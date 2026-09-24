/**
 * standalone.ts — modo "HTML standalone" de Hermes Studio, ejecutado por Hermes Agent.
 *
 * El compañero pega el prompt de dirección creativa que genera la skill
 * `newsletter-creative-brief`. El trabajo queda en cola aquí; un worker en el Mac del usuario
 * (studio/worker/hermes-worker.ts) lo recoge, lanza `hermes -z` con SU instalación (config,
 * skills, memoria, suscripción de Nous) dentro de sistema-final/ y devuelve el HTML.
 *
 * Por qué no una llamada directa al modelo (versión anterior, 2026-09-24 mañana): la calidad de
 * Hermes sale de su bucle de agente — ~100 acciones por newsletter (navegar la web real de la
 * marca, mirar capturas con visión, escribir, renderizar, mirar y corregir; 15-20 min). Una sola llamada a
 * gpt-5.5 producía piezas genéricas "de sistema primitivo" (feedback del usuario).
 *
 * Este módulo: compone el encargo para Hermes (prompt pegado + instrucciones de entrega) y, al
 * recibir el resultado, publica sus imágenes en /assets y guarda la newsletter.
 */
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { ROOT } from './paths';
import { getJob, updateJob, appendEvent, type Job } from './store';
import { toPublicAssetUrl } from './heroImage';

/** Gmail recorta los emails de más de ~102 KB de HTML ("Mensaje recortado"). */
const GMAIL_CLIP_BYTES = 102 * 1024;
const DATA_URI_RE = /data:image\/(png|jpe?g|gif|webp|svg\+xml);base64,([A-Za-z0-9+/=]+)/g;

export function log(jobId: string, message: string, level: 'info' | 'error' | 'success' = 'info'): void {
  appendEvent(jobId, { phase: 'hermes', level, message });
}

/** Corto a propósito: Hermes copia esta ruta a mano y con nombres largos se equivoca (el
 *  2026-09-24 escribió "integradon" por "integracion" y dejó el HTML en otra carpeta). */
export function standaloneCampaignSlug(job: Job): string {
  return `${job.createdAt.slice(0, 10)}-${job.id.slice(-6)}`;
}

/** Carpeta de trabajo (relativa a sistema-final/) donde Hermes debe dejar la newsletter — la
 *  misma ruta en el Mac (salida de Hermes) y en Railway (copia publicada). */
export function standaloneOutputDir(job: Job): string {
  return path.join('newsletters', job.createdAt.slice(0, 4), job.input.clientSlug, 'hermes', standaloneCampaignSlug(job));
}

/** Encargo completo para `hermes -z`: el prompt pegado, tal cual, más las reglas de entrega. */
export function buildHermesPrompt(job: Job): string {
  const outDir = standaloneOutputDir(job);
  const images =
    job.input.imageMode === 'ai'
      ? 'Imágenes: GENÉRALAS CON IA con tu herramienta de generación de imágenes (hero, producto, ambiente). El logo, en cambio, SIEMPRE el oficial de la marca.'
      : `Imágenes: usa SOLO assets oficiales de la marca (brands/${job.input.clientSlug}/ si existe, o imágenes de su web oficial). No generes imágenes con IA.`;
  return [
    job.input.briefText.trim(),
    '',
    '---',
    '## Instrucciones de entrega (Hermes Studio — ejecución automatizada)',
    '',
    `- Marca: ${job.input.clientName}${job.input.clientSlug ? ` (carpeta brands/${job.input.clientSlug}/ si existe)` : ''}.`,
    `- ${images}`,
    '- Nadie va a responder preguntas durante esta ejecución: no uses clarify ni esperes confirmación.',
    '  Si falta un dato, no lo inventes: déjalo fuera de la pieza y anótalo como pendiente.',
    `- Entrega UN ÚNICO archivo HTML de email, final y listo para enviar, en: ${outDir}/newsletter.html`,
    '  Revisa el resultado renderizado (capturas) y corrígelo antes de darlo por terminado, como haces siempre.',
    '- Imágenes en ese HTML: rutas locales (relativas al HTML o dentro del repo) o URLs https. No hace',
    '  falta subirlas ni incrustarlas en base64: Studio las publica al recibir la newsletter.',
    '- Respuesta final: breve — concepto, fuentes de los datos verificados y lo que quede pendiente.',
  ].join('\n');
}

/** Avisos no bloqueantes: se muestran en el progreso para que el compañero los revise. */
export function checkEmailHtml(html: string): string[] {
  const warnings: string[] = [];
  const bytes = Buffer.byteLength(html, 'utf8');
  if (bytes > GMAIL_CLIP_BYTES) warnings.push(`Pesa ${Math.round(bytes / 1024)} KB: Gmail lo recortará (límite ~102 KB).`);
  const imgs = [...html.matchAll(/<img\b[^>]*>/gi)].map((m) => m[0]);
  const badSrc = imgs.filter((t) => !/\bsrc\s*=\s*["']https:\/\//i.test(t));
  if (badSrc.length) warnings.push(`${badSrc.length} imagen(es) sin src https absoluto — no se verán en el correo.`);
  const noAlt = imgs.filter((t) => !/\balt\s*=/i.test(t));
  if (noAlt.length) warnings.push(`${noAlt.length} imagen(es) sin atributo alt.`);
  if (!/unsubscribe|darse de baja|baja/i.test(html)) warnings.push('No se ve enlace de baja.');
  return warnings;
}

/** Las imágenes llegan incrustadas en base64 (el worker convierte así las rutas locales del Mac).
 *  Los clientes de correo como Gmail no muestran imágenes data:, así que cada una se guarda en
 *  brands/{marca}/design-input/hermes/{campaña}/ y se sustituye por su URL pública en /assets. */
export function publishEmbeddedImages(html: string, job: Job): { html: string; count: number } {
  const relDir = path.join('brands', job.input.clientSlug, 'design-input', 'hermes', standaloneCampaignSlug(job));
  const byHash = new Map<string, string>();
  const out = html.replace(DATA_URI_RE, (_m, type: string, b64: string) => {
    const buf = Buffer.from(b64, 'base64');
    const hash = crypto.createHash('sha256').update(buf).digest('hex').slice(0, 12);
    let url = byHash.get(hash);
    if (!url) {
      const ext = type === 'svg+xml' ? 'svg' : type === 'jpeg' ? 'jpg' : type;
      const rel = path.join(relDir, `img-${hash}.${ext}`);
      fs.mkdirSync(path.join(ROOT, relDir), { recursive: true });
      fs.writeFileSync(path.join(ROOT, rel), buf);
      url = toPublicAssetUrl(rel);
      byHash.set(hash, url);
    }
    return url;
  });
  return { html: out, count: byHash.size };
}

export function completeStandaloneJob(jobId: string, rawHtml: string, finalMessage: string): void {
  const job = getJob(jobId);
  if (!job) throw new Error(`Job ${jobId} no encontrado`);
  const outRel = standaloneOutputDir(job);
  const outAbs = path.join(ROOT, outRel);
  fs.mkdirSync(outAbs, { recursive: true });

  const { html, count } = publishEmbeddedImages(rawHtml, job);
  if (count) log(jobId, `${count} imagen(es) publicada(s) en /assets.`, 'success');

  fs.writeFileSync(path.join(outAbs, 'prompt.md'), job.input.briefText, 'utf8');
  fs.writeFileSync(path.join(outAbs, 'newsletter.html'), html, 'utf8');
  if (finalMessage.trim()) fs.writeFileSync(path.join(outAbs, 'notas.md'), finalMessage.trim() + '\n', 'utf8');

  for (const w of checkEmailHtml(html)) log(jobId, `Aviso: ${w}`, 'error');
  if (finalMessage.trim()) log(jobId, `Nota de Hermes: ${finalMessage.trim().slice(0, 1500)}`);

  updateJob(jobId, {
    status: 'completed',
    currentPhase: null,
    progress: job.progress ? { ...job.progress, pct: 100, stage: 'terminado', stageLabel: 'Terminada', detail: '', etaSec: 0 } : undefined,
    campaignRelPath: outRel,
    resultRelPath: path.join(outRel, 'newsletter.html'),
  });
  log(jobId, 'Newsletter lista.', 'success');
}
