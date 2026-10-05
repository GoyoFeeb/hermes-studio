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
import { appendEvent, createJob, getJob, listJobs, readEvents, updateJob, isValidJobId } from './store';
import type { Job } from './store';
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
  pendingThumbnails,
  sanitizeQuality,
  sanitizeTimings,
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
// "Editar" con imagen subida (2026-10-01) también lleva su propio parser, más grande.
app.use((req: Request, res: Response, next: NextFunction) =>
  req.path.startsWith('/api/worker/') || /^\/api\/jobs\/[^/]+\/text-edit$/.test(req.path) ? next() : jsonSmall(req, res, next)
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
  // Tras aprobar el brief se recoge por segunda vez: se conserva el inicio (el brief) y se apunta la espera.
  const now = new Date();
  const waited = next.briefReadyAt && next.briefWaitSec == null ? Math.max(0, Math.round((now.getTime() - Date.parse(next.briefReadyAt)) / 1000)) : null;
  const job = updateJob(next.id, {
    status: 'running',
    currentPhase: 'hermes',
    startedAt: next.startedAt && waited != null ? next.startedAt : now.toISOString(),
    ...(waited != null ? { briefWaitSec: waited } : {}),
  });
  hermesLog(job.id, 'Hermes ha recogido el trabajo y está trabajando.');
  res.json({
    id: job.id,
    outputDir: standaloneOutputDir(job),
    // Lo que suelen tardar los de su tipo (mediana real): el worker lo usa para el porcentaje y la
    // estimación de los cambios y adaptaciones (2026-09-28).
    expectedSec: typicalSeconds(job),
    // Para medir la identidad en la web si la marca no tiene brand pack, y la revisión visual (2026-10-05).
    brand: { slug: job.input.clientSlug, name: job.input.clientName, ...(job.input.brandUrl ? { url: job.input.brandUrl } : {}) },
    artReview: !!job.input.artReview,
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
  // Revisar el brief (2026-10-01): el trabajo se aparta hasta que alguien lo apruebe. Solo si el worker sabe
  // pararse aquí (`canPause`); uno anterior a este cambio esperaría el encargo y sigue como siempre.
  if (job.input.reviewBrief && req.body?.canPause === true) {
    updateJob(job.id, {
      status: 'review',
      currentPhase: null,
      briefReadyAt: new Date().toISOString(),
      input: { ...job.input, briefText: brief.slice(0, 200000) },
    });
    hermesLog(job.id, 'Brief creativo listo: revísalo y apruébalo para que Hermes haga la newsletter.', 'success');
    res.json({ pause: true });
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
    completeStandaloneJob(job.id, req.body.html, String(req.body.finalMessage || ''), sanitizeQuality(req.body.quality), req.body.thumbnail, sanitizeTimings(req.body.timings));
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
  const timings = sanitizeTimings(req.body?.timings);
  updateJob(job.id, { status: 'failed', error, ...(timings ? { timings } : {}) });
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
    }));
  const stored = readBrandCard(slug);
  res.json({
    card: stored?.card || null,
    receivedAt: stored?.receivedAt || null,
    onWorker: readWorkerBrands().includes(slug),
    newsletters,
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
    const job = createJob({
      mode: 'standalone',
      clientSlug,
      clientName: body.clientName,
      brandMode: body.existingBrand ? 'existing' : 'new',
      briefText: fromInstruction ? '' : body.promptText,
      instruction: fromInstruction ? String(body.promptText).slice(0, 4000) : undefined,
      reviewBrief: fromInstruction && body.reviewBrief === true ? true : undefined,
      artReview: body.artReview === true ? true : undefined,
      brandUrl: typeof body.brandUrl === 'string' && /^https:\/\/[^\s"'<>]{4,300}$/.test(body.brandUrl.trim()) ? body.brandUrl.trim() : undefined,
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
app.get('/api/jobs', (_req: Request, res: Response) => {
  sweepStaleHermesJobs();
  const logos = brandLogoIndex();
  // Antes, .slice(0, 200): con cada versión contando como un trabajo, las newsletters antiguas desaparecían del
  // historial sin aviso (2026-10-05). Ahora el tope es mucho más alto y, si se alcanza, la web lo dice.
  const standalone = listJobs().filter((j) => j.input.mode === 'standalone');
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
      // Logo de la ficha de marca para las miniaturas sin imagen (2026-10-05): 'light' o 'dark' (versión blanca).
      brandLogo: logos.has(j.input.clientSlug) ? (logos.get(j.input.clientSlug)!.onDark ? 'dark' : 'light') : null,
      pct: j.progress?.pct ?? null,
      // Fase actual, para la franja «Ahora mismo» de la portada (2026-10-05).
      stageLabel: j.status === 'running' ? j.progress?.stageLabel || null : null,
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
  const requester = typeof req.body?.requesterName === 'string' && req.body.requesterName.trim() ? req.body.requesterName.trim().slice(0, 80) : undefined;
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
  if (!job?.thumbRelPath) {
    res.status(404).end();
    return;
  }
  res.set('Cache-Control', 'private, max-age=86400');
  res.type('jpeg').sendFile(path.join(ROOT, job.thumbRelPath));
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
