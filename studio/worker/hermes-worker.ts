/**
 * hermes-worker.ts — corre en el Mac del usuario, NO en Railway (2026-09-24).
 *
 * Pregunta a Hermes Studio si hay newsletters standalone en cola, ejecuta cada una con
 * `hermes chat -q` (no interactivo) usando la instalación local de Hermes Agent (config, skills, memoria, suscripción
 * de Nous) dentro de sistema-final/, y sube el HTML resultante. Es exactamente el flujo manual
 * del usuario (pegar el prompt en Hermes), automatizado: por eso la calidad es la misma.
 *
 * Progreso: lee el historial de sesiones de Hermes mientras trabaja (ver "Progreso" abajo).
 *
 * Uso (desde sistema-final/):   npm run hermes-worker
 * Variables (studio/.env):      STUDIO_WORKER_URL, WORKER_TOKEN
 * Opcionales:                   HERMES_BIN (por defecto "hermes"), HERMES_TIMEOUT_MIN (180)
 *
 * Un trabajo a la vez. `--yolo` aprueba solo los comandos (no hay nadie para confirmarlos):
 * Hermes actúa en este Mac igual que en una sesión normal, pero sin pedir permiso.
 */
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { spawn, execFile } from 'child_process';
import { promisify } from 'util';
import { loadEnv } from '../../scripts/lib/env';

const ROOT = path.resolve(__dirname, '..', '..');
loadEnv(ROOT);
loadEnv(path.join(ROOT, 'studio'));

const BASE = (process.env.STUDIO_WORKER_URL || '').replace(/\/+$/, '');
const TOKEN = process.env.WORKER_TOKEN || '';
const HERMES_BIN = process.env.HERMES_BIN || 'hermes';
const TIMEOUT_MS = Number(process.env.HERMES_TIMEOUT_MIN || 180) * 60 * 1000;
const POLL_MS = 20 * 1000;
const PROGRESS_MS = 30 * 1000;
const execFileAsync = promisify(execFile);
/** Duraciones reales de las últimas newsletters: la estimación de "cuánto queda" sale de aquí. */
const DURATIONS_FILE = path.join(__dirname, '.hermes-durations.json');
const DEFAULT_EXPECTED_MIN = 20;

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

// --- Progreso -------------------------------------------------------------------------------
// `hermes -z` no informa de nada hasta terminar, pero Hermes guarda cada acción en su historial
// de sesiones. Cada PROGRESS_MS se lee esa sesión y se deduce la fase por las herramientas que
// ha usado: preparar (skills, repo) → investigar (web, navegador) → escribir (HTML, imágenes) →
// revisar (capturas, render). El porcentaje combina esa fase con el tiempo transcurrido frente a
// lo que tardan de verdad las newsletters (mediana de las últimas); es una estimación.

type Stage = 'preparando' | 'investigando' | 'escribiendo' | 'revisando';
const STAGES: Record<Stage, { label: string; from: number; to: number }> = {
  preparando: { label: 'Preparando: skills y brand pack', from: 2, to: 15 },
  investigando: { label: 'Investigando la marca', from: 15, to: 45 },
  escribiendo: { label: 'Escribiendo la newsletter', from: 45, to: 75 },
  revisando: { label: 'Revisando y corrigiendo', from: 75, to: 97 },
};

function describeTool(tool: string): string {
  if (/^browser_/.test(tool)) return 'Navegando la web de la marca';
  const map: Record<string, string> = {
    skill_view: 'Cargando skills',
    skills_list: 'Cargando skills',
    search_files: 'Consultando el repositorio',
    read_file: 'Leyendo archivos del repositorio',
    web_search: 'Buscando en la web',
    web_extract: 'Leyendo páginas de la marca',
    write_file: 'Escribiendo el HTML',
    patch: 'Corrigiendo el HTML',
    vision_analyze: 'Revisando capturas de la newsletter',
    terminal: 'Renderizando y comprobando',
    execute_code: 'Ejecutando comprobaciones',
    todo: 'Planificando',
  };
  return map[tool] || (/image/i.test(tool) ? 'Generando imágenes' : 'Trabajando');
}

export interface Progress {
  pct: number;
  stage: Stage;
  stageLabel: string;
  detail: string;
  actions: number;
  elapsedSec: number;
  etaSec: number | null;
}

export interface ToolCall {
  name: string;
  target: string;
}

export function estimateProgress(calls: ToolCall[], elapsedSec: number, expectedSec: number): Progress {
  // Antes del primer .html Hermes también escribe scripts de apoyo (preparar el logo, renderizar)
  // y mira capturas de la web: todo eso es preparación/investigación, no la newsletter.
  let stage: Stage = 'preparando';
  let wroteHtml = false;
  for (const { name, target } of calls) {
    const isHtmlWrite = (name === 'write_file' || name === 'patch') && /\.html?$/i.test(target);
    if (isHtmlWrite && !wroteHtml) {
      wroteHtml = true;
      stage = 'escribiendo';
    } else if (wroteHtml && (name === 'vision_analyze' || name === 'browser_vision')) {
      stage = 'revisando';
    } else if (!wroteHtml && stage === 'preparando' && (/^web_/.test(name) || /^browser_/.test(name))) {
      stage = 'investigando';
    }
  }
  const { from, to, label } = STAGES[stage];
  const byTime = (elapsedSec / expectedSec) * 100;
  const pct = Math.round(Math.min(to - 1, Math.max(from, byTime)));
  const last = calls[calls.length - 1];
  return {
    pct,
    stage,
    stageLabel: label,
    detail: last ? describeTool(last.name) : 'Arrancando Hermes',
    actions: calls.length,
    elapsedSec: Math.round(elapsedSec),
    etaSec: elapsedSec < expectedSec ? Math.max(60, Math.round(expectedSec - elapsedSec)) : null,
  };
}

function expectedSeconds(): number {
  try {
    const mins = (JSON.parse(fs.readFileSync(DURATIONS_FILE, 'utf8')) as number[]).slice(-10).sort((a, b) => a - b);
    if (mins.length) return mins[Math.floor(mins.length / 2)] * 60;
  } catch {
    // Sin historial todavía: valor por defecto (lo que suele tardar según el usuario).
  }
  return DEFAULT_EXPECTED_MIN * 60;
}

function recordDuration(minutes: number): void {
  let all: number[] = [];
  try {
    all = JSON.parse(fs.readFileSync(DURATIONS_FILE, 'utf8'));
  } catch {
    // primer registro
  }
  fs.writeFileSync(DURATIONS_FILE, JSON.stringify([...all, Math.max(1, minutes)].slice(-20)));
}

function sessionStamp(d: Date): string {
  const p = (n: number): string => String(n).padStart(2, '0');
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}_${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`;
}

/** Sesión que abrió este `hermes -z`: la primera creada después de lanzarlo (los IDs de sesión
 *  empiezan por la fecha y hora local de creación). */
async function findSessionId(since: Date): Promise<string | null> {
  const { stdout } = await execFileAsync(HERMES_BIN, ['sessions', 'list'], { timeout: 30000 });
  const floor = sessionStamp(new Date(since.getTime() - 5000));
  const ids = [...stdout.matchAll(/(\d{8}_\d{6}_[0-9a-f]+)\s*$/gm)].map((m) => m[1]).filter((id) => id.slice(0, 15) >= floor);
  return ids.sort()[0] || null;
}

export function toolCallsFromSession(session: { messages?: unknown[] }): ToolCall[] {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (session.messages || []).flatMap((m: any) =>
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (m.tool_calls || []).map((tc: any) => {
      let args: Record<string, unknown> = {};
      try {
        args = JSON.parse(tc.function?.arguments || '{}');
      } catch {
        // argumentos no JSON: solo importa el nombre
      }
      return { name: tc.function?.name || tc.name || '', target: String(args.path || args.file_path || '') };
    })
  );
}

async function sessionToolCalls(sessionId: string): Promise<ToolCall[]> {
  const tmp = path.join(os.tmpdir(), `hermes-worker-${sessionId}.jsonl`);
  await execFileAsync(HERMES_BIN, ['sessions', 'export', tmp, '--session-id', sessionId], { timeout: 30000 });
  try {
    return toolCallsFromSession(JSON.parse(fs.readFileSync(tmp, 'utf8').split('\n')[0]));
  } finally {
    fs.rmSync(tmp, { force: true });
  }
}

/** El .html más reciente escrito después de `sinceMs` en cualquier subcarpeta directa de `dir`. */
function newestHtmlSince(dir: string, sinceMs: number): string | null {
  if (!fs.existsSync(dir)) return null;
  const found = fs
    .readdirSync(dir, { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .map((e) => newestHtml(path.join(dir, e.name)))
    .filter((f): f is string => !!f && fs.statSync(f).mtimeMs >= sinceMs)
    .sort((a, b) => fs.statSync(b).mtimeMs - fs.statSync(a).mtimeMs);
  return found[0] || null;
}

let current: string | null = null;
let currentChild: ReturnType<typeof spawn> | null = null;

/** Veces que se le dice a Hermes "continúa" si termina sin haber dejado el HTML (en la app de
 *  escritorio lo haría el usuario; p. ej. el 2026-09-24 Hermes anunció "reintento la extracción"
 *  y terminó el turno sin reintentar). */
const MAX_CONTINUES = 3;
/** Sin ninguna actividad en la sesión durante este tiempo, la barra avisa de que parece atascado. */
const STALL_WARN_SEC = 10 * 60;

/** Las skills de newsletter de Hermes han crecido a ~100 KB por archivo. Por `skill_view` llegan
 *  como UNA línea JSON de 100 KB que Hermes guarda en un temporal y no consigue leer por tramos
 *  (read_file devuelve siempre la misma línea recortada): el 2026-09-24 entró en bucle
 *  (4 skill_view + 3 read_file) y se quedó parado. Leídos del disco son Markdown normal. */
const LARGE_SKILL_FILE_BYTES = 40 * 1024;

function skillReadingNote(): string {
  const skillsDir = path.join(os.homedir(), '.hermes', 'skills');
  const large: string[] = [];
  const walk = (dir: string, depth: number): void => {
    if (depth > 4 || !fs.existsSync(dir)) return;
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const abs = path.join(dir, e.name);
      if (e.isDirectory()) walk(abs, depth + 1);
      else if (e.name.endsWith('.md') && /newsletter/i.test(abs) && fs.statSync(abs).size > LARGE_SKILL_FILE_BYTES) large.push(abs);
    }
  };
  walk(skillsDir, 0);
  if (!large.length) return '';
  return [
    '',
    '## Nota de entorno (worker de Hermes Studio)',
    'Estos archivos de skill son demasiado grandes para skill_view (llegan como una sola línea que no',
    'se puede leer por tramos). Léelos DIRECTAMENTE del disco con read_file, por tramos con offset/limit,',
    'y solo las secciones que necesites:',
    ...large.map((f) => `- ${f}`),
  ].join('\n');
}

/** Un turno de Hermes: `hermes chat -q` (no interactivo, aprueba solo los comandos) — a
 *  diferencia de `-z`, imprime el session_id y permite retomar la sesión con --resume. */
function runHermesTurn(
  query: string,
  resumeId: string | null,
  onSession: (id: string) => void
): Promise<{ code: number | null; output: string; stderr: string }> {
  const args = ['chat', '-q', query, '-Q', '--yolo', ...(resumeId ? ['--resume', resumeId] : [])];
  const child = spawn(HERMES_BIN, args, { cwd: ROOT, env: process.env, stdio: ['ignore', 'pipe', 'pipe'] });
  currentChild = child;
  let stdout = '';
  let stderr = '';
  child.stdout!.on('data', (d) => {
    stdout += d;
    const m = stdout.match(/session_id:\s*(\S+)/);
    if (m) onSession(m[1]);
  });
  child.stderr!.on('data', (d) => (stderr = (stderr + d).slice(-8000)));
  return new Promise((resolve) => {
    child.on('close', (code) => {
      currentChild = null;
      resolve({ code, output: stdout.replace(/^\s*session_id:.*$/m, '').trim(), stderr });
    });
    child.on('error', (err) => {
      currentChild = null;
      resolve({ code: -1, output: stdout, stderr: `${stderr}\n${err.message}` });
    });
  });
}

async function runJob(job: { id: string; prompt: string; outputDir: string }): Promise<void> {
  current = job.id;
  const outAbs = path.join(ROOT, job.outputDir);
  fs.mkdirSync(outAbs, { recursive: true });
  const started = Date.now();
  const expectedFile = path.join(outAbs, 'newsletter.html');
  // Si Hermes escribe mal la ruta (erratas al copiarla), se acepta cualquier .html escrito durante
  // este trabajo en la carpeta hermes/ de la marca.
  const htmlReady = (): string | null =>
    fs.existsSync(expectedFile) ? expectedFile : newestHtml(outAbs) || newestHtmlSince(path.dirname(outAbs), started);
  console.log(`[${stamp()}] Trabajo ${job.id} → ${job.outputDir}`);

  const expected = expectedSeconds();
  let sessionId: string | null = null;
  let lastCount = -1;
  let lastChange = Date.now();
  let busy = false;
  const heartbeat = setInterval(async () => {
    if (busy) return;
    busy = true;
    const elapsed = (Date.now() - started) / 1000;
    let tools: ToolCall[] = [];
    try {
      sessionId = sessionId || (await findSessionId(new Date(started)));
      if (sessionId) tools = await sessionToolCalls(sessionId);
    } catch {
      // Si no se puede leer la sesión, el progreso sigue solo por tiempo.
    }
    if (tools.length !== lastCount) {
      lastCount = tools.length;
      lastChange = Date.now();
    }
    const progress = estimateProgress(tools, elapsed, expected);
    const idleSec = (Date.now() - lastChange) / 1000;
    if (idleSec >= STALL_WARN_SEC) {
      progress.detail = `Hermes lleva ${Math.round(idleSec / 60)} min sin avanzar (esperando al modelo)`;
    }
    await api(`/api/worker/jobs/${job.id}/progress`, { progress }).catch(() => undefined);
    busy = false;
  }, PROGRESS_MS);
  const killer = setTimeout(() => currentChild?.kill('SIGTERM'), TIMEOUT_MS);

  let turn = await runHermesTurn(job.prompt + skillReadingNote(), null, (id) => (sessionId = sessionId || id));
  for (let i = 1; i <= MAX_CONTINUES && !htmlReady() && sessionId && Date.now() - started < TIMEOUT_MS; i++) {
    console.log(`[${stamp()}] Hermes paró sin entregar: continuar (${i}/${MAX_CONTINUES})`);
    await api(`/api/worker/jobs/${job.id}/progress`, {
      message: `Hermes se detuvo antes de entregar; se le pide que continúe (${i}/${MAX_CONTINUES}).`,
    }).catch(() => undefined);
    turn = await runHermesTurn(
      `Continúa con el encargo: todavía no existe ${job.outputDir}/newsletter.html. Sigue trabajando ` +
        '(reintenta lo que haya fallado o busca otra fuente) hasta dejar ese archivo terminado y revisado. ' +
        'No te detengas a anunciar lo que vas a hacer: hazlo.',
      sessionId,
      () => undefined
    );
  }
  clearInterval(heartbeat);
  clearTimeout(killer);
  const minutes = Math.round((Date.now() - started) / 60000);

  const htmlPath = htmlReady();
  if (!htmlPath) {
    const why = Date.now() - started >= TIMEOUT_MS ? `se agotó el tiempo (${minutes} min)` : `terminó (código ${turn.code}) sin dejar el HTML en ${job.outputDir}/`;
    await api(`/api/worker/jobs/${job.id}/fail`, {
      error: `Hermes ${why}.\n\nÚltima respuesta de Hermes:\n${(turn.output || turn.stderr).trim().slice(-2500)}`,
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
  const res = await api(`/api/worker/jobs/${job.id}/complete`, { html, finalMessage: turn.output });
  if (res.ok) recordDuration(minutes);
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
  currentChild?.kill('SIGTERM');
  if (current) {
    await api(`/api/worker/jobs/${current}/fail`, { error: 'El worker de Hermes se detuvo a mitad del trabajo. Vuelve a enviarlo.' }).catch(() => undefined);
  }
  process.exit(0);
});

if (require.main === module) void main();
