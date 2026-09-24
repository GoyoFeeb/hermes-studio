/**
 * hermes-worker.ts — corre en el Mac del usuario, NO en Railway (2026-09-24).
 *
 * Pregunta a Hermes Studio si hay newsletters standalone en cola, ejecuta cada una con
 * `hermes -z` usando la instalación local de Hermes Agent (config, skills, memoria, suscripción
 * de Nous) dentro de sistema-final/, y sube el HTML resultante. Es exactamente el flujo manual
 * del usuario (pegar el prompt en Hermes), automatizado: por eso la calidad es la misma.
 *
 * Uso (desde sistema-final/):   npm run hermes-worker
 * Variables (studio/.env):      STUDIO_WORKER_URL, WORKER_TOKEN
 * Opcionales:                   HERMES_BIN (por defecto "hermes"), HERMES_TIMEOUT_MIN (180)
 *
 * Un trabajo a la vez. `hermes -z` aprueba solo los comandos (no hay nadie para confirmarlos):
 * Hermes actúa en este Mac igual que en una sesión normal, pero sin pedir permiso.
 */
import * as fs from 'fs';
import * as path from 'path';
import { spawn } from 'child_process';
import { loadEnv } from '../../scripts/lib/env';

const ROOT = path.resolve(__dirname, '..', '..');
loadEnv(ROOT);
loadEnv(path.join(ROOT, 'studio'));

const BASE = (process.env.STUDIO_WORKER_URL || '').replace(/\/+$/, '');
const TOKEN = process.env.WORKER_TOKEN || '';
const HERMES_BIN = process.env.HERMES_BIN || 'hermes';
const TIMEOUT_MS = Number(process.env.HERMES_TIMEOUT_MIN || 180) * 60 * 1000;
const POLL_MS = 20 * 1000;
const HEARTBEAT_MS = 5 * 60 * 1000;

const MIME: Record<string, string> = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
};

function stamp(): string {
  return new Date().toLocaleTimeString('es-ES');
}

async function api(route: string, body?: unknown, attempts = 3): Promise<Response> {
  for (let i = 1; ; i++) {
    try {
      return await fetch(`${BASE}${route}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(body ?? {}),
      });
    } catch (err) {
      if (i >= attempts) throw err;
      await new Promise((r) => setTimeout(r, 5000 * i));
    }
  }
}

/** Hermes deja las imágenes como rutas locales de este Mac; se incrustan en base64 para subirlas
 *  y Studio las publica en /assets (el destinatario del email no puede ver rutas del Mac). */
export function embedLocalImages(html: string, htmlDir: string, root: string): { html: string; missing: string[] } {
  const missing: string[] = [];
  const resolve = (ref: string): string | null => {
    const clean = decodeURI(ref.replace(/^file:\/\//, '').split(/[?#]/)[0]);
    const candidates = path.isAbsolute(clean) ? [clean] : [path.resolve(htmlDir, clean), path.resolve(root, clean)];
    return candidates.find((c) => fs.existsSync(c) && fs.statSync(c).isFile()) || null;
  };
  const embed = (ref: string): string => {
    if (/^(https?:|data:|cid:|mailto:|#|\{\{)/i.test(ref)) return ref;
    const mime = MIME[path.extname(ref.split(/[?#]/)[0]).toLowerCase()];
    if (!mime) return ref;
    const abs = resolve(ref);
    if (!abs) {
      missing.push(ref);
      return ref;
    }
    return `data:${mime};base64,${fs.readFileSync(abs).toString('base64')}`;
  };
  const out = html
    .replace(/(\b(?:src|background)\s*=\s*)(["'])([^"']+)\2/gi, (_m, attr, q, ref) => `${attr}${q}${embed(ref)}${q}`)
    .replace(/url\(\s*(["']?)([^"')]+)\1\s*\)/gi, (_m, q, ref) => `url(${q}${embed(ref)}${q})`);
  return { html: out, missing };
}

function newestHtml(dir: string): string | null {
  if (!fs.existsSync(dir)) return null;
  const files = fs
    .readdirSync(dir)
    .filter((f) => f.toLowerCase().endsWith('.html'))
    .map((f) => path.join(dir, f))
    .sort((a, b) => fs.statSync(b).mtimeMs - fs.statSync(a).mtimeMs);
  return files[0] || null;
}

let current: string | null = null;

async function runJob(job: { id: string; prompt: string; outputDir: string }): Promise<void> {
  current = job.id;
  const outAbs = path.join(ROOT, job.outputDir);
  fs.mkdirSync(outAbs, { recursive: true });
  console.log(`[${stamp()}] Trabajo ${job.id} → ${job.outputDir}`);

  const started = Date.now();
  const child = spawn(HERMES_BIN, ['-z', job.prompt], { cwd: ROOT, env: process.env });
  let stdout = '';
  let stderr = '';
  child.stdout.on('data', (d) => (stdout += d));
  child.stderr.on('data', (d) => (stderr = (stderr + d).slice(-8000)));

  const heartbeat = setInterval(() => {
    const min = Math.round((Date.now() - started) / 60000);
    void api(`/api/worker/jobs/${job.id}/progress`, { message: `Hermes sigue trabajando (${min} min).` }).catch(() => undefined);
  }, HEARTBEAT_MS);
  const killer = setTimeout(() => child.kill('SIGTERM'), TIMEOUT_MS);

  const code: number | null = await new Promise((resolve) => {
    child.on('close', resolve);
    child.on('error', (err) => {
      stderr += `\n${err.message}`;
      resolve(-1);
    });
  });
  clearInterval(heartbeat);
  clearTimeout(killer);
  const minutes = Math.round((Date.now() - started) / 60000);

  const expected = path.join(outAbs, 'newsletter.html');
  const htmlPath = fs.existsSync(expected) ? expected : newestHtml(outAbs);
  if (!htmlPath) {
    const why = Date.now() - started >= TIMEOUT_MS ? `se agotó el tiempo (${minutes} min)` : `terminó (código ${code}) sin dejar el HTML en ${job.outputDir}/`;
    await api(`/api/worker/jobs/${job.id}/fail`, {
      error: `Hermes ${why}.\n\nÚltima respuesta de Hermes:\n${(stdout || stderr).trim().slice(-2500)}`,
    });
    console.log(`[${stamp()}] ✗ ${job.id}: ${why}`);
    current = null;
    return;
  }

  const { html, missing } = embedLocalImages(fs.readFileSync(htmlPath, 'utf8'), path.dirname(htmlPath), ROOT);
  if (missing.length) {
    await api(`/api/worker/jobs/${job.id}/progress`, {
      message: `Aviso: ${missing.length} imagen(es) referenciadas que no existen en el Mac: ${missing.slice(0, 5).join(', ')}`,
    });
  }
  const res = await api(`/api/worker/jobs/${job.id}/complete`, { html, finalMessage: stdout.trim() });
  console.log(`[${stamp()}] ${res.ok ? '✓' : '✗'} ${job.id} en ${minutes} min${res.ok ? '' : `: ${await res.text()}`}`);
  current = null;
}

async function main(): Promise<void> {
  if (!BASE || !TOKEN) {
    console.error('Faltan STUDIO_WORKER_URL y/o WORKER_TOKEN en studio/.env — ver studio/README.md.');
    process.exit(1);
  }
  console.log(`Hermes worker conectado a ${BASE} — esperando trabajos (Ctrl+C para salir).`);
  for (;;) {
    try {
      const res = await api('/api/worker/claim');
      if (res.status === 200) {
        await runJob((await res.json()) as { id: string; prompt: string; outputDir: string });
        continue;
      }
      if (res.status === 401) {
        console.error('Studio rechaza el WORKER_TOKEN — revisa que coincide con el de Railway.');
      } else if (res.status !== 204) {
        console.error(`Studio respondió ${res.status} al pedir trabajo.`);
      }
    } catch (err) {
      console.error(`[${stamp()}] Sin conexión con Studio: ${(err as Error).message}`);
    }
    await new Promise((r) => setTimeout(r, POLL_MS));
  }
}

process.on('SIGINT', async () => {
  if (current) {
    await api(`/api/worker/jobs/${current}/fail`, { error: 'El worker de Hermes se detuvo a mitad del trabajo. Vuelve a enviarlo.' }).catch(() => undefined);
  }
  process.exit(0);
});

if (require.main === module) void main();
