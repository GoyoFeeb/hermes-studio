/**
 * renderChecks.ts — lo que se mide renderizando la newsletter en Chromium (y sus imágenes con sharp).
 *
 * Antes vivía dentro de hermes-worker.ts; desde el 2026-10-05 lo usan también `check-newsletter.ts` (la
 * comprobación que Hermes ejecuta él mismo antes de entregar) y los arreglos automáticos (autoFix.ts), así
 * que Hermes, el worker y Studio miden exactamente lo mismo.
 *
 * - Móvil: qué se sale de 375 px (Adidas, 2026-09-24).
 * - Espacios: texto pegado a una foto y laterales de móvil (Siroko, 2026-10-05).
 * - Inspectores del 2026-10-05 (auditoría de agentes): contraste del texto sobre su fondo, texto demasiado
 *   pequeño en móvil, estructura «imagen + texto» repetida sin ningún módulo propio (Siroko), colores grandes
 *   fuera de la paleta de la marca, fotos con mucho blanco alrededor (la zapatilla de Nike, 2026-09-28) y peso
 *   de las imágenes.
 * - Modo oscuro legible (2026-10-06): la pieza renderizada con prefers-color-scheme: dark, como la abre Apple Mail.
 *   La de Paredes declaraba el oscuro y pasaba el control, pero su @media pasaba el texto a claro sin oscurecer los
 *   fondos: texto blanco sobre blanco.
 * Sin JavaScript de la pieza: el HTML lo escribe un modelo que ha leído webs de terceros.
 */
import { createHash } from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import { chromium, type Browser } from 'playwright';
import sharp from 'sharp';
import { layoutFindings, LAYOUT_MIN_GAP } from './qualityCheck';

export const MOBILE_WIDTH = 375;
const DESKTOP_WIDTH = 700;

/** En el contenedor de pruebas el Chromium del sistema no coincide con la versión de Playwright: CHROMIUM_PATH. */
export function launchBrowser(): Promise<Browser> {
  return chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
}

/** Se ejecuta dentro de Chromium. Va como texto: tsx añade `__name(...)` a las funciones y eso no
 *  existe en la página ("ReferenceError: __name is not defined").
 *  Devuelve los elementos más internos que se salen (ninguno de sus hijos se sale): son la causa —
 *  p. ej. una <img width="600"> — y no las tablas que la contienen, que solo heredan el ancho. */
const MEASURE_OVERFLOW_JS = `function (limit) {
  function overflows(el) { var r = el.getBoundingClientRect(); return r.width > 0 && r.right > limit + 1; }
  var seen = {}, offenders = [], all = document.body.querySelectorAll('*');
  for (var i = 0; i < all.length && offenders.length < 6; i++) {
    var el = all[i];
    if (!overflows(el) || Array.prototype.some.call(el.children, overflows)) continue;
    var w = el.getAttribute('width'), cls = el.getAttribute('class');
    var text = el.tagName === 'IMG' ? (el.getAttribute('alt') || '') : (el.textContent || '').trim().replace(/\\s+/g, ' ').slice(0, 40);
    var desc = '<' + el.tagName.toLowerCase() + (w ? ' width="' + w + '"' : '') + (cls ? ' class="' + cls + '"' : '') + '> ' +
      Math.round(el.getBoundingClientRect().width) + ' px' + (text ? ' («' + text + '»)' : '');
    if (seen[desc]) continue;
    seen[desc] = true;
    offenders.push(desc);
  }
  return { docWidth: document.documentElement.scrollWidth, offenders: offenders };
}`;

/** Se ejecuta dentro de Chromium (como texto, ver MEASURE_OVERFLOW_JS).
 *  - `touching`: bloques de texto a menos de `gapMin` px de una foto de más de 60 px de alto, encima o debajo en
 *    la misma columna. El preheader oculto no cuenta.
 *  - `left`: margen izquierdo de cada bloque de texto con más de 20 caracteres.
 *  - `contrast`: textos con su color y el de su fondo (null si el fondo es una imagen: no se puede saber).
 *  - `fonts`: tamaño de letra de cada bloque de texto largo y su posición relativa en la página.
 *  - Estructura: fotos a todo el ancho, filas con dos columnas y bloques de texto sobre color.
 *  - `areas`: colores de fondo grandes y de los botones, para compararlos con la paleta de la marca.
 *  - `imgs`: ancho pintado de cada <img>, en orden (para poner el atributo width que pide Outlook). */
const MEASURE_LAYOUT_JS = `function (gapMin) {
  function vis(r) { return r.width > 0 && r.height > 0; }
  function ownText(el) {
    var t = '';
    for (var i = 0; i < el.childNodes.length; i++) if (el.childNodes[i].nodeType === 3) t += el.childNodes[i].textContent;
    return t.replace(/\\s+/g, ' ').trim();
  }
  function parse(c) {
    var m = (c || '').match(/rgba?\\(([^)]+)\\)/);
    if (!m) return null;
    var p = m[1].split(',').map(function (x) { return parseFloat(x); });
    return { r: p[0], g: p[1], b: p[2], a: p.length > 3 ? p[3] : 1 };
  }
  function hex(c) { return '#' + [c.r, c.g, c.b].map(function (v) { return ('0' + Math.round(v).toString(16)).slice(-2); }).join(''); }
  // Fondo efectivo: el primer antepasado con color opaco. Si antes aparece una imagen de fondo, no se sabe (null).
  function background(el) {
    for (var n = el; n && n.nodeType === 1; n = n.parentElement) {
      var cs = getComputedStyle(n);
      if (cs.backgroundImage && cs.backgroundImage !== 'none') return null;
      if (n.getAttribute('background')) return null;
      var c = parse(cs.backgroundColor);
      if (c && c.a > 0.5) return c;
      var attr = n.getAttribute('bgcolor');
      if (attr && /^#[0-9a-f]{6}$/i.test(attr)) return { r: parseInt(attr.substr(1, 2), 16), g: parseInt(attr.substr(3, 2), 16), b: parseInt(attr.substr(5, 2), 16), a: 1 };
    }
    return { r: 255, g: 255, b: 255, a: 1 };
  }
  var docH = Math.max(1, document.documentElement.scrollHeight);
  var imgs = [], imgWidths = [], imgTops = [], blocks = [];
  document.querySelectorAll('img').forEach(function (img) {
    var r = img.getBoundingClientRect();
    imgWidths.push(vis(r) ? Math.round(r.width) : 0);
    imgTops.push(Math.round(r.top + window.scrollY));
    if (vis(r) && r.height > 60) imgs.push(r);
  });
  document.body.querySelectorAll('h1,h2,h3,h4,h5,h6,p,li,td,div,a,span').forEach(function (el) {
    var text = ownText(el);
    if (text.length < 2) return;
    var cs = getComputedStyle(el);
    if (cs.display === 'none' || cs.visibility === 'hidden' || parseFloat(cs.maxHeight) === 0 || parseFloat(cs.opacity) === 0) return;
    var r = el.getBoundingClientRect();
    if (!vis(r) || r.height < 4) return;
    // Lo que se mide es la caja del texto, no la celda entera.
    var range = document.createRange(); range.selectNodeContents(el);
    var tr = range.getBoundingClientRect();
    blocks.push({ el: el, cs: cs, text: (el.textContent || '').replace(/\\s+/g, ' ').trim().slice(0, 50), r: vis(tr) ? tr : r, len: text.length });
  });
  var touching = [], seen = {};
  blocks.forEach(function (b) {
    if (b.el.tagName === 'SPAN') return;
    imgs.forEach(function (ir) {
      var overlap = Math.min(b.r.right, ir.right) - Math.max(b.r.left, ir.left);
      if (overlap < Math.min(40, b.r.width / 2)) return;
      var below = b.r.top - ir.bottom, above = ir.top - b.r.bottom;
      var gap = below >= -2 && below < gapMin ? below : above >= -2 && above < gapMin ? above : null;
      if (gap === null || seen[b.text]) return;
      seen[b.text] = true;
      touching.push({ text: b.text, gap: Math.max(0, gap) });
    });
  });
  var left = blocks.filter(function (b) { return b.len > 20 && b.el.tagName !== 'SPAN'; }).map(function (b) { return b.r.left; });
  var contrast = [], fonts = [], coloredText = false, seenC = {};
  blocks.forEach(function (b) {
    var fg = parse(b.cs.color), bg = background(b.el);
    var size = parseFloat(b.cs.fontSize), weight = parseInt(b.cs.fontWeight, 10) || 400;
    if (fg && bg && !seenC[b.text]) {
      seenC[b.text] = true;
      contrast.push({ text: b.text, fg: hex(fg), bg: hex(bg), size: size, bold: weight >= 700, at: (b.r.top + window.scrollY) / docH });
    }
    if (bg) {
      var lum = (0.299 * bg.r + 0.587 * bg.g + 0.114 * bg.b) / 255;
      var sat = Math.max(bg.r, bg.g, bg.b) - Math.min(bg.r, bg.g, bg.b);
      // Solo cuenta en el cuerpo: la banda de color del cierre (antes del pie) la lleva cualquier plantilla.
      if (b.len > 30 && (lum < 0.8 || sat > 40) && (b.r.top + window.scrollY) / docH < 0.8) coloredText = true;
    }
    if (b.len > 40) fonts.push({ text: b.text, size: size, at: (b.r.top + window.scrollY) / docH });
  });
  // Filas con dos o más columnas: bloques (texto largo o foto ancha) a la misma altura y uno al lado del otro.
  // Dos fotos una al lado de la otra siguen siendo una banda de fotos: al menos una columna tiene que llevar texto.
  var items = blocks.filter(function (b) { return b.len > 30; }).map(function (b) { return { r: b.r, text: true }; })
    .concat(imgs.filter(function (r) { return r.width > 120; }).map(function (r) { return { r: r, text: false }; }));
  var columns = 0;
  for (var i = 0; i < items.length; i++) for (var j = i + 1; j < items.length; j++) {
    if (!items[i].text && !items[j].text) continue;
    var a = items[i].r, c = items[j].r;
    // Ni la cabecera (logo y menú) ni el cierre y el pie (enlaces legales, redes) cuentan como módulo.
    if (a.top + window.scrollY < 200 || c.top + window.scrollY < 200 || (a.top + window.scrollY) / docH > 0.8) continue;
    var vOverlap = Math.min(a.bottom, c.bottom) - Math.max(a.top, c.top);
    var apart = a.right <= c.left + 2 || c.right <= a.left + 2;
    if (vOverlap > 20 && apart) columns++;
  }
  var widest = 0; imgs.forEach(function (r) { widest = Math.max(widest, r.width); });
  var content = 0; document.querySelectorAll('table').forEach(function (t) { var w = t.getBoundingClientRect().width; if (w <= 720) content = Math.max(content, w); });
  content = content || widest;
  var fullImgs = imgs.filter(function (r) { return r.width >= content * 0.8; }).length;
  // Colores: fondos que ocupan mucho y botones (enlaces con fondo de color).
  var areas = [];
  document.body.querySelectorAll('table,td,div,a').forEach(function (el) {
    var cs = getComputedStyle(el), c = parse(cs.backgroundColor);
    if (!c || c.a < 0.5) return;
    var r = el.getBoundingClientRect(), area = r.width * r.height;
    var button = el.tagName === 'A' || (el.tagName === 'TD' && el.querySelector('a') && r.height < 80 && r.width < 400);
    if (area > 15000 || button) areas.push({ hex: hex(c), area: Math.round(area), button: !!button });
  });
  return { touching: touching, left: left, contrast: contrast, fonts: fonts, columns: columns, coloredText: coloredText,
    fullImgs: fullImgs, areas: areas, imgWidths: imgWidths, imgTops: imgTops };
}`;

interface PageMetrics {
  touching: { text: string; gap: number }[];
  left: number[];
  contrast: { text: string; fg: string; bg: string; size: number; bold: boolean; at: number }[];
  fonts: { text: string; size: number; at: number }[];
  columns: number;
  coloredText: boolean;
  fullImgs: number;
  areas: { hex: string; area: number; button: boolean }[];
  imgWidths: number[];
  imgTops: number[];
}

/** Errores (se devuelven a Hermes) y avisos (solo se enseñan) de los inspectores. */
export interface Findings {
  errors: string[];
  warnings: string[];
}

export interface RenderReport {
  /** null = cabe a 375 px. */
  mobile: string | null;
  layout: string[];
  design: Findings;
  images: Findings;
  /** Ancho pintado a 700 px de cada <img>, en orden (0 si no se ve). */
  imgWidths: number[];
  /** Contraste en modo oscuro; null si la pieza no tiene estilos oscuros (eso ya lo marca el check «Modo oscuro»). */
  dark: Findings | null;
  /** Imagen principal y variedad de fotos (photoFindings). */
  photos: { hero: Findings; variety: Findings };
  /** Lienzo distinguible del fondo exterior y franjas sueltas, medidos por píxeles en claro y oscuro (frameFindings). */
  frame: { canvas: Findings; strips: Findings };
}

// --- Lienzo y franjas (2026-10-06) ---------------------------------------------------------------------
// Inglesina: el fondo exterior y las secciones claras eran #f4f4f5 (en oscuro, #263743 los dos) y la pieza no tenía
// bordes; entre bloques quedaban franjas de 12-24 px de otro color (en oscuro, una celda blanca sin versión oscura).
// Se mide la pieza renderizada a 900 px, por píxeles: lo que se ve, sin interpretar el CSS.

const FRAME_WIDTH = 900;
/** Un tramo seguido de al menos este alto con el borde del lienzo igual al exterior = una sección que se funde con la
 *  página (medir la parte del alto total lo diluía: en Inglesina, 26 % con dos secciones enteras fundidas). */
export const CANVAS_BLEND_RUN = 100;
export const STRIP_MIN = 4;
export const STRIP_MAX = 28;

export interface FrameMetrics {
  /** Tramos (y, alto) en los que el borde del lienzo tiene el color del exterior; null si no hay exterior visible. */
  blend: { y: number; h: number }[] | null;
  outer: string | null;
  strips: { y: number; h: number; color: string }[];
}

type Px = [number, number, number];
const dist = (a: Px, b: Px): number => Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]) + Math.abs(a[2] - b[2]);
const hexOf = (c: Px): string => '#' + c.map((v) => v.toString(16).padStart(2, '0')).join('');

/** Mide una captura: `px(x, y)` da el color; `box` es el lienzo de 600 px en la captura. Pura, para los tests. */
export function frameFromPixels(
  px: (x: number, y: number) => Px,
  box: { left: number; right: number; top: number; bottom: number },
  width: number,
  imgEdges: number[] = []
): FrameMetrics {
  const { left, right, top, bottom } = box;
  let blend: FrameMetrics['blend'] = null;
  let outer: Px | null = null;
  if (left >= 40 && right <= width - 40) {
    blend = [];
    let start = -1;
    for (let y = top; y <= bottom; y++) {
      const o = px(left - 30, Math.min(y, bottom - 1));
      outer = outer || o;
      const same = y < bottom && dist(o, px(left + 3, y)) < 14 && dist(px(right + 29, y), px(right - 4, y)) < 14;
      if (same && start < 0) start = y;
      if (!same && start >= 0) {
        if (y - start >= CANVAS_BLEND_RUN) blend.push({ y: start - top, h: y - start });
        start = -1;
      }
    }
  }
  // Bordes de las fotos (arriba y abajo), relativos al lienzo: una franja pegada a una foto también es franja.
  const edges = imgEdges.map((e) => e - top);
  const atImage = (y: number): boolean => edges.some((e) => Math.abs(e - y) <= 2);
  // Filas planas: todo el ancho del lienzo del mismo color.
  const flat: (Px | null)[] = [];
  for (let y = top; y < bottom; y++) {
    const first = px(left + 2, y);
    let ok = true;
    for (let x = left + 2; x < right - 2 && ok; x += 6) ok = dist(px(x, y), first) < 10;
    flat.push(ok ? first : null);
  }
  const strips: FrameMetrics['strips'] = [];
  let i = 0;
  while (i < flat.length) {
    const c = flat[i];
    if (!c) {
      i++;
      continue;
    }
    let j = i + 1;
    while (j < flat.length && flat[j] && dist(flat[j]!, c) < 10) j++;
    const h = j - i;
    const above = i > 0 ? flat[i - 1] : null;
    const below = j < flat.length ? flat[j] : null;
    // Franja: entre dos bloques planos de otro color (padding o fondo), o entre uno y el borde de una foto (Inglesina en
    // oscuro: celda blanca de 20 px sobre la foto); no al principio ni al final de la pieza.
    const diff = (n: Px | null): boolean => !!n && dist(n, c) >= 24;
    const between = (diff(above) && diff(below)) || (diff(above) && !below && atImage(j)) || (diff(below) && !above && atImage(i));
    if (h >= STRIP_MIN && h <= STRIP_MAX && i > 0 && j < flat.length && between) {
      strips.push({ y: i, h, color: hexOf(c) });
    }
    i = j;
  }
  return { blend, outer: outer ? hexOf(outer) : null, strips };
}

/** Captura a 900 px y mide el lienzo (el bloque de 560-640 px de ancho más alto). */
async function frameMetrics(browser: Browser, htmlPath: string, dark: boolean): Promise<FrameMetrics | null> {
  const page = await browser.newPage({ viewport: { width: FRAME_WIDTH, height: 900 }, colorScheme: dark ? 'dark' : 'light', javaScriptEnabled: false });
  try {
    await page.goto(`file://${htmlPath}`, { waitUntil: 'load', timeout: 30000 });
    const edges = (await page.evaluate(`(function () {
      var out = [];
      document.querySelectorAll('img').forEach(function (im) {
        var r = im.getBoundingClientRect();
        if (r.width >= 200 && r.height >= 60) { out.push(Math.round(r.top + window.scrollY)); out.push(Math.round(r.bottom + window.scrollY)); }
      });
      return out;
    })()`)) as number[];
    const box = (await page.evaluate(`(function () {
      var best = null;
      document.querySelectorAll('table, div, td').forEach(function (el) {
        var r = el.getBoundingClientRect();
        if (r.width >= 560 && r.width <= 640 && r.height > 200 && (!best || r.height > best.bottom - best.top)) {
          best = { left: Math.round(r.left + window.scrollX), right: Math.round(r.right + window.scrollX), top: Math.round(r.top + window.scrollY), bottom: Math.round(r.bottom + window.scrollY) };
        }
      });
      return best;
    })()`)) as { left: number; right: number; top: number; bottom: number } | null;
    if (!box) return null;
    const { data, info } = await sharp(await page.screenshot({ fullPage: true })).removeAlpha().raw().toBuffer({ resolveWithObject: true });
    const px = (x: number, y: number): Px => {
      const cx = Math.max(0, Math.min(info.width - 1, x));
      const cy = Math.max(0, Math.min(info.height - 1, y));
      const k = (cy * info.width + cx) * 3;
      return [data[k], data[k + 1], data[k + 2]];
    };
    return frameFromPixels(px, { ...box, bottom: Math.min(box.bottom, info.height) }, info.width, edges);
  } finally {
    await page.close();
  }
}

/** Lo medido en claro y en oscuro, en errores para Hermes. */
export function frameFindings(light: FrameMetrics | null, dark: FrameMetrics | null): { canvas: Findings; strips: Findings } {
  const canvas: Findings = { errors: [], warnings: [] };
  const strips: Findings = { errors: [], warnings: [] };
  for (const [m, mode] of [[light, 'claro'], [dark, 'oscuro']] as const) {
    if (!m) continue;
    if (m.blend && m.blend.length) {
      const where = m.blend.slice(0, 3).map((b) => `${b.h} px a ${b.y} px del inicio`).join(', ');
      canvas.errors.push(
        `En ${mode}, ${m.blend.length === 1 ? 'una sección se funde' : `${m.blend.length} secciones se funden`} con el fondo exterior (${m.outer}): ${where}. ` +
          'El body y el lienzo de 600 px tienen que distinguirse a simple vista (p. ej. un neutro de la marca algo más oscuro alrededor de un lienzo ' +
          'blanco o de color, con su versión oscura en .dm-outer), y ninguna sección puede tener el color del exterior.'
      );
    }
    for (const st of m.strips.slice(0, 4)) {
      strips.errors.push(
        `En ${mode}, franja suelta de ${st.h} px de color ${st.color} a ${st.y} px del inicio de la pieza, entre dos bloques de otro color: ` +
          'quita la fila separadora (la separación va en el padding de cada sección) o, si es el fondo de una celda, dale su versión oscura.'
      );
    }
    if (m.strips.length > 4) strips.errors.push(`… y ${m.strips.length - 4} franja(s) más en ${mode}.`);
  }
  return { canvas, strips };
}

/** Resumen de la galería de campaña que dejó el worker (productSheet.ts, _trabajo/galeria.json). */
export interface GallerySummary {
  photos: number;
  heroCandidates: string[];
}

/** Imagen principal: una foto de al menos este ancho pintado (a 700 px de ventana) … */
export const HERO_MIN_PAINTED = 560;
/** … que empieza antes de esta altura (cabecera con logo + un bloque corto como mucho). */
export const HERO_MAX_TOP = 700;

/** Imagen principal y variedad de fotos (2026-10-06, punto 2 de la auditoría: Adeslas salió con 1 foto y Polo con 2,
 *  sin imagen principal). Sin imagen principal arriba es error si la galería tenía candidatas (vuelve a Hermes); si
 *  no, aviso. Menos de 3 fotos distintas con una galería de 5 o más, aviso. El logo (src, alt, clase o id con «logo»
 *  o «mark»), los SVG y las imágenes de menos de 200 px no cuentan como fotos. */
export function photoFindings(html: string, widths: number[], tops: number[], gallery?: GallerySummary | null): { hero: Findings; variety: Findings } {
  const tags = [...html.matchAll(/<img\b[^>]*>/gi)].map((m) => m[0]);
  const attr = (t: string, a: string): string => t.match(new RegExp(`\\b${a}\\s*=\\s*["']([^"']*)["']`, 'i'))?.[1] || '';
  const photos = tags
    .map((t, i) => ({ src: attr(t, 'src'), w: widths[i] || 0, top: tops[i] ?? Infinity, t }))
    .filter((p) => p.src && p.w >= 200 && !/\.svg([?#]|$)/i.test(p.src) && !/logo|mark/i.test(`${p.src} ${attr(p.t, 'alt')} ${attr(p.t, 'class')} ${attr(p.t, 'id')}`));
  const hero: Findings = { errors: [], warnings: [] };
  if (!photos.some((p) => p.w >= HERO_MIN_PAINTED && p.top <= HERO_MAX_TOP)) {
    const msg =
      `Sin imagen principal: el primer bloque tras el logo tiene que ser una foto a todo el ancho (≥ ${HERO_MIN_PAINTED} px, empezando antes de ${HERO_MAX_TOP} px de alto)` +
      (gallery?.heroCandidates.length ? `; elige una de las candidatas de la galería: ${gallery.heroCandidates.join(', ')}.` : '.');
    (gallery?.heroCandidates.length ? hero.errors : hero.warnings).push(msg);
  }
  const variety: Findings = { errors: [], warnings: [] };
  const distinct = new Set(photos.map((p) => p.src)).size;
  if (gallery && gallery.photos >= 5 && distinct < 3) {
    variety.warnings.push(`La pieza usa ${distinct} foto(s) distinta(s) y la galería de campaña tiene ${gallery.photos}: usa al menos 3, sin repetir.`);
  }
  return { hero, variety };
}

export async function mobileOverflowWith(browser: Browser, htmlPath: string): Promise<string | null> {
  const page = await browser.newPage({ viewport: { width: MOBILE_WIDTH, height: 800 }, javaScriptEnabled: true });
  try {
    await page.goto(`file://${htmlPath}`, { waitUntil: 'load', timeout: 30000 });
    const result = (await page.evaluate(`(${MEASURE_OVERFLOW_JS})(${MOBILE_WIDTH})`)) as { docWidth: number; offenders: string[] };
    if (result.docWidth <= MOBILE_WIDTH + 1 && !result.offenders.length) return null;
    return `A ${MOBILE_WIDTH} px la página mide ${result.docWidth} px de ancho. Se salen: ${result.offenders.join('; ') || '(sin detalle)'}`;
  } finally {
    await page.close();
  }
}

/** Renderiza el HTML a 375 px y devuelve qué se sale del ancho (null si cabe). La newsletter de
 *  Adidas (2026-09-24) salió con imágenes de width="600" fijo y titular y CTA cortados en móvil, y
 *  la autoauditoría de Hermes no lo vio: ahora lo mide el worker. Si Chromium no arranca, no bloquea. */
export async function mobileOverflow(htmlPath: string): Promise<string | null> {
  let browser;
  try {
    browser = await launchBrowser();
    return await mobileOverflowWith(browser, htmlPath);
  } catch (err) {
    console.log(`No se pudo comprobar la versión móvil: ${(err as Error).message.slice(0, 200)}`);
    return null;
  } finally {
    await browser?.close().catch(() => undefined);
  }
}

/** Columnas lado a lado que, en escritorio, caen una debajo de otra (2026-10-08, Spotify y Jordan): hermanos con clase
 *  «stack» e inline-block en el mismo contenedor, el segundo empezando debajo del primero. Devuelve los textos de error. */
export async function stackedColumnsWith(browser: Browser, htmlPath: string): Promise<string[]> {
  const page = await browser.newPage({ viewport: { width: DESKTOP_WIDTH, height: 900 }, javaScriptEnabled: true });
  try {
    await page.goto(`file://${htmlPath}`, { waitUntil: 'load', timeout: 30000 });
    const n = (await page.evaluate(`(() => {
      let bad = 0;
      const parents = new Set([...document.querySelectorAll('.stack')].map((e) => e.parentElement));
      for (const p of parents) {
        const cols = [...p.children].filter((c) => c.classList.contains('stack') && getComputedStyle(c).display === 'inline-block' && c.getBoundingClientRect().width > 0);
        // Apilada = la siguiente baja de línea aunque habría cabido al lado (le faltan menos de 30 px). Así no cuenta una
        // segunda pareja de columnas que empieza su propia fila.
        const cs = getComputedStyle(p);
        const right = p.getBoundingClientRect().right - parseFloat(cs.paddingRight);
        for (let i = 1; i < cols.length; i++) {
          const a = cols[i - 1].getBoundingClientRect(), b = cols[i].getBoundingClientRect();
          if (b.top >= a.bottom - 2 && a.right + b.width <= right + 30) { bad++; break; }
        }
      }
      return bad;
    })()`)) as number;
    return n
      ? [`Columnas que se apilan en escritorio (${n} módulo${n > 1 ? 's' : ''}): las columnas lado a lado caen una debajo de otra a 600 px. La suma de sus anchos (max-width) debe dejar al menos 20 px libres en su contenedor; o quita el espacio en blanco entre los <div class="stack">.`]
      : [];
  } finally {
    await page.close();
  }
}

async function measure(browser: Browser, htmlPath: string, width: number, dark = false): Promise<PageMetrics> {
  const page = await browser.newPage({ viewport: { width, height: 900 }, colorScheme: dark ? 'dark' : 'light' });
  try {
    await page.goto(`file://${htmlPath}`, { waitUntil: 'load', timeout: 30000 });
    return (await page.evaluate(`(${MEASURE_LAYOUT_JS})(${LAYOUT_MIN_GAP})`)) as PageMetrics;
  } finally {
    await page.close();
  }
}

// --- Colores --------------------------------------------------------------------------------------

function rgb(hex: string): [number, number, number] | null {
  const m = hex.trim().match(/^#?([0-9a-f]{3}|[0-9a-f]{6})$/i);
  if (!m) return null;
  const h = m[1].length === 3 ? m[1].split('').map((c) => c + c).join('') : m[1];
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16)) as [number, number, number];
}

function luminance([r, g, b]: [number, number, number]): number {
  const ch = (v: number): number => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * ch(r) + 0.7152 * ch(g) + 0.0722 * ch(b);
}

/** Relación de contraste WCAG entre dos colores (1 a 21). */
export function contrastRatio(a: string, b: string): number {
  const ca = rgb(a);
  const cb = rgb(b);
  if (!ca || !cb) return 21;
  const [hi, lo] = [luminance(ca), luminance(cb)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

/** Blancos, negros y grises: no son «de marca» ni dejan de serlo. */
function isNeutral(hex: string): boolean {
  const c = rgb(hex);
  if (!c) return true;
  return Math.max(...c) - Math.min(...c) < 24;
}

function distance(a: string, b: string): number {
  const ca = rgb(a);
  const cb = rgb(b);
  if (!ca || !cb) return Infinity;
  // Distancia «redmean»: barata y bastante cercana a la percepción.
  const rm = (ca[0] + cb[0]) / 2;
  const [dr, dg, db] = [ca[0] - cb[0], ca[1] - cb[1], ca[2] - cb[2]];
  return Math.sqrt((2 + rm / 256) * dr * dr + 4 * dg * dg + (2 + (255 - rm) / 256) * db * db);
}

// --- Inspectores --------------------------------------------------------------------------------

/** Contraste, tamaño de letra en móvil, estructura y paleta. `palette`: colores de la marca (brand pack o
 *  identidad medida); sin ella no se comparan colores. */
export function designFindings(desktop: Pick<PageMetrics, 'contrast' | 'columns' | 'coloredText' | 'fullImgs' | 'areas'>, mobileFonts: PageMetrics['fonts'], palette: string[] = []): Findings {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Contraste (WCAG): por debajo de 3:1 no se lee en ningún tamaño; de 3 a 4,5 vale solo para texto grande.
  const low: string[] = [];
  const weak: string[] = [];
  for (const c of desktop.contrast) {
    const ratio = contrastRatio(c.fg, c.bg);
    const large = c.size >= 24 || (c.size >= 18.6 && c.bold);
    const line = `«${c.text}» (${c.fg} sobre ${c.bg}, ${ratio.toFixed(1)}:1)`;
    // Pies de foto y pie legal (letra de 12 px o menos, o último quinto de la pieza) suelen ir en gris a propósito:
    // ahí es aviso. En el texto del cuerpo, por debajo de 3:1, error.
    const secondary = c.size <= 12.5 || c.at > 0.8;
    if (ratio < 3 && !secondary) low.push(line);
    else if (ratio < 4.5 && !large) weak.push(line);
  }
  for (const l of low.slice(0, 3)) errors.push(`Texto que no se lee por falta de contraste: ${l}. Necesita al menos 4,5:1 (3:1 si es un titular grande).`);
  if (low.length > 3) errors.push(`… y ${low.length - 3} texto(s) más con contraste insuficiente.`);
  for (const l of weak.slice(0, 2)) warnings.push(`Contraste bajo: ${l}; lo recomendable es 4,5:1.`);

  // Texto pequeño en móvil. El pie legal (último cuarto de la pieza) puede ir más pequeño.
  // Por debajo de 12 px no se lee; de 12 a 14 px puede ser un pie de foto (aviso).
  const tiny = mobileFonts.filter((f) => f.at < 0.75 && f.size < 11.5);
  const small = mobileFonts.filter((f) => f.at < 0.75 && f.size >= 11.5 && f.size < 14);
  for (const f of tiny.slice(0, 3)) errors.push(`Texto demasiado pequeño en móvil (${Math.round(f.size)} px): «${f.text}». El texto corrido necesita al menos 14 px a 375 px.`);
  if (small.length) warnings.push(`${small.length} bloque(s) de texto de ${Math.round(small[0].size)} px en móvil (lo recomendable para texto corrido es 14-16 px), p. ej. «${small[0].text}».`);

  // Estructura (Siroko, 2026-10-05): tres o más fotos a todo el ancho y nada más que «foto + texto».
  if (desktop.fullImgs >= 3 && !desktop.columns && !desktop.coloredText) {
    errors.push(
      `Estructura repetida: ${desktop.fullImgs} fotos a todo el ancho seguidas de texto y ningún otro módulo (ni dos columnas, ni texto sobre ` +
        'color). Cambia al menos un bloque por un módulo propio del concepto: dos columnas, rejilla, cita o dato sobre color, secuencia…'
    );
  }

  // Paleta: fondos grandes y botones con un color que no es de la marca (ni neutro).
  const brand = palette.filter((p) => rgb(p) && !isNeutral(p));
  if (brand.length) {
    const off = new Map<string, { area: number; button: boolean }>();
    for (const a of desktop.areas) {
      if (isNeutral(a.hex) || brand.some((p) => distance(p, a.hex) < 60)) continue;
      const prev = off.get(a.hex);
      off.set(a.hex, { area: (prev?.area || 0) + a.area, button: !!prev?.button || a.button });
    }
    const list = [...off.entries()].sort((x, y) => y[1].area - x[1].area).slice(0, 3);
    if (list.length) {
      warnings.push(
        `Colores que no están en la paleta de la marca: ${list.map(([hex, v]) => `${hex}${v.button ? ' (botón)' : ''}`).join(', ')}. ` +
          `Paleta: ${brand.slice(0, 6).join(', ')}.`
      );
    }
  }
  return { errors, warnings };
}

/** Texto que no se lee en modo oscuro: mismo umbral que en claro (3:1 en el cuerpo es error), pero aquí también el pie
 *  legal y los pies de foto dan error si caen por debajo de 1,5:1, porque eso es texto invisible (blanco sobre blanco),
 *  no un gris elegido a propósito. Solo lo que en claro sí se leía: lo que ya fallaba en claro lo marca «Legibilidad». */
export function darkFindings(dark: PageMetrics['contrast'], light: PageMetrics['contrast'] = []): Findings {
  const errors: string[] = [];
  const warnings: string[] = [];
  const lightRatio = new Map(light.map((c) => [c.text, contrastRatio(c.fg, c.bg)]));
  const bad: string[] = [];
  const weak: string[] = [];
  for (const c of dark) {
    const ratio = contrastRatio(c.fg, c.bg);
    if ((lightRatio.get(c.text) ?? 21) < 3) continue;
    const secondary = c.size <= 12.5 || c.at > 0.8;
    const line = `«${c.text}» (${c.fg} sobre ${c.bg}, ${ratio.toFixed(1)}:1)`;
    if (ratio < 1.5 || (ratio < 3 && !secondary)) bad.push(line);
    else if (ratio < 4.5 && !secondary) weak.push(line);
  }
  if (bad.length) {
    errors.push(
      `En modo oscuro (Apple Mail, iOS) no se leen ${bad.length} texto(s): ${bad.slice(0, 4).join('; ')}${bad.length > 4 ? '…' : ''}. ` +
        'En el @media (prefers-color-scheme: dark): si el texto pasa a claro, su celda o tabla (bgcolor o background) tiene que ' +
        'pasar a oscuro con una clase y !important; si el texto se queda oscuro sobre un fondo que ya es oscuro (enlaces del ' +
        'pie, textos con color en línea), dale una clase con su color claro y !important.'
    );
  }
  if (weak.length) warnings.push(`Contraste bajo en modo oscuro: ${weak.slice(0, 2).join('; ')}; lo recomendable es 4,5:1.`);
  return { errors, warnings };
}

/** Archivo local de una imagen referenciada en la pieza (relativa al HTML o a la raíz), o null. */
export function resolveLocal(ref: string, htmlDir: string, root: string): string | null {
  if (/^(https?:|data:|cid:|mailto:|#|\{\{)/i.test(ref)) return null;
  let clean: string;
  try {
    clean = decodeURI(ref.replace(/^file:\/\//, '').split(/[?#]/)[0]);
  } catch {
    return null;
  }
  const candidates = path.isAbsolute(clean) ? [clean] : [path.resolve(htmlDir, clean), path.resolve(root, clean)];
  return candidates.find((c) => fs.existsSync(c) && fs.statSync(c).isFile()) || null;
}

export const IMAGE_MAX_BYTES = 600 * 1024;
export const IMAGES_TOTAL_MAX_BYTES = 2.5 * 1024 * 1024;

/** Peso de las imágenes y fotos con mucho margen vacío (fondo liso) arriba y abajo: la zapatilla de Nike
 *  (2026-09-28) dejaba más de 400 px de blanco. Solo se miran las que se pintan a más de 300 px. */
export async function imageFindings(html: string, htmlDir: string, root: string, widths: number[] = []): Promise<Findings> {
  const errors: string[] = [];
  const warnings: string[] = [];
  const tags = [...html.matchAll(/<img\b[^>]*>/gi)].map((m) => m[0]);
  const seen = new Set<string>();
  // Fotos repetidas por su contenido (Nike, 2026-10-08: «alphafly3-suela.jpg» y «_trabajo/suela-crop.jpg» eran el mismo
  // archivo y la pieza enseñaba la misma foto dos veces; ni la comprobación ni la nota de arte lo vieron). Solo las que
  // se pintan a 200 px o más y no son el logo (repetirlo en cabecera y pie, o claro/oscuro, es correcto).
  const byContent = new Map<string, string[]>();
  for (let i = 0; i < tags.length; i++) {
    const src = tags[i].match(/\bsrc\s*=\s*["']([^"']+)["']/i)?.[1] || '';
    const file = resolveLocal(src, htmlDir, root);
    const painted = widths[i] || Number(tags[i].match(/\bwidth\s*=\s*["']?(\d+)/i)?.[1] || 0);
    if (!file || painted < 200 || /logo|swoosh/i.test(path.basename(file))) continue;
    const hash = createHash('md5').update(fs.readFileSync(file)).digest('hex');
    byContent.set(hash, [...(byContent.get(hash) || []), src]);
  }
  for (const srcs of byContent.values()) {
    if (srcs.length < 2) continue;
    const names = [...new Set(srcs.map((s) => path.basename(s)))];
    errors.push(
      `Foto repetida: la misma imagen sale ${srcs.length} veces (${names.join(', ')})${names.length > 1 ? ', con nombres distintos pero idéntica' : ''}. ` +
        'Cada escena lleva una foto distinta: usa otra de las fotos oficiales o quita una.'
    );
  }
  let total = 0;
  for (let i = 0; i < tags.length; i++) {
    const src = tags[i].match(/\bsrc\s*=\s*["']([^"']+)["']/i)?.[1] || '';
    const file = resolveLocal(src, htmlDir, root);
    if (!file || seen.has(file)) continue;
    seen.add(file);
    const bytes = fs.statSync(file).size;
    total += bytes;
    const name = path.basename(file);
    if (bytes > IMAGE_MAX_BYTES) warnings.push(`${name} pesa ${Math.round(bytes / 1024)} KB: redúcela a 1200 px de ancho y comprímela (tarda en cargar en el móvil).`);
    const painted = widths[i] || Number(tags[i].match(/\bwidth\s*=\s*["']?(\d+)/i)?.[1] || 0);
    if (painted < 300 || /\.svg$/i.test(file)) continue;
    try {
      const meta = await sharp(file).metadata();
      const { info } = await sharp(file).trim({ threshold: 12 }).toBuffer({ resolveWithObject: true });
      const h = meta.height || 0;
      if (!h || !info.height) continue;
      const empty = 1 - info.height / h;
      const pct = Math.round(empty * 100);
      const msg = `${name}: el ${pct} % de su alto es fondo liso (arriba y abajo). Recórtala dejando ~10 % de margen alrededor del producto.`;
      if (empty > 0.45) errors.push(`Foto con mucho espacio vacío — ${msg}`);
      else if (empty > 0.3) warnings.push(`Foto con bastante espacio vacío — ${msg}`);
    } catch {
      // formato que sharp no lee: sin medir
    }
  }
  if (total > IMAGES_TOTAL_MAX_BYTES) warnings.push(`Las imágenes suman ${(total / 1024 / 1024).toFixed(1)} MB: la pieza tardará en abrirse en el móvil.`);
  return { errors, warnings };
}

/** La galería de campaña del trabajo, si el worker la dejó. */
export function readGallery(dir: string): GallerySummary | null {
  try {
    return JSON.parse(fs.readFileSync(path.join(dir, '_trabajo', 'galeria.json'), 'utf8')) as GallerySummary;
  } catch {
    return null;
  }
}

/** Todo lo que se mide renderizando, con un solo Chromium. `palette`: colores de la marca para el inspector de
 *  paleta. Si Chromium no arranca, devuelve null y no bloquea nada. */
export async function renderChecks(htmlPath: string, root: string, palette: string[] = []): Promise<RenderReport | null> {
  let browser;
  try {
    browser = await launchBrowser();
    const mobile = await mobileOverflowWith(browser, htmlPath);
    const desktop = await measure(browser, htmlPath, DESKTOP_WIDTH);
    const small = await measure(browser, htmlPath, MOBILE_WIDTH);
    const html = fs.readFileSync(htmlPath, 'utf8');
    const darkCss = /prefers-color-scheme\s*:\s*dark/i.test(html);
    const dark = darkCss ? darkFindings((await measure(browser, htmlPath, DESKTOP_WIDTH, true)).contrast, desktop.contrast) : null;
    return {
      dark,
      mobile,
      layout: [...layoutFindings({ touching: desktop.touching, mobileLeft: small.left }), ...(await stackedColumnsWith(browser, htmlPath).catch(() => []))],
      design: designFindings(desktop, small.fonts, palette),
      images: await imageFindings(html, path.dirname(htmlPath), root, desktop.imgWidths),
      imgWidths: desktop.imgWidths,
      photos: photoFindings(html, desktop.imgWidths, desktop.imgTops, readGallery(path.dirname(htmlPath))),
      frame: frameFindings(await frameMetrics(browser, htmlPath, false).catch(() => null), darkCss ? await frameMetrics(browser, htmlPath, true).catch(() => null) : null),
    };
  } catch (err) {
    console.log(`No se pudo renderizar la pieza para medirla: ${(err as Error).message.slice(0, 200)}`);
    return null;
  } finally {
    await browser?.close().catch(() => undefined);
  }
}
