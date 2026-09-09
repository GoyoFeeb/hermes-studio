/**
 * index.ts — servidor del servicio. Autenticación por Basic Auth con una contraseña
 * compartida de equipo (sin sesiones/cookies que mantener): suficiente para una herramienta
 * interna v1, documentado como limitación en studio/README.md.
 */
import express, { type NextFunction, type Request, type Response } from 'express';
import * as path from 'path';
import * as fs from 'fs';
import { loadEnv } from '../../scripts/lib/env';
import { ROOT, STUDIO_DIR, BRANDS_DIR } from './paths';
import { createJob, getJob, listJobs, readEvents } from './store';
import { enqueue, recoverOnStartup } from './queue';
import { slugify } from './campaignFs';

loadEnv(ROOT);
loadEnv(STUDIO_DIR);

const PORT = Number(process.env.PORT || 3000);
const ACCESS_PASSWORD = process.env.APP_ACCESS_PASSWORD;

const app = express();
app.use(express.json({ limit: '2mb' }));

if (ACCESS_PASSWORD) {
  app.use((req: Request, res: Response, next: NextFunction) => {
    const header = req.headers.authorization;
    if (header?.startsWith('Basic ')) {
      const decoded = Buffer.from(header.slice(6), 'base64').toString('utf8');
      const separatorIndex = decoded.indexOf(':');
      const password = separatorIndex >= 0 ? decoded.slice(separatorIndex + 1) : '';
      if (password === ACCESS_PASSWORD) return next();
    }
    res.set('WWW-Authenticate', 'Basic realm="Hermes Studio"');
    res.status(401).send('Autenticación requerida.');
  });
} else {
  console.warn('ATENCION: APP_ACCESS_PASSWORD no configurada -- el servicio queda abierto sin contrasena.');
}

app.use('/assets', express.static(BRANDS_DIR));
app.use(express.static(path.join(STUDIO_DIR, 'web')));

app.get('/api/brands', (_req: Request, res: Response) => {
  const brands = fs.existsSync(BRANDS_DIR)
    ? fs
        .readdirSync(BRANDS_DIR, { withFileTypes: true })
        .filter((e) => e.isDirectory() && fs.existsSync(path.join(BRANDS_DIR, e.name, 'tokens', 'brand-tokens.json')))
        .map((e) => e.name)
        .sort()
    : [];
  res.json({ brands });
});

app.post('/api/jobs', (req: Request, res: Response) => {
  const body = req.body || {};
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
  res.sendFile(path.join(ROOT, job.resultRelPath));
});

recoverOnStartup();

app.listen(PORT, () => {
  console.log(`Hermes Studio escuchando en http://localhost:${PORT}`);
});
