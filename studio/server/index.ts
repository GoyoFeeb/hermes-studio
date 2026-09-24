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
import { createJob, getJob, listJobs, readEvents } from './store';
import { enqueue, recoverOnStartup } from './queue';
import { slugify } from './campaignFs';
import { createRateLimiter } from './rateLimit';

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
app.use(express.json({ limit: '2mb' }));

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
  const brands = fs.existsSync(BRANDS_DIR)
    ? fs
        .readdirSync(BRANDS_DIR, { withFileTypes: true })
        .filter((e) => e.isDirectory() && SLUG_RE.test(e.name))
        .map((e) => e.name)
        .sort()
    : [];
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
    const job = createJob({
      mode: 'standalone',
      clientSlug: body.existingBrand || slugify(body.clientName),
      clientName: body.clientName,
      brandMode: body.existingBrand ? 'existing' : 'new',
      briefText: body.promptText,
      imageMode: body.imageMode,
      requesterName: body.requesterName || undefined,
    });
    enqueue(job.id);
    res.status(201).json({ id: job.id });
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

app.get('/api/jobs', (_req: Request, res: Response) => {
  res.json({ jobs: listJobs() });
});

app.get('/api/jobs/:id', (req: Request, res: Response) => {
  const job = getJob(req.params.id);
  if (!job) {
    res.status(404).json({ error: 'No encontrado' });
    return;
  }
  res.json({ job, events: readEvents(job.id) });
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

recoverOnStartup();

app.listen(PORT, () => {
  console.log(`Hermes Studio escuchando en http://localhost:${PORT}`);
});
