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
import { ROOT, STUDIO_DIR, BRANDS_DIR, DATA_DIR, JOBS_DIR } from './paths';
import { appendEvent, artPct, createJob, finalArtNotes, getJob, listJobs, readEvents, updateJob, isValidJobId } from './store';
import { enqueueStandaloneJob } from './enqueueJob';
import {
  CLICKUP_RATE_LIMIT,
  clickupConfigFromEnv,
  clickupReadyForClaim,
  fetchClickupTask,
  findJobByClickupTaskId,
  clickupStartedComment,
  deliverClickupEndNotice,
  handleClickupWebhook,
  postClickupComment,
  postClickupCommentBody,
  type ClickupDeps,
  type ClickupEndDeps,
} from './clickup';
import { leaseUntil, selectClaim, withStoreLock, workerIdentity } from './claimQueue';
import { renewJobLease } from './lease';
import { noteWorker, workerCapacity } from './workerPool';
import type { Job } from './store';
import { supabase } from './supabase';
import { SESSION_COOKIE, authConfigFromEnv, clearedCookie, createSessionToken, googleLoginUrl, readCookie, readSessionToken, sessionCookie, userFromSupabaseToken } from './auth';
import type { SessionUser } from './auth';
import { acceptCorrection, onWorkerBeat, openBrief } from './earlyBrief';
import { slugify } from './campaignFs';
import { createRateLimiter } from './rateLimit';
import { joinLabels, missingInBrief } from './requestCoverage';
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
  familyJobs,
  cachedSubject,
  renameFamily,
  typicalDurations,
  typicalSeconds,
  durationSec,
  createTextEditVersion,
  approveVersion,
  archiveFamily,
  TextEditNoChanges,
  saveThumbnail,
  saveThumbnailLong,
  THUMB_HD_WIDTH,
  pendingThumbnails,
  sanitizeQuality,
  sanitizeTimings,
  sanitizeJobCost,
  costJobSummary,
  wantsCostFields,
  priorUsageOf,
  sanitizeArtReview,
  pendingArtReviews,
  needsBrief,
  completeStandaloneJob,
  standaloneOutputDir,
  log as hermesLog,
  promptMentionsBrand,
  sweepStaleHermesJobs,
  saveWorkerBrands,
  readWorkerBrands,
} from './standalone';
import { TextEditError, type TextEdit, type AltEdit, type LinkEdit, type ImageEdit } from './textEdit';
import { runQualityCheck } from '../worker/qualityCheck';
import { clientMatrix } from './clientMatrix';
import { MAX_TEST_RECIPIENTS, MailError, mailEnabled, parseRecipients, sendTestEmail } from './mail';
import { brandLogoIndex, knownBrandHashes, listBrandCardSlugs, readBrandCard, readBrandLogo, saveBrandCards } from './brandCards';
import { REPORT_DAYS, REPORT_HEADERS, createReportShare, findReportJob, isReportActive, renderReportGone, renderReportPage, revokeReportShare } from './report';
import {
  SHARE_DAYS,
  ShareInputError,
  addShareComment,
  createShare,
  findSharedJob,
  isShareActive,
  moveShare,
  recordShareView,
  renderShareGone,
  renderSharePage,
  resolveShareComment,
  resolveShareDecision,
  revokeShare,
  setShareDecision,
  shareHeaders,
} from './share';

loadEnv(ROOT);
loadEnv(STUDIO_DIR);

const PORT = Number(process.env.PORT || 3000);
const ACCESS_PASSWORD = process.env.APP_ACCESS_PASSWORD;
const ALLOW_NO_AUTH = process.env.ALLOW_NO_AUTH === 'true';

// Cuentas del equipo con Google (2026-10-13, ver auth.ts). null: no configuradas, solo contraseña compartida.
const AUTH = authConfigFromEnv();

if (!ACCESS_PASSWORD && !ALLOW_NO_AUTH && !AUTH) {
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
// ClickUp firma el cuerpo en bruto: si express.json lo parsea, la firma ya no cuadra.
const jsonSmall = express.json({ limit: '2mb' });
function skipsSharedJsonParser(req: Request): boolean {
  return req.path.startsWith('/api/worker/') || req.path === '/api/integrations/clickup' || /^\/api\/jobs\/[^/]+\/text-edit$/.test(req.path);
}
// "Editar" con imagen subida (2026-10-01) también lleva su propio parser, más grande.
app.use((req: Request, res: Response, next: NextFunction) => (skipsSharedJsonParser(req) ? next() : jsonSmall(req, res, next)));

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

// Vista previa para el cliente (2026-10-01, ver share.ts): pública como /assets, pero solo con un token
// aleatorio activo. Va antes del Basic Auth: quien la abre no tiene la contraseña del equipo.
app.get('/p/:token', (req: Request, res: Response) => {
  const job = findSharedJob(String(req.params.token));
  const nonce = crypto.randomBytes(16).toString('base64');
  res.set(shareHeaders(nonce));
  const page = job ? renderSharePage(job, nonce) : null;
  if (!job || !page) {
    res.status(404).type('html').send(renderShareGone());
    return;
  }
  recordShareView(job);
  res.type('html').send(page);
});

// Informe de la revisión por programa de correo (2026-10-01, ver report.ts): público con su propio token.
app.get('/r/:token', (req: Request, res: Response) => {
  res.set(REPORT_HEADERS);
  const job = findReportJob(String(req.params.token));
  const page = job ? renderReportPage(job) : null;
  if (!page) {
    res.status(404).type('html').send(renderReportGone());
    return;
  }
  res.type('html').send(page);
});

// Revisión del cliente (2026-10-01): comentarios y "Aprobar" / "Pedir cambios" desde el enlace, sin contraseña.
// Solo con un enlace activo, con límite por IP y con todo acotado (ver addShareComment / setShareDecision).
const shareWriteLimit = createRateLimiter({
  windowMs: 10 * 60 * 1000,
  max: 40,
  keyPrefix: 'share-write',
  message: 'Demasiados comentarios seguidos. Espera unos minutos.',
});
function sharedJobOr404(req: Request, res: Response): Job | null {
  const job = findSharedJob(String(req.params.token));
  if (!job) res.status(404).json({ error: 'Este enlace ya no está disponible.' });
  return job;
}
app.post('/p/:token/comments', shareWriteLimit.middleware, (req: Request, res: Response) => {
  const job = sharedJobOr404(req, res);
  if (!job) return;
  try {
    const c = addShareComment(job, req.body || {});
    hermesLog(job.id, `Comentario del cliente (${c.author})${c.ref ? ` ${c.ref}` : ''}: «${c.text.slice(0, 300)}»`);
    res.status(201).json({ comment: { id: c.id, current: true, author: c.author, text: c.text, ref: c.ref || null, path: c.path || null, at: c.at, resolved: false } });
  } catch (err) {
    if (err instanceof ShareInputError) return void res.status(400).json({ error: err.message });
    throw err;
  }
});
app.post('/p/:token/decision', shareWriteLimit.middleware, (req: Request, res: Response) => {
  const job = sharedJobOr404(req, res);
  if (!job) return;
  try {
    const d = setShareDecision(job, req.body || {});
    hermesLog(
      job.id,
      d.kind === 'approved' ? `El cliente (${d.author}) ha APROBADO esta versión.${d.note ? ` Nota: «${d.note.slice(0, 300)}»` : ''}` : `El cliente (${d.author}) pide cambios.${d.note ? ` «${d.note.slice(0, 300)}»` : ''}`,
      d.kind === 'approved' ? 'success' : 'info'
    );
    res.json({ decision: d });
  } catch (err) {
    if (err instanceof ShareInputError) return void res.status(400).json({ error: err.message });
    throw err;
  }
});

// --- Worker de Hermes (2026-09-24) -------------------------------------------------------
// studio/worker/hermes-worker.ts (en el Mac, o en el servicio Railway hermes-worker) recoge los
// trabajos standalone, los ejecuta con `hermes -z` y devuelve el HTML. Autenticación propia con
// WORKER_TOKEN (Bearer), distinta de la contraseña del equipo; sin WORKER_TOKEN estas rutas no
// existen. Van antes del Basic Auth.
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

// El servicio hermes-worker llama aquí cada 30 s (studio/worker/CLOUD.md). /claim y /progress ya
// renuevan lastWorkerSeen; este latido cubre un render largo en el que no hay otra llamada.
function workerIdOf(req: Request): string {
  const header = req.get('x-worker-id') || '';
  const body = typeof req.body?.workerId === 'string' ? req.body.workerId : '';
  return (body || header).trim().slice(0, 80);
}

app.post('/api/worker/heartbeat', requireWorker, express.json({ limit: '16kb' }), (req: Request, res: Response) => {
  noteWorker(workerIdOf(req), Number(req.body?.concurrency));
  res.json({ ok: true, capacity: workerCapacity() });
});

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
  const workerId = workerIdOf(req);
  if (job.lease?.workerId && workerId && job.lease.workerId !== workerId) {
    res.status(409).json({ error: 'Este trabajo lo tiene otro worker.' });
    return null;
  }
  return renewJobLease(job, workerId);
}

// El worker llama aquí al arrancar: si tenía un trabajo a medias (Ctrl+C, cierre, réplica reiniciada)
// ese trabajo ya no sigue vivo. Solo se marcan los suyos (mismo workerId). Una réplica que arranca
// no tumba lo que está haciendo otra. Sin workerId (worker anterior) se marcan los que no tienen arrendamiento.
app.post('/api/worker/reset', requireWorker, express.json({ limit: '256kb' }), (req: Request, res: Response) => {
  saveWorkerBrands(req.body?.brands);
  const workerId = workerIdOf(req);
  if (workerId) noteWorker(workerId, Number(req.body?.concurrency));
  let failed = 0;
  // Sus carpetas: el worker las aparta (_fallido-…) para que Hermes no tome el intento a medias por
  // trabajo previo (Lacoste, 2026-09-29).
  const failedDirs: string[] = [];
  for (const j of listJobs()) {
    if (j.input.mode !== 'standalone' || j.status !== 'running') continue;
    const mine = workerId ? j.lease?.workerId === workerId : !j.lease;
    if (!mine) continue;
    hermesLog(j.id, 'El worker de Hermes se reinició a mitad del trabajo.', 'error');
    updateJob(j.id, { status: 'failed', error: 'El worker de Hermes se reinició a mitad del trabajo. Vuelve a enviarlo.' });
    failedDirs.push(standaloneOutputDir(j));
    failed++;
  }
  res.json({ failed, failedDirs });
});

function notifyClickupStarted(job: Job): void {
  const cfg = clickupConfigFromEnv();
  const taskId = job.input.clickupTaskId;
  if (!cfg.comment || !cfg.apiToken || !taskId) return;
  postClickupComment(taskId, cfg.apiToken, clickupStartedComment()).catch((err) => {
    console.error(`[clickup] ${job.id}: no se pudo avisar de que empezó — ${(err as Error).message}`);
  });
}

function clickupEndDeps(): ClickupEndDeps {
  const cfg = clickupConfigFromEnv();
  return {
    comment: cfg.comment,
    apiToken: cfg.apiToken,
    webBase: cfg.webBase,
    getJob,
    postComment: postClickupCommentBody,
    log: (id, message, level = 'info') => appendEvent(id, { phase: 'studio', level, message }),
    lock: (fn) => withStoreLock(DATA_DIR, fn),
    noticeDir: JOBS_DIR,
    replicaId: workerIdentity(),
  };
}

function notifyClickupEnded(jobId: string, outcome: 'completed' | 'failed'): Promise<boolean> {
  return deliverClickupEndNotice(jobId, outcome, clickupEndDeps());
}

app.post('/api/worker/claim', requireWorker, express.json({ limit: '256kb' }), async (req: Request, res: Response) => {
  const workerId = workerIdOf(req);
  const slot = Number.isFinite(Number(req.body?.slot)) ? Math.max(0, Math.floor(Number(req.body.slot))) : 0;
  if (workerId) noteWorker(workerId, Number(req.body?.concurrency));
  let job: Job | null = null;
  try {
    job = await withStoreLock(DATA_DIR, () => {
      if (req.body?.brands) saveWorkerBrands(req.body.brands);
      sweepStaleHermesJobs();
      const standalone = listJobs().filter((j) => j.input.mode === 'standalone');
      // clickupPending: el webhook ya respondió y aún está leyendo la tarea. No se coge hasta que
      // termine, o pasados dos minutos si esa lectura no vuelve.
      const next = selectClaim(
        standalone.map((j) => ({
          id: j.id,
          status: j.status,
          createdAt: j.createdAt,
          ready: clickupReadyForClaim(j),
          mode: 'standalone' as const,
        }))
      );
      if (!next) return null;
      const fresh = getJob(next.id);
      if (!fresh || fresh.status !== 'queued' || !clickupReadyForClaim(fresh)) return null;
      // Tras aprobar el brief se recoge por segunda vez: se conserva el inicio (el brief) y se apunta la espera.
      const now = new Date();
      const waited = fresh.briefReadyAt && fresh.briefWaitSec == null ? Math.max(0, Math.round((now.getTime() - Date.parse(fresh.briefReadyAt)) / 1000)) : null;
      return updateJob(fresh.id, {
        status: 'running',
        currentPhase: 'hermes',
        startedAt: fresh.startedAt && waited != null ? fresh.startedAt : now.toISOString(),
        ...(waited != null ? { briefWaitSec: waited } : {}),
        ...(workerId ? { lease: { workerId, slot, until: leaseUntil(now.getTime()) } } : {}),
      });
    });
  } catch (err) {
    console.error(`[claim] ${(err as Error).message}`);
    res.status(503).json({ error: 'No se pudo reclamar el trabajo.' });
    return;
  }
  if (!job) {
    res.status(204).end();
    return;
  }
  hermesLog(job.id, 'Hermes ha recogido el trabajo y está trabajando.');
  void notifyClickupStarted(job);
  res.json({
    id: job.id,
    outputDir: standaloneOutputDir(job),
    // Lo que suelen tardar los de su tipo (mediana real): el worker lo usa para el porcentaje y la
    // estimación de los cambios y adaptaciones (2026-09-28).
    expectedSec: typicalSeconds(job),
    // Para medir la identidad en la web si la marca no tiene brand pack, y la revisión visual (2026-10-05).
    brand: { slug: job.input.clientSlug, name: job.input.clientName, ...(job.input.brandUrl ? { url: job.input.brandUrl } : {}) },
    artReview: !!job.input.artReview,
    // La petición del equipo (2026-10-05): el worker comprueba que el brief y la pieza recogen lo que pide.
    ...(job.input.instruction ? { request: job.input.instruction } : {}),
    ...(priorUsageOf(job) ? { priorUsage: priorUsageOf(job) } : {}),
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

app.post('/api/worker/jobs/:id/heartbeat', requireWorker, express.json({ limit: '16kb' }), (req: Request, res: Response) => {
  const job = standaloneJobForWorker(req, res);
  if (!job) return;
  res.json({ ok: true, until: getJob(job.id)?.lease?.until || job.lease?.until || null });
});

app.post('/api/worker/jobs/:id/brief', requireWorker, express.json({ limit: '1mb' }), (req: Request, res: Response) => {
  const job = standaloneJobForWorker(req, res);
  if (!job) return;
  const brief = typeof req.body?.brief === 'string' ? req.body.brief.trim() : '';
  if (brief.length < 200) {
    res.status(400).json({ error: 'El brief está vacío o incompleto.' });
    return;
  }
  // Revisar el brief (2026-10-01): el trabajo se aparta hasta que alguien lo apruebe. Solo si el worker sabe
  // pararse aquí (`canPause`); uno anterior a este cambio esperaría el encargo y sigue como siempre.
  // Lo que la petición pedía y el brief no recoge (Paredes, 2026-10-05): el worker ya le pidió una vez que lo
  // añadiera; si sigue faltando, se avisa en el panel de revisión y en el registro.
  const missingTerms = job.input.instruction ? missingInBrief(job.input.instruction, brief) : [];
  const briefMissing = missingTerms.map((t) => t.label);
  if (missingTerms.length) hermesLog(job.id, `Ojo: la petición pide ${joinLabels(missingTerms)} y el brief no lo recoge.`, 'error');
  const cost = sanitizeJobCost(req.body) || {};
  if (job.input.reviewBrief && req.body?.canPause === true) {
    updateJob(job.id, {
      briefMissing,
      status: 'review',
      currentPhase: null,
      briefReadyAt: new Date().toISOString(),
      input: { ...job.input, briefText: brief.slice(0, 200000) },
      ...cost,
    });
    hermesLog(job.id, 'Brief creativo listo: revísalo y apruébalo para que Hermes haga la newsletter.', 'success');
    res.json({ pause: true });
    return;
  }
  // Brief temprano (H-17): a la vista en la página mientras Hermes sigue; corregible si el worker sabe rehacer la pieza.
  const updated = updateJob(job.id, {
    briefMissing,
    ...openBrief(req.body?.canRestart === true),
    input: { ...job.input, briefText: brief.slice(0, 200000) },
    ...cost,
  });
  hermesLog(job.id, 'Brief creativo listo: Hermes empieza la newsletter. Puedes leerlo y corregirlo mientras trabaja.', 'success');
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
  // Brief corregido desde la página (H-17): se entrega en este latido con el encargo nuevo y el worker rehace la pieza.
  const beat = onWorkerBeat(getJob(job.id) || job, req.body?.briefLock === true);
  if (beat.patch) updateJob(job.id, beat.patch);
  if (beat.restart) {
    const fresh = getJob(job.id) || job;
    hermesLog(job.id, 'Hermes vuelve a empezar la pieza con el brief corregido.', 'success');
    res.json({ ok: true, briefRestart: { prompt: buildHermesPrompt(fresh), brief: fresh.input.briefText } });
    return;
  }
  if (req.body?.briefLock === true && beat.patch) hermesLog(job.id, 'Primera versión hecha: el brief ya no se puede corregir (para cambios, «Pedir cambios»).');
  res.json({ ok: true });
});

app.post('/api/worker/jobs/:id/complete', requireWorker, express.json({ limit: '80mb' }), async (req: Request, res: Response) => {
  const job = standaloneJobForWorker(req, res);
  if (!job) return;
  if (typeof req.body?.html !== 'string' || !/<html[\s>]/i.test(req.body.html)) {
    res.status(400).json({ error: 'Falta el HTML de la newsletter.' });
    return;
  }
  try {
    completeStandaloneJob(job.id, req.body.html, String(req.body.finalMessage || ''), sanitizeQuality(req.body.quality), req.body.thumbnail, sanitizeTimings(req.body.timings), req.body.thumbnailLong);
    // Notas de la revisión de dirección de arte (2026-10-06, punto 7): para ver por marca y fecha si la calidad sube.
    const artReview = sanitizeArtReview(req.body.artReview);
    const cost = sanitizeJobCost(req.body);
    if (artReview || cost) updateJob(job.id, { ...(artReview ? { artReview } : {}), ...(cost || {}) });
  } catch (err) {
    const cost = sanitizeJobCost(req.body);
    const error = (err as Error).message;
    updateJob(job.id, { status: 'failed', error, finishedAt: job.finishedAt || new Date().toISOString(), ...(cost || {}) });
    await notifyClickupEnded(job.id, 'failed');
    res.status(500).json({ error });
    return;
  }
  await notifyClickupEnded(job.id, 'completed');
  res.json({ ok: true });
});

/** El fallo de Hermes trae las últimas líneas al final: si no caben, se conserva ese final. */
function clipWorkerError(error: string): string {
  const max = 12_000;
  if (error.length <= max) return error;
  const head = error.slice(0, 500);
  return `${head}\n…\n${error.slice(-(max - head.length - 3))}`;
}

app.post('/api/worker/jobs/:id/fail', requireWorker, express.json({ limit: '256kb' }), async (req: Request, res: Response) => {
  const job = standaloneJobForWorker(req, res);
  if (!job) return;
  const error = clipWorkerError(String(req.body?.error || 'Hermes no pudo terminar la newsletter.'));
  hermesLog(job.id, error, 'error');
  const timings = sanitizeTimings(req.body?.timings);
  const cost = sanitizeJobCost(req.body);
  updateJob(job.id, { status: 'failed', error, finishedAt: job.finishedAt || new Date().toISOString(), ...(timings ? { timings } : {}), ...(cost || {}) });
  await notifyClickupEnded(job.id, 'failed');
  res.json({ ok: true });
});

// Miniaturas de newsletters anteriores (2026-09-28): el worker, cuando está libre, pide unas pocas sin
// miniatura, las renderiza en el Mac y las sube. Railway no abre ningún navegador.
// Fichas de marca (2026-10-01, ver brandCards.ts y studio/worker/brandCard.ts): el worker pregunta qué huellas
// hay y envía solo las fichas que han cambiado.
app.post('/api/worker/brand-cards/known', requireWorker, express.json({ limit: '16kb' }), (_req: Request, res: Response) => {
  res.json({ hashes: knownBrandHashes() });
});
app.post('/api/worker/brand-cards', requireWorker, express.json({ limit: '4mb' }), (req: Request, res: Response) => {
  res.json({ saved: saveBrandCards(req.body?.cards) });
});

// Notas de calidad de piezas anteriores (2026-10-06): el worker, libre, puntúa las que no tienen y las envía.
app.post('/api/worker/art/pending', requireWorker, express.json({ limit: '16kb' }), (_req: Request, res: Response) => {
  res.json({ jobs: pendingArtReviews(1) });
});
app.post('/api/worker/jobs/:id/art-review', requireWorker, express.json({ limit: '64kb' }), (req: Request, res: Response) => {
  const job = getJob(req.params.id);
  if (!job || job.input.mode !== 'standalone' || job.status !== 'completed') {
    res.status(404).json({ error: 'Trabajo no encontrado o no terminado.' });
    return;
  }
  if (req.body?.failed) {
    updateJob(job.id, { artReviewFailed: true });
    res.json({ ok: true });
    return;
  }
  const artReview = sanitizeArtReview({ ...req.body, backfill: true });
  if (!artReview) {
    res.status(400).json({ error: 'Notas no válidas.' });
    return;
  }
  if (!job.artReview) updateJob(job.id, { artReview });
  res.json({ ok: true });
});

app.post('/api/worker/thumbs/pending', requireWorker, express.json({ limit: '16kb' }), (req: Request, res: Response) => {
  res.json({ jobs: pendingThumbnails(3, { hd: req.body?.hd === true, long: req.body?.long === true }) });
});

app.post('/api/worker/jobs/:id/thumb', requireWorker, express.json({ limit: '4mb' }), (req: Request, res: Response) => {
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
  const thumb = saveThumbnail(job, req.body?.image);
  if (!thumb) {
    res.status(400).json({ error: 'Miniatura no válida.' });
    return;
  }
  // Sin ancho legible en la cabecera se da por buena: si no, se le volvería a pedir al worker sin fin.
  updateJob(job.id, { ...thumb, thumbW: thumb.thumbW ?? THUMB_HD_WIDTH });
  // La tira larga (2026-10-13). Un worker antiguo no manda el campo y la pieza sigue pendiente de ella.
  if (req.body?.long !== undefined) updateJob(job.id, saveThumbnailLong(job, req.body.long));
  res.json({ ok: true });
});

/** Página del 401 de /api/auth/password con el aspecto de Studio y una salida (H-01). Sin recursos externos. */
const PASSWORD_401_PAGE = `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Hermes Studio · Entrar</title>
<style>:root{color-scheme:dark light}body{margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px;background:#050c2a;color:#edf3fc;font:16px/1.55 'Work Sans',-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif}
.card{max-width:400px;padding:32px;border:1px solid #262b59;border-radius:10px;background:#0a1030;text-align:center}h1{margin:0 0 8px;font-size:22px}p{margin:0 0 24px;color:#8991ae}
a{display:inline-block;padding:12px 24px;border:1px solid #fb73ff;border-radius:45px;background:#262b59;color:#edf3fc;font-weight:600;text-decoration:none}a:hover,a:focus-visible{background:#fb73ff;color:#081136;outline:none}
@media (prefers-color-scheme:light){body{background:#f4f5fb;color:#0e1545}.card{background:#fff;border-color:#dcdeec}p{color:#5a6182}a{background:#e9eaf5;color:#0e1545;border-color:#9c1f9a}}</style></head>
<body><main class="card"><h1>No has entrado</h1><p>Has cancelado la contraseña del equipo o no era correcta. Puedes volver a la entrada y escribirla allí, o entrar con Google.</p><a href="/">Volver a la entrada</a></main></body></html>`;

function basicPasswordOk(req: Request): boolean {
  const header = req.headers.authorization;
  if (!ACCESS_PASSWORD || !header?.startsWith('Basic ')) return false;
  const decoded = Buffer.from(header.slice(6), 'base64').toString('utf8');
  const separatorIndex = decoded.indexOf(':');
  return safeEqual(separatorIndex >= 0 ? decoded.slice(separatorIndex + 1) : '', ACCESS_PASSWORD);
}

/** Quién hace la petición: la sesión de la cookie (cuenta de Google, o contraseña compartida canjeada en
 *  /api/auth/password) o, como siempre, la contraseña compartida en la cabecera. */
function sessionOf(req: Request): SessionUser | null {
  const fromCookie = AUTH ? readSessionToken(readCookie(req.headers.cookie, SESSION_COOKIE), AUTH.secret) : null;
  return fromCookie ?? (basicPasswordOk(req) ? { via: 'password' } : null);
}

// --- Cuentas (2026-10-13) ---------------------------------------------------------------------
// Van antes del control de acceso: es lo que la web consulta para saber si hay sesión y cómo entrar.
// Ninguna responde con WWW-Authenticate salvo /api/auth/password, que es justo para eso.
app.get('/api/auth/me', (req: Request, res: Response) => {
  const user = sessionOf(req);
  res.set('Cache-Control', 'no-store').json({
    open: !ACCESS_PASSWORD && !AUTH,
    user: user ? { via: user.via, name: user.name ?? null, email: user.email ?? null } : null,
    google: AUTH ? { url: googleLoginUrl(AUTH), domains: AUTH.domains } : null,
    password: !!ACCESS_PASSWORD,
  });
});

app.post('/api/auth/session', async (req: Request, res: Response) => {
  if (!AUTH) {
    res.status(404).json({ error: 'No encontrado' });
    return;
  }
  if (authRateLimit.isLimited(req)) {
    authRateLimit.reject(req, res);
    return;
  }
  try {
    const user = await userFromSupabaseToken(req.body?.accessToken, AUTH);
    res.set('Set-Cookie', sessionCookie(createSessionToken(user, AUTH.secret), req.secure));
    res.json({ user: { via: user.via, name: user.name, email: user.email } });
  } catch (err) {
    authRateLimit.recordFailure(req);
    res.status(401).json({ error: (err as Error).message });
  }
});

// La contraseña compartida, mientras conviva con las cuentas: aquí el navegador sí enseña su diálogo y, si
// acierta, se lleva una sesión como las demás (el resto de la API ya no lo provoca).
app.get('/api/auth/password', (req: Request, res: Response) => {
  if (!AUTH || !ACCESS_PASSWORD) {
    res.status(404).send('No encontrado');
    return;
  }
  if (authRateLimit.isLimited(req)) {
    authRateLimit.reject(req, res);
    return;
  }
  if (!basicPasswordOk(req)) {
    if (req.headers.authorization) authRateLimit.recordFailure(req);
    res.set('WWW-Authenticate', 'Basic realm="Hermes Studio"');
    // Al cancelar el diálogo, el navegador enseña esta página: antes era «Autenticación requerida.» sin estilos ni
    // salida (auditoría de UX 2026-10-14, H-01). La web ya no viene aquí: usa el POST de abajo.
    res.status(401).type('html').send(PASSWORD_401_PAGE);
    return;
  }
  res.set('Set-Cookie', sessionCookie(createSessionToken({ via: 'password' }, AUTH.secret), req.secure));
  res.redirect('/');
});

// La contraseña escrita en la propia tarjeta de entrada (H-01): responde JSON, sin diálogo del navegador.
app.post('/api/auth/password', (req: Request, res: Response) => {
  if (!AUTH || !ACCESS_PASSWORD) {
    res.status(404).json({ error: 'No encontrado' });
    return;
  }
  if (authRateLimit.isLimited(req)) {
    authRateLimit.reject(req, res);
    return;
  }
  const typed = typeof req.body?.password === 'string' ? req.body.password : '';
  if (!typed || !safeEqual(typed, ACCESS_PASSWORD)) {
    authRateLimit.recordFailure(req);
    res.status(401).json({ error: 'Contraseña incorrecta. Vuelve a intentarlo o entra con Google.' });
    return;
  }
  res.set('Set-Cookie', sessionCookie(createSessionToken({ via: 'password' }, AUTH.secret), req.secure));
  res.json({ user: { via: 'password', name: null, email: null } });
});

app.post('/api/auth/logout', (req: Request, res: Response) => {
  res.set('Set-Cookie', clearedCookie(req.secure));
  res.json({ ok: true });
});

// Webhook de ClickUp (2026-10-19, ver studio/CLICKUP.md). Va antes del login: ClickUp no tiene sesión.
// Mismo cupo que POST /api/jobs, con contador propio para no gastarse el del formulario.
const clickupRateLimit = createRateLimiter(CLICKUP_RATE_LIMIT);
app.post('/api/integrations/clickup', express.raw({ type: () => true, limit: '2mb' }), clickupRateLimit.middleware, async (req, res) => {
  try {
    const raw = Buffer.isBuffer(req.body) ? req.body : Buffer.alloc(0);
    const header = req.headers['x-signature'];
    const signature = Array.isArray(header) ? header[0] : header;
    const outcome = await handleClickupWebhook(raw, signature, clickupDeps());
    res.status(outcome.status).json(outcome.body);
    // La lectura de la tarea ya va en marcha (no se espera para responder).
    if (outcome.after) void outcome.after;
  } catch (err) {
    console.error(`[clickup] ${(err as Error).message}`);
    if (!res.headersSent) res.status(500).json({ error: 'No se pudo procesar el aviso de ClickUp.' });
  }
});

function clickupDeps(): ClickupDeps {
  const cfg = clickupConfigFromEnv();
  const workerRecentlySeen = Date.now() - lastWorkerSeen < 2 * 60 * 1000;
  return {
    ...cfg,
    findJob: (taskId) => findJobByClickupTaskId(taskId),
    createJob: (input) => enqueueStandaloneJob(input, workerRecentlySeen),
    getJob,
    updateJob: (id, patch) => {
      updateJob(id, patch);
    },
    fetchTask: fetchClickupTask,
    postComment: postClickupComment,
    knownBrand: (slug) => !!readBrandCard(slug)?.card,
    brandRecords: () => listBrandCardSlugs().flatMap((slug) => {
      const card = readBrandCard(slug)?.card;
      return card ? [{ slug, name: card.name }] : [];
    }),
    log: (id, message, level = 'info') => appendEvent(id, { phase: 'studio', level, message }),
    queueFor: (job) => {
      const info = queueInfo(job);
      if (!info || info.startsInSec < 30) return null;
      return { ahead: info.ahead, startsInSec: info.startsInSec };
    },
  };
}

if (ACCESS_PASSWORD || AUTH) {
  app.use((req: Request, res: Response, next: NextFunction) => {
    if (authRateLimit.isLimited(req)) {
      authRateLimit.reject(req, res);
      return;
    }
    const user = sessionOf(req);
    if (user) {
      res.locals.user = user;
      return next();
    }
    if (AUTH) {
      // Con cuentas, la web (pública también en Vercel) enseña su propia pantalla de entrada: la API responde
      // 401 sin WWW-Authenticate para que el navegador no saque su diálogo de contraseña.
      if (!req.path.startsWith('/api/')) return next();
      if (req.headers.authorization) authRateLimit.recordFailure(req);
      res.status(401).json({ error: 'Necesitas iniciar sesión.' });
      return;
    }
    authRateLimit.recordFailure(req);
    res.set('WWW-Authenticate', 'Basic realm="Hermes Studio"');
    res.status(401).send('Autenticación requerida.');
  });
} else {
  console.warn('ATENCION: arrancando SIN contraseña porque ALLOW_NO_AUTH=true -- el servicio queda abierto (solo para desarrollo local).');
}

/** Quién pide: con cuenta de Google manda su nombre, no lo que diga el formulario. */
function requesterOf(req: Request, res: Response, fallback?: string): string | undefined {
  const user = res.locals.user as SessionUser | undefined;
  if (user?.via === 'google' && user.name) return user.name;
  const typed = req.body?.requesterName;
  return typeof typed === 'string' && typed.trim() ? typed.trim().slice(0, 80) : fallback;
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
  // Qué marcas tienen logo en su ficha (2026-10-05): las sugerencias del campo «Marca» lo enseñan.
  const logos = Object.fromEntries([...brandLogoIndex()].map(([slug, l]) => [slug, l.onDark ? 'dark' : 'light']));
  res.json({ brands, logos });
});

// Página «Marcas» (2026-10-05): todas las marcas de un vistazo, con lo que Hermes tiene de cada una y lo que falta
// (logo, archivos rotos). Las que salen de las fichas, de las carpetas del Mac y de las newsletters hechas.
app.get('/api/brand-overview', (_req: Request, res: Response) => {
  const workerBrands = readWorkerBrands();
  const families = new Map<string, { name: string; roots: Set<string>; lastAt: string }>();
  // Una sola lectura del disco (versionFamily relee todos los trabajos en cada llamada).
  const all = listJobs().filter((j) => j.input.mode === 'standalone');
  const byId = new Map(all.map((j) => [j.id, j]));
  const rootOf = (j: Job): string => {
    let cur = j;
    for (let i = 0; i < 50; i++) {
      const parent = cur.input.revisionOf || cur.input.mobileFixOf || cur.input.textEditOf || cur.input.retryOf;
      const next = parent ? byId.get(parent) : undefined;
      if (!next) return cur.id;
      cur = next;
    }
    return cur.id;
  };
  for (const j of all) {
    if (!j.input.clientSlug || j.archivedAt) continue;
    const f = families.get(j.input.clientSlug) || { name: j.input.clientName, roots: new Set<string>(), lastAt: '' };
    f.roots.add(rootOf(j));
    if (j.createdAt > f.lastAt) {
      f.lastAt = j.createdAt;
      f.name = j.input.clientName;
    }
    families.set(j.input.clientSlug, f);
  }
  const slugs = [...new Set([...listBrandCardSlugs(), ...workerBrands, ...families.keys()])].filter((s) => SLUG_RE.test(s));
  const brands = slugs
    .map((slug) => {
      const card = readBrandCard(slug)?.card || null;
      const fam = families.get(slug);
      return {
        slug,
        name: card?.name || fam?.name || slug,
        hasCard: !!card,
        hasPack: !!card?.hasPack,
        logo: card?.logo ? (card.logoOnDark ? 'dark' : 'light') : null,
        logos: card?.assets.logos.length || 0,
        broken: card?.assets.broken.length || 0,
        mismatched: card?.assets.mismatched.length || 0,
        onWorker: workerBrands.includes(slug),
        newsletters: fam?.roots.size || 0,
        lastAt: fam?.lastAt || null,
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name, 'es'));
  res.json({ brands, workerKnown: workerBrands.length > 0 });
});

// Ficha de marca (2026-10-01): la que envió el worker y las últimas newsletters de esa marca.
// Logo de la ficha (2026-10-05) como imagen, para las miniaturas del historial. Viene de webs de terceros y puede
// ser SVG: con CSP sandbox y nosniff, abierto directamente no ejecuta nada en el origen de Studio.
app.get('/api/brands/:slug/logo', (req: Request, res: Response) => {
  const slug = String(req.params.slug);
  const logo = SLUG_RE.test(slug) ? readBrandLogo(slug) : null;
  if (!logo) {
    res.status(404).end();
    return;
  }
  const etag = `"${logo.hash}"`;
  res.set({ 'Content-Security-Policy': 'sandbox', 'X-Content-Type-Options': 'nosniff', 'Cache-Control': 'private, max-age=3600', ETag: etag });
  if (req.headers['if-none-match'] === etag) {
    res.status(304).end();
    return;
  }
  res.type(logo.type).send(logo.body);
});

app.get('/api/brands/:slug', (req: Request, res: Response) => {
  const slug = String(req.params.slug);
  if (!SLUG_RE.test(slug)) {
    res.status(404).json({ error: 'Marca no válida.' });
    return;
  }
  // Una línea por newsletter (su versión más reciente), no por versión: v1 y v2 suelen tener el mismo asunto.
  const families = new Map<string, { latest: Job; root: Job; count: number }>();
  for (const j of listJobs()) {
    if (j.input.mode !== 'standalone' || j.input.clientSlug !== slug || j.archivedAt) continue;
    const rootId = versionFamily(j)[0]?.id || j.id;
    const f = families.get(rootId);
    if (!f) families.set(rootId, { latest: j, root: getJob(rootId) || j, count: 1 });
    else {
      f.count++;
      if (j.createdAt > f.latest.createdAt) f.latest = j;
    }
  }
  const newsletters = [...families.values()]
    .sort((a, b) => b.latest.createdAt.localeCompare(a.latest.createdAt))
    .slice(0, 12)
    .map(({ latest, root, count }) => ({
      id: latest.id,
      createdAt: latest.createdAt,
      status: latest.status,
      title: root.title || null,
      subject: cachedSubject(latest),
      versions: count,
      // Para la galería de la ficha de marca (2026-10-07).
      hasThumb: !!latest.thumbRelPath,
    }));
  const stored = readBrandCard(slug);
  // Calidad (2026-10-06, punto 7): la nota de cada pieza con revisión de arte, por fecha, y los criterios más flojos.
  const reviewed = listJobs()
    .filter((j) => j.input.mode === 'standalone' && j.input.clientSlug === slug && !j.archivedAt && j.artReview)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
    .slice(-30);
  const byCriterion = new Map<string, number[]>();
  for (const j of reviewed) for (const [k, v] of Object.entries(finalArtNotes(j.artReview!))) byCriterion.set(k, [...(byCriterion.get(k) || []), v]);
  const quality = reviewed.length
    ? {
        points: reviewed.map((j) => ({ id: j.id, createdAt: j.createdAt, pct: artPct(j.artReview!) })),
        criteria: [...byCriterion.entries()]
          .map(([k, v]) => ({ id: k, avg: Math.round((v.reduce((a, b) => a + b, 0) / v.length) * 10) / 10 }))
          .sort((a, b) => a.avg - b.avg),
      }
    : null;
  res.json({
    card: stored?.card || null,
    receivedAt: stored?.receivedAt || null,
    onWorker: readWorkerBrands().includes(slug),
    newsletters,
    quality,
  });
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
    // Marca nueva (H-04, 2026-10-15): sin web oficial, Studio podía medir otra empresa del mismo nombre («Feebbo» →
    // feebbo.com, Feebbo Encuestas). Se pide la web o una confirmación expresa de enviar sin ella. También en una marca
    // conocida sin brand pack cuya web medida no confirmó el equipo (Tesla: tesla.es era otra empresa).
    const brandUrl = typeof body.brandUrl === 'string' && /^https:\/\/[^\s"'<>]{4,300}$/.test(body.brandUrl.trim()) ? body.brandUrl.trim() : undefined;
    const knownCard = body.existingBrand ? readBrandCard(clientSlug)?.card : undefined;
    const unconfirmedKnown = !!body.existingBrand && (!knownCard || (!knownCard.hasPack && !knownCard.web?.confirmed));
    if ((!body.existingBrand || unconfirmedKnown) && !brandUrl && body.confirmNoBrandUrl !== true) {
      res.status(409).json({
        code: 'brand_url_required',
        error: body.existingBrand
          ? `"${body.clientName}" no tiene web oficial confirmada: indícala o confirma que la envías sin ella (Hermes la investigará).`
          : `"${body.clientName}" es una marca nueva: indica su web oficial o confirma que la envías sin ella (Hermes la investigará).`,
      });
      return;
    }
    const job = enqueueStandaloneJob({
      mode: 'standalone',
      clientSlug,
      clientName: body.clientName,
      brandMode: body.existingBrand ? 'existing' : 'new',
      briefText: fromInstruction ? '' : body.promptText,
      instruction: fromInstruction ? String(body.promptText).slice(0, 4000) : undefined,
      reviewBrief: fromInstruction && body.reviewBrief === true ? true : undefined,
      artReview: body.artReview === true ? true : undefined,
      brandUrl,
      imageMode: body.imageMode,
      requesterName: requesterOf(req, res),
    }, Date.now() - lastWorkerSeen < 2 * 60 * 1000);
    res.status(201).json({ id: job.id });
    return;
  }

  // El pipeline de 9 fases (runner.ts y phases/) se retiró el 2026-10-05: la web solo crea trabajos con Hermes.
  res.status(400).json({ error: 'Solo se aceptan newsletters hechas con Hermes (mode: "standalone").' });
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
    mailEnabled: mailEnabled(),
  });
});

/** Trabajos (versiones incluidas) que manda el historial. */
const HISTORY_LIMIT = 2000;
/** Historial ligero para la página principal (sin el prompt completo de cada trabajo). */
app.get('/api/jobs', (req: Request, res: Response) => {
  sweepStaleHermesJobs();
  const standalone = listJobs().filter((j) => j.input.mode === 'standalone');
  if (wantsCostFields(req.query.fields)) {
    res.json({ jobs: standalone.map(costJobSummary) });
    return;
  }
  const logos = brandLogoIndex();
  // Antes, .slice(0, 200): con cada versión contando como un trabajo, las newsletters antiguas desaparecían del
  // historial sin aviso (2026-10-05). Ahora el tope es mucho más alto y, si se alcanza, la web lo dice.
  const jobs = standalone
    .slice(0, HISTORY_LIMIT)
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
      title: j.title || null,
      subject: cachedSubject(j),
      // Revisión del cliente (2026-10-01): comentarios sin resolver y su decisión sobre esta versión.
      client: isShareActive(j.share)
        ? {
            open: (j.share.comments || []).filter((c) => c.jobId === j.id && !c.resolvedAt).length,
            decision: j.share.decision?.jobId === j.id && !j.share.decision.resolvedAt ? j.share.decision.kind : null,
          }
        : null,
      durationSec: durationSec(j),
      briefWaitSec: j.briefWaitSec ?? null,
      hasThumb: !!j.thumbRelPath,
      thumbW: j.thumbW ?? null,
      thumbLongH: j.thumbLongH || null,
      // Nota de la revisión de dirección de arte (2026-10-06, punto 7): porcentaje y notas finales por criterio.
      art: j.artReview ? { pct: artPct(j.artReview), notes: finalArtNotes(j.artReview) } : null,
      // Logo de la ficha de marca para las miniaturas sin imagen (2026-10-05): 'light' o 'dark' (versión blanca).
      brandLogo: logos.has(j.input.clientSlug) ? (logos.get(j.input.clientSlug)!.onDark ? 'dark' : 'light') : null,
      pct: j.progress?.pct ?? null,
      // Fase actual, para la franja «Ahora mismo» de la portada (2026-10-05).
      stageLabel: j.status === 'running' ? j.progress?.stageLabel || null : null,
      queue: j.status === 'queued' ? queueInfo(j) : null,
      elapsedSec: j.progress?.elapsedSec ?? null,
      error: j.status === 'failed' || j.status === 'blocked' ? (j.error || j.blockedReason || '').slice(0, 200) : null,
      approvedAt: j.approvedAt || null,
      approvedBy: j.approvedBy || null,
      archivedAt: j.archivedAt || null,
    }));
  res.json({ jobs, truncated: standalone.length > HISTORY_LIMIT, limit: HISTORY_LIMIT });
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
    familyTitle: getJob(versionFamily(job)[0]?.id || job.id)?.title || null,
    // Revisión agrupada por programa de correo (2026-10-01, ver clientMatrix.ts).
    clientMatrix: job.quality ? clientMatrix(job.quality) : null,
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
    requesterOf(req, res, source.input.requesterName);
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
    requesterName: requesterOf(req, res, source.input.requesterName),
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
    requesterName: requesterOf(req, res, source.input.requesterName),
    revisionOf: source.id,
    changeRequest: changes.slice(0, 4000),
  });
  hermesLog(job.id, `Cambios sobre la newsletter ${source.id}: en cola.`);
  res.status(201).json({ id: job.id });
});

// "Editar texto": versión nueva al momento, sin Hermes (ver createTextEditVersion y textEdit.ts).
/** Imagen subida: hasta ~3 MB de archivo (en base64 ocupa 4/3). Más pesada no tiene sentido en un email. */
const MAX_IMAGE_DATA_URI = 4 * 1024 * 1024;
app.post('/api/jobs/:id/text-edit', createJobRateLimit.middleware, express.json({ limit: '12mb' }), async (req: Request, res: Response) => {
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
  const rawLinks = Array.isArray(req.body?.links) ? req.body.links : [];
  const links: LinkEdit[] = [];
  for (const l of rawLinks.slice(0, 100)) {
    if (!l || typeof l.before !== 'string' || typeof l.after !== 'string' || l.before.length > 2000 || l.after.length > 2000) continue;
    links.push({ before: l.before, after: l.after });
  }
  const rawImages = Array.isArray(req.body?.images) ? req.body.images : [];
  const imageEdits: ImageEdit[] = [];
  for (const im of rawImages.slice(0, 50)) {
    if (!im || !isInt(im.index) || typeof im.before !== 'string' || typeof im.after !== 'string' || im.before.length > 4000) continue;
    if (im.after.length > MAX_IMAGE_DATA_URI) {
      res.status(413).json({ error: `La imagen ${im.index + 1} pesa demasiado: usa una de menos de 3 MB (en un email, mejor de menos de 500 KB).` });
      return;
    }
    imageEdits.push({ index: im.index, before: im.before, after: im.after });
  }
  if (edits.length !== raw.length || alts.length !== rawAlts.length || links.length !== rawLinks.length || imageEdits.length !== rawImages.length) {
    res.status(400).json({ error: 'Cambios no válidos.' });
    return;
  }
  const subject = typeof req.body?.subject === 'string' ? req.body.subject.slice(0, 300) : null;
  const requester = requesterOf(req, res);
  try {
    const job = createTextEditVersion(source, edits, subject, requester, alts, links, imageEdits);
    // Enlaces o imágenes nuevos: se comprueban de verdad (404, dominio inexistente…) antes de responder; la
    // comprobación de la versión anterior ya no vale para ellos. Unos segundos.
    if (links.length || imageEdits.length) {
      const html = readResultHtml(job) || '';
      const mobile = source.quality?.checks.find((c) => c.id === 'mobile');
      const quality = await runQualityCheck(html, { mobileProblem: mobile ? (mobile.status === 'error' ? mobile.details[0] || 'Desborda a 375 px' : null) : undefined });
      updateJob(job.id, { quality });
      hermesLog(job.id, `Revisión automática de los enlaces e imágenes nuevos: ${quality.errors} error(es), ${quality.warnings} aviso(s).`, quality.errors ? 'error' : 'success');
    }
    res.status(201).json({ id: job.id });
  } catch (err) {
    if (err instanceof TextEditError || err instanceof TextEditNoChanges) {
      res.status(err instanceof TextEditNoChanges ? 400 : 409).json({ error: err.message });
      return;
    }
    // Ruta asíncrona en Express 4: un error sin capturar no llegaría al manejador de errores.
    console.error('text-edit', err);
    if (!res.headersSent) res.status(500).json({ error: 'No se pudo guardar la versión nueva.' });
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
// Enlace de vista previa para el cliente (2026-10-01): uno por versión, se reutiliza mientras esté activo.
app.post('/api/jobs/:id/share', (req: Request, res: Response) => {
  const job = getJob(req.params.id);
  if (!job || job.input.mode !== 'standalone' || job.status !== 'completed' || !readResultHtml(job)) {
    res.status(404).json({ error: 'Solo se puede compartir una newsletter terminada.' });
    return;
  }
  const by = typeof req.body?.by === 'string' ? req.body.by.trim().slice(0, 80) : '';
  const existed = isShareActive(job.share);
  const share = createShare(job, by);
  if (!existed) hermesLog(job.id, `Enlace de vista previa para el cliente creado${by ? ` por ${by}` : ''} (caduca en ${SHARE_DAYS} días).`);
  res.status(existed ? 200 : 201).json({ share });
});

// Enlace al informe de la revisión (2026-10-01): uno por versión, se reutiliza mientras esté activo.
app.post('/api/jobs/:id/report-share', (req: Request, res: Response) => {
  const job = getJob(req.params.id);
  if (!job || job.input.mode !== 'standalone' || job.status !== 'completed' || !job.quality) {
    res.status(404).json({ error: 'Esta versión no tiene revisión automática que compartir.' });
    return;
  }
  const by = typeof req.body?.by === 'string' ? req.body.by.trim().slice(0, 80) : '';
  const existed = isReportActive(job.reportShare);
  const reportShare = createReportShare(job, by);
  if (!existed) hermesLog(job.id, `Enlace al informe de la revisión creado${by ? ` por ${by}` : ''} (caduca en ${REPORT_DAYS} días).`);
  res.status(existed ? 200 : 201).json({ reportShare });
});

app.delete('/api/jobs/:id/report-share', (req: Request, res: Response) => {
  const job = getJob(req.params.id);
  if (!job || job.input.mode !== 'standalone') {
    res.status(404).json({ error: 'No encontrado' });
    return;
  }
  if (job.reportShare) {
    revokeReportShare(job);
    hermesLog(job.id, 'Enlace al informe de la revisión desactivado.');
  }
  res.json({ ok: true });
});

// Renombrar la newsletter (2026-10-01): el nombre es de la familia entera (vive en la versión raíz).
app.post('/api/jobs/:id/rename', (req: Request, res: Response) => {
  const job = getJob(req.params.id);
  if (!job || job.input.mode !== 'standalone' || typeof req.body?.title !== 'string') {
    res.status(404).json({ error: 'No encontrado' });
    return;
  }
  const root = renameFamily(job, req.body.title);
  res.json({ title: root.title || null, rootId: root.id });
});

// Marcar un comentario del cliente como resuelto (o reabrirlo).
// Decisión del cliente atendida (2026-10-05): sale de «Te esperan» y del aviso; queda en el registro.
app.post('/api/jobs/:id/share/decision/resolve', (req: Request, res: Response) => {
  const job = getJob(req.params.id);
  const by = typeof req.body?.by === 'string' ? req.body.by.slice(0, 80) : undefined;
  const d = job ? resolveShareDecision(job, req.body?.resolved !== false, by) : null;
  if (!job || !d) {
    res.status(404).json({ error: 'No hay decisión del cliente en esta versión.' });
    return;
  }
  hermesLog(job.id, d.resolvedAt ? `Decisión del cliente marcada como atendida${by ? ` por ${by}` : ''}.` : 'Decisión del cliente marcada otra vez como pendiente.');
  res.json({ ok: true, decision: d });
});

app.post('/api/jobs/:id/share/comments/:cid/resolve', (req: Request, res: Response) => {
  const job = getJob(req.params.id);
  const cid = String(req.params.cid);
  if (!job || !/^[A-Za-z0-9_-]{1,20}$/.test(cid) || !resolveShareComment(job, cid, req.body?.resolved !== false, typeof req.body?.by === 'string' ? req.body.by.slice(0, 80) : undefined)) {
    res.status(404).json({ error: 'Comentario no encontrado.' });
    return;
  }
  res.json({ ok: true });
});

// Pasar el enlace del cliente a esta versión (2026-10-01): misma URL para el cliente, ahora con la pieza nueva.
app.post('/api/jobs/:id/share/move-here', (req: Request, res: Response) => {
  const job = getJob(req.params.id);
  if (!job || job.input.mode !== 'standalone' || job.status !== 'completed' || !readResultHtml(job)) {
    res.status(404).json({ error: 'Solo se puede compartir una newsletter terminada.' });
    return;
  }
  if (isShareActive(job.share)) {
    res.status(409).json({ error: 'Esta versión ya tiene su enlace.' });
    return;
  }
  const from = familyJobs(job).find((j) => j.id !== job.id && isShareActive(j.share));
  if (!from) {
    res.status(404).json({ error: 'Ninguna otra versión de esta newsletter tiene un enlace activo.' });
    return;
  }
  const share = moveShare(from, job);
  hermesLog(job.id, `Enlace del cliente pasado a esta versión (antes en ${from.id}): la misma URL muestra ahora esta pieza.`);
  hermesLog(from.id, `Enlace del cliente pasado a la versión ${job.id}.`);
  res.json({ share });
});

app.delete('/api/jobs/:id/share', (req: Request, res: Response) => {
  const job = getJob(req.params.id);
  if (!job || job.input.mode !== 'standalone') {
    res.status(404).json({ error: 'No encontrado' });
    return;
  }
  if (job.share) {
    revokeShare(job);
    hermesLog(job.id, 'Enlace de vista previa desactivado: quien lo tenga ya no podrá abrirlo.');
  }
  res.json({ ok: true });
});

// Corregir el brief sin parar a Hermes (auditoría de UX 2026-10-14, H-17, ver earlyBrief.ts): se guarda y el worker
// lo recoge en su siguiente latido (≤ 30 s), corta el turno y rehace la pieza con él.
app.post('/api/jobs/:id/brief-correct', (req: Request, res: Response) => {
  const job = getJob(req.params.id);
  if (!job || job.input.mode !== 'standalone') {
    res.status(404).json({ error: 'No encontrado' });
    return;
  }
  const result = acceptCorrection(job, req.body?.brief, requesterOf(req, res, typeof req.body?.by === 'string' ? req.body.by : undefined));
  if ('error' in result) {
    res.status(result.status).json({ error: result.error });
    return;
  }
  const updated = updateJob(job.id, result.patch);
  const by = updated.briefCorrection?.by;
  hermesLog(job.id, `Brief corregido${by ? ` por ${by}` : ''}: Hermes rehará la pieza con él en menos de un minuto.`, 'success');
  res.json({ ok: true });
});

// Aprobar el brief (2026-10-01): vuelve a la cola con el brief tal cual o editado; Hermes hace la newsletter
// en un turno nuevo, sin volver a escribir el brief.
app.post('/api/jobs/:id/brief-approve', (req: Request, res: Response) => {
  const job = getJob(req.params.id);
  if (!job || job.input.mode !== 'standalone') {
    res.status(404).json({ error: 'No encontrado' });
    return;
  }
  if (job.status !== 'review') {
    res.status(409).json({ error: 'Este brief ya no está pendiente de revisión.' });
    return;
  }
  const edited = typeof req.body?.brief === 'string' ? req.body.brief.trim() : '';
  if (edited && edited.length < 50) {
    res.status(400).json({ error: 'El brief ha quedado demasiado corto: Hermes no tendría con qué trabajar.' });
    return;
  }
  const changed = !!edited && edited !== job.input.briefText.trim();
  const by = typeof req.body?.by === 'string' ? req.body.by.trim().slice(0, 80) : '';
  updateJob(job.id, {
    status: 'queued',
    progress: undefined,
    input: { ...job.input, briefText: changed ? edited.slice(0, 200000) : job.input.briefText, briefReused: true },
  });
  hermesLog(job.id, `Brief aprobado${changed ? ' con cambios' : ''}${by ? ` por ${by}` : ''}: en cola para hacer la newsletter.`, 'success');
  res.json({ ok: true });
});

app.post('/api/jobs/:id/cancel', (req: Request, res: Response) => {
  const job = getJob(req.params.id);
  if (!job || job.input.mode !== 'standalone') {
    res.status(404).json({ error: 'No encontrado' });
    return;
  }
  if (job.status !== 'queued' && job.status !== 'running' && job.status !== 'review') {
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
  // ?long=1: la tira larga para el abanico de la portada (2026-10-13).
  const rel = req.query.long ? job?.thumbLongRelPath : job?.thumbRelPath;
  if (!rel) {
    res.status(404).end();
    return;
  }
  res.set('Cache-Control', 'private, max-age=86400');
  res.type('jpeg').sendFile(path.join(ROOT, rel));
});

// Enviar una prueba por correo (2026-10-05, ver mail.ts). Para el equipo: pocas direcciones y un límite por hora.
const testEmailLimit = createRateLimiter({
  windowMs: 60 * 60 * 1000,
  max: 20,
  keyPrefix: 'test-email',
  message: 'Demasiadas pruebas enviadas en la última hora. Espera un poco.'
});
app.post('/api/jobs/:id/test-email', testEmailLimit.middleware, express.json({ limit: '16kb' }), async (req: Request, res: Response) => {
  const job = getJob(req.params.id);
  const html = job ? readResultHtml(job) : null;
  if (!job || job.input.mode !== 'standalone' || !html) {
    res.status(404).json({ error: 'Esta newsletter aún no está terminada.' });
    return;
  }
  if (!mailEnabled()) {
    res.status(503).json({ error: 'El envío de pruebas no está configurado: faltan RESEND_API_KEY y MAIL_FROM en Railway.' });
    return;
  }
  const { valid, invalid } = parseRecipients(req.body?.to);
  if (invalid.length) {
    res.status(400).json({ error: `No parece una dirección de correo: ${invalid.slice(0, 3).join(', ')}.` });
    return;
  }
  if (!valid.length || valid.length > MAX_TEST_RECIPIENTS) {
    res.status(400).json({ error: valid.length ? `Como mucho ${MAX_TEST_RECIPIENTS} direcciones por prueba.` : 'Escribe al menos una dirección.' });
    return;
  }
  const subject = `[Prueba] ${resultMeta(job)?.subject || `Newsletter de ${job.input.clientName}`}`.slice(0, 200);
  try {
    await sendTestEmail({ to: valid, subject, html });
    appendEvent(job.id, { phase: 'studio', level: 'info', message: `Prueba enviada por correo a ${valid.length} dirección${valid.length === 1 ? '' : 'es'}.` });
    res.json({ sent: valid.length });
  } catch (err) {
    res.status(502).json({ error: err instanceof MailError ? err.message : 'No se pudo enviar la prueba.' });
  }
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

const server = app.listen(PORT, () => {
  console.log(`Hermes Studio escuchando en http://localhost:${PORT}`);
  console.log(`Cuentas con Google: ${AUTH ? `activadas (${AUTH.domains.map((d) => `@${d}`).join(', ')})` : 'desactivadas (falta AUTH_EMAIL_DOMAIN o las variables de Supabase)'}${ACCESS_PASSWORD ? '; contraseña compartida: activa' : ''}.`);
  console.log(`Copia en Supabase: ${supabase.enabled ? 'activada' : 'desactivada (faltan SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY)'}.`);
  console.log(`ClickUp: ${process.env.CLICKUP_WEBHOOK_SECRET ? 'activo' : 'desactivado (falta CLICKUP_WEBHOOK_SECRET)'}.`);
});

// Apagado limpio (2026-10-01): Railway para el contenedor anterior con SIGTERM en cada despliegue. Antes el
// proceso moría por la señal (vía npx) y el despliegue sustituido salía como CRASHED sin haber fallado. Ahora
// deja de aceptar conexiones, termina las peticiones en curso y sale con 0; si alguna se alarga, a los 5 s.
// Los trabajos se guardan con escritura atómica (store.ts). Lo único que queda por vaciar es la cola de copias a
// Supabase (2026-10-12): se le dan hasta 3 s dentro de esos 5.
let shuttingDown = false;
for (const signal of ['SIGTERM', 'SIGINT'] as const) {
  process.on(signal, () => {
    if (shuttingDown) return;
    shuttingDown = true;
    console.log(`${signal} recibido: cerrando Hermes Studio…`);
    server.close(async () => {
      const left = await supabase.flush(3000);
      if (left) console.error(`[supabase] ${left} envío(s) sin hacer al cerrar: los recupera la comprobación de paridad.`);
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
