#!/usr/bin/env npx tsx
/**
 * generate-hero-image.ts — genera el ARTE del banner del header con la API de imágenes de
 * OpenAI (por defecto gpt-image-1; soporta gpt-image-2 vía HERO_IMG_MODEL, ver abajo).
 *
 * Diseño híbrido (decisión 2026-07-21): la imagen es SOLO arte de marca — el titular,
 * subtítulo y CTA siguen siendo HTML vivo (componente hero-imagen del motor). Así el email
 * sobrevive al bloqueo de imágenes de Outlook/Gmail y el copy sigue siendo accesible y
 * editable sin regenerar arte.
 *
 * Proveedor (2026-07-22, vuelta a OpenAI a petición del usuario — ver engine/CHANGELOG.md,
 * entrada "Vuelta a OpenAI"): habíamos pasado a Pollinations.ai el 2026-07-21 porque la cuenta
 * de OpenAI estaba bloqueada por límite de facturación. El usuario pidió volver a OpenAI; la
 * facturación ya está resuelta (créditos añadidos, ver CHANGELOG).
 *
 * Modelo (2026-07-22, actualizado a petición del usuario vía HERO_IMG_MODEL=gpt-image-2 en su
 * .env): gpt-image-2 (lanzado 2026-04-21, posterior al conocimiento de entrenamiento del
 * modelo — verificado con búsqueda web antes de implementar, no asumido) acepta CUALQUIER
 * tamaño que cumpla: ambos lados múltiplos de 16px, lado máximo ≤3840px, ratio lado
 * largo:lado corto ≤3:1, y total de píxeles entre 655.360 y 8.294.400 — a diferencia de
 * gpt-image-1, que solo acepta el enum fijo 1024x1024/1536x1024/1024x1536/auto. Este script
 * valida el tamaño pedido contra las reglas del modelo activo ANTES de llamar a la API, para
 * fallar con un mensaje claro en vez de un error crudo de OpenAI.
 *
 * Redimensionado final (2026-07-22, a petición del usuario): 600px es el ancho real del email,
 * pero no es múltiplo de 16 (600/16 = 37.5) — no se le puede pedir directamente a la API. Por
 * eso se genera a un tamaño válido (HERO_IMG_SIZE, misma relación de aspecto que se quiera
 * mantener) y este script reescala el resultado a HERO_IMG_TARGET_WIDTH con `sharp` antes de
 * guardarlo — la API nunca recibe un tamaño inválido, el archivo final sí queda a medida.
 *
 * Uso:
 *   npm run generate-hero-image -- --brand tarifalo --theme "comparar tarifas de luz y gas"
 *   npm run generate-hero-image -- --brand tarifalo --theme "..." --campaign newsletters/2026/tarifalo/2026-jul-tarifalo-compara-luz
 *   (no interactivo, para invocación automatizada / desde un agente — ver más abajo)
 *   npm run generate-hero-image -- --brand tarifalo --theme "..." --source landing --url https://tarifalo.com/comparador/luz/
 *   npm run generate-hero-image -- --brand tarifalo --theme "..." --source general [--url https://tarifalo.com] [--save-website]
 *   npm run generate-hero-image -- --brand tarifalo --theme "..." --source skip
 *
 * Requiere OPENAI_API_KEY en .env (de la raíz del proyecto) — console.openai.com > API Keys.
 * gpt-image-2 (y gpt-image-1) requieren además que la organización de OpenAI esté verificada
 * (API Organization Verification, platform.openai.com/settings/organization/general) — este
 * script distingue ese error específico de un simple problema de facturación.
 *
 * Anclaje a una página real (2026-07-22, a petición del usuario: "quiero que genere la imagen
 * de cabecera en base a la página sobre la que se esté haciendo la newsletter"). El prompt
 * genérico (solo colores + tono de marca) no reflejaba la fotografía/imaginería real del
 * cliente. Ahora, si hay una terminal interactiva, el script PREGUNTA antes de generar —
 * porque varía por campaña, no hay un valor por defecto correcto:
 *   1) Landing específica de esta campaña (sugiere cta.href si se pasa --campaign)
 *   2) Web general de la marca (se pregunta la URL la primera vez y se ofrece guardarla en el
 *      brand pack como `website` para no volver a preguntarla)
 *   3) Omitir — vuelve al prompt genérico de siempre
 * Mecanismo elegido (no image-to-image, para evitar que cuelen logos/texto/capturas literales
 * del sitio en el arte generado — rompería la regla híbrida de "sin texto/marca dentro de la
 * imagen"): se captura la página con Playwright de forma EXHAUSTIVA (2026-07-22, a petición del
 * usuario: "captura mucho más exhaustiva e intensiva, capturar absolutamente todos los detalles
 * para... máxima calidad") — 3 vistas a doble resolución (desktop above-the-fold, desktop página
 * completa con scroll forzado para disparar lazy-load, y mobile 390x844; ver capturePage()) — y
 * la propia OpenAI (chat completions con visión, modelo HERO_IMG_VISION_MODEL — por defecto
 * gpt-5.6-sol) describe SOLO el tratamiento fotográfico/estilo visual real que ve en las 3,
 * cubriendo imaginería, color/luz, composición, texturas, sujetos, mood e iconografía — nunca
 * transcribe texto ni logos. Esa descripción (texto, no las imágenes en sí) es el prompt que
 * luego se le pasa a la propia API de imágenes de OpenAI en vez de un "Theme" genérico — todo el
 * flujo corre con la misma OPENAI_API_KEY, sin depender de ningún otro proveedor (2026-07-22: se
 * había probado primero con Claude/Anthropic para esta descripción, pero el usuario pidió quitar
 * esa dependencia y que sea la propia GPT la que genere tanto el prompt como la imagen). Si no
 * hay terminal interactiva o la captura falla, el script avisa y cae de vuelta al prompt genérico de
 * siempre — nunca bloquea la generación por esto. Desactivable del todo con
 * HERO_IMG_SOURCE_PAGE=false (ver .env.example).
 *
 * Salida:
 *   brands/{brand}/design-input/hero-banner.png            (el arte, ya reescalado a 600px)
 *   brands/{brand}/design-input/hero-banner-original.png   (el arte tal cual lo devolvió la API, sin reescalar — por si se quiere reescalar distinto luego)
 *   brands/{brand}/design-input/hero-banner-prompt.txt     (el prompt usado, para trazabilidad)
 *   brands/{brand}/design-input/hero-source-page-desktop-viewport.png  (si se usó anclaje real: above-the-fold)
 *   brands/{brand}/design-input/hero-source-page-desktop-full.png      (página completa, fullPage)
 *   brands/{brand}/design-input/hero-source-page-mobile.png            (viewport móvil 390x844)
 *   brands/{brand}/design-input/hero-source-page-url.txt               (URL capturada, trazabilidad)
 *
 * La imagen NO entra sola en ninguna campaña: hay que subirla al CDN
 * (feebbodigital.com/creativities-library/{brand}/... — mismo flujo que los iconos de PyC) y
 * poner esa URL https en campaign-data.json → modules[0].data.bannerSrc. El Gate 5 de
 * production-gate-motor verificará el HTTP 200.
 */
import * as fs from 'fs';
import * as path from 'path';
import { execFile } from 'child_process';
import * as readline from 'readline/promises';
import sharp from 'sharp';
import { loadEnv } from './lib/env';
import { sanitizeLandingPrompt } from './lib/sanitize-hero-prompt';

const ROOT = path.resolve(import.meta.dirname, '..');
loadEnv(ROOT);

// Fix (auditoría enterprise 2026-07-28): las dos llamadas a la API de OpenAI de este script
// (descripción de estilo visual y generación de imagen) no tenían AbortController/timeout —
// si la API se quedaba colgada, el script colgaba indefinidamente sin salida. Contrasta con
// gate5Assets de production-gate-motor.ts, que sí usaba timeout de 8s desde el principio.
async function fetchWithTimeout(url: string, init: RequestInit, timeoutMs: number): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

const API_KEY = process.env.OPENAI_API_KEY;
const MODEL = process.env.HERO_IMG_MODEL || 'gpt-image-1';
const SIZE = process.env.HERO_IMG_SIZE || '1536x1024';
const QUALITY = process.env.HERO_IMG_QUALITY || 'medium'; // low | medium | high | auto
const TARGET_WIDTH = process.env.HERO_IMG_TARGET_WIDTH ? Number(process.env.HERO_IMG_TARGET_WIDTH) : undefined;
// Ver local automática (2026-07-22, a petición del usuario: "quiero que se visualicen
// directamente las imágenes de gpt, en local"). Activada por defecto — abre el/los PNG
// generados con `open` (macOS) al terminar, sin pasos extra. Desactivable con
// HERO_IMG_AUTO_OPEN=false (útil en CI/sandbox sin GUI, donde `open` no existe o no sirve de
// nada). Falla en silencio si `open` no está disponible — nunca rompe la generación en sí.
const AUTO_OPEN = process.env.HERO_IMG_AUTO_OPEN !== 'false';
// Anclaje a página real — ver nota arriba. Activado por defecto; false lo desactiva del todo
// (siempre prompt genérico), útil si se automatiza este script sin terminal interactiva.
const SOURCE_PAGE_ENABLED = process.env.HERO_IMG_SOURCE_PAGE !== 'false';
// Modelo de visión de OpenAI para describir la página capturada (chat completions, no el
// endpoint de imágenes). gpt-5.6-sol (2026-07-22, verificado en developers.openai.com/api/docs/
// models/gpt-5.6-sol antes de fijarlo — no asumido de memoria: es el modelo insignia de la
// familia GPT-5.6, GA 2026-07-09, entrada text+image / salida text, disponible en
// v1/chat/completions). Configurable porque OpenAI renombra/retira modelos con frecuencia; si
// la API rechaza el nombre por defecto, sobreescribe con HERO_IMG_VISION_MODEL en .env.
const VISION_MODEL = process.env.HERO_IMG_VISION_MODEL || 'gpt-5.6-sol';

function openLocally(...files: string[]): void {
  if (!AUTO_OPEN) return;
  if (process.platform !== 'darwin') {
    console.log('ℹ️  HERO_IMG_AUTO_OPEN activo pero esto no es macOS — omitido (usa tu visor de imágenes manualmente).');
    return;
  }
  execFile('open', files, (err) => {
    if (err) console.log(`ℹ️  No se pudo abrir automáticamente (${err.message}) — ábrelo tú manualmente.`);
  });
}

const GPT_IMAGE_1_SIZES = new Set(['1024x1024', '1536x1024', '1024x1536', 'auto']);

function arg(name: string): string | undefined {
  const i = process.argv.indexOf('--' + name);
  return i >= 0 && !String(process.argv[i + 1] || '').startsWith('--') ? process.argv[i + 1] : undefined;
}

/** Flags booleanos sin valor (ej. --save-website), a diferencia de arg() que espera un valor. */
function hasFlag(name: string): boolean {
  return process.argv.includes('--' + name);
}

/**
 * Valida `size` contra las reglas del modelo activo. Devuelve un mensaje de error, o null si
 * es válido. No inventa reglas: gpt-image-1 usa el enum fijo documentado por OpenAI; gpt-image-2
 * usa las 4 restricciones (múltiplos de 16, lado máx 3840, ratio ≤3:1, píxeles en rango) —
 * verificadas por búsqueda web el 2026-07-22 antes de implementar esto, no asumidas de memoria.
 */
function validateSize(model: string, size: string): string | null {
  if (size === 'auto') return null;
  const m = size.match(/^(\d+)x(\d+)$/);
  if (!m) return `"${size}" no tiene forma "ANCHOxALTO" ni es "auto".`;
  const w = Number(m[1]);
  const h = Number(m[2]);

  if (model === 'gpt-image-1') {
    if (!GPT_IMAGE_1_SIZES.has(size)) {
      return `gpt-image-1 solo acepta ${[...GPT_IMAGE_1_SIZES].join(', ')} — "${size}" no es válido.`;
    }
    return null;
  }

  if (model === 'gpt-image-2') {
    if (w % 16 !== 0 || h % 16 !== 0) {
      return `gpt-image-2 exige que ambos lados sean múltiplos de 16px — ${w}x${h} no lo es (${w}/16=${w / 16}, ${h}/16=${h / 16}).`;
    }
    const maxEdge = Math.max(w, h);
    if (maxEdge > 3840) return `gpt-image-2: el lado máximo no puede superar 3840px (pedido: ${maxEdge}px).`;
    const ratio = Math.max(w, h) / Math.min(w, h);
    if (ratio > 3) return `gpt-image-2: la relación lado largo:lado corto no puede superar 3:1 (pedido: ${ratio.toFixed(2)}:1).`;
    const pixels = w * h;
    if (pixels < 655360 || pixels > 8294400) {
      return `gpt-image-2: el total de píxeles debe estar entre 655.360 y 8.294.400 (pedido: ${pixels}).`;
    }
    return null;
  }

  // Modelo desconocido para este script (posterior a esta escritura) — no bloqueamos, solo avisamos.
  return null;
}

/** Busca el primer cta.href dentro de modules[] de un campaign-data.json — usado solo para
 *  sugerir la URL de landing cuando se pasa --campaign, nunca la impone. */
function findFirstCtaHref(campaignDataPath: string): string | null {
  try {
    const data = JSON.parse(fs.readFileSync(campaignDataPath, 'utf8'));
    for (const mod of data.modules || []) {
      if (mod?.data?.cta?.href) return mod.data.cta.href as string;
    }
  } catch { /* si no se puede leer, simplemente no hay sugerencia */ }
  return null;
}

/**
 * Determina qué página usar como referencia. Dos caminos:
 *   1) No interactivo (2026-07-22, para que Hermes/un agente pueda invocar este script como
 *      parte de su propio flujo, sin depender de que haya un humano respondiendo en terminal):
 *      si se pasa `--source landing|general|skip`, se usa directamente sin preguntar nada.
 *      `--url {url}` da la URL; en modo landing, si no se pasa --url se intenta sugerir el
 *      cta.href de --campaign. En modo general, si no se pasa --url se usa `pack.website` si
 *      existe; `--save-website` persiste la URL usada en el brand pack (nunca se guarda sin que
 *      se pida explícitamente — evita mutar el brand pack por sorpresa en un run automatizado).
 *   2) Interactivo (comportamiento original, sin --source): pregunta por terminal. Devuelve null
 *      si el usuario elige omitir, si no hay terminal interactiva, o si HERO_IMG_SOURCE_PAGE=false
 *      — en todos esos casos main() cae de vuelta al prompt genérico.
 */
async function promptSourcePage(
  brand: string,
  pack: any,
  packPath: string,
  campaignArg: string | undefined
): Promise<string | null> {
  if (!SOURCE_PAGE_ENABLED) return null;

  const sourceFlag = arg('source'); // 'landing' | 'general' | 'skip' — modo no interactivo
  if (sourceFlag) {
    const mode = sourceFlag.toLowerCase();
    if (mode === 'skip') return null;
    if (mode !== 'landing' && mode !== 'general') {
      console.log(`⚠️  --source "${sourceFlag}" no reconocido (usa landing|general|skip) — se omite.`);
      return null;
    }
    const urlFlag = arg('url');
    if (mode === 'general') {
      const url = urlFlag || (pack.website as string | undefined);
      if (!url) { console.log('⚠️  --source general sin --url y sin website cacheada en el brand pack — se omite.'); return null; }
      if (urlFlag && hasFlag('save-website') && pack.website !== url) {
        pack.website = url;
        fs.writeFileSync(packPath, JSON.stringify(pack, null, 2) + '\n');
        console.log(`✅ Guardado brand-tokens.json → website = "${url}"`);
      }
      return url;
    }
    // mode === 'landing'
    const url = urlFlag || (campaignArg ? findFirstCtaHref(path.join(ROOT, campaignArg, '06-data', 'campaign-data.json')) : null);
    if (!url) { console.log('⚠️  --source landing sin --url y sin cta.href sugerible desde --campaign — se omite.'); return null; }
    return url;
  }

  if (!process.stdin.isTTY) {
    console.log('ℹ️  Sin terminal interactiva y sin --source — se omite la pregunta de página real (prompt genérico).');
    return null;
  }

  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  try {
    console.log('\n¿En qué página basamos el arte del header? (varía por campaña, no hay valor por defecto)');
    console.log('  1) Landing específica de esta campaña');
    console.log('  2) Web general de la marca');
    console.log('  3) Omitir — prompt genérico (solo colores/tono de marca)');
    const choice = (await rl.question('Elige 1/2/3 [1]: ')).trim() || '1';

    if (choice === '3') return null;

    if (choice === '2') {
      const cached = pack.website as string | undefined;
      const answer = (await rl.question(`URL de la web general de la marca${cached ? ` [${cached}]` : ''}: `)).trim();
      const url = answer || cached;
      if (!url) { console.log('⚠️  Sin URL — se omite el anclaje a página real.'); return null; }
      if (!cached || cached !== url) {
        const save = (await rl.question('¿Guardar esta URL en el brand pack para no volver a preguntarla? (s/N): ')).trim().toLowerCase();
        if (save === 's' || save === 'si' || save === 'sí') {
          pack.website = url;
          fs.writeFileSync(packPath, JSON.stringify(pack, null, 2) + '\n');
          console.log(`✅ Guardado brand-tokens.json → website = "${url}"`);
        }
      }
      return url;
    }

    // choice === '1' (o cualquier otra entrada) → landing específica
    const suggested = campaignArg ? findFirstCtaHref(path.join(ROOT, campaignArg, '06-data', 'campaign-data.json')) : null;
    const answer = (await rl.question(`URL de la landing de esta campaña${suggested ? ` [${suggested}]` : ''}: `)).trim();
    const url = answer || suggested;
    if (!url) { console.log('⚠️  Sin URL — se omite el anclaje a página real.'); return null; }
    return url;
  } finally {
    rl.close();
  }
}

/**
 * Captura la página con Playwright de forma exhaustiva (2026-07-22, a petición del usuario:
 * "captura mucho más exhaustiva e intensiva, capturar absolutamente todos los detalles").
 * Antes: una sola captura de viewport 1280x900. Ahora, 3 capturas distintas a doble resolución
 * (deviceScaleFactor: 2, para que el detalle fino — texturas, gradientes, iconografía — no se
 * pierda antes de describirlo):
 *   1) Desktop, above the fold (1280x900) — lo que se ve sin hacer scroll.
 *   2) Desktop, página completa (fullPage) — todas las secciones, no solo el primer pantallazo.
 *   3) Mobile (390x844) — el tratamiento responsive puede diferir bastante del desktop.
 * Antes de capturar espera networkidle Y un margen extra (esperar por si hay animaciones/lazy
 * loading que no cuentan como "red inactiva"), y hace scroll hasta el final y de vuelta arriba
 * para disparar imágenes con lazy-load antes de la captura fullPage.
 * Devuelve null (y avisa) si algo falla — nunca bloquea la generación por esto.
 */
async function capturePage(url: string, outDir: string): Promise<Buffer[] | null> {
  try {
    const { chromium } = await import('playwright');
    const browser = await chromium.launch();
    fs.mkdirSync(outDir, { recursive: true });
    fs.writeFileSync(path.join(outDir, 'hero-source-page-url.txt'), url + '\n');

    const shots: Buffer[] = [];

    // 1) y 2) Desktop — misma página, mismo contexto (evita cargarla dos veces).
    const desktopCtx = await browser.newContext({ viewport: { width: 1280, height: 900 }, deviceScaleFactor: 2 });
    const desktopPage = await desktopCtx.newPage();
    await desktopPage.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
    await desktopPage.waitForTimeout(1500); // margen para animaciones/lazy-load post networkidle

    const viewportBuf = await desktopPage.screenshot({ fullPage: false });
    shots.push(viewportBuf);
    fs.writeFileSync(path.join(outDir, 'hero-source-page-desktop-viewport.png'), viewportBuf);

    // Scroll completo (dispara lazy-load) y vuelta arriba antes de la captura fullPage.
    await desktopPage.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await desktopPage.waitForTimeout(800);
    await desktopPage.evaluate(() => window.scrollTo(0, 0));
    await desktopPage.waitForTimeout(300);

    const fullPageBuf = await desktopPage.screenshot({ fullPage: true });
    shots.push(fullPageBuf);
    fs.writeFileSync(path.join(outDir, 'hero-source-page-desktop-full.png'), fullPageBuf);
    await desktopCtx.close();

    // 3) Mobile — mismo patrón de espera, contexto aparte (viewport distinto).
    const mobileCtx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
    const mobilePage = await mobileCtx.newPage();
    await mobilePage.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
    await mobilePage.waitForTimeout(1500);
    const mobileBuf = await mobilePage.screenshot({ fullPage: false });
    shots.push(mobileBuf);
    fs.writeFileSync(path.join(outDir, 'hero-source-page-mobile.png'), mobileBuf);
    await mobileCtx.close();

    await browser.close();
    console.log(`✅ Captura exhaustiva: ${shots.length} vistas (desktop viewport + fullpage, mobile), a doble resolución.`);
    return shots;
  } catch (err) {
    console.log(`⚠️  No se pudo capturar ${url} (${(err as Error).message}) — se omite el anclaje a página real.`);
    return null;
  }
}

/**
 * Reduce una captura a un tamaño razonable para mandarla a la API de visión — SOLO para esa
 * llamada; los PNG originales a doble resolución se quedan intactos en disco (ver capturePage).
 * Hallazgo real (2026-07-24, campaña BMW): una captura fullPage a deviceScaleFactor:2 de una
 * página larga puede pesar >18 MB; 3 capturas así en una sola petición de chat completions
 * suman ~27 MB en base64 — muy por encima de lo razonable para una API, la llamada fallaba (o
 * quedaba tan cerca del límite que era frágil) y el script caía en silencio al prompt genérico
 * sin que quedara claro por qué. 1568px de ancho es el tamaño que documenta OpenAI como el techo
 * útil para el análisis en alta resolución de sus modelos de visión — pasar de ahí no aporta
 * más detalle a la descripción, solo bytes.
 */
async function shrinkForVision(buf: Buffer): Promise<Buffer> {
  return sharp(buf).resize({ width: 1568, withoutEnlargement: true }).jpeg({ quality: 82 }).toBuffer();
}

/**
 * Pide a la propia OpenAI (chat completions con visión, HERO_IMG_VISION_MODEL) que describa
 * SOLO el tratamiento fotográfico/estilo visual real que ve en las capturas — explícitamente
 * NUNCA transcribe texto ni describe logos/marca, porque esa descripción se va a inyectar tal
 * cual en el prompt de generación de imágenes y no debe colar texto/marca real dentro del arte
 * (rompería la regla híbrida). Todo el flujo corre con OPENAI_API_KEY, sin ningún otro
 * proveedor. Devuelve null si algo falla — nunca bloquea la generación por esto.
 *
 * Acepta varias capturas (desktop above-the-fold, desktop página completa, mobile — ver
 * capturePage) para una descripción mucho más exhaustiva (2026-07-22, a petición del usuario:
 * "capturar absolutamente todos los detalles para... máxima calidad"), en vez de una sola vista.
 * Cada una se comprime con `shrinkForVision()` antes de mandarla (ver esa función) — los
 * archivos guardados en disco siguen siendo los originales a doble resolución.
 */
async function describeVisualStyle(screenshots: Buffer[]): Promise<string | null> {
  try {
    const originalTotalMB = screenshots.reduce((sum, s) => sum + s.length, 0) / 1024 / 1024;
    const shrunk = await Promise.all(screenshots.map(shrinkForVision));
    const shrunkTotalMB = shrunk.reduce((sum, s) => sum + s.length, 0) / 1024 / 1024;
    console.log(
      `   Comprimiendo ${screenshots.length} captura(s) para la API de visión: ` +
      `${originalTotalMB.toFixed(1)} MB → ${shrunkTotalMB.toFixed(1)} MB (solo para esta llamada; ` +
      `los PNG originales en disco no se tocan).`
    );

    const instruction =
      `You are looking at ${screenshots.length} screenshots of the SAME real webpage: desktop ` +
      'above-the-fold, the full scrolled desktop page, and the mobile layout (in that order). ' +
      'Describe EXHAUSTIVELY and in detail the real photographic/visual style shown ACROSS all ' +
      'of them, covering every one of these aspects: (1) type of imagery — photography vs ' +
      'illustration vs abstract vs iconographic; (2) color palette and light treatment — hues, ' +
      'contrast, gradients, saturation; (3) composition and layout patterns — density, negative ' +
      'space, alignment, how sections are weighted; (4) textures and materials if any — flat, ' +
      'glossy, soft, grainy, gradient meshes, etc.; (5) subject matter if any — people, objects, ' +
      'landscapes, abstract shapes, and how they are framed/cropped; (6) overall mood/atmosphere ' +
      '— energetic, calm, corporate, playful, premium, etc.; (7) any recurring iconographic style ' +
      '(shapes, line weight, fill vs outline) if visible. Do NOT transcribe any visible text on ' +
      'the pages. Do NOT describe the logo or mention the brand name. Write a thorough, detailed ' +
      'description of 8-14 sentences, ready to be used as a rich style reference inside an ' +
      'image-generation prompt (a style description, not an instruction).';

    const res = await fetchWithTimeout('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: VISION_MODEL,
        max_completion_tokens: 1600,
        // gpt-5.6-sol es un modelo de razonamiento — sin esto puede gastar el budget de tokens
        // "pensando" antes de escribir la respuesta y devolver contenido vacío. La tarea es
        // directa (describir varias capturas), no necesita razonamiento profundo.
        reasoning_effort: 'low',
        messages: [{
          role: 'user',
          content: [
            { type: 'text', text: instruction },
            ...shrunk.map((s) => ({
              type: 'image_url' as const,
              image_url: { url: `data:image/jpeg;base64,${s.toString('base64')}` },
            })),
          ],
        }],
      }),
    }, 60_000);
    if (!res.ok) {
      const bodyText = await res.text();
      console.log(
        `⚠️  OpenAI (${VISION_MODEL}) ${res.status} al describir la página — se omite (prompt genérico). ` +
        `Si el modelo no existe o fue retirado, prueba con HERO_IMG_VISION_MODEL en .env. Detalle: ${bodyText.slice(0, 300)}`
      );
      return null;
    }
    const data: any = await res.json();
    const text = data?.choices?.[0]?.message?.content?.trim();
    if (!text) {
      console.log(
        `⚠️  OpenAI (${VISION_MODEL}) devolvió una respuesta vacía al describir la página ` +
        `(posible finish_reason: ${data?.choices?.[0]?.finish_reason || 'desconocido'}) — se omite (prompt genérico).`
      );
      return null;
    }
    return text;
  } catch (err) {
    console.log(`⚠️  No se pudo describir la página (${(err as Error).message}) — se omite (prompt genérico).`);
    return null;
  }
}

// sanitizeLandingPrompt() se extrajo a ./lib/sanitize-hero-prompt.ts (auditoría 2026-09-23,
// BUG-H08) para que studio/server/heroImage.ts pueda usar el mismo saneado — antes solo vivía
// aquí, así que el flujo de Studio quedaba sin la mitigación del incidente BMW (2026-07-27).

async function main(): Promise<void> {
  const brand = arg('brand');
  const theme = arg('theme') || 'la propuesta de valor principal de la marca';
  const campaignArg = arg('campaign'); // opcional: sugiere el cta.href como landing por defecto
  if (!brand) { console.error('Uso: --brand {slug} [--theme "tema de la campaña"] [--campaign {ruta}]'); process.exit(1); }

  if (!API_KEY) {
    console.error(
      '❌ Falta OPENAI_API_KEY en .env (raíz del proyecto). Copia .env.example a .env y pon tu ' +
      'clave — console.openai.com > API Keys. La cuenta necesita facturación activa para generar ' +
      `imágenes con ${MODEL} (no tiene nivel gratuito), y la organización debe estar verificada ` +
      '(platform.openai.com/settings/organization/general) para modelos gpt-image-*.'
    );
    process.exit(1);
  }

  const sizeError = validateSize(MODEL, SIZE);
  if (sizeError) {
    console.error(`❌ HERO_IMG_SIZE inválido para ${MODEL}: ${sizeError}`);
    process.exit(1);
  }
  if (TARGET_WIDTH !== undefined && (!Number.isFinite(TARGET_WIDTH) || TARGET_WIDTH <= 0)) {
    console.error(`❌ HERO_IMG_TARGET_WIDTH inválido: "${process.env.HERO_IMG_TARGET_WIDTH}".`);
    process.exit(1);
  }

  const packPath = path.join(ROOT, 'brands', brand, 'tokens', 'brand-tokens.json');
  if (!fs.existsSync(packPath)) { console.error(`❌ No existe ${packPath}`); process.exit(1); }
  const pack = JSON.parse(fs.readFileSync(packPath, 'utf8'));
  const colors = pack.colors || {};
  const voice = (pack.voice && pack.voice.tone) || 'clara y cercana';
  const outDir = path.join(ROOT, 'brands', brand, 'design-input');

  // Anclaje a página real (opcional) — ver nota de cabecera. Nunca bloquea: cualquier fallo cae
  // de vuelta al prompt genérico de siempre.
  let visualDescription: string | null = null;
  const sourceUrl = await promptSourcePage(brand, pack, packPath, campaignArg);
  if (sourceUrl) {
    console.log(`Capturando ${sourceUrl}...`);
    const screenshot = await capturePage(sourceUrl, outDir);
    if (screenshot) {
      console.log(`Describiendo estilo visual real con OpenAI (${VISION_MODEL})...`);
      visualDescription = await describeVisualStyle(screenshot);
      if (visualDescription) {
        console.log(`✅ Anclado a página real: "${visualDescription.slice(0, 100)}..."`);
        fs.writeFileSync(path.join(outDir, 'hero-banner-visual-description.txt'), visualDescription + '\n');
      }
    }
  }

  // Estilo del arte: FOTOGRAFÍA real vs ilustración plana (2026-07-25 — ver engine/CHANGELOG.md,
  // "El prompt de generate-hero-image ignoraba photography.usesRealPhotography"). Hasta esta
  // fecha el prompt forzaba "Flat modern editorial illustration" para TODAS las marcas, sin
  // condición — ignorando por completo photography.usesRealPhotography/photography.treatment,
  // el mismo campo que el agente 02 investiga a fondo (con Chrome real) para cada marca. Una
  // marca declarada explícitamente como fotografía-primero (Worn Wear, Nike, BMW...) nunca podía
  // recibir una foto real: el prompt se lo impedía. Ahora se lee el pack.
  const photography = pack.photography || {};
  const usesRealPhotography = photography.usesRealPhotography === true;
  const styleInstruction = usesRealPhotography
    ? `Real photography — NOT an illustration, NOT a flat graphic or vector treatment, NOT a ` +
      `screen-print/riso poster look. Shot as an actual photograph: real camera lens ` +
      `characteristics, real lighting and shadow falloff, real depth of field, photographic ` +
      `grain/texture, natural full-range color grounded in the brand palette (not flattened into ` +
      `a limited poster palette).` +
      (photography.treatment ? ` Specific treatment for this brand: ${photography.treatment}` : '')
    : `Flat modern editorial illustration, generous negative space, composition weighted to the ` +
      `right side so the left half stays calm.`;

  // Prompt construido desde el brand pack — el arte debe ser SIN TEXTO (regla del híbrido).
  // Si hay anclaje a página real, la descripción visual se sanitiza para no activar safety.
  let finalVisualRef = '';
  let sourceMode = 'generic';
  if (visualDescription) {
    sourceMode = sourceUrl ? 'landing' : 'general';
    const sanitized = sanitizeLandingPrompt(visualDescription, pack.brand || brand);
    fs.writeFileSync(path.join(outDir, 'hero-banner-visual-description-sanitized.txt'), sanitized + '\n');
    finalVisualRef =
      `Art direction reference: ${sanitized} `;
  }

  const prompt =
    `Wide premium email header artwork for a ${pack.brand || brand} campaign. ` +
    finalVisualRef +
    `Theme: ${theme}. Brand palette ONLY: primary ${colors.primary}, accent ${colors.ctaBackground}` +
    (colors.onBrandSecondary ? `, soft ${colors.onBrandSecondary}` : '') +
    `. ${styleInstruction} (HTML text will be overlaid separately — the image itself must contain ` +
    `ABSOLUTELY NO text, no letters, no numbers, no logos, no watermarks). ` +
    `Tone: ${voice}. ${usesRealPhotography ? 'Photographic composition' : 'Clean shapes'}, ` +
    `suitable as a decorative banner in an email.`;

  // Guardar el prompt ANTES de llamar a la API (trazabilidad incluso si falla)
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, 'hero-banner-prompt-attempt.txt'), prompt + '\n');

  console.log(`\nLlamando a la API de imágenes de OpenAI (modelo ${MODEL}, ${SIZE}, calidad ${QUALITY})...`);

  let res: Response;
  try {
    // Timeout generoso (120s): generación de imagen es más lenta que la descripción de estilo,
    // pero sin ningún límite el script podía colgarse indefinidamente si la API no respondía.
    res = await fetchWithTimeout('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: MODEL,
        prompt,
        size: SIZE,
        quality: QUALITY,
        n: 1,
      }),
    }, 120_000);
  } catch (err) {
    const isAbort = (err as Error).name === 'AbortError';
    console.error(
      isAbort
        ? '❌ La API de imágenes de OpenAI no respondió en 120s — se abortó la petición.'
        : `❌ No se pudo conectar con api.openai.com: ${(err as Error).message}`
    );
    process.exit(1);
  }

  if (!res.ok) {
    const bodyText = await res.text();
    let message = bodyText;
    let parsedError: any = null;
    try {
      parsedError = JSON.parse(bodyText);
      message = parsedError?.error?.message || bodyText;
    } catch { /* no era JSON, se deja el texto crudo */ }

    // Guardar error JSON para trazabilidad (hero-banner-error.json)
    const xRequestId = res.headers.get('x-request-id') || '';
    const errorDump: Record<string, any> = {
      timestamp: new Date().toISOString(),
      httpStatus: res.status,
      httpStatusText: res.statusText,
      model: MODEL,
      size: SIZE,
      quality: QUALITY,
      sourceMode: sourceMode,
      xRequestId: xRequestId,
      openaiOrganization: res.headers.get('openai-organization') || '',
      openaiProject: res.headers.get('openai-project') || '',
    };
    if (parsedError?.error) {
      errorDump.errorType = parsedError.error.type || '';
      errorDump.errorCode = parsedError.error.code || '';
      errorDump.errorMessage = parsedError.error.message || '';
      errorDump.errorParam = parsedError.error.param || null;
    } else {
      errorDump.rawBody = bodyText.slice(0, 1000);
    }
    fs.writeFileSync(path.join(outDir, 'hero-banner-error.json'), JSON.stringify(errorDump, null, 2) + '\n');

    if (res.status === 400 && /billing|quota|insufficient/i.test(message)) {
      console.error(
        `❌ OpenAI rechazó la petición por facturación/cuota (HTTP ${res.status}): ${message}\n` +
        '   Revisa platform.openai.com/settings/organization/billing.'
      );
    } else if (res.status === 401) {
      console.error(`❌ OpenAI rechazó la clave (HTTP 401): ${message}\n   Revisa OPENAI_API_KEY en .env.`);
    } else if (res.status === 403 || /organization.*verif|verify.*organization/i.test(message)) {
      console.error(
        `❌ OpenAI bloqueó la petición por falta de verificación de organización (HTTP ${res.status}): ${message}\n` +
        `   Los modelos gpt-image-* requieren "API Organization Verification" — resuélvelo en ` +
        'platform.openai.com/settings/organization/general antes de reintentar.'
      );
    } else {
      console.error(`❌ API OpenAI ${res.status}: ${message}`);
    }
    process.exit(1);
  }

  const json = await res.json() as { data?: Array<{ b64_json?: string }> };
  const b64 = json?.data?.[0]?.b64_json;
  if (!b64) {
    console.error('❌ Respuesta de OpenAI sin imagen (b64_json ausente). Respuesta cruda:', JSON.stringify(json).slice(0, 500));
    process.exit(1);
  }

  const buf = Buffer.from(b64, 'base64');
  if (buf.length < 1000) {
    console.error('❌ Imagen decodificada demasiado pequeña para ser válida — reintenta.');
    process.exit(1);
  }

  fs.mkdirSync(outDir, { recursive: true });

  const originalFile = path.join(outDir, 'hero-banner-original.png');
  fs.writeFileSync(originalFile, buf);

  let finalBuf = buf;
  let finalNote = '';
  if (TARGET_WIDTH !== undefined) {
    finalBuf = await sharp(buf).resize({ width: TARGET_WIDTH }).png().toBuffer();
    finalNote = ` (reescalado desde el original a ${TARGET_WIDTH}px de ancho con sharp)`;
  }

  const outFile = path.join(outDir, 'hero-banner.png');
  fs.writeFileSync(outFile, finalBuf);
  fs.writeFileSync(path.join(outDir, 'hero-banner-prompt.txt'), prompt + '\n');

  console.log(`\n✅ Arte generado${finalNote}: brands/${brand}/design-input/hero-banner.png (${(finalBuf.length / 1024).toFixed(0)} KB)`);
  if (TARGET_WIDTH !== undefined) {
    console.log(`   Original sin reescalar: brands/${brand}/design-input/hero-banner-original.png (${(buf.length / 1024).toFixed(0)} KB)`);
  }
  if (sourceUrl) {
    console.log(`   Anclado a: ${sourceUrl}${visualDescription ? '' : ' (captura guardada, pero sin descripción visual — ver aviso arriba)'}`);
  }
  if (finalBuf.length > 300 * 1024) {
    console.log('⚠️  Pesa más de 300 KB — comprimir antes de subir al CDN (el email debe ser ligero).');
  }

  // Ver local automática — ver nota de HERO_IMG_AUTO_OPEN arriba.
  const filesToOpen = TARGET_WIDTH !== undefined ? [outFile, originalFile] : [outFile];
  openLocally(...filesToOpen);
  console.log(
    AUTO_OPEN && process.platform === 'darwin'
      ? '\n🖼️  Abriendo en Vista Previa...'
      : ''
  );

  console.log('\nSiguientes pasos:');
  console.log('  1. Revisar el arte (sin texto dentro, paleta de marca).');
  console.log(`  2. Subirlo al CDN: feebbodigital.com/creativities-library/${brand}/... (HTTP 200) — lo haces tú, luego pásame la URL.`);
  console.log('  3. En campaign-data.json: component "hero-imagen", data.bannerSrc = URL del CDN.\n');
}
main();
