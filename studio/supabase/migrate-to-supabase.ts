/**
 * migrate-to-supabase.ts — sube a Supabase lo que ya hay en disco y comprueba que coincide
 * (fase 1, pasos 4 y 5 de studio/PLAN-SUPABASE-FASE-1.md).
 *
 *   npx tsx studio/supabase/migrate-to-supabase.ts           sube lo que falte o difiera y después comprueba
 *   npx tsx studio/supabase/migrate-to-supabase.ts --check   solo comprueba, no escribe nada
 *
 * Se ejecuta donde está el volumen (en Railway), con SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY. Se puede
 * repetir: los trabajos y las fichas se sobrescriben, los eventos se reponen solo si el número no cuadra y
 * los archivos que ya están con el mismo tamaño se saltan. No borra nada de Supabase que no esté en disco.
 */
import * as fs from 'fs';
import * as path from 'path';
import { loadEnv } from '../../scripts/lib/env';
import { ROOT, STUDIO_DIR, DATA_DIR, JOBS_DIR, BRANDS_DIR, NEWSLETTERS_DIR } from '../server/paths';
import { supabase } from '../server/supabase';
import type { Bucket } from '../server/supabase';
import type { Job, JobEvent } from '../server/store';

loadEnv(ROOT);
loadEnv(STUDIO_DIR);

const CHECK_ONLY = process.argv.includes('--check');
const PUBLIC_ASSET_RE = /\.(png|jpe?g|gif|webp|svg)$/i; // la misma regla que /assets en studio/server/index.ts
const CARDS_DIR = path.join(DATA_DIR, 'brand-cards');
const MIME: Record<string, string> = {
  html: 'text/html; charset=utf-8', md: 'text/markdown; charset=utf-8', txt: 'text/plain; charset=utf-8',
  json: 'application/json', js: 'text/javascript', css: 'text/css', svg: 'image/svg+xml', png: 'image/png',
  jpg: 'image/jpeg', jpeg: 'image/jpeg', gif: 'image/gif', webp: 'image/webp', pdf: 'application/pdf', woff: 'font/woff',
};

const problems: string[] = [];

/** El plan gratuito corta con 429 («too many connections») si se le pide mucho a la vez: se espera y se repite. */
async function retry<T>(fn: () => Promise<T>): Promise<T> {
  for (let attempt = 0; ; attempt++) {
    try {
      return await fn();
    } catch (err) {
      if (attempt >= 7 || !/→ (429|5\d\d) /.test((err as Error).message)) throw err;
      await new Promise((r) => setTimeout(r, Math.min(30000, 1000 * 2 ** attempt)));
    }
  }
}
const api = (p: string, init: Parameters<typeof supabase.raw>[1]) => retry(() => supabase.raw(p, init));
const json = { 'Content-Type': 'application/json' };

/** jsonb no conserva el orden de las claves: se compara con las claves ordenadas. */
function stable(v: unknown): string {
  if (Array.isArray(v)) return `[${v.map(stable).join(',')}]`;
  if (v && typeof v === 'object') {
    return `{${Object.keys(v as object).sort().map((k) => `${JSON.stringify(k)}:${stable((v as Record<string, unknown>)[k])}`).join(',')}}`;
  }
  return JSON.stringify(v) ?? 'null';
}

function readJson<T>(file: string): T | null {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8')) as T;
  } catch {
    return null;
  }
}

function diskJobs(): Job[] {
  if (!fs.existsSync(JOBS_DIR)) return [];
  return fs.readdirSync(JOBS_DIR).filter((f) => f.endsWith('.json')).flatMap((f) => {
    const job = readJson<Job>(path.join(JOBS_DIR, f));
    if (!job) problems.push(`trabajo ilegible en disco: ${f}`);
    return job ? [job] : [];
  });
}

function diskEvents(id: string): JobEvent[] {
  try {
    return fs.readFileSync(path.join(JOBS_DIR, `${id}.events.ndjson`), 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l));
  } catch {
    return [];
  }
}

function jobRow(j: Job) {
  return {
    id: j.id, created_at: j.createdAt, updated_at: j.updatedAt, status: j.status, client_slug: j.input.clientSlug,
    requester: j.input.requesterName ?? null, archived_at: j.archivedAt ?? null, data: j,
  };
}

async function eventCount(id: string): Promise<number> {
  const res = await api(`/rest/v1/job_events?job_id=eq.${id}&select=id`, { method: 'HEAD', headers: { Prefer: 'count=exact' } });
  return Number((res.headers.get('content-range') ?? '').split('/')[1] ?? NaN);
}

async function migrateJobs(jobs: Job[]): Promise<void> {
  for (let i = 0; i < jobs.length; i += 50) {
    await api('/rest/v1/jobs?on_conflict=id', {
      method: 'POST', headers: { ...json, Prefer: 'resolution=merge-duplicates,return=minimal' }, body: JSON.stringify(jobs.slice(i, i + 50).map(jobRow)),
    });
  }
  let replaced = 0;
  for (const j of jobs) {
    const events = diskEvents(j.id);
    if ((await eventCount(j.id)) === events.length) continue;
    await api(`/rest/v1/job_events?job_id=eq.${j.id}`, { method: 'DELETE', headers: { Prefer: 'return=minimal' } });
    for (let i = 0; i < events.length; i += 500) {
      await api('/rest/v1/job_events', {
        method: 'POST', headers: { ...json, Prefer: 'return=minimal' },
        body: JSON.stringify(events.slice(i, i + 500).map((e) => ({ job_id: j.id, ts: e.ts, phase: e.phase, level: e.level, message: e.message }))),
      });
    }
    replaced++;
  }
  console.log(`Trabajos: ${jobs.length} enviados; eventos repuestos en ${replaced}.`);
}

function diskCards(): { slug: string; data: unknown }[] {
  if (!fs.existsSync(CARDS_DIR)) return [];
  return fs.readdirSync(CARDS_DIR).filter((f) => f.endsWith('.json')).flatMap((f) => {
    const data = readJson<unknown>(path.join(CARDS_DIR, f));
    return data ? [{ slug: f.slice(0, -5), data }] : [];
  });
}

async function migrateCards(cards: { slug: string; data: unknown }[]): Promise<void> {
  if (!cards.length) return;
  const now = new Date().toISOString();
  await api('/rest/v1/brand_cards?on_conflict=slug', {
    method: 'POST', headers: { ...json, Prefer: 'resolution=merge-duplicates,return=minimal' },
    body: JSON.stringify(cards.map((c) => ({ slug: c.slug, updated_at: now, data: c.data }))),
  });
  console.log(`Fichas de marca: ${cards.length} enviadas.`);
}

interface DiskFile { bucket: Bucket; key: string; abs: string; size: number }

function walk(dir: string, out: string[] = []): string[] {
  if (!fs.existsSync(dir)) return out;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.name.startsWith('.')) continue; // .gitkeep, .DS_Store y carpetas ocultas no se suben
    const abs = path.join(dir, e.name);
    if (e.isDirectory()) walk(abs, out);
    else if (e.isFile()) out.push(abs);
  }
  return out;
}

/** newsletters/ va entero a `newsletters` con su ruta desde la raíz (la de campaignRelPath). De brands/, las
 *  imágenes que hoy sirve /assets van a `assets` y el resto a `brand-packs`, con su ruta dentro de brands/. */
function diskFiles(): DiskFile[] {
  const files: DiskFile[] = [];
  for (const abs of walk(NEWSLETTERS_DIR)) files.push({ bucket: 'newsletters', key: path.relative(ROOT, abs), abs, size: fs.statSync(abs).size });
  for (const abs of walk(BRANDS_DIR)) {
    files.push({ bucket: PUBLIC_ASSET_RE.test(abs) ? 'assets' : 'brand-packs', key: path.relative(BRANDS_DIR, abs), abs, size: fs.statSync(abs).size });
  }
  return files.filter((f) => f.size > 0).map((f) => ({ ...f, key: f.key.split(path.sep).join('/') }));
}

async function remoteFiles(): Promise<Record<Bucket, Map<string, number>>> {
  // De uno en uno: en paralelo agotaban las conexiones del plan gratuito.
  const newsletters = await retry(() => supabase.listFiles('newsletters'));
  const assets = await retry(() => supabase.listFiles('assets'));
  const packs = await retry(() => supabase.listFiles('brand-packs'));
  return { newsletters, assets, 'brand-packs': packs };
}

async function migrateFiles(files: DiskFile[]): Promise<void> {
  const remote = await remoteFiles();
  const todo = files.filter((f) => remote[f.bucket].get(f.key) !== f.size);
  console.log(`Archivos: ${files.length} en disco, ${files.length - todo.length} ya estaban, ${todo.length} por subir.`);
  let done = 0;
  let failed = 0;
  async function worker(): Promise<void> {
    for (let f = todo.pop(); f; f = todo.pop()) {
      const ext = f.key.split('.').pop()?.toLowerCase() ?? '';
      const url = `/storage/v1/object/${f.bucket}/${f.key.split('/').map(encodeURIComponent).join('/')}`;
      try {
        await api(url, { method: 'POST', headers: { 'Content-Type': MIME[ext] ?? 'application/octet-stream', 'x-upsert': 'true' }, body: fs.readFileSync(f.abs) as unknown as BodyInit });
      } catch (err) {
        failed++;
        if (failed <= 20) console.error(`  no se pudo subir ${f.bucket}/${f.key}: ${(err as Error).message}`);
      }
      if (++done % 200 === 0) console.log(`  ${done} procesados…`);
    }
  }
  await Promise.all(Array.from({ length: 3 }, worker));
  console.log(`Archivos: subida terminada (${failed} fallos).`);
}

async function check(jobs: Job[], cards: { slug: string; data: unknown }[], files: DiskFile[]): Promise<void> {
  const res = await api('/rest/v1/jobs?select=id,data&limit=100000', { method: 'GET' });
  const remoteJobs = new Map(((await res.json()) as { id: string; data: Job }[]).map((r) => [r.id, r.data]));
  for (const j of jobs) {
    const r = remoteJobs.get(j.id);
    if (!r) problems.push(`trabajo ${j.id}: falta en Supabase`);
    else if (stable(r) !== stable(j)) problems.push(`trabajo ${j.id}: distinto en Supabase`);
    else {
      const n = diskEvents(j.id).length;
      const m = await eventCount(j.id);
      if (n !== m) problems.push(`trabajo ${j.id}: ${n} eventos en disco, ${m} en Supabase`);
    }
  }
  const cres = await api('/rest/v1/brand_cards?select=slug,data&limit=100000', { method: 'GET' });
  const remoteCards = new Map(((await cres.json()) as { slug: string; data: unknown }[]).map((r) => [r.slug, r.data]));
  for (const c of cards) {
    if (!remoteCards.has(c.slug)) problems.push(`ficha ${c.slug}: falta en Supabase`);
    else if (stable(remoteCards.get(c.slug)) !== stable(c.data)) problems.push(`ficha ${c.slug}: distinta en Supabase`);
  }
  const remote = await remoteFiles();
  for (const f of files) {
    const size = remote[f.bucket].get(f.key);
    if (size === undefined) problems.push(`archivo ${f.bucket}/${f.key}: falta en Supabase`);
    else if (size !== f.size) problems.push(`archivo ${f.bucket}/${f.key}: ${f.size} bytes en disco, ${size} en Supabase`);
  }
  const count = (b: Bucket) => files.filter((f) => f.bucket === b).length;
  console.log(`Comprobado: ${jobs.length} trabajos (Supabase tiene ${remoteJobs.size}), ${cards.length} fichas (${remoteCards.size}), ` +
    `archivos newsletters ${count('newsletters')} (${remote.newsletters.size}), assets ${count('assets')} (${remote.assets.size}), brand-packs ${count('brand-packs')} (${remote['brand-packs'].size}).`);
}

async function main(): Promise<void> {
  if (!supabase.enabled) throw new Error('Faltan SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY.');
  const jobs = diskJobs();
  const cards = diskCards();
  const files = diskFiles();
  if (!CHECK_ONLY) {
    await migrateJobs(jobs);
    await migrateCards(cards);
    await migrateFiles(files);
  }
  await check(jobs, cards, files);
  if (problems.length) {
    console.log(`\n${problems.length} diferencia(s):`);
    for (const p of problems.slice(0, 60)) console.log(`  - ${p}`);
    if (problems.length > 60) console.log(`  … y ${problems.length - 60} más.`);
    process.exit(1);
  }
  console.log('\nDisco y Supabase coinciden.');
}

main().catch((err) => {
  console.error(`Error: ${(err as Error).message}`);
  process.exit(2);
});
