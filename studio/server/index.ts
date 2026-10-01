/**
 * index.ts — servidor del servicio. Autenticación por Basic Auth con una contraseña
 * compartida de equipo (sin sesiones/cookies que mantener): suficiente para una herramienta
 * interna v1, documentado como limitación en studio/README.md.
 *
 * Arranque sin contraseña (auditoría 2026-09-23, BUG-H09): antes, si APP_ACCESS_PASSWORD estaba
 * vacía el servicio arrancaba igualmente ABIERTO, con solo un console.warn — fácil de pasar por
 * alto en un deploy real (Railway/Docker) si se olvida fijar la variable. Ahora arrancar sin
 * contraseña requiere el flag explícito ALLOW_NO_AUTH=true (documentado en .env.example para
 * que el quick-start local siga funcionando sin pasos extra); sin contraseña NI ese flag, el
 * proceso se niega a arrancar (falla ruidoso, no silenciosamente abierto).
 */
import express, { type NextFunction, type Request, type Response } from 'express';
import * as path from 'path';
import * as fs from 'fs';
import * as crypto from 'crypto';
import { loadEnv } from '../../scripts/lib/env';
import { ROOT, STUDIO_DIR, BRANDS_DIR } from './paths';
import { createJob, getJob, listJobs, readEvents, updateJob, isValidJobId } from './store';
import type { Job } from './store';
import { enqueue, recoverOnStartup } from './queue';
import { slugify } from './campaignFs';
import { createRateLimiter } from './rateLimit';
import {
  buildHermesPrompt,
  buildBriefPrompt,
  buildMobileFixPrompt,
  buildRevisionPrompt,
  readResultHtml,
  readResultNotes,
  resultMeta,
  queueInfo,
  queueWait,
  versionFamily,
  typicalDurations,
  typicalSeconds,
  durationSec,
  createTextEditVersion,
  approveVersion,
  archiveFamily,
  TextEditNoChanges,
  saveThumbnail,
  pendingThumbnails,
  sanitizeQuality,
  needsBrief,
  completeStandaloneJob,
  standaloneOutputDir,
  log as hermesLog,
  promptMentionsBrand,
  sweepStaleHermesJobs,
  saveWorkerBrands,
  readWorkerBrands,
} from './standalone';
import { TextEditError, type TextEdit, type AltEdit } from './textEdit';

loadEnv(ROOT);
loadEnv(STUDIO_DIR);

const PORT = Number(process.env.PORT || 3000);
const ACCESS_PASSWORD = process.env.APP_ACCESS_PASSWORD;
const ALLOW_NO_AUTH = process.env.ALLOW_NO_AUTH === 'true';
/** El pipeline de 9 fases ya no se ofrece en la interfaz, pero seguía aceptándose por API y
 *  gastando la clave de OpenAI de Railway (auditoría 2026-09-24). Solo con PIPELINE_ENABLED=true. */
const PIPELINE_ENABLED = process.env.PIPELINE_ENABLED === 'true';

if (!ACCESS_PASSWORD && !ALLOW_NO_AUTH) {
  console.error(
    '\nERROR: APP_ACCESS_PASSWORD no está configurada y ALLOW_NO_AUTH no es "true".\n' +
    'El servicio se niega a arrancar abierto sin contraseña por accidente.\n' +
    'Fija APP_ACCESS_PASSWORD para producción, o ALLOW_NO_AUTH=true si de verdad quieres\n' +
    'correrlo sin contraseña (solo desarrollo local) — ver studio/.env.example.\n'
  );
  process.exit(1);
}

/** Comparación de longitud constante — timingSafeEqual exige buffers del mismo tamaño. */
function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a, 'utf8');
  const bufB = Buffer.from(b, 'utf8');
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

const app = express();
// Necesario para que rateLimit.ts vea la IP real del cliente (no la del proxy) detrás de
// Railway/Docker (ver docker-compose.yml) — sin esto, `req.ip` devuelve la IP del proxy para
// TODAS las peticiones y el limitador por IP no distingue a nadie (auditoría 2026-09-23).
// TRUST_PROXY_HOPS (2026-09-24): con el frontend en Vercel reenviando /api y /assets a Railway
// hay DOS proxies delante (Vercel + Railway) — con 1 salto, req.ip sería la IP de salida de
// Vercel y todo el equipo compartiría el mismo cupo del limitador. En ese despliegue se fija a 2.
// Contrapartida: quien llame directo a la URL de Railway puede falsear un salto de
// X-Forwarded-For y esquivar el limitador por IP (la contraseña sigue siendo obligatoria).
const TRUST_PROXY_HOPS = Number(process.env.TRUST_PROXY_HOPS || 1);
app.set('trust proxy', Number.isInteger(TRUST_PROXY_HOPS) && TRUST_PROXY_HOPS >= 0 ? TRUST_PROXY_HOPS : 1);
// Las rutas del worker llevan su propio parser (la newsletter llega con las imágenes en base64).
const jsonSmall = express.json({ limit: '2mb' });
app.use((req: Request, res: Response, next: NextFunction) =>
  req.path.startsWith('/api/worker/') ? next() : jsonSmall(req, res, next)
);

// Límite de intentos de contraseña (auditoría 2026-09-23, BUG-H09): antes la única barrera de
// acceso era una contraseña compartida sin ningún límite — fuerza-bruteable sin fricción si el
// servicio queda expuesto. 20 intentos FALLIDOS / 5 min por IP corta un ataque de diccionario
// automatizado sin penalizar el uso normal ya autenticado (solo se consume cupo cuando la
// contraseña es incorrecta — ver recordFailure más abajo; contar también los aciertos habría
// bloqueado a un usuario legítimo tras un puñado de peticiones GET normales del panel).
const authRateLimit = createRateLimiter({
  windowMs: 5 * 60 * 1000,
  max: 20,
  keyPrefix: 'auth',
  message: 'Demasiados intentos de autenticación fallidos. Inténtalo de nuevo en unos minutos.'
});

// /assets es PÚBLICO y solo sirve imágenes (2026-09-24, cierra BUG-H13): las newsletters
// referencian estas URLs (logos, hero generado) y el cliente de correo del destinatario no tiene
// la contraseña de Studio — detrás del Basic Auth llegaban sin imágenes. Cualquier otro archivo
// de brands/ (tokens, .md, capturas HTML) sigue sin exponerse.
const PUBLIC_ASSET_RE = /\.(png|jpe?g|gif|webp|svg)$/i;
app.use('/assets', (req: Request, res: Response, next: NextFunction) => {
  if (!PUBLIC_ASSET_RE.test(req.path) || req.path.split('/').some((seg) => seg.startsWith('.'))) {
    res.status(404).end();
    return;
  }
  next();
}, express.static(BRANDS_DIR, {
  dotfiles: 'deny',
  index: false,
  fallthrough: false,
  // Un SVG puede llevar <script>: en sandbox no se ejecuta nada ni accede al origen de Studio.
  setHeaders: (res) => res.setHeader('Content-Security-Policy', 'sandbox'),
}));

// --- Worker de Hermes (2026-09-24) -------------------------------------------------------
// El Mac del usuario (studio/worker/hermes-worker.ts) recoge los trabajos standalone, los ejecuta
// con `hermes -z` y devuelve el HTML. Autenticación propia con WORKER_TOKEN (Bearer), distinta de
// la contraseña del equipo; sin WORKER_TOKEN estas rutas no existen. Van antes del Basic Auth.
const WORKER_TOKEN = process.env.WORKER_TOKEN || '';
let lastWorkerSeen = 0;

// Cualquier ruta con :id valida el formato antes de tocar el disco (ver isValidJobId).
app.param('id', (req: Request, res: Response, next: NextFunction, id: string) => {
  if (!isValidJobId(id)) {
    res.status(404).json({ error: 'No encontrado' });
    return;
  }
  next();
});

function requireWorker(req: Request, res: Response, next: NextFunction): void {
  const header = req.headers.authorization || '';
  if (!WORKER_TOKEN || !header.startsWith('Bearer ') || !safeEqual(header.slice(7), WORKER_TOKEN)) {
    res.status(401).json({ error: 'Token de worker no válido.' });
    return;
  }
  lastWorkerSeen = Date.now();
  next();
}

function standaloneJobForWorker(req: Request, res: Response): ReturnType<typeof getJob> {
  const job = getJob(req.params.id);
  // Cancelado desde la web: el worker lo ve en su siguiente llamada (progreso cada 30 s) y para.
  if (job && job.input.mode === 'standalone' && job.status === 'cancelled') {
    res.status(409).json({ cancelled: true, error: 'El trabajo se ha cancelado.' });
    return null;
  }
  if (!job || job.input.mode !== 'standalone' || job.status !== 'running') {
    res.status(404).json({ error: 'Trabajo no encontrado o no está en curso.' });
    return null;
  }
  return job;
}

// El worker llama aquí al arrancar: si tenía un trabajo a medias (Ctrl+C, cierre, Mac reiniciado)
// ese trabajo ya no sigue vivo — sin esto quedaba "running" hasta el límite de 4 h. Hay un solo
// worker, así que todo standalone en curso es suyo.
app.post('/api/worker/reset', requireWorker, express.json({ limit: '256kb' }), (req: Request, res: Response) => {
  saveWorkerBrands(req.body?.brands);
  let failed = 0;
  // Sus carpetas: el worker las aparta (_fallido-…) para que Hermes no tome el intento a medias por
  // trabajo previo (Lacoste, 2026-09-29).
  const failedDirs: string[] = [];
  for (const j of listJobs()) {
    if (j.input.mode === 'standalone' && j.status === 'running') {
      hermesLog(j.id, 'El worker de Hermes se reinició a mitad del trabajo.', 'error');
      updateJob(j.id, { status: 'failed', error: 'El worker de Hermes se reinició a mitad del trabajo. Vuelve a enviarlo.' });
      failedDirs.push(standaloneOutputDir(j));
      failed++;
    }
  }
  res.json({ failed, failedDirs });
});

app.post('/api/worker/claim', requireWorker, express.json({ limit: '256kb' }), (req: Request, res: Response) => {
  if (req.body?.brands) saveWorkerBrands(req.body.brands);
  sweepStaleHermesJobs();
  const standalone = listJobs().filter((j) => j.input.mode === 'standalone');
  const next = standalone.filter((j) => j.status === 'queued').sort((a, b) => a.createdAt.localeCompare(b.createdAt))[0];
  if (!next) {
    res.status(204).end();
    return;
  }
  const job = updateJob(next.id, { status: 'running', currentPhase: 'hermes', startedAt: new Date().toISOString() });
  hermesLog(job.id, 'Hermes ha recogido el trabajo y está trabajando.');
  res.json({
    id: job.id,
    outputDir: standaloneOutputDir(job),
    // Lo que suelen tardar los de su tipo (mediana real): el worker lo usa para el porcentaje y la
    // estimación de los cambios y adaptaciones (2026-09-28).
    expectedSec: typicalSeconds(job),
    // Instrucción básica: el worker ejecuta primero briefPrompt y luego pide el encargo final
    // a /brief. Con prompt pegado, el encargo va directamente.
    ...(job.input.revisionOf
      ? (() => {
          const source = getJob(job.input.revisionOf) || job;
          return { editKind: 'revision', prompt: buildRevisionPrompt(job), sourceHtml: readResultHtml(source) || '', sourceNotes: readResultNotes(source) || '' };
        })()
      : job.input.mobileFixOf
      ? { editKind: 'mobile-fix', prompt: buildMobileFixPrompt(job), sourceHtml: readResultHtml(getJob(job.input.mobileFixOf) || job) || '' }
      : needsBrief(job)
        ? { briefPrompt: buildBriefPrompt(job) }
        : { prompt: buildHermesPrompt(job) }),
  });
});

app.post('/api/worker/jobs/:id/brief', requireWorker, express.json({ limit: '1mb' }), (req: Request, res: Response) => {
  const job = standaloneJobForWorker(req, res);
  if (!job) return;
  const brief = typeof req.body?.brief === 'string' ? req.body.brief.trim() : '';
  if (brief.length < 200) {
    res.status(400).json({ error: 'El brief está vacío o incompleto.' });
    return;
  }
  const updated = updateJob(job.id, { input: { ...job.input, briefText: brief.slice(0, 200000) } });
  hermesLog(job.id, 'Brief creativo listo: Hermes empieza la newsletter.', 'success');
  res.json({ prompt: buildHermesPrompt(updated) });
});

app.post('/api/worker/jobs/:id/progress', requireWorker, express.json({ limit: '64kb' }), (req: Request, res: Response) => {
  const job = standaloneJobForWorker(req, res);
  if (!job) return;
  const p = req.body?.progress;
  if (p && typeof p === 'object' && Number.isFinite(p.pct)) {
    const progress = {
      pct: Math.max(0, Math.min(100, Math.round(p.pct))),
      stage: String(p.stage || '').slice(0, 40),
      stageLabel: String(p.stageLabel || '').slice(0, 120),
      detail: String(p.detail || '').slice(0, 200),
      actions: Number(p.actions) || 0,
      elapsedSec: Number(p.elapsedSec) || 0,
      etaSec: Number.isFinite(p.etaSec) ? Number(p.etaSec) : null,
      lastActionAt: Number.isFinite(p.lastActionAt) ? Number(p.lastActionAt) : null,
    };
    if (progress.stage && progress.stage !== job.progress?.stage) hermesLog(job.id, `${progress.stageLabel}…`);
    updateJob(job.id, { progress });
  } else {
    updateJob(job.id, {}); // renueva updatedAt: el trabajo sigue vivo
  }
  if (req.body?.message) hermesLog(job.id, String(req.body.message).slice(0, 2000), req.body.level === 'error' ? 'error' : 'info');
  res.json({ ok: true });
});

app.post('/api/worker/jobs/:id/complete', requireWorker, express.json({ limit: '80mb' }), (req: Request, res: Response) => {
  const job = standaloneJobForWorker(req, res);
  if (!job) return;
  if (typeof req.body?.html !== 'string' || !/<html[\s>]/i.test(req.body.html)) {
    res.status(400).json({ error: 'Falta el HTML de la newsletter.' });
    return;
  }
  try {
    completeStandaloneJob(job.id, req.body.html, String(req.body.finalMessage || ''), sanitizeQuality(req.body.quality), req.body.thumbnail);
    res.json({ ok: true });
  } catch (err) {
    updateJob(job.id, { status: 'failed', error: (err as Error).message });
    res.status(500).json({ error: (err as Error).message });
  }
});

app.post('/api/worker/jobs/:id/fail', requireWorker, express.json({ limit: '256kb' }), (req: Request, res: Response) => {
  const job = standaloneJobForWorker(req, res);
  if (!job) return;
  const error = String(req.body?.error || 'Hermes no pudo terminar la newsletter.').slice(0, 4000);
  hermesLog(job.id, error, 'error');
  updateJob(job.id, { status: 'failed', error });
  res.json({ ok: true });
});

// Miniaturas de newsletters anteriores (2026-09-28): el worker, cuando está libre, pide unas pocas sin
// miniatura, las renderiza en el Mac y las sube. Railway no abre ningún navegador.
app.post('/api/worker/thumbs/pending', requireWorker, express.json({ limit: '16kb' }), (_req: Request, res: Response) => {
  res.json({ jobs: pendingThumbnails(3) });
});

app.post('/api/worker/jobs/:id/thumb', requireWorker, express.json({ limit: '1mb' }), (req: Request, res: Response) => {
  const job = getJob(req.params.id);
  if (!job || job.input.mode !== 'standalone' || job.status !== 'completed') {
    res.status(404).json({ error: 'Trabajo no encontrado o no terminado.' });
    return;
  }
  if (req.body?.failed) {
    updateJob(job.id, { thumbFailed: true });
    res.json({ ok: true });
    return;
  }
  const rel = saveThumbnail(job, req.body?.image);
  if (!rel) {
    res.status(400).json({ error: 'Miniatura no válida.' });
    return;
  }
  updateJob(job.id, { thumbRelPath: rel });
  res.json({ ok: true });
});

if (ACCESS_PASSWORD) {
  app.use((req: Request, res: Response, next: NextFunction) => {
    if (authRateLimit.isLimited(req)) {
      authRateLimit.reject(req, res);
      return;
    }
    const header = req.headers.authorization;
    if (header?.startsWith('Basic ')) {
      const decoded = Buffer.from(header.slice(6), 'base64').toString('utf8');
      const separatorIndex = decoded.indexOf(':');
      const password = separatorIndex >= 0 ? decoded.slice(separatorIndex + 1) : '';
      if (safeEqual(password, ACCESS_PASSWORD)) return next();
    }
    authRateLimit.recordFailure(req);
    res.set('WWW-Authenticate', 'Basic realm="Hermes Studio"');
    res.status(401).send('Autenticación requerida.');
  });
} else {
  console.warn('ATENCION: arrancando SIN contraseña porque ALLOW_NO_AUTH=true -- el servicio queda abierto (solo para desarrollo local).');
}

app.use(express.static(path.join(STUDIO_DIR, 'web')));

/** clientSlug acaba en rutas de disco (brands/{slug}, newsletters/{año}/{slug}): nada de
 *  "../" ni barras — antes existingBrand se usaba tal cual llegaba del formulario. */
const SLUG_RE = /^[a-z0-9][a-z0-9-]{0,59}$/;

// Modo standalone: vale cualquier marca con carpeta en brands/ (logos/imágenes), aunque no
// tenga brand-tokens.json — el pack completo solo lo exigía el pipeline de 9 fases.
app.get('/api/brands', (_req: Request, res: Response) => {
  const local = fs.existsSync(BRANDS_DIR)
    ? fs
        .readdirSync(BRANDS_DIR, { withFileTypes: true })
        .filter((e) => e.isDirectory() && SLUG_RE.test(e.name))
        .map((e) => e.name)
    : [];
  // Las del Mac del worker primero: es donde Hermes busca brands/{marca}/.
  const brands = [...new Set([...readWorkerBrands(), ...local])].sort();
  res.json({ brands });
});

// Límite de creación de jobs (auditoría 2026-09-23, BUG-H09): cada job dispara varias llamadas
// reales a Anthropic/OpenAI y, si la marca es nueva, una navegación Playwright completa — sin
// límite, alguien con la contraseña (o un script tras un fallo del gate de auth) podía agotar
// cuota de API o saturar la cola de un solo job en curso (ver README, "Un job a la vez").
const createJobRateLimit = createRateLimiter({
  windowMs: 10 * 60 * 1000,
  max: 5,
  keyPrefix: 'create-job',
  message: 'Demasiados jobs creados en poco tiempo. Espera unos minutos antes de enviar otro.'
});

app.post('/api/jobs', createJobRateLimit.middleware, (req: Request, res: Response) => {
  const body = req.body || {};
  if (body.existingBrand && !SLUG_RE.test(String(body.existingBrand))) {
    res.status(400).json({ error: 'Marca no válida.' });
    return;
  }

  if (body.mode === 'standalone') {
    if (!body.promptText || !body.clientName) {
      res.status(400).json({ error: 'Faltan campos obligatorios: marca y prompt.' });
      return;
    }
    if (body.imageMode !== 'official' && body.imageMode !== 'ai') {
      res.status(400).json({ error: 'Elige de dónde salen las imágenes: assets oficiales o IA.' });
      return;
    }
    const fromInstruction = body.inputKind === 'instruction';
    const clientSlug = body.existingBrand || slugify(body.clientName);
    if (!body.confirmBrand && !promptMentionsBrand(String(body.promptText), String(body.clientName), clientSlug)) {
      res.status(409).json({
        code: 'brand_mismatch',
        error: `${fromInstruction ? 'La instrucción' : 'El prompt'} no menciona "${body.clientName}". ¿Seguro que la marca elegida es la correcta?`,
      });
      return;
    }
    const job = createJob({
      mode: 'standalone',
      clientSlug,
      clientName: body.clientName,
      brandMode: body.existingBrand ? 'existing' : 'new',
      briefText: fromInstruction ? '' : body.promptText,
      instruction: fromInstruction ? String(body.promptText).slice(0, 4000) : undefined,
      imageMode: body.imageMode,
      requesterName: body.requesterName || undefined,
    });
    // No pasa por la cola interna: lo recoge el worker de Hermes (ver /api/worker/claim).
    hermesLog(
      job.id,
      Date.now() - lastWorkerSeen < 2 * 60 * 1000
        ? 'En cola: Hermes lo recogerá en unos segundos.'
        : 'En cola: Hermes no está conectado ahora mismo — empezará en cuanto el Mac del worker se conecte.'
    );
    res.status(201).json({ id: job.id });
    return;
  }

  if (!PIPELINE_ENABLED) {
    res.status(400).json({ error: 'El pipeline de 9 fases está desactivado (PIPELINE_ENABLED). Usa el modo standalone.' });
    return;
  }

  if (!body.briefText || !body.clientName) {
    res.status(400).json({ error: 'Faltan campos obligatorios: clientName, briefText.' });
    return;
  }

  const brandMode: 'existing' | 'new' = body.brandMode === 'existing' ? 'existing' : 'new';
  if (brandMode === 'new' && !body.brandUrl) {
    res.status(400).json({ error: 'Falta la URL de la marca para poder analizarla.' });
    return;
  }
  const clientSlug = brandMode === 'existing' && body.existingBrand ? body.existingBrand : slugify(body.clientName);

  const job = createJob({
    clientSlug,
    clientName: body.clientName,
    brandMode,
    brandUrl: body.brandUrl || undefined,
    briefText: body.briefText,
    ctaLabel: body.ctaLabel || undefined,
    ctaUrl: body.ctaUrl || undefined,
    legalNotes: body.legalNotes || undefined,
    requesterName: body.requesterName || undefined,
  });

  enqueue(job.id);
  res.status(201).json({ id: job.id });
});

/** Estado de Hermes para la cabecera (2026-09-28): conectado o no, con qué newsletter está y cuántas esperan. */
app.get('/api/status', (_req: Request, res: Response) => {
  const standalone = listJobs().filter((j) => j.input.mode === 'standalone');
  const running = standalone.find((j) => j.status === 'running');
  res.json({
    hermesOnline: Date.now() - lastWorkerSeen < 2 * 60 * 1000,
    current: running
      ? { id: running.id, clientName: running.input.clientName, pct: running.progress?.pct ?? null, stageLabel: running.progress?.stageLabel ?? null }
      : null,
    queued: standalone.filter((j) => j.status === 'queued').length,
    // Lo que esperaría una newsletter enviada ahora antes de empezar (2026-09-30): el formulario lo suma a lo que suele tardar.
    wait: queueWait(),
    typical: typicalDurations(),
  });
});

/** Historial ligero para la página principal (sin el prompt completo de cada trabajo). */
app.get('/api/jobs', (_req: Request, res: Response) => {
  sweepStaleHermesJobs();
  const jobs = listJobs()
    .filter((j) => j.input.mode === 'standalone')
    .slice(0, 200)
    .map((j) => ({
      id: j.id,
      createdAt: j.createdAt,
      status: j.status,
      clientName: j.input.clientName,
      clientSlug: j.input.clientSlug,
      requesterName: j.input.requesterName || null,
      imageMode: j.input.imageMode || null,
      fromInstruction: !!j.input.instruction,
      mobileFixOf: j.input.mobileFixOf || null,
      revisionOf: j.input.revisionOf || null,
      textEditOf: j.input.textEditOf || null,
      retryOf: j.input.retryOf || null,
      durationSec: durationSec(j),
      hasThumb: !!j.thumbRelPath,
      pct: j.progress?.pct ?? null,
      elapsedSec: j.progress?.elapsedSec ?? null,
      error: j.status === 'failed' || j.status === 'blocked' ? (j.error || j.blockedReason || '').slice(0, 200) : null,
      approvedAt: j.approvedAt || null,
      approvedBy: j.approvedBy || null,
      archivedAt: j.archivedAt || null,
    }));
  res.json({ jobs });
});

app.get('/api/jobs/:id', (req: Request, res: Response) => {
  sweepStaleHermesJobs();
  const job = getJob(req.params.id);
  if (!job) {
    res.status(404).json({ error: 'No encontrado' });
    return;
  }
  res.json({
    job,
    events: readEvents(job.id),
    notes: readResultNotes(job),
    meta: resultMeta(job),
    queue: queueInfo(job),
    versions: versionFamily(job),
    retriedBy: retriedBy(job),
    hermesOnline: Date.now() - lastWorkerSeen < 2 * 60 * 1000,
  });
});

/** El reintento más reciente de un trabajo fallido o cancelado, para enlazarlo desde su página. */
function retriedBy(job: Job): { id: string; status: Job['status'] } | null {
  const last = listJobs()
    .filter((j) => j.input.retryOf === job.id)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];
  return last ? { id: last.id, status: last.status } : null;
}

// "Reintentar" (2026-10-01): relanza un trabajo fallido o cancelado con lo mismo que se pidió. Si Hermes
// ya había escrito el brief (desde instrucción), se reutiliza: el fallo vino después y regenerarlo costaba
// 5-20 min (Lacoste, 2026-09-29). Cambios y adaptaciones se relanzan sobre la misma versión de partida.
app.post('/api/jobs/:id/retry', createJobRateLimit.middleware, (req: Request, res: Response) => {
  const source = getJob(req.params.id);
  if (!source || source.input.mode !== 'standalone' || source.input.textEditOf) {
    res.status(404).json({ error: 'No encontrado' });
    return;
  }
  if (!['failed', 'cancelled', 'blocked'].includes(source.status)) {
    res.status(409).json({ error: 'Solo se puede reintentar un trabajo fallido o cancelado.' });
    return;
  }
  const baseId = source.input.revisionOf || source.input.mobileFixOf;
  const base = baseId ? getJob(baseId) : null;
  if (baseId && (!base || !readResultHtml(base))) {
    res.status(409).json({ error: 'La versión de la que salía ya no está disponible: no se puede reintentar.' });
    return;
  }
  const briefReused = !!source.input.instruction && !!source.input.briefText.trim();
  const requesterName =
    typeof req.body?.requesterName === 'string' && req.body.requesterName.trim() ? req.body.requesterName.trim().slice(0, 80) : source.input.requesterName;
  const job = createJob({ ...source.input, requesterName, retryOf: source.id, briefReused: briefReused || undefined });
  hermesLog(
    job.id,
    `Reintento de ${source.id}: en cola.${briefReused ? ' Parte del brief que Hermes ya escribió (no se vuelve a generar).' : ''}`
  );
  res.status(201).json({ id: job.id, briefReused });
});

// "Adaptar a móvil": nuevo trabajo que parte del HTML de uno terminado (ver buildMobileFixPrompt).
app.post('/api/jobs/:id/mobile-fix', createJobRateLimit.middleware, (req: Request, res: Response) => {
  const source = getJob(req.params.id);
  if (!source || source.input.mode !== 'standalone' || !readResultHtml(source)) {
    res.status(404).json({ error: 'Solo se puede adaptar una newsletter terminada.' });
    return;
  }
  const job = createJob({
    mode: 'standalone',
    clientSlug: source.input.clientSlug,
    clientName: source.input.clientName,
    brandMode: source.input.brandMode,
    briefText: source.input.briefText,
    imageMode: source.input.imageMode,
    // Quien la pide ahora (2026-09-30); sin nombre, el de la newsletter de partida, como en "Pedir cambios".
    requesterName: typeof req.body?.requesterName === 'string' && req.body.requesterName.trim() ? req.body.requesterName.trim().slice(0, 80) : source.input.requesterName,
    mobileFixOf: source.id,
  });
  hermesLog(job.id, `Adaptación a móvil de la newsletter ${source.id}: en cola.`);
  res.status(201).json({ id: job.id });
});

// "Pedir cambios": nuevo trabajo que retoca el HTML de uno terminado según lo que pide el equipo
// (ver buildRevisionPrompt). La newsletter original no se toca.
app.post('/api/jobs/:id/revise', createJobRateLimit.middleware, (req: Request, res: Response) => {
  const source = getJob(req.params.id);
  if (!source || source.input.mode !== 'standalone' || !readResultHtml(source)) {
    res.status(404).json({ error: 'Solo se pueden pedir cambios sobre una newsletter terminada.' });
    return;
  }
  const changes = typeof req.body?.changes === 'string' ? req.body.changes.trim() : '';
  if (changes.length < 5) {
    res.status(400).json({ error: 'Describe qué quieres cambiar.' });
    return;
  }
  const job = createJob({
    mode: 'standalone',
    clientSlug: source.input.clientSlug,
    clientName: source.input.clientName,
    brandMode: source.input.brandMode,
    briefText: source.input.briefText,
    imageMode: source.input.imageMode,
    requesterName: typeof req.body?.requesterName === 'string' && req.body.requesterName.trim() ? req.body.requesterName.trim().slice(0, 80) : source.input.requesterName,
    revisionOf: source.id,
    changeRequest: changes.slice(0, 4000),
  });
  hermesLog(job.id, `Cambios sobre la newsletter ${source.id}: en cola.`);
  res.status(201).json({ id: job.id });
});

// "Editar texto": versión nueva al momento, sin Hermes (ver createTextEditVersion y textEdit.ts).
app.post('/api/jobs/:id/text-edit', createJobRateLimit.middleware, (req: Request, res: Response) => {
  const source = getJob(req.params.id);
  if (!source || source.input.mode !== 'standalone' || source.status !== 'completed' || !readResultHtml(source)) {
    res.status(404).json({ error: 'Solo se puede editar el texto de una newsletter terminada.' });
    return;
  }
  const raw = Array.isArray(req.body?.edits) ? req.body.edits : [];
  const isInt = (n: unknown): n is number => Number.isInteger(n) && (n as number) >= 0 && (n as number) < 100000;
  const edits: TextEdit[] = [];
  for (const e of raw.slice(0, 300)) {
    if (!e || !Array.isArray(e.path) || e.path.length > 80 || !e.path.every(isInt) || !isInt(e.gap)) continue;
    if (typeof e.before !== 'string' || typeof e.after !== 'string' || e.after.length > 5000 || e.before.length > 20000) continue;
    edits.push({ path: e.path, gap: e.gap, before: e.before, after: e.after });
  }
  const rawAlts = Array.isArray(req.body?.alts) ? req.body.alts : [];
  const alts: AltEdit[] = [];
  for (const a of rawAlts.slice(0, 200)) {
    if (!a || !isInt(a.index) || typeof a.before !== 'string' || typeof a.after !== 'string' || a.after.length > 500 || a.before.length > 2000) continue;
    alts.push({ index: a.index, before: a.before, after: a.after });
  }
  if (edits.length !== raw.length || alts.length !== rawAlts.length) {
    res.status(400).json({ error: 'Cambios no válidos.' });
    return;
  }
  const subject = typeof req.body?.subject === 'string' ? req.body.subject.slice(0, 300) : null;
  const requester = typeof req.body?.requesterName === 'string' && req.body.requesterName.trim() ? req.body.requesterName.trim().slice(0, 80) : undefined;
  try {
    const job = createTextEditVersion(source, edits, subject, requester, alts);
    res.status(201).json({ id: job.id });
  } catch (err) {
    if (err instanceof TextEditError || err instanceof TextEditNoChanges) {
      res.status(err instanceof TextEditNoChanges ? 400 : 409).json({ error: err.message });
      return;
    }
    throw err;
  }
});

// "Aprobar para envío": una sola versión aprobada por familia (ver approveVersion).
app.post('/api/jobs/:id/approve', (req: Request, res: Response) => {
  const job = getJob(req.params.id);
  if (!job || job.input.mode !== 'standalone' || job.status !== 'completed') {
    res.status(404).json({ error: 'Solo se puede aprobar una newsletter terminada.' });
    return;
  }
  const raw = Array.isArray(req.body?.checklist) ? req.body.checklist : [];
  const checklist = raw.filter((c: unknown): c is string => typeof c === 'string' && c.trim().length > 0).map((c: string) => c.trim().slice(0, 160)).slice(0, 12);
  const by = typeof req.body?.by === 'string' && req.body.by.trim() ? req.body.by.trim().slice(0, 80) : undefined;
  const updated = approveVersion(job, checklist, by);
  res.json({ ok: true, approvedAt: updated.approvedAt });
});

app.post('/api/jobs/:id/unapprove', (req: Request, res: Response) => {
  const job = getJob(req.params.id);
  if (!job || job.input.mode !== 'standalone') {
    res.status(404).json({ error: 'No encontrado' });
    return;
  }
  if (job.approvedAt) {
    updateJob(job.id, { approvedAt: undefined, approvedBy: undefined, approvalChecklist: undefined });
    hermesLog(job.id, 'Se quitó la aprobación para envío.');
  }
  res.json({ ok: true });
});

// Archivar / recuperar: la familia entera (la original y todas sus versiones). No se borra nada.
app.post('/api/jobs/:id/archive', (req: Request, res: Response) => {
  const job = getJob(req.params.id);
  if (!job || job.input.mode !== 'standalone') {
    res.status(404).json({ error: 'No encontrado' });
    return;
  }
  try {
    res.json({ ok: true, changed: archiveFamily(job, req.body?.archived !== false) });
  } catch (err) {
    res.status(409).json({ error: (err as Error).message });
  }
});

// Cancelar: en cola, al momento; en curso, el worker lo ve en su siguiente aviso de progreso
// (cada 30 s, ver standaloneJobForWorker), detiene a Hermes y no sube nada.
app.post('/api/jobs/:id/cancel', (req: Request, res: Response) => {
  const job = getJob(req.params.id);
  if (!job || job.input.mode !== 'standalone') {
    res.status(404).json({ error: 'No encontrado' });
    return;
  }
  if (job.status !== 'queued' && job.status !== 'running') {
    res.status(409).json({ error: 'Este trabajo ya ha terminado.' });
    return;
  }
  const wasRunning = job.status === 'running';
  updateJob(job.id, { status: 'cancelled', currentPhase: null, error: undefined });
  hermesLog(job.id, wasRunning ? 'Cancelado: Hermes se detendrá en unos segundos.' : 'Cancelado antes de empezar.', 'error');
  res.json({ ok: true });
});

app.get('/api/jobs/:id/thumb', (req: Request, res: Response) => {
  const job = getJob(req.params.id);
  if (!job?.thumbRelPath) {
    res.status(404).end();
    return;
  }
  res.set('Cache-Control', 'private, max-age=86400');
  res.type('jpeg').sendFile(path.join(ROOT, job.thumbRelPath));
});

app.get('/api/jobs/:id/result', (req: Request, res: Response) => {
  const job = getJob(req.params.id);
  if (!job || job.status !== 'completed' || !job.resultRelPath) {
    res.status(404).json({ error: 'El resultado todavía no está disponible.' });
    return;
  }
  // El HTML lo escribe un modelo que ha leído páginas web (posible inyección): se sirve en un
  // sandbox sin scripts ni acceso al origen de Studio, igual en la vista previa que abierto aparte.
  res.set('Content-Security-Policy', 'sandbox');
  const abs = path.join(ROOT, job.resultRelPath);
  if (req.query.download) {
    res.download(abs, `${job.input.clientSlug}-${job.id}.html`);
    return;
  }
  res.sendFile(abs);
});

if (PIPELINE_ENABLED) recoverOnStartup();

const server = app.listen(PORT, () => {
  console.log(`Hermes Studio escuchando en http://localhost:${PORT}`);
});

// Apagado limpio (2026-10-01): Railway para el contenedor anterior con SIGTERM en cada despliegue. Antes el
// proceso moría por la señal (vía npx) y el despliegue sustituido salía como CRASHED sin haber fallado. Ahora
// deja de aceptar conexiones, termina las peticiones en curso y sale con 0; si alguna se alarga, a los 5 s.
// Los trabajos se guardan con escritura atómica (store.ts): no hay nada más que vaciar.
let shuttingDown = false;
for (const signal of ['SIGTERM', 'SIGINT'] as const) {
  process.on(signal, () => {
    if (shuttingDown) return;
    shuttingDown = true;
    console.log(`${signal} recibido: cerrando Hermes Studio…`);
    server.close(() => {
      console.log('Hermes Studio cerrado.');
      process.exit(0);
    });
    server.closeIdleConnections();
    setTimeout(() => {
      console.log('Cierre forzado: quedaban peticiones abiertas a los 5 s.');
      process.exit(0);
    }, 5000).unref();
  });
}
