/**
 * standalone.ts — modo "HTML standalone" de Hermes Studio (2026-09-24).
 *
 * El compañero pega el prompt de dirección creativa que genera la skill
 * `newsletter-creative-brief` y el modelo (con búsqueda web) devuelve directamente un HTML de
 * email completo — el mismo flujo que el usuario ya usaba con Hermes fuera del pipeline de 9
 * fases (ver memory.md, "Hallazgo 1": la mayoría de newsletters reales se hicieron así). No pasa
 * por engine/build-newsletter.js ni por los gates: el HTML es de autor, no de componentes.
 *
 * Imágenes, a elección del compañero en cada trabajo:
 *  - 'official': solo imágenes ya capturadas de la marca (brands/{slug}/) o, si no bastan, URLs
 *    https directas de su web oficial encontradas investigando.
 *  - 'ai': el modelo marca los huecos con {{GENERAR_IMAGEN: descripción}} y Studio genera cada
 *    imagen con gpt-image (máx. MAX_AI_IMAGES) tras sanear la descripción.
 * El logo SIEMPRE es el oficial (regla de la skill: nunca reconstruir el logo como texto).
 */
import * as fs from 'fs';
import * as path from 'path';
import sharp from 'sharp';
import { ROOT, BRANDS_DIR } from './paths';
import { updateJob, appendEvent, type JobInput } from './store';
import { slugify } from './campaignFs';
import { callResearchAgent } from './llmClient';
import { generateHeroImage, toPublicAssetUrl } from './heroImage';
import { sanitizeLandingPrompt } from '../../scripts/lib/sanitize-hero-prompt';
// eslint-disable-next-line @typescript-eslint/no-var-requires
let juice = require('juice');
juice = juice.default || juice;

const MAX_AI_IMAGES = 4;
const IMAGE_PLACEHOLDER_RE = /\{\{\s*GENERAR_IMAGEN\s*:\s*([^}]+?)\s*\}\}/g;
const IMAGE_EXT = /\.(png|jpe?g|gif|webp)$/i;
// Capturas de pantalla de la web, previews de QA, etc.: están en design-input pero no son
// assets publicables en un email.
const NOT_AN_ASSET = /(preview|source-page|screenshot|home-top|header-crop|desktop|viewport|full|qa-|check|render)/i;
/** Gmail recorta los emails de más de ~102 KB de HTML ("Mensaje recortado"). */
const GMAIL_CLIP_BYTES = 102 * 1024;

function log(jobId: string, message: string, level: 'info' | 'error' | 'success' = 'info'): void {
  appendEvent(jobId, { phase: 'standalone', level, message });
}

interface BrandImage {
  url: string;
  width?: number;
  height?: number;
  isLogo: boolean;
}

async function listBrandImages(brandSlug: string): Promise<BrandImage[]> {
  const brandDir = path.join(BRANDS_DIR, brandSlug);
  if (!fs.existsSync(brandDir)) return [];
  const found: string[] = [];
  const walk = (dir: string): void => {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      if (e.name.startsWith('.')) continue;
      const abs = path.join(dir, e.name);
      if (e.isDirectory()) walk(abs);
      else if (IMAGE_EXT.test(e.name) && !NOT_AN_ASSET.test(e.name) && fs.statSync(abs).size < 2.5 * 1024 * 1024) {
        found.push(abs);
      }
    }
  };
  walk(brandDir);

  const images: BrandImage[] = [];
  for (const abs of found.slice(0, 60)) {
    const rel = path.relative(ROOT, abs);
    let width: number | undefined;
    let height: number | undefined;
    try {
      ({ width, height } = await sharp(abs).metadata());
    } catch {
      // Sin dimensiones la imagen sigue siendo utilizable; solo se informa peor al modelo.
    }
    images.push({ url: toPublicAssetUrl(rel), width, height, isLogo: /logo/i.test(path.basename(abs)) });
  }
  return images;
}

function readBrandTokens(brandSlug: string): string | null {
  const p = path.join(BRANDS_DIR, brandSlug, 'tokens', 'brand-tokens.json');
  if (!fs.existsSync(p)) return null;
  // Se omite el historial de cambios: ocupa mucho contexto y no aporta nada al HTML.
  try {
    const t = JSON.parse(fs.readFileSync(p, 'utf8'));
    delete t._changelog;
    return JSON.stringify(t, null, 2);
  } catch {
    return null;
  }
}

function buildInstructions(input: JobInput, images: BrandImage[], tokens: string | null): string {
  const logos = images.filter((i) => i.isLogo);
  const others = images.filter((i) => !i.isLogo);
  const fmt = (i: BrandImage): string => `- ${i.url}${i.width ? ` (${i.width}x${i.height})` : ''}`;

  return [
    `Eres el equipo de dirección creativa y desarrollo de email de Hermes. Vas a recibir un prompt`,
    `de dirección creativa para una newsletter de ${input.clientName}. Síguelo al pie de la letra`,
    'y entrega el resultado final como UN ÚNICO documento HTML de email, completo y listo para enviar.',
    '',
    'Ejecución automatizada: no hay nadie a quien preguntar. Si el prompt dice que no entregues HTML,',
    'o que el HTML lo genera otro sistema, IGNORA esa parte: aquí tú entregas el HTML final.',
    '',
    '## Investigación',
    'Tienes búsqueda web. Úsala para verificar en fuentes oficiales todo dato que el prompt pida',
    'verificar (precios, características, disponibilidad, condiciones legales). Nunca inventes un',
    'dato: si no lo puedes verificar, no lo pongas en la pieza y regístralo como pendiente.',
    '',
    '## Requisitos técnicos del HTML (email real, no web)',
    '- <!DOCTYPE html> completo, <meta charset="utf-8">, viewport y color-scheme light dark.',
    '- Maquetación con <table role="presentation">, ancho máximo 600px centrado, CSS inline en cada',
    '  elemento. Un <style> en el <head> solo para @media (móvil ≤ 480px) y modo oscuro.',
    '- Nada de JavaScript, <form>, <iframe>, vídeo, CSS externo, position, flexbox ni grid.',
    '- Tipografías con fallback web-safe (Arial, Helvetica, Georgia...). Si la marca usa una fuente',
    '  propia, puedes cargarla con <link> de Google Fonts, pero el fallback debe funcionar solo.',
    '- Preheader oculto al principio del <body>.',
    '- Todo texto importante (titulares, CTA) va en HTML vivo, nunca dentro de una imagen.',
    '- El "Concepto: ..." y cualquier nota de trabajo (autoauditoría, fuentes, pendientes) van SOLO',
    '  en el comentario HERMES-NOTAS: nunca como texto visible del email (ni como antetítulo).',
    '- Botones CTA como enlace <a> con fondo, padding y border-radius inline (bulletproof).',
    '- Cada <img> con src https absoluto, width/height explícitos, alt descriptivo, display:block.',
    '- Footer con aviso legal si aplica, y enlaces {{unsubscribe_url}} y {{preferences_url}}',
    '  como href literales (el ESP los sustituye).',
    '- Mantén el HTML por debajo de ~90 KB (Gmail recorta a partir de 102 KB).',
    '',
    '## Imágenes',
    logos.length
      ? ['Logo oficial de la marca (usa uno de estos; nunca escribas el nombre de la marca como logo;',
         'evita SVG si hay PNG, Gmail no muestra SVG):', ...logos.map(fmt)].join('\n')
      : 'No hay logo oficial en el sistema. Busca en la web oficial de la marca la URL https directa de su logo (PNG/JPG) y úsala; si no la encuentras, deja el nombre de la marca en texto y regístralo como pendiente.',
    '',
    input.imageMode === 'ai'
      ? [
          'Resto de imágenes: GENERADAS CON IA. Donde necesites una imagen (hero, producto, ambiente),',
          'pon en el src literalmente {{GENERAR_IMAGEN: descripción visual detallada}} — el sistema',
          `la genera después. Máximo ${MAX_AI_IMAGES - 1} imágenes. La descripción: solo lo visual (encuadre, luz,`,
          'sujeto, fondo, estilo fotográfico), sin texto, logos, marcas, personas famosas ni precios.',
          'Las imágenes generadas son horizontales (3:2): usa width="600" height="400" o recórtalas con CSS.',
        ].join('\n')
      : [
          'Resto de imágenes: SOLO ASSETS OFICIALES DE LA MARCA. Usa estas (no generes nada):',
          ...(others.length ? others.map(fmt) : ['(no hay imágenes de la marca en el sistema)']),
          'Si no bastan, puedes usar URLs https directas de imágenes de la web OFICIAL de la marca que',
          'encuentres investigando. Si aun así falta alguna, diseña ese bloque sin imagen (color, tipografía).',
        ].join('\n'),
    '',
    tokens ? `## Brand pack de la marca (brand-tokens.json) — colores, tipografía y voz verificados\n${tokens}` : '',
    '',
    '## Formato de la respuesta',
    'Devuelve SOLO el documento HTML, desde <!DOCTYPE html> hasta </html>, sin explicaciones antes ni',
    'después y sin fences de markdown. Justo antes de </html>, incluye un comentario HTML con:',
    '<!-- HERMES-NOTAS',
    'Concepto: ...',
    'Fuentes: cada dato verificado con su URL',
    'Pendiente de confirmar: lo que no pudiste verificar',
    '-->',
  ]
    .filter((l) => l !== null)
    .join('\n');
}

export function extractHtml(text: string): string | null {
  const start = text.search(/<!doctype html|<html[\s>]/i);
  const end = text.toLowerCase().lastIndexOf('</html>');
  if (start < 0 || end < start) return null;
  return text.slice(start, end + '</html>'.length);
}

/** Avisos no bloqueantes: se muestran en el progreso para que el compañero los revise. */
export function checkEmailHtml(html: string): string[] {
  const warnings: string[] = [];
  const bytes = Buffer.byteLength(html, 'utf8');
  if (bytes > GMAIL_CLIP_BYTES) warnings.push(`Pesa ${Math.round(bytes / 1024)} KB: Gmail lo recortará (límite ~102 KB).`);
  if (/<script[\s>]/i.test(html)) warnings.push('Contenía <script>: se ha eliminado (los clientes de correo lo bloquean).');
  const imgs = [...html.matchAll(/<img\b[^>]*>/gi)].map((m) => m[0]);
  const badSrc = imgs.filter((t) => !/\bsrc\s*=\s*["']https:\/\//i.test(t));
  if (badSrc.length) warnings.push(`${badSrc.length} imagen(es) sin src https absoluto — no se verán en el correo.`);
  const noAlt = imgs.filter((t) => !/\balt\s*=/i.test(t));
  if (noAlt.length) warnings.push(`${noAlt.length} imagen(es) sin atributo alt.`);
  if (!/\{\{\s*unsubscribe_url\s*\}\}/i.test(html)) warnings.push('No hay enlace de baja ({{unsubscribe_url}}).');
  return warnings;
}

export async function runStandaloneJob(jobId: string, input: JobInput): Promise<void> {
  const brandSlug = input.clientSlug;
  const year = String(new Date().getFullYear());
  const campaignSlug = `${new Date().toISOString().slice(0, 10)}-${slugify(input.briefText).slice(0, 30)}-${jobId.slice(-4)}`;
  const outRel = path.join('newsletters', year, brandSlug, 'standalone', campaignSlug);
  const outAbs = path.join(ROOT, outRel);
  fs.mkdirSync(outAbs, { recursive: true });
  fs.writeFileSync(path.join(outAbs, 'prompt.md'), input.briefText, 'utf8');
  updateJob(jobId, { currentPhase: 'standalone', campaignSlug, campaignRelPath: outRel });

  const images = await listBrandImages(brandSlug);
  const tokens = readBrandTokens(brandSlug);
  log(
    jobId,
    `Marca "${brandSlug}": ${tokens ? 'brand pack encontrado' : 'sin brand pack (se investigará en su web)'}, ` +
      `${images.filter((i) => i.isLogo).length} logo(s) y ${images.filter((i) => !i.isLogo).length} imagen(es) oficiales. ` +
      `Imágenes: ${input.imageMode === 'ai' ? 'generadas con IA' : 'assets oficiales'}.`
  );

  log(jobId, 'Investigando y escribiendo la newsletter (suele tardar varios minutos)...');
  const { text, webSearches } = await callResearchAgent({
    instructions: buildInstructions(input, images, tokens),
    input: input.briefText,
    maxOutputTokens: 64000,
    reasoningEffort: process.env.STANDALONE_REASONING_EFFORT || 'medium',
    onProgress: (s) => log(jobId, `Sigue trabajando... (${Math.round(s / 60)} min)`),
  });
  log(jobId, `Borrador recibido (${webSearches} búsqueda(s) web).`, 'success');

  let html = extractHtml(text);
  if (!html) {
    fs.writeFileSync(path.join(outAbs, 'respuesta-sin-html.txt'), text, 'utf8');
    throw new Error('El modelo no devolvió un documento HTML completo (sin <html>...</html>).');
  }
  html = html.replace(/<script\b[\s\S]*?<\/script>/gi, '');

  const placeholders = [...html.matchAll(IMAGE_PLACEHOLDER_RE)];
  if (placeholders.length > 0) {
    if (input.imageMode !== 'ai') {
      throw new Error('El modelo pidió generar imágenes con IA, pero este trabajo es de assets oficiales.');
    }
    if (placeholders.length > MAX_AI_IMAGES) {
      throw new Error(`El modelo pidió ${placeholders.length} imágenes con IA (máximo ${MAX_AI_IMAGES}). Reenvía el prompt pidiendo menos imágenes.`);
    }
    for (let i = 0; i < placeholders.length; i++) {
      const [token, description] = placeholders[i];
      log(jobId, `Generando imagen ${i + 1}/${placeholders.length} con IA...`);
      // Mismo saneado que el hero del pipeline (incidente BMW de moderación, ver memory.md).
      const prompt =
        `Fotografía para un email de marketing de ${input.clientName}: ` +
        `${sanitizeLandingPrompt(description, input.clientName)}. Sin texto superpuesto ni logotipos.`;
      const rel = await generateHeroImage({ brandSlug, campaignSlug: `${campaignSlug}-${i + 1}`, prompt });
      html = html.split(token).join(toPublicAssetUrl(rel));
    }
    log(jobId, `${placeholders.length} imagen(es) generada(s).`, 'success');
  }

  let inline = html;
  try {
    inline = juice(html, { preserveMediaQueries: true });
  } catch (err) {
    log(jobId, `No se pudo pasar el CSS a inline (${(err as Error).message}); se entrega tal cual.`, 'error');
  }

  fs.writeFileSync(path.join(outAbs, 'newsletter.html'), html, 'utf8');
  fs.writeFileSync(path.join(outAbs, 'newsletter-inline.html'), inline, 'utf8');
  const notes = html.match(/<!--\s*HERMES-NOTAS([\s\S]*?)-->/);
  if (notes) fs.writeFileSync(path.join(outAbs, 'notas.md'), notes[1].trim() + '\n', 'utf8');

  for (const w of checkEmailHtml(inline)) log(jobId, `Aviso: ${w}`, 'error');
  if (notes && /pendiente de confirmar:\s*\S/i.test(notes[1]) && !/pendiente de confirmar:\s*(ninguno|nada|-)\s*$/im.test(notes[1])) {
    log(jobId, 'Hay datos pendientes de confirmar: revisa el comentario HERMES-NOTAS al final del HTML.', 'error');
  }

  updateJob(jobId, { status: 'completed', resultRelPath: path.join(outRel, 'newsletter-inline.html') });
  log(jobId, 'Newsletter lista.', 'success');
}
