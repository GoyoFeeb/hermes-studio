/**
 * Prueba del juez de arte (2026-10-16, propuesta 2 de la auditoría de calidad). Sin generar piezas: usa las que ya hay.
 *
 *   npx tsx _archive/prueba-juez-2026-10-16/juez.ts ruido      → 8 piezas × (método antiguo ×2, método nuevo ×2)
 *   npx tsx _archive/prueba-juez-2026-10-16/juez.ts comparar   → 20 parejas reales antes/después + 6 idénticas, ×2 órdenes
 *   npx tsx _archive/prueba-juez-2026-10-16/juez.ts resumen    → tablas a partir de resultados/*.json
 *
 * Reanudable: cada llamada deja resultados/<id>.json y no se repite. Las capturas van a renders/ (nunca a la pieza).
 */
import * as fs from 'fs';
import * as path from 'path';
import { spawn } from 'child_process';
import { ART_CRITERIA, artReviewQuery, parseArtReview, scoreTotal } from '../../studio/worker/hermes-worker';
import { artCompareQuery, briefDigest, compareVerdict, judgeFacts, parseArtCompare } from '../../studio/worker/artJudge';
import { renderPair, renderSheet } from '../../studio/worker/render-newsletter';
import { renderChecks } from '../../studio/worker/renderChecks';
import { brandPalette } from '../../studio/worker/inspect';
import { copyFindings } from '../../studio/worker/copyCheck';
import sharp from 'sharp';

const ROOT = path.resolve(__dirname, '..', '..');
const HERE = __dirname;
const OUT = path.join(HERE, 'resultados');
const RENDERS = path.join(HERE, 'renders');
const NL = path.join(ROOT, 'newsletters', '2026');
const PARALLEL = Number(process.env.PARALELO || 3);
const CALL_MS = 7 * 60 * 1000;

const RUIDO = [
  'novo-resort/hermes/2026-10-16-wr22s3',
  'mcdonald-s/hermes/2026-10-16-q4ikwq',
  'playstation/hermes/2026-10-15-e6a808',
  'spotify/hermes/2026-10-15-v96095',
  'alo/hermes/2026-10-14-umgqhq',
  'feebbo/hermes/2026-10-15-nfy1op',
  'land-rover/hermes/2026-10-15-pqeys6',
  'prozis/hermes/2026-10-15-dzkq9z',
];

const env: NodeJS.ProcessEnv = { ...process.env };
delete env.WORKER_TOKEN;
delete env.STUDIO_WORKER_URL;

/** Un turno de Hermes como lo lanza el worker (sin reglas del repo, sin sesión previa). */
function hermes(query: string): Promise<{ output: string; ms: number }> {
  const t0 = Date.now();
  return new Promise((resolve) => {
    const child = spawn(process.env.HERMES_BIN || 'hermes', ['chat', '-q', query, '-Q', '--yolo', '--ignore-rules', ...(process.env.HERMES_MODEL_ART ? ['-m', process.env.HERMES_MODEL_ART] : [])], { cwd: ROOT, env, stdio: ['ignore', 'pipe', 'pipe'] });
    let out = '';
    child.stdout.on('data', (d) => (out += d));
    const timer = setTimeout(() => child.kill('SIGTERM'), CALL_MS);
    child.on('close', () => {
      clearTimeout(timer);
      resolve({ output: out.replace(/^\s*session_id:.*$/m, '').trim(), ms: Date.now() - t0 });
    });
  });
}

async function size(file: string): Promise<{ width: number; height: number }> {
  const m = await sharp(file).metadata();
  return { width: m.width || 0, height: m.height || 0 };
}

function visibleText(html: string): string {
  return html
    .replace(/<head[\s\S]*?<\/head>|<style[\s\S]*?<\/style>|<!--[\s\S]*?-->/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&#?[a-z0-9]+;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function request(dir: string): string | undefined {
  const f = path.join(NL, dir, '_trabajo', 'peticion.txt');
  return fs.existsSync(f) ? fs.readFileSync(f, 'utf8').trim() : undefined;
}

const prompt = (dir: string): string => fs.readFileSync(path.join(NL, dir, '_trabajo', 'encargo.md'), 'utf8');
const idOf = (dir: string): string => `${dir.split('/')[0]}-${dir.split('/')[2].slice(-6)}`;

async function pool<T>(items: T[], fn: (t: T) => Promise<void>): Promise<void> {
  let i = 0;
  await Promise.all(Array.from({ length: PARALLEL }, async () => {
    while (i < items.length) await fn(items[i++]).catch((e) => console.error(`✗ ${(e as Error).message}`));
  }));
}

// --- Ruido de la nota -------------------------------------------------------------------------------------------

interface Task { id: string; run: () => Promise<unknown> }

async function ruido(): Promise<void> {
  // Capturas antes de lanzar nada en paralelo: las cuatro llamadas de una pieza usan la misma hoja.
  for (const dir of RUIDO) {
    const r = path.join(RENDERS, idOf(dir));
    if (!fs.existsSync(path.join(r, 'render-escritorio.jpg'))) await renderSheet(path.join(NL, dir, 'newsletter.html'), r);
  }
  const tasks: Task[] = [];
  for (const dir of RUIDO) {
    const abs = path.join(NL, dir);
    const html = path.join(abs, 'newsletter.html');
    const r = path.join(RENDERS, idOf(dir));
    const web = fs.existsSync(path.join(abs, '_trabajo', 'web-marca.jpg')) ? path.join(abs, '_trabajo', 'web-marca.jpg') : null;
    for (const method of ['antiguo', 'nuevo'] as const) {
      for (const rep of [1, 2]) {
        tasks.push({
          id: `ruido-${idOf(dir)}-${method}-${rep}`,
          run: async () => {
            fs.mkdirSync(r, { recursive: true });
            const sheet = fs.existsSync(path.join(r, 'render-hoja.jpg')) && fs.existsSync(path.join(r, 'render-escritorio.jpg'))
              ? { sheet: path.join(r, 'render-hoja.jpg'), desktop: { path: path.join(r, 'render-escritorio.jpg'), ...(await size(path.join(r, 'render-escritorio.jpg'))) } }
              : await renderSheet(html, r);
            const text = fs.readFileSync(html, 'utf8');
            const slug = dir.split('/')[0];
            // Método antiguo: hoja reducida, sin medidas y el prompt cortado a 3.500 caracteres (sin secciones reconocibles).
            const p = method === 'antiguo' ? prompt(dir).replace(/^## (\d)/gm, '### $1') : prompt(dir);
            const facts = method === 'nuevo' ? judgeFacts(await renderChecks(html, ROOT, brandPalette(ROOT, slug)).catch(() => null)) : [];
            const q = artReviewQuery(request(dir), p, text, sheet.sheet, await size(sheet.sheet), web ? { path: web, size: await size(web) } : null, copyFindings(text).found, method === 'nuevo' ? sheet.desktop : null, facts);
            const { output, ms } = await hermes(q);
            const review = parseArtReview(output);
            return { dir, method, rep, ms, notas: review?.notas || null, total: review ? scoreTotal(review) : null, raw: review ? undefined : output.slice(-1500) };
          },
        });
      }
    }
  }
  await runTasks(tasks);
}

// --- Comparación antes / después ---------------------------------------------------------------------------------

function pairs(): { dir: string; identical: boolean }[] {
  const out: { dir: string; identical: boolean }[] = [];
  for (const brand of fs.readdirSync(NL)) {
    const h = path.join(NL, brand, 'hermes');
    if (!fs.existsSync(h)) continue;
    for (const job of fs.readdirSync(h).filter((j) => /^2026-10-/.test(j)).sort()) {
      const dir = `${brand}/hermes/${job}`;
      const b = path.join(NL, dir, '_trabajo', 'antes-de-mejora.html');
      if (!fs.existsSync(b) || !fs.existsSync(path.join(NL, dir, '_trabajo', 'encargo.md'))) continue;
      out.push({ dir, identical: fs.readFileSync(b, 'utf8') === fs.readFileSync(path.join(NL, dir, 'newsletter.html'), 'utf8') });
    }
  }
  const real = out.filter((p) => !p.identical);
  const same = out.filter((p) => p.identical).slice(-6);
  return [...real, ...same];
}

async function comparar(): Promise<void> {
  const tasks: Task[] = [];
  for (const { dir, identical } of pairs()) {
    const abs = path.join(NL, dir);
    for (const afterIs of ['A', 'B'] as const) {
      tasks.push({
        id: `comparar-${idOf(dir)}-${afterIs}`,
        run: async () => {
          const r = path.join(RENDERS, `${idOf(dir)}-par-${afterIs}`);
          const before = path.join(abs, '_trabajo', 'antes-de-mejora.html');
          const after = path.join(abs, 'newsletter.html');
          const [a, b] = afterIs === 'A' ? [after, before] : [before, after];
          const pair = fs.existsSync(path.join(r, 'comparar-movil.jpg'))
            ? { desktop: { path: path.join(r, 'comparar-escritorio.jpg'), ...(await size(path.join(r, 'comparar-escritorio.jpg'))) }, mobile: { path: path.join(r, 'comparar-movil.jpg'), ...(await size(path.join(r, 'comparar-movil.jpg'))) } }
            : await renderPair(a, b, abs, r);
          const q = artCompareQuery(ART_CRITERIA, pair, briefDigest(prompt(dir)), visibleText(fs.readFileSync(a, 'utf8')), visibleText(fs.readFileSync(b, 'utf8')), request(dir));
          const { output, ms } = await hermes(q);
          const cmp = parseArtCompare(output, Object.keys(ART_CRITERIA));
          // Votos ya traducidos a «mejorada» / «anterior» / «igual».
          const votes = cmp ? Object.fromEntries(Object.entries(cmp.criterios).map(([k, v]) => [k, v === 'igual' ? 'igual' : v === afterIs ? 'mejorada' : 'anterior'])) : null;
          return { dir, identical, afterIs, ms, votes, verdict: cmp ? compareVerdict(cmp, afterIs) : null, raw: cmp ? undefined : output.slice(-1500) };
        },
      });
    }
  }
  await runTasks(tasks);
}

async function runTasks(tasks: Task[]): Promise<void> {
  fs.mkdirSync(OUT, { recursive: true });
  const todo = tasks.filter((t) => !fs.existsSync(path.join(OUT, `${t.id}.json`)));
  console.log(`${tasks.length} llamadas, ${todo.length} pendientes, ${PARALLEL} en paralelo`);
  let done = 0;
  await pool(todo, async (t) => {
    const res = await t.run();
    fs.writeFileSync(path.join(OUT, `${t.id}.json`), JSON.stringify(res, null, 1));
    console.log(`[${new Date().toTimeString().slice(0, 8)}] ${++done}/${todo.length} ${t.id}`);
  });
}

// --- Resumen ---------------------------------------------------------------------------------------------------

function resumen(): void {
  const all = fs.existsSync(OUT) ? fs.readdirSync(OUT).map((f) => JSON.parse(fs.readFileSync(path.join(OUT, f), 'utf8'))) : [];
  const keys = Object.keys(ART_CRITERIA);
  const lines: string[] = ['## Ruido de la nota (misma pieza puntuada dos veces)', '', '| Pieza | Antiguo 1 | Antiguo 2 | Δ | Criterios distintos | Nuevo 1 | Nuevo 2 | Δ | Criterios distintos |', '|---|---|---|---|---|---|---|---|---|'];
  const agg = { antiguo: { d: [] as number[], c: [] as number[], fail: 0 }, nuevo: { d: [] as number[], c: [] as number[], fail: 0 } };
  for (const dir of RUIDO) {
    const row = [idOf(dir)];
    for (const m of ['antiguo', 'nuevo'] as const) {
      const rs = [1, 2].map((rep) => all.find((x) => x.dir === dir && x.method === m && x.rep === rep));
      const t = rs.map((x) => (x?.total ?? null));
      if (rs[0]?.notas && rs[1]?.notas) {
        const d = Math.abs(t[0] - t[1]);
        const c = keys.filter((k) => rs[0].notas[k] !== rs[1].notas[k]).length;
        agg[m].d.push(d);
        agg[m].c.push(c);
        row.push(String(t[0]), String(t[1]), String(d), String(c));
      } else {
        agg[m].fail += rs.filter((x) => x && !x.notas).length;
        row.push(String(t[0] ?? '—'), String(t[1] ?? '—'), '—', '—');
      }
    }
    lines.push(`| ${row.join(' | ')} |`);
  }
  const mean = (a: number[]): string => (a.length ? (a.reduce((x, y) => x + y, 0) / a.length).toFixed(2) : '—');
  lines.push('', `Media Δ total: antiguo ${mean(agg.antiguo.d)}, nuevo ${mean(agg.nuevo.d)}. Media de criterios que cambian: antiguo ${mean(agg.antiguo.c)}, nuevo ${mean(agg.nuevo.c)}. Respuestas ilegibles: antiguo ${agg.antiguo.fail}, nuevo ${agg.nuevo.fail}.`);
  const meanTot = (m: string): string => mean(all.filter((x) => x.method === m && x.total != null).map((x) => x.total));
  lines.push(`Total medio: antiguo ${meanTot('antiguo')}, nuevo ${meanTot('nuevo')}.`);

  lines.push('', '## Comparación antes / después (dos órdenes por pareja)', '', '| Pieza | Pareja | Mejorada = A | Mejorada = B | Mismo veredicto | Votos coincidentes |', '|---|---|---|---|---|---|');
  const cmp = all.filter((x) => x.afterIs);
  const dirs = [...new Set(cmp.map((x) => x.dir))];
  let agree = 0, both = 0, sameVotes = 0, votesN = 0, identN = 0, identIgual = 0, identVotesIgual = 0, identVotes = 0, unreadable = 0;
  for (const dir of dirs) {
    const [a, b] = ['A', 'B'].map((o) => cmp.find((x) => x.dir === dir && x.afterIs === o));
    unreadable += [a, b].filter((x) => x && !x.votes).length;
    const fmt = (x: any): string => (x?.verdict ? `${x.verdict.keep ? 'se queda' : 'se descarta'} (+${x.verdict.wins.length}/−${x.verdict.losses.length})` : '—');
    let same = '—', sv = '—';
    if (a?.verdict && b?.verdict) {
      both++;
      if (a.verdict.keep === b.verdict.keep) agree++;
      same = a.verdict.keep === b.verdict.keep ? 'sí' : 'no';
      const n = keys.filter((k) => a.votes[k] === b.votes[k]).length;
      sameVotes += n;
      votesN += keys.length;
      sv = `${n}/${keys.length}`;
    }
    const identical = (a || b)?.identical;
    for (const x of [a, b]) {
      if (!identical || !x?.votes) continue;
      identN++;
      if (!x.verdict.keep && !x.verdict.wins.length && !x.verdict.losses.length) identIgual++;
      identVotes += keys.length;
      identVotesIgual += keys.filter((k) => x.votes[k] === 'igual').length;
    }
    lines.push(`| ${idOf(dir)} | ${identical ? 'idéntica (control)' : 'real'} | ${fmt(a)} | ${fmt(b)} | ${same} | ${sv} |`);
  }
  lines.push(
    '',
    `Mismo veredicto en los dos órdenes: ${agree}/${both}${both ? ` (${Math.round((100 * agree) / both)} %)` : ''}. Votos por criterio coincidentes: ${votesN ? Math.round((100 * sameVotes) / votesN) : '—'} %.`,
    `Parejas idénticas (control): ${identIgual}/${identN} respuestas sin ninguna preferencia; ${identVotes ? Math.round((100 * identVotesIgual) / identVotes) : '—'} % de votos «igual». Respuestas ilegibles: ${unreadable}.`
  );
  const ms = all.filter((x) => x.ms).map((x) => x.ms / 1000);
  lines.push('', `Tiempo por llamada: mediana ${ms.sort((x, y) => x - y)[Math.floor(ms.length / 2)]?.toFixed(0)} s (${ms.length} llamadas).`);
  fs.writeFileSync(path.join(HERE, 'resumen.md'), lines.join('\n') + '\n');
  console.log(lines.join('\n'));
}

const mode = process.argv[2];
(mode === 'ruido' ? ruido() : mode === 'comparar' ? comparar() : Promise.resolve(resumen())).then(() => process.exit(0));
