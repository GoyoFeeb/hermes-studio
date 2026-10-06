/**
 * qualityCheck.ts — control de calidad de una newsletter de Hermes antes de entregarla (2026-09-28).
 *
 * La ruta real (Studio → Hermes) no pasaba ningún gate salvo el de móvil, y la auditoría del
 * 2026-09-28 lo midió: el botón de producto de las 3 versiones de Inglesina llevaba a un 404
 * (/products/base-darwin-360-isize) y 5 de 8 piezas no tenían preheader. El worker corre esto al
 * terminar Hermes: los errores se le devuelven para que los corrija (como la comprobación móvil) y
 * el informe viaja con la newsletter para el panel de revisión de Studio.
 *
 * Errores (se devuelven a Hermes): enlace o imagen que da 404/410/5xx o cuyo dominio no existe,
 * imagen local que no existe, sin preheader, sin {{unsubscribe_url}}, imagen sin alt, enlace vacío
 * o a "#", más de 102 KB (Gmail lo recorta), se sale del ancho en móvil.
 * Modo oscuro y Outlook (2026-09-28): error si falta <meta name="color-scheme" content="light dark"> o el
 * bloque @media (prefers-color-scheme: dark) — ninguna de las 8 newsletters de la auditoría lo tenía —,
 * si no hay ningún <!--[if mso]> (las 3 de Inglesina), si hay display:flex/grid en línea o imágenes sin
 * atributo width. Aviso: "light only" explícito (Gmail y Outlook móvil invierten igualmente), sin ajuste de
 * 96 ppp, background-image sin VML y tipografías sin alternativa genérica (Outlook pone Times New Roman).
 * Identidad y espacios (2026-10-05, Siroko): error si toda la pieza va en fuentes genéricas (typographyCheck) y, medido
 * al renderizar en el worker (layoutProblems), si un texto queda a menos de 16 px de una foto o si a 375 px los
 * laterales del texto pasan de 32 px.
 * Inspectores del 2026-10-05 (renderChecks.ts): contraste por debajo de 3:1, texto de menos de 13 px en móvil,
 * estructura «foto a todo el ancho + texto» repetida sin ningún otro módulo y fotos con más del 45 % de fondo liso
 * son errores; contraste justo, 13 px, colores fuera de la paleta de la marca y peso de las imágenes, avisos.
 * Avisos (no se devuelven): claims de riesgo — la regla da falsos positivos, p. ej. "potencia" en la
 * ficha técnica de una moto (Talaria) — y webs que bloquean a los robots (403/429: Prozis, Adeslas),
 * que en un navegador normal funcionan.
 */
import { CLAIM_RULES } from '../../scripts/lib/claim-rules';

export type CheckStatus = 'ok' | 'warning' | 'error';

export interface QualityCheckItem {
  id: string;
  label: string;
  status: CheckStatus;
  /** Primero los errores (los `errorCount` primeros), después avisos e información. */
  details: string[];
  errorCount: number;
}

export interface QualityReport {
  checkedAt: string;
  errors: number;
  warnings: number;
  checks: QualityCheckItem[];
}

/** Gmail recorta los emails de más de ~102 KB de HTML ("Mensaje recortado"). */
export const GMAIL_CLIP_BYTES = 102 * 1024;
const MAX_URLS = 60;
const URL_TIMEOUT_MS = 15000;
const URL_CONCURRENCY = 6;
/** Algunas webs devuelven 403/404 a peticiones sin cabeceras de navegador. */
const BROWSER_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36',
  Accept: 'text/html,application/xhtml+xml,image/avif,image/webp,*/*;q=0.8',
  'Accept-Language': 'es-ES,es;q=0.9',
};

function item(id: string, label: string, errors: string[], warnings: string[] = []): QualityCheckItem {
  return { id, label, status: errors.length ? 'error' : warnings.length ? 'warning' : 'ok', details: [...errors, ...warnings], errorCount: errors.length };
}

function attr(tag: string, name: string): string | null {
  const m = tag.match(new RegExp(`\\b${name}\\s*=\\s*("([^"]*)"|'([^']*)')`, 'i'));
  return m ? (m[2] ?? m[3] ?? '') : null;
}

function decodeEntities(text: string): string {
  return text
    .replace(/&nbsp;|&#160;/gi, ' ')
    // Relleno invisible tras el preheader (&zwnj;&nbsp;… para que el cliente no muestre texto del cuerpo).
    .replace(/&(zwnj|zwj|shy|lrm|rlm);/gi, '')
    .replace(/&(ensp|emsp|thinsp);/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&#(\d+);/g, (_m, n) => String.fromCodePoint(Number(n)));
}

function stripTags(html: string): string {
  return decodeEntities(html.replace(/<[^>]+>/g, ' ')).replace(/[\s\u200b-\u200d\u034f\u00ad\ufeff]+/g, ' ').trim();
}

function bodyOf(html: string): string {
  const m = html.match(/<body\b[^>]*>([\s\S]*)<\/body>/i);
  return (m ? m[1] : html).replace(/<!--[\s\S]*?-->/g, '').replace(/<(style|script)\b[\s\S]*?<\/\1>/gi, '');
}

/** Texto visible (sin <head>, estilos ni comentarios condicionales de Outlook). */
export function visibleText(html: string): string {
  return stripTags(bodyOf(html));
}

/** Preheader: bloque oculto con texto al principio del <body> (display:none, mso-hide:all o
 *  max-height:0 + overflow:hidden), o un elemento con clase "preheader". */
export function findPreheader(html: string): string | null {
  const body = bodyOf(html);
  const re = /<(div|span|td|p)\b([^>]*)>([\s\S]*?)<\/\1>/gi;
  for (let m = re.exec(body); m; m = re.exec(body)) {
    const attrs = m[2];
    const style = (attr(`<x ${attrs}>`, 'style') || '').toLowerCase().replace(/\s+/g, '');
    const cls = (attr(`<x ${attrs}>`, 'class') || '').toLowerCase();
    const hidden =
      /display:none/.test(style) || /mso-hide:all/.test(style) || (/max-height:0/.test(style) && /overflow:hidden/.test(style));
    if (!hidden && !/preheader/.test(cls)) continue;
    const text = stripTags(m[3]);
    if (text.length >= 10) return text;
  }
  return null;
}

function snippet(tag: string): string {
  return tag.replace(/\s+/g, ' ').slice(0, 120);
}

/** Comprobaciones que no necesitan red. `missingLocal`: imágenes con ruta local que no existen. */
export function staticChecks(html: string, missingLocal: string[] = []): QualityCheckItem[] {
  const checks: QualityCheckItem[] = [];

  const pre = findPreheader(html);
  checks.push(
    item('preheader', 'Preheader', pre ? [] : ['No hay preheader: añade al principio del <body> un bloque oculto (display:none; mso-hide:all) con el texto que se ve junto al asunto en la bandeja.'])
  );
  if (pre) checks[checks.length - 1].details.push(`«${pre.slice(0, 140)}»`);

  const anchors = [...html.matchAll(/<a\b[^>]*>/gi)].map((m) => m[0]);
  const hrefs = anchors.map((t) => attr(t, 'href'));
  checks.push(
    item('unsubscribe', 'Enlace de baja', hrefs.some((h) => h && /\{\{\s*unsubscribe_url\s*\}\}/.test(h)) ? [] : ['Falta el enlace de baja con href="{{unsubscribe_url}}" en el footer.'])
  );

  const empty = anchors.filter((t) => {
    const h = (attr(t, 'href') ?? '').trim();
    return !h || h === '#' || /^javascript:/i.test(h);
  });
  checks.push(item('empty-links', 'Enlaces con destino', empty.map((t) => `Enlace vacío o a "#": ${snippet(t)}`)));

  const imgs = [...html.matchAll(/<img\b[^>]*>/gi)].map((m) => m[0]);
  const noAlt = imgs.filter((t) => attr(t, 'alt') === null);
  checks.push(
    item('alt', 'Texto alternativo de las imágenes', noAlt.map((t) => `Imagen sin atributo alt: ${snippet(t)}`))
  );

  // Se mide como quedará publicado: Studio cambia las imágenes base64 por URLs de /assets.
  const bytes = Buffer.byteLength(html.replace(/data:image\/[a-z+]+;base64,[A-Za-z0-9+/=]+/g, 'https://x/assets/brands/marca/img-000000000000.png'), 'utf8');
  checks.push(
    item('size', 'Peso para Gmail', bytes > GMAIL_CLIP_BYTES ? [`Pesa ${Math.round(bytes / 1024)} KB: Gmail lo recortará (límite ~102 KB).`] : [])
  );
  checks[checks.length - 1].details.push(`${Math.round(bytes / 1024)} KB`);

  const text = visibleText(html);
  const claims = CLAIM_RULES.flatMap((rule) => {
    const m = text.match(rule.pattern);
    if (!m) return [];
    const i = m.index || 0;
    return [`«${rule.label}» (${rule.severity}): …${text.slice(Math.max(0, i - 40), i + m[0].length + 40).trim()}… — ${rule.recommendation}`];
  });
  checks.push(item('claims', 'Claims de riesgo', [], claims));

  // Marcadores de la base técnica (studio/hermes/email-base.html) que se quedaron sin rellenar.
  const leftovers = [...new Set([...html.replace(/<!--(?!\[if)[\s\S]*?-->/g, '').matchAll(/\[(?:[A-ZÁÉÍÓÚÑ0-9][A-ZÁÉÍÓÚÑ0-9 .:,/-]{2,60}|[a-z0-9_-]+\.(?:png|jpe?g))\]/g)].map((m) => m[0]))];
  checks.push(item('placeholders', 'Sin marcadores pendientes', leftovers.slice(0, 6).map((p) => `Marcador sin rellenar: ${p}`)));

  checks.push(darkModeCheck(html), outlookCheck(html), logoPresenceCheck(html), logoMatchCheck(html), typographyCheck(html), emailImagesCheck(html));

  if (missingLocal.length) {
    checks.push(item('local-images', 'Imágenes locales', missingLocal.map((r) => `La imagen ${r} no existe en el Mac.`)));
  }
  return checks;
}

/** Modo oscuro: la pieza tiene que declarar que lo admite y definir sus colores en oscuro. Sin eso, Apple
 *  Mail la muestra en claro y Gmail/Outlook en móvil invierten sus colores a ciegas (logos, CTA). */
export function darkModeCheck(html: string): QualityCheckItem {
  const contents = [...html.matchAll(/<meta\b[^>]*>/gi)]
    .map((m) => m[0])
    .filter((t) => /name\s*=\s*["']?(color-scheme|supported-color-schemes)/i.test(t))
    .map((t) => (attr(t, 'content') || '').toLowerCase());
  const lightOnly = contents.some((c) => /\bonly\b/.test(c) && !/dark/.test(c));
  const declaresDark = contents.some((c) => /dark/.test(c));
  const darkCss = /prefers-color-scheme\s*:\s*dark/i.test(html);
  if (lightOnly) {
    return item('dark-mode', 'Modo oscuro', [], [
      'La pieza fija solo el modo claro ("light only"): Apple Mail lo respeta, pero Gmail y Outlook en móvil invertirán sus colores igualmente.',
    ]);
  }
  const errors: string[] = [];
  if (!declaresDark) {
    errors.push(
      'Falta declarar el modo oscuro en <head>: <meta name="color-scheme" content="light dark"> y <meta name="supported-color-schemes" content="light dark">' +
        (contents.length ? ` (ahora declara "${contents[0]}").` : '.')
    );
  }
  if (!darkCss) {
    errors.push(
      'Falta un bloque @media (prefers-color-scheme: dark) con los colores de la pieza en oscuro (fondos, textos, CTA y, si hace falta, una versión clara del logo).'
    );
  }
  const result = item('dark-mode', 'Modo oscuro', errors);
  if (!errors.length) result.details.push('Declara "light dark" y define estilos oscuros.');
  return result;
}

const GENERIC_FONT = /\b(sans-serif|serif|monospace|cursive|system-ui|arial|helvetica|georgia|verdana|tahoma|trebuchet|times|courier)\b/i;

/** Outlook de escritorio (Word como motor): sin <!--[if mso]> la pieza se estira a todo el ancho, ignora
 *  flex/grid, pinta las imágenes a su tamaño real si no llevan width y no muestra fondos CSS. */
export function outlookCheck(html: string): QualityCheckItem {
  const errors: string[] = [];
  const warnings: string[] = [];
  if (!/<!--\[if[^\]]*mso/i.test(html)) {
    errors.push(
      'No hay ajustes para Outlook de escritorio: falta un bloque <!--[if mso]> (tabla "fantasma" de 600 px alrededor del contenido; sin ella Outlook ignora max-width y estira la pieza).'
    );
  } else if (!/PixelsPerInch/i.test(html)) {
    warnings.push('Falta el ajuste de 96 ppp (<o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch> dentro de <!--[if mso]> en <head>): en pantallas de alta resolución Outlook escala la pieza.');
  }
  const flex = [...html.matchAll(/<[a-z][^>]*\bstyle\s*=\s*("[^"]*"|'[^']*')[^>]*>/gi)].filter((m) => /display\s*:\s*(inline-)?(flex|grid)\b/i.test(m[1]));
  if (flex.length) {
    errors.push(`${flex.length} elemento(s) con display:flex/grid en línea: Outlook no los entiende; usa tablas. P. ej.: ${snippet(flex[0][0])}`);
  }
  const noWidth = [...html.matchAll(/<img\b[^>]*>/gi)].map((m) => m[0]).filter((t) => attr(t, 'width') === null);
  for (const t of noWidth.slice(0, 5)) errors.push(`Imagen sin atributo width (Outlook la pinta a su tamaño real): ${snippet(t)}`);
  if (/background-image\s*:\s*url/i.test(html) && !/<v:(rect|fill|roundrect|image)\b/i.test(html)) {
    warnings.push('Hay fondos con background-image sin alternativa VML (<v:rect>/<v:fill>): Outlook de escritorio no los mostrará.');
  }
  // Dentro de @font-face, font-family es el NOMBRE de la fuente que se declara, no una lista con
  // alternativas: contaba como aviso falso (Nike, 2026-09-28: 'Inter' declarada y usada con Helvetica, Arial).
  const withoutFontFace = html.replace(/@font-face\s*\{[^}]*\}/gi, '');
  const fonts = [...new Set([...withoutFontFace.matchAll(/font-family\s*:\s*([^;"}]+)/gi)].map((m) => decodeEntities(m[1]).trim()))].filter((f) => !GENERIC_FONT.test(f));
  for (const f of fonts.slice(0, 3)) warnings.push(`Tipografía sin alternativa genérica ("${f.slice(0, 60)}"): añade p. ej. Arial, sans-serif o Outlook pondrá Times New Roman.`);
  const result = item('outlook', 'Outlook', errors, warnings);
  if (!errors.length && !warnings.length) result.details.push('Bloque <!--[if mso]>, 96 ppp, tablas e imágenes con width.');
  return result;
}

/** Primeras fuentes que no son de ninguna marca: de sistema o genéricas. «Helvetica Neue» o «Roboto» no están:
 *  hay marcas que las usan de verdad (Zara, Google). */
const GENERIC_PRIMARY = new Set([
  'arial', 'helvetica', 'sans-serif', 'serif', 'monospace', 'georgia', 'verdana', 'tahoma', 'trebuchet ms',
  'times new roman', 'times', 'courier new', 'courier', 'system-ui', '-apple-system', 'blinkmacsystemfont', 'segoe ui',
]);

/** Tipografía de marca (2026-10-05): la de Siroko salió entera en «Arial, Helvetica, sans-serif». Error si en
 *  ningún font-family la PRIMERA fuente es de marca. Lo de Outlook (<!--[if mso]>, VML) no cuenta: ahí Arial es
 *  lo correcto. Devuelve qué fuentes principales usa la pieza. */
export function typographyCheck(html: string): QualityCheckItem {
  const css = html.replace(/<!--\[if[^\]]*mso[\s\S]*?<!\[endif\]-->/gi, '').replace(/@font-face\s*\{[^}]*\}/gi, '');
  const primaries = [...css.matchAll(/font-family\s*:\s*([^;"}]+)/gi)]
    .map((m) => decodeEntities(m[1]).split(',')[0].trim().replace(/^['"]|['"]$/g, '').trim())
    .filter((f) => f && !/^(inherit|initial|unset)$/i.test(f));
  const unique = [...new Set(primaries.map((f) => f.toLowerCase()))];
  if (!unique.length) return item('typography', 'Tipografía de la marca', [], ['La pieza no declara ninguna tipografía.']);
  const brand = unique.filter((f) => !GENERIC_PRIMARY.has(f));
  const shown = [...new Set(primaries)].slice(0, 4).join(', ');
  if (!brand.length) {
    return item('typography', 'Tipografía de la marca', [
      `Toda la pieza va en fuentes genéricas (${shown}): no se reconoce la marca. Usa la tipografía de su web oficial ` +
        'o de su brand pack (cárgala con <link> o @import) como primera fuente de cada font-family y deja Arial/Helvetica ' +
        'solo detrás, de respaldo. Si la marca usa de verdad Arial o Helvetica, cítalo con su fuente en notas.md.',
    ]);
  }
  const result = item('typography', 'Tipografía de la marca', []);
  result.details.push(`Fuente principal: ${shown}.`);
  return result;
}

/** Medidas de maquetación que toma el worker al renderizar (layoutProblems en hermes-worker.ts). */
export interface LayoutMetrics {
  /** Textos a menos de LAYOUT_MIN_GAP de una imagen (encima o debajo, en la misma columna), a 600 px. */
  touching: { text: string; gap: number }[];
  /** Margen izquierdo de cada bloque de texto a 375 px (px desde el borde de la pantalla). */
  mobileLeft: number[];
}
export const LAYOUT_MIN_GAP = 16;
export const MOBILE_MAX_SIDE = 32;

/** Convierte las medidas en errores para Hermes (2026-10-05, la de Siroko: titulares pegados a la foto de encima
 *  y 48 px de laterales en móvil porque la clase .pad de la media query no se aplicaba a ninguna celda). */
export function layoutFindings(m: LayoutMetrics): string[] {
  const out: string[] = [];
  for (const t of m.touching.slice(0, 4)) {
    out.push(`Texto pegado a una imagen (${Math.max(0, Math.round(t.gap))} px): «${t.text}». Deja al menos 32 px entre la foto y el texto con el padding de la celda.`);
  }
  if (m.touching.length > 4) out.push(`… y ${m.touching.length - 4} texto(s) más pegados a una imagen.`);
  const left = [...m.mobileLeft].sort((a, b) => a - b);
  if (left.length >= 3) {
    const median = left[Math.floor(left.length / 2)];
    if (median > MOBILE_MAX_SIDE) {
      out.push(`A 375 px el texto tiene ${Math.round(median)} px de margen lateral (columna estrecha): bájalo a 20-24 px aplicando la clase de la media query a cada celda con texto, y alinea los botones con ese margen.`);
    }
  }
  return out;
}

interface LogoImg {
  tag: string;
  pos: number;
  src: string;
  alt: string;
  marked: boolean;
  dark: boolean;
  width: string;
  height: string;
}

function cssPx(style: string, prop: string): string | null {
  const m = style.match(new RegExp(`(?:^|;)\\s*${prop}\\s*:\\s*([^;]+)`, 'i'));
  return m ? m[1].trim().toLowerCase() : null;
}

/** Tamaño tal como se pinta: el estilo en línea manda sobre el atributo; "auto" y sin alto son lo mismo. */
function imgSize(tag: string): { width: string; height: string } {
  const style = attr(tag, 'style') || '';
  const norm = (v: string | null): string => {
    const t = (v || '').trim().toLowerCase().replace(/\s*!important$/, '');
    if (!t || t === 'auto') return '';
    return /^\d+(\.\d+)?$/.test(t) ? `${Number(t)}px` : t;
  };
  return {
    width: norm(cssPx(style, 'width') ?? attr(tag, 'width')),
    height: norm(cssPx(style, 'height') ?? attr(tag, 'height')),
  };
}

function srcLabel(src: string): string {
  if (src.startsWith('data:')) return `imagen incrustada (${src.length} caracteres)`;
  return src.split(/[?#]/)[0].split('/').pop() || src;
}

/** Logo en la cabecera (2026-10-05, Calvin Klein): la pieza salió sin logo visible y el control no dijo nada. Se
 *  busca como en logoMatchCheck: "logo" en el src, la clase o el id, o una primera imagen pequeña (≤ 320 px). */
export function logoPresenceCheck(html: string): QualityCheckItem {
  const imgs = [...bodyOf(html).matchAll(/<img\b[^>]*>/gi)].map((m) => m[0]);
  const marked = imgs.find((t) => /logo/i.test(`${(attr(t, 'src') || '').startsWith('data:') ? '' : attr(t, 'src')} ${attr(t, 'class') || ''} ${attr(t, 'id') || ''} ${attr(t, 'alt') || ''}`));
  const first = imgs[0];
  const firstSmall = !!first && (() => {
    const w = parseFloat(imgSize(first).width);
    return Number.isFinite(w) && w <= 320;
  })();
  if (!marked && !firstSmall) {
    return item('logo-present', 'Logo de la marca', [
      'No hay logo en la cabecera: pon el logo oficial de la marca como imagen (PNG descargado en la carpeta del trabajo, con alt con el nombre de la marca), arriba del todo.',
    ]);
  }
  const result = item('logo-present', 'Logo de la marca', []);
  result.details.push(`Logo: ${srcLabel(attr(marked || first!, 'src') || '')}.`);
  return result;
}

/** Imágenes que un programa de correo puede mostrar (2026-10-05, Calvin Klein): el logo era un SVG enlazado desde
 *  la web de la marca y las fotos, URLs de su CDN que bloquea a quien no viene de su web (Akamai: 403). Gmail y
 *  Outlook no muestran SVG, y el proxy de imágenes de Gmail también recibe el 403. Las imágenes tienen que ir en
 *  la carpeta del trabajo (Studio las publica en /assets) o ya publicadas por Studio (img-<hash> en /assets/). */
const STUDIO_ASSET_RE = /\/assets\/.+\/img-[0-9a-f]{12}\.(png|jpe?g|gif|webp)(\?|$)/i;
export function emailImagesCheck(html: string): QualityCheckItem {
  const body = bodyOf(html);
  const srcs = [
    ...[...body.matchAll(/<img\b[^>]*>/gi)].map((m) => attr(m[0], 'src') || ''),
    ...[...body.matchAll(/\bbackground\s*=\s*["']([^"']+)["']/gi)].map((m) => m[1]),
  ].map((u) => decodeEntities(u.trim())).filter(Boolean);
  const errors: string[] = [];
  const svg = [...new Set(srcs.filter((u) => /^data:image\/svg\+xml/i.test(u) || /\.svg(\?|#|$)/i.test(u)))];
  for (const u of svg.slice(0, 3)) errors.push(`Imagen SVG (${srcLabel(u)}): Gmail y Outlook no la muestran. Conviértela a PNG al doble de su tamaño y guárdala en la carpeta del trabajo.`);
  const external = [...new Set(srcs.filter((u) => /^https?:\/\//i.test(u) && !STUDIO_ASSET_RE.test(u) && !svg.includes(u)))];
  for (const u of external.slice(0, 4)) {
    errors.push(`Imagen enlazada desde fuera (${u.length > 90 ? `${u.slice(0, 90)}…` : u}): descárgala a la carpeta del trabajo y enlázala con ruta local; Studio la publica. Las webs de las marcas suelen bloquear el enlace directo y en el correo no se vería.`);
  }
  if (external.length > 4) errors.push(`… y ${external.length - 4} imagen(es) más enlazadas desde fuera.`);
  const result = item('email-images', 'Imágenes que se ven en el correo', errors);
  if (!errors.length) result.details.push('Todas locales o publicadas por Studio, ninguna SVG.');
  return result;
}

/** Logo arriba y abajo (norma del 2026-10-02): si el pie lleva logo, es exactamente el de la cabecera —
 *  mismo archivo, misma versión de color y mismo tamaño. En las 13 piezas de Hermes hasta entonces, 11
 *  lo encogían en el pie (Nike 120→96 px, Lacoste 190→120) y Adidas cambiaba de archivo (negro arriba,
 *  blanco abajo). El logo del pie es opcional: sin él no hay nada que comparar.
 *  Se detecta por "logo" en el src, la clase o el id, y también sin esa pista (al publicar, Studio renombra
 *  las imágenes a img-<hash>.png): la primera imagen de la pieza, pequeña, cuyo src o alt se repite abajo.
 *  Las variantes de modo oscuro (clase con "dark" o display:none en línea) se comparan entre sí. */
export function logoMatchCheck(html: string): QualityCheckItem {
  const label = 'Logo arriba y abajo';
  const body = bodyOf(html).replace(/data:image\/[a-z+]+;base64,[A-Za-z0-9+/=]+/g, (m) => `data:${m.length}:${m.slice(-24)}`);
  const imgs: LogoImg[] = [...body.matchAll(/<img\b[^>]*>/gi)].map((m) => {
    const tag = m[0];
    const src = (attr(tag, 'src') || '').trim().replace(/^\.\//, '');
    const hints = `${src.startsWith('data:') ? '' : src.split(/[?#]/)[0]} ${attr(tag, 'class') || ''} ${attr(tag, 'id') || ''}`;
    const style = (attr(tag, 'style') || '').toLowerCase().replace(/\s+/g, '');
    return {
      tag,
      pos: m.index || 0,
      src,
      alt: (attr(tag, 'alt') || '').trim().toLowerCase(),
      marked: /logo/i.test(hints),
      dark: /dark/i.test(attr(tag, 'class') || '') || /display:none/.test(style),
      ...imgSize(tag),
    };
  });
  const small = (i: LogoImg): boolean => {
    const w = parseFloat(i.width);
    return !i.width || (i.width.endsWith('px') && w <= 320);
  };
  // Imágenes seguidas, sin texto de por medio: el logo y su variante oscura.
  const adjacent = (a: LogoImg, b: LogoImg): boolean =>
    imgs.indexOf(b) === imgs.indexOf(a) + 1 && stripTags(body.slice(a.pos + a.tag.length, b.pos)).length < 20;
  const run = (start: number, belongs: (i: LogoImg) => boolean): LogoImg[] => {
    const out = [imgs[start]];
    for (let k = start + 1; k < imgs.length && belongs(imgs[k]) && adjacent(imgs[k - 1], imgs[k]); k++) out.push(imgs[k]);
    return out;
  };

  let first = imgs.findIndex((i) => i.marked);
  if (first < 0 && imgs.length > 1 && small(imgs[0]) && imgs.slice(1).some((i) => i.src === imgs[0].src || (imgs[0].alt && i.alt === imgs[0].alt))) {
    first = 0;
  }
  if (first < 0) return { ...item('logo-match', label, []), details: ['No se ha detectado logo en la cabecera.'] };
  const head = run(first, (i) => i.marked || (!!imgs[first].alt && i.alt === imgs[first].alt));
  const headSrcs = new Set(head.map((i) => i.src));
  const headAlts = new Set(head.map((i) => i.alt).filter(Boolean));
  const isFootLogo = (i: LogoImg): boolean => i.marked || headSrcs.has(i.src) || (headAlts.has(i.alt) && small(i));
  const after = imgs.slice(imgs.indexOf(head[head.length - 1]) + 1);
  const lastIdx = after.length ? imgs.indexOf(after[after.length - 1]) : -1;
  let footStart = -1;
  for (let k = lastIdx; k > imgs.indexOf(head[head.length - 1]); k--) {
    if (!isFootLogo(imgs[k])) continue;
    footStart = k;
    while (footStart - 1 > imgs.indexOf(head[head.length - 1]) && isFootLogo(imgs[footStart - 1]) && adjacent(imgs[footStart - 1], imgs[footStart])) footStart--;
    break;
  }
  if (footStart < 0) return { ...item('logo-match', label, []), details: ['El pie no lleva logo.'] };
  const foot = run(footStart, isFootLogo);

  const size = (i: LogoImg): string => `${i.width || 'auto'} × ${i.height || 'auto'}`;
  const errors: string[] = [];
  for (const dark of [false, true]) {
    const h = head.find((i) => i.dark === dark);
    const f = foot.find((i) => i.dark === dark);
    const which = dark ? 'La versión de modo oscuro del logo' : 'El logo';
    if (!f) {
      if (dark && h) errors.push('Arriba el logo cambia de versión en modo oscuro y abajo no: el pie tiene que llevar las mismas versiones que la cabecera.');
      continue;
    }
    if (!h) {
      errors.push(
        dark
          ? 'Abajo el logo cambia de versión en modo oscuro y arriba no: la cabecera y el pie tienen que llevar las mismas versiones.'
          : `El pie lleva un logo (${srcLabel(f.src)}) que no aparece igual en la cabecera.`
      );
      continue;
    }
    if (h.src !== f.src) {
      errors.push(`${which} del pie es otro archivo: arriba ${srcLabel(h.src)}, abajo ${srcLabel(f.src)}. Tiene que ser exactamente el mismo (también la misma versión de color).`);
    }
    if (h.width !== f.width || h.height !== f.height) {
      errors.push(`${which} del pie tiene otro tamaño: arriba ${size(h)}, abajo ${size(f)}. Tiene que medir lo mismo en los dos sitios (atributos width/height y estilo).`);
    }
  }
  const result = item('logo-match', label, errors);
  if (!errors.length) result.details.push(`Mismo logo arriba y abajo (${srcLabel(head[0].src)}, ${size(head[0])}).`);
  return result;
}

/** URLs a comprobar: destinos de los enlaces e imágenes (src, background, url()). Las variables
 *  del ESP ({{...}}), mailto: y las rutas locales se quedan fuera. */
export function collectUrls(html: string): { links: string[]; images: string[] } {
  const isHttp = (u: string | null): u is string => !!u && /^https?:\/\//i.test(u.trim()) && !/\{\{/.test(u);
  const links = [...html.matchAll(/<a\b[^>]*>/gi)].map((m) => attr(m[0], 'href')).filter(isHttp).map((u) => decodeEntities(u.trim()));
  const images = [
    ...[...html.matchAll(/<img\b[^>]*>/gi)].map((m) => attr(m[0], 'src')),
    ...[...html.matchAll(/\bbackground\s*=\s*["']([^"']+)["']/gi)].map((m) => m[1]),
    ...[...html.matchAll(/url\(\s*["']?([^"')]+)["']?\s*\)/gi)].map((m) => m[1]),
  ]
    .filter(isHttp)
    .map((u) => decodeEntities(u.trim()));
  return { links: [...new Set(links)], images: [...new Set(images)] };
}

export type UrlVerdict = { url: string; kind: 'ok' | 'broken' | 'unverifiable'; reason: string };

export type Fetcher = (url: string, init: RequestInit) => Promise<{ status: number; body?: { cancel(): Promise<void> } | null }>;

async function probe(url: string, fetcher: Fetcher): Promise<UrlVerdict> {
  let lastError = '';
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const res = await fetcher(url, { method: 'GET', redirect: 'follow', headers: BROWSER_HEADERS, signal: AbortSignal.timeout(URL_TIMEOUT_MS) });
      await res.body?.cancel().catch(() => undefined);
      if (res.status < 400) return { url, kind: 'ok', reason: String(res.status) };
      if (res.status === 404 || res.status === 410) return { url, kind: 'broken', reason: `HTTP ${res.status}` };
      if (res.status >= 500) {
        lastError = `HTTP ${res.status}`;
        continue; // un 5xx puntual se reintenta una vez
      }
      return { url, kind: 'unverifiable', reason: `HTTP ${res.status} (la web bloquea peticiones automáticas)` };
    } catch (err) {
      const e = err as Error & { cause?: { code?: string } };
      const code = e.cause?.code || '';
      if (code === 'ENOTFOUND' || code === 'EAI_NONAME') return { url, kind: 'broken', reason: 'el dominio no existe' };
      if (e.name === 'TimeoutError' || e.name === 'AbortError') return { url, kind: 'unverifiable', reason: 'no respondió a tiempo' };
      lastError = code || e.message;
    }
  }
  return { url, kind: lastError.startsWith('HTTP 5') ? 'broken' : 'unverifiable', reason: lastError };
}

export async function checkUrls(urls: string[], fetcher: Fetcher = fetch as unknown as Fetcher): Promise<UrlVerdict[]> {
  const queue = urls.slice(0, MAX_URLS);
  const out: UrlVerdict[] = [];
  await Promise.all(
    Array.from({ length: Math.min(URL_CONCURRENCY, queue.length) }, async () => {
      for (let url = queue.shift(); url; url = queue.shift()) out.push(await probe(url, fetcher));
    })
  );
  return out;
}

function urlItem(id: string, label: string, verdicts: UrlVerdict[], total: number, blockedIsError = false): QualityCheckItem {
  // En una imagen, un 403/429 no es «solo un robot»: el proxy de imágenes de Gmail también lo recibe y no la muestra
  // (Calvin Klein, 2026-10-05). En un enlace sigue siendo aviso: quien pulsa usa un navegador normal.
  const blocked = (v: UrlVerdict): boolean => blockedIsError && v.kind === 'unverifiable' && /^HTTP 4/.test(v.reason);
  const broken = verdicts.filter((v) => v.kind === 'broken' || blocked(v)).map((v) => `${v.url} → ${blocked(v) ? `${v.reason.split(' (')[0]}: la web bloquea la imagen; descárgala a la carpeta del trabajo` : v.reason}`);
  const unverifiable = verdicts.filter((v) => v.kind === 'unverifiable' && !blocked(v)).map((v) => `No verificable: ${v.url} → ${v.reason}`);
  const result = item(id, label, broken, unverifiable);
  if (!total) result.details.push('Ninguno que comprobar.');
  else if (!broken.length && !unverifiable.length) result.details.push(`${total} comprobado${total === 1 ? '' : 's'}.`);
  return result;
}

export interface QualityOptions {
  missingLocal?: string[];
  /** Resultado de mobileOverflow (null = cabe a 375 px; undefined = no se comprobó). */
  mobileProblem?: string | null;
  /** Problemas de espacios medidos al renderizar (layoutFindings); sin definir = no se midió. */
  layoutProblems?: string[];
  /** Inspectores del 2026-10-05 (renderChecks.ts): contraste, letra en móvil, estructura y paleta. */
  design?: { errors: string[]; warnings: string[] };
  /** Contraste con la pieza en modo oscuro (renderChecks.ts, darkFindings); null = sin estilos oscuros. */
  darkFindings?: { errors: string[]; warnings: string[] } | null;
  /** Peso y encuadre de las imágenes (renderChecks.ts, imageFindings). */
  imageFindings?: { errors: string[]; warnings: string[] };
  /** Lo que pidió el equipo y la pieza no nombra (requestCoverage.ts); sin definir = no se comprobó. */
  requestMissing?: string[];
  fetcher?: Fetcher;
}

export async function runQualityCheck(html: string, opts: QualityOptions = {}): Promise<QualityReport> {
  const checks = staticChecks(html, opts.missingLocal);
  const { links, images } = collectUrls(html);
  const verdicts = await checkUrls([...links, ...images.filter((u) => !links.includes(u))], opts.fetcher);
  checks.unshift(
    urlItem('links', 'Enlaces', verdicts.filter((v) => links.includes(v.url)), links.length),
    urlItem('images', 'Imágenes publicadas', verdicts.filter((v) => images.includes(v.url)), images.length, true)
  );
  if (opts.mobileProblem !== undefined) {
    checks.push(item('mobile', 'Móvil (375 px)', opts.mobileProblem ? [opts.mobileProblem] : []));
  }
  if (opts.layoutProblems !== undefined) {
    checks.push(item('layout', 'Espacios y márgenes', opts.layoutProblems));
  }
  if (opts.design) {
    const d = item('design', 'Legibilidad y estructura', opts.design.errors, opts.design.warnings);
    if (d.status === 'ok') d.details.push('Contraste, tamaño de letra en móvil, módulos y paleta correctos.');
    checks.push(d);
  }
  if (opts.darkFindings) {
    const d = item('dark-legibility', 'Modo oscuro legible', opts.darkFindings.errors, opts.darkFindings.warnings);
    if (d.status === 'ok') d.details.push('Renderizada en oscuro (como Apple Mail), todos los textos se leen.');
    checks.push(d);
  }
  if (opts.imageFindings) {
    const d = item('image-quality', 'Peso y encuadre de las imágenes', opts.imageFindings.errors, opts.imageFindings.warnings);
    if (d.status === 'ok') d.details.push('Sin fotos con exceso de fondo vacío ni imágenes pesadas.');
    checks.push(d);
  }
  if (opts.requestMissing !== undefined) {
    const d = item(
      'request',
      'Lo que pidió el equipo',
      opts.requestMissing.map((label) => `La petición pide ${label} y la pieza no lo nombra: tiene que salir tal cual en el asunto, un titular o una escena.`)
    );
    if (d.status === 'ok') d.details.push('La pieza nombra la ocasión y la oferta que pedía el equipo.');
    checks.push(d);
  }
  return {
    checkedAt: new Date().toISOString(),
    errors: checks.filter((c) => c.status === 'error').length,
    warnings: checks.filter((c) => c.status === 'warning').length,
    checks,
  };
}

/** Texto para devolverle a Hermes los errores (los avisos no se le devuelven). */
export function describeErrors(report: QualityReport): string {
  return report.checks
    .filter((c) => c.status === 'error')
    .map((c) => `- ${c.label}:\n${c.details.slice(0, c.errorCount).map((d) => `  · ${d}`).join('\n')}`)
    .join('\n');
}
