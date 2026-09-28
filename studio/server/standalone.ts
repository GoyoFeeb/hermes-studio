/**
 * standalone.ts — modo "HTML standalone" de Hermes Studio, ejecutado por Hermes Agent.
 *
 * El compañero pega el prompt de dirección creativa que genera la skill
 * `newsletter-creative-brief`. El trabajo queda en cola aquí; un worker en el Mac del usuario
 * (studio/worker/hermes-worker.ts) lo recoge, lanza `hermes chat -q` con SU instalación (config,
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
import { ROOT, DATA_DIR } from './paths';
import { getJob, updateJob, appendEvent, listJobs, type Job } from './store';
import { toPublicAssetUrl } from './heroImage';
import type { QualityReport, QualityCheckItem } from '../worker/qualityCheck';
import { findPreheader } from '../worker/qualityCheck';

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

/** Encargo completo para Hermes: el prompt pegado, tal cual, más las reglas de entrega. */
export function buildHermesPrompt(job: Job): string {
  const outDir = standaloneOutputDir(job);
  const images =
    job.input.imageMode === 'ai'
      ? 'Imágenes: GENÉRALAS CON IA con tu herramienta de generación de imágenes (hero, producto, ambiente). El logo, en cambio, SIEMPRE el oficial de la marca.'
      : 'Imágenes: SOLO fotografía oficial de la marca, sacada de su web oficial, newsroom o press kit ' +
        '(descárgala con el navegador y anota la URL de origen). No generes imágenes con IA. Las fotos de ' +
        `brands/${job.input.clientSlug}/design-input/ pueden venir de campañas anteriores generadas con IA: ` +
        'úsalas solo si puedes confirmar que están publicadas en la web oficial.';
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
    '- Preheader OBLIGATORIO: al principio del <body>, un bloque oculto (display:none; max-height:0;',
    '  overflow:hidden; mso-hide:all) con una frase que complemente al asunto (se ve junto a él en la bandeja).',
    '- Enlaces: cada href debe llevar a una página que exista (compruébalo con el navegador); nunca inventes',
    '  una URL. Studio comprueba enlaces e imágenes al recibir la pieza y te devolverá los que den 404.',
    '- Footer: incluye SIEMPRE un enlace de baja con href="{{unsubscribe_url}}" (obligatorio en un',
    '  email comercial; el ESP sustituye la variable) y, si procede, el aviso legal de la marca.',
    `- Scripts y archivos auxiliares (conversiones, comprobaciones, capturas): en ${outDir}/_trabajo/`,
    '  o en /tmp. Nunca en scripts/, en la raíz del repo ni en brands/ (ahí solo logos e imágenes de marca).',
    '- Móvil OBLIGATORIO: renderiza la pieza también a 375 px de ancho (iPhone). Nada puede salirse del',
    '  ancho ni quedar cortado: en la media query de móvil, imágenes con width:100% y height:auto, tablas',
    '  y celdas fluidas (sin anchos fijos de 600 px), titulares y botones que puedan partir línea. Studio',
    '  lo mide al recibir la pieza y te la devolverá si se sale.',
    `- Autoauditoría por escrito, OBLIGATORIA: antes de terminar, escribe ${outDir}/notas.md con:`,
    '  1. Concepto (una frase) y titular principal de la pieza; explica cómo deriva el titular del',
    '     concepto. Si no deriva de él, corrige el titular antes de entregar.',
    '  2. Cada precio, cifra, nombre de modelo o dato técnico que aparezca en la pieza, con su fuente',
    '     (URL oficial). Lo que no tenga fuente no puede estar en la pieza: quítalo o reescríbelo.',
    '  3. Origen de cada imagen: URL oficial, brand pack o generada con IA.',
    '  4. Resultado de la comprobación a 375 px (qué revisaste y qué corregiste).',
    '  5. Las preguntas de autoauditoría del prompt con su respuesta.',
    '- Respuesta final: breve — concepto y lo que quede pendiente.',
  ].join('\n');
}

/** El brief está pendiente: el trabajo llegó como instrucción básica y Hermes aún no lo ha escrito. */
export function needsBrief(job: Job): boolean {
  return !!job.input.instruction && !job.input.briefText.trim();
}

/** Paso previo para una instrucción básica: Hermes escribe el prompt de dirección creativa con la
 *  skill newsletter-creative-brief (destino standalone, fijado aquí: la skill pregunta el destino si
 *  es ambiguo y en esta ejecución nadie responde). El worker lo lee de `{outDir}/brief.md`. */
export function buildBriefPrompt(job: Job): string {
  const outDir = standaloneOutputDir(job);
  const images =
    job.input.imageMode === 'ai'
      ? 'Las imágenes de la pieza se generarán con IA (el logo, siempre el oficial).'
      : 'La pieza usará solo fotografía oficial de la marca, sacada de su web oficial (nada de imágenes ' +
        'generadas con IA; las fotos del brand pack pueden serlo). Pide en el brief localizar las imágenes ' +
        'oficiales concretas (URL) de la web de la marca.';
  return [
    'Carga la skill newsletter-creative-brief (skill_view) y sigue su "Modo 1 — Generar un brief nuevo".',
    '',
    `Petición del equipo: «${job.input.instruction!.trim()}»`,
    `Marca: ${job.input.clientName}${job.input.clientSlug ? ` (carpeta brands/${job.input.clientSlug}/ si existe)` : ''}.`,
    '',
    '## Decisiones ya tomadas (no preguntes)',
    '- Destino: **standalone** (HTML standalone). Usa la variante `standalone` de la sección 6 de la',
    '  plantilla; no uses la variante `hermes` ni preguntes por el destino.',
    `- ${images} Tenlo en cuenta en el brief.`,
    '- Nadie va a responder preguntas: no uses clarify. Si falta el producto o la campaña concreta,',
    '  elige la opción más razonable para la marca ahora mismo (lanzamiento o campaña vigente en su web',
    '  oficial) y dilo explícitamente en el brief.',
    '- Investigación ligera, como pide la skill (2-4 búsquedas o páginas de la web oficial).',
    '',
    '## Entrega',
    `- Escribe el brief completo, con todas las {{VARIABLES}} resueltas, en ${outDir}/brief.md (write_file).`,
    '  Es el entregable: ignora las instrucciones de la skill sobre present_files o guardar la skill.',
    '- NO generes la newsletter ni ningún HTML: solo el brief. La newsletter se hace en otro paso.',
    '- Respuesta final: una línea con el concepto elegido.',
  ].join('\n');
}

/** HTML publicado de un trabajo terminado (con las imágenes ya en URLs https de /assets). */
export function readResultHtml(job: Job): string | null {
  if (job.status !== 'completed' || !job.resultRelPath) return null;
  try {
    return fs.readFileSync(path.join(ROOT, job.resultRelPath), 'utf8');
  } catch {
    return null;
  }
}

/** Encargo de "Adaptar a móvil": el worker deja el HTML original en `_trabajo/original.html`
 *  (fuera de la carpeta raíz para que no cuente como entrega) y Hermes escribe la versión adaptada.
 *  Las newsletters hechas antes de la comprobación móvil (Adidas, Inglesina…) eran tablas fijas de
 *  600 px sin ninguna media query: rehacerlas costaba 20 min; esto, unos minutos. */
export function buildMobileFixPrompt(job: Job): string {
  const outDir = standaloneOutputDir(job);
  return [
    `Adapta a móvil la newsletter de ${job.input.clientName} que está en ${outDir}/_trabajo/original.html.`,
    'Es una pieza ya aprobada: NO la rediseñes, NO cambies textos, imágenes, colores ni orden, NO investigues',
    'la marca ni cargues skills. La versión de escritorio (600 px) debe quedar idéntica.',
    '',
    '## Qué hacer',
    '- Añade (o corrige) un bloque <style> con @media only screen and (max-width: 620px) y clases en el HTML:',
    '  contenedor principal al 100 %; imágenes con width:100% !important y height:auto !important;',
    '  columnas apiladas (display:block; width:100%); paddings laterales de ~20 px; titulares más pequeños',
    '  que puedan partir línea; botones que no se salgan (ancho automático o 100 %).',
    '- Sustituye anchos fijos que impidan encoger (width="600" en tablas contenedoras → width="100%" con',
    '  max-width:600px, o la clase de la media query). Mantén los atributos width de las imágenes para Outlook.',
    '- Mantén las URLs de las imágenes tal cual (ya están publicadas).',
    '',
    '## Entrega',
    `- Guarda el resultado en ${outDir}/newsletter.html (write_file). Scripts y capturas en ${outDir}/_trabajo/.`,
    '- Renderízalo a 375 px y a 600 px y míralo: a 375 px nada puede salirse del ancho ni quedar cortado, y a',
    '  600 px debe verse igual que el original. Studio lo mide al recibirlo y te lo devolverá si se sale.',
    `- Escribe ${outDir}/notas.md con los cambios hechos y el resultado de las comprobaciones a 375 y 600 px.`,
    '- Nadie va a responder preguntas: no uses clarify. Respuesta final: una línea.',
  ].join('\n');
}

/** Encargo de "Pedir cambios": el worker deja en `_trabajo/` el HTML publicado (original.html) y la
 *  autoauditoría de esa versión (notas-original.md, con las fuentes de cada dato). Sesión nueva y no
 *  la original: con 70+ acciones acumuladas, retomarla con DeepSeek es lento y caro, y lo necesario
 *  (pieza, fuentes y brief) ya está aquí. */
export function buildRevisionPrompt(job: Job): string {
  const outDir = standaloneOutputDir(job);
  const images =
    job.input.imageMode === 'ai'
      ? 'Si el cambio pide una imagen nueva, puedes generarla con IA (el logo, siempre el oficial).'
      : 'Si el cambio pide una imagen nueva, solo fotografía oficial de la web de la marca, con su URL de origen.';
  return [
    `Aplica cambios a la newsletter de ${job.input.clientName} que está en ${outDir}/_trabajo/original.html.`,
    `Su autoauditoría (fuente de cada dato y origen de cada imagen) está en ${outDir}/_trabajo/notas-original.md.`,
    '',
    '## Cambios pedidos por el equipo',
    job.input.changeRequest!.trim(),
    '',
    '## Cómo',
    '- Aplica SOLO lo pedido. Mantén el resto igual: diseño, estructura, textos, imágenes y enlaces que no',
    '  afecte el cambio. No rehagas la pieza ni cambies el concepto salvo que se pida.',
    '- Si el cambio necesita un dato nuevo (precio, cifra, nombre de modelo), sácalo de la web oficial y',
    '  anota la fuente; si no lo encuentras, no lo inventes: deja la pieza como estaba en ese punto y dilo.',
    `- ${images}`,
    '- No cargues skills ni investigues la marca más allá de lo que pida el cambio.',
    '- Si un cambio pedido contradice una regla de la pieza (claims, datos sin fuente, enlace de baja),',
    '  no lo apliques en esa parte y explícalo en las notas.',
    '',
    '## Entrega',
    `- Guarda el resultado en ${outDir}/newsletter.html (write_file). Scripts y capturas en ${outDir}/_trabajo/.`,
    '- Renderízalo a 600 y a 375 px y míralo: nada puede salirse del ancho. Studio comprueba el móvil, los',
    '  enlaces, las imágenes y el preheader al recibirlo y te devolverá lo que falle.',
    `- Escribe ${outDir}/notas.md: qué cambiaste y dónde, la fuente de cada dato nuevo, el origen de cada`,
    '  imagen nueva y lo que no pudiste aplicar (y por qué).',
    '- Nadie va a responder preguntas: no uses clarify. Respuesta final: una línea.',
    '',
    '## Referencia: brief original de la pieza',
    job.input.briefText.trim(),
  ].join('\n');
}

/** El prompt tiene que hablar de la marca elegida: el 2026-09-24 se envió un prompt de Prozis con
 *  la marca Adeslas seleccionada (el navegador había rellenado el formulario) y Hermes recibió
 *  "usa solo assets de Adeslas" para una campaña de Prozis. */
export function promptMentionsBrand(prompt: string, clientName: string, clientSlug: string): boolean {
  const norm = (t: string): string =>
    t.toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '').replace(/[^a-z0-9]+/g, ' ').trim();
  const text = ` ${norm(prompt)} `;
  return [clientName, clientSlug.replace(/-/g, ' ')].map(norm).some((n) => n.length > 1 && text.includes(` ${n} `));
}

/** Con el worker enviando progreso cada 30 s, 10 min sin señales = trabajo perdido (Mac apagado o
 *  dormido, worker cerrado). Antes eran 4 h y solo se comprobaba cuando el worker pedía trabajo:
 *  con el Mac apagado, la página se quedaba en "running" indefinidamente. */
export const HERMES_STALE_MS = 10 * 60 * 1000;

export function sweepStaleHermesJobs(): void {
  for (const j of listJobs()) {
    if (j.input.mode === 'standalone' && j.status === 'running' && Date.now() - Date.parse(j.updatedAt) > HERMES_STALE_MS) {
      log(j.id, 'Hermes dejó de dar señales de vida (¿Mac apagado, dormido o worker cerrado?).', 'error');
      updateJob(j.id, { status: 'failed', error: 'Hermes dejó de responder (¿Mac apagado, dormido o worker cerrado?). Vuelve a enviarlo.' });
    }
  }
}

// Marcas que existen en el Mac del worker (donde trabaja Hermes). El desplegable mostraba las del
// volumen de Railway, que no incluyen lo que Hermes descarga en el Mac (p. ej. brands/prozis).
const WORKER_BRANDS_FILE = path.join(DATA_DIR, 'worker-brands.json');
const SLUG_RE = /^[a-z0-9][a-z0-9-]{0,59}$/;

export function saveWorkerBrands(brands: unknown): void {
  if (!Array.isArray(brands)) return;
  const clean = [...new Set(brands.filter((b): b is string => typeof b === 'string' && SLUG_RE.test(b)))].slice(0, 1000).sort();
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(WORKER_BRANDS_FILE, JSON.stringify(clean));
  } catch {
    // no crítico: el desplegable seguirá con las marcas de Railway
  }
}

export function readWorkerBrands(): string[] {
  try {
    return JSON.parse(fs.readFileSync(WORKER_BRANDS_FILE, 'utf8'));
  } catch {
    return [];
  }
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

/** El informe llega del worker por la red: se guarda solo lo que tiene la forma esperada, acotado. */
export function sanitizeQuality(raw: unknown): QualityReport | undefined {
  if (!raw || typeof raw !== 'object' || !Array.isArray((raw as QualityReport).checks)) return undefined;
  const statuses = ['ok', 'warning', 'error'];
  const checks: QualityCheckItem[] = (raw as QualityReport).checks
    .filter((c) => c && typeof c === 'object' && statuses.includes(c.status))
    .slice(0, 20)
    .map((c) => {
      const details = (Array.isArray(c.details) ? c.details : []).slice(0, 30).map((d) => String(d).slice(0, 600));
      return {
        id: String(c.id || '').slice(0, 40),
        label: String(c.label || '').slice(0, 80),
        status: c.status,
        details,
        errorCount: Math.max(0, Math.min(details.length, Number(c.errorCount) || 0)),
      };
    });
  return {
    checkedAt: String((raw as QualityReport).checkedAt || new Date().toISOString()).slice(0, 40),
    errors: checks.filter((c) => c.status === 'error').length,
    warnings: checks.filter((c) => c.status === 'warning').length,
    checks,
  };
}

/** Asunto (el <title> del HTML: es donde Hermes lo deja) y preheader de una newsletter terminada,
 *  para copiarlos a la plataforma de envío sin abrir el archivo (2026-09-28). */
export function resultMeta(job: Job): { subject: string | null; preheader: string | null } | null {
  const html = readResultHtml(job);
  if (!html) return null;
  const title = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] || '';
  const subject = title
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&nbsp;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return { subject: subject || null, preheader: findPreheader(html) };
}

/** Lo que suele tardar cada tipo de trabajo (orientativo: las duraciones reales viven en el Mac). */
function typicalSeconds(job: Job): number {
  if (job.input.mobileFixOf) return 6 * 60;
  if (job.input.revisionOf) return 8 * 60;
  return (job.input.instruction ? 25 : 20) * 60;
}

/** Posición en la cola de un trabajo standalone en espera y cuándo empezará, estimado: lo que le
 *  queda al que está en marcha más lo que suelen tardar los que van delante. Hermes hace uno a la vez. */
export function queueInfo(job: Job): { ahead: number; startsInSec: number } | null {
  if (job.status !== 'queued' || job.input.mode !== 'standalone') return null;
  const standalone = listJobs().filter((j) => j.input.mode === 'standalone');
  const running = standalone.filter((j) => j.status === 'running');
  const queuedAhead = standalone.filter((j) => j.status === 'queued' && j.createdAt < job.createdAt);
  let seconds = 0;
  for (const r of running) {
    // Sin estimación (recta final) o sin progreso todavía: lo que suele tardar menos lo transcurrido.
    seconds += r.progress?.etaSec ?? Math.max(120, typicalSeconds(r) - (r.progress?.elapsedSec ?? 0));
  }
  for (const q of queuedAhead) seconds += typicalSeconds(q);
  return { ahead: running.length + queuedAhead.length, startsInSec: seconds };
}

/** Autoauditoría de Hermes (notas.md) de un trabajo terminado, para el panel de revisión. */
export function readResultNotes(job: Job): string | null {
  if (job.status !== 'completed' || !job.campaignRelPath) return null;
  try {
    return fs.readFileSync(path.join(ROOT, job.campaignRelPath, 'notas.md'), 'utf8').slice(0, 60000);
  } catch {
    return null;
  }
}

export function completeStandaloneJob(jobId: string, rawHtml: string, finalMessage: string, quality?: QualityReport): void {
  const job = getJob(jobId);
  if (!job) throw new Error(`Job ${jobId} no encontrado`);
  const outRel = standaloneOutputDir(job);
  const outAbs = path.join(ROOT, outRel);
  fs.mkdirSync(outAbs, { recursive: true });

  const { html, count } = publishEmbeddedImages(rawHtml, job);
  if (count) log(jobId, `${count} imagen(es) publicada(s) en /assets.`, 'success');

  fs.writeFileSync(path.join(outAbs, 'prompt.md'), job.input.briefText, 'utf8');
  if (job.input.instruction) fs.writeFileSync(path.join(outAbs, 'instruccion.md'), job.input.instruction.trim() + '\n', 'utf8');
  if (job.input.changeRequest) fs.writeFileSync(path.join(outAbs, 'cambios.md'), job.input.changeRequest.trim() + '\n', 'utf8');
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
    ...(quality ? { quality } : {}),
  });
  log(jobId, 'Newsletter lista.', 'success');
}
