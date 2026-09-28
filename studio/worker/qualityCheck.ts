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

  checks.push(darkModeCheck(html), outlookCheck(html));

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
  const fonts = [...new Set([...html.matchAll(/font-family\s*:\s*([^;"}]+)/gi)].map((m) => decodeEntities(m[1]).trim()))].filter((f) => !GENERIC_FONT.test(f));
  for (const f of fonts.slice(0, 3)) warnings.push(`Tipografía sin alternativa genérica ("${f.slice(0, 60)}"): añade p. ej. Arial, sans-serif o Outlook pondrá Times New Roman.`);
  const result = item('outlook', 'Outlook', errors, warnings);
  if (!errors.length && !warnings.length) result.details.push('Bloque <!--[if mso]>, 96 ppp, tablas e imágenes con width.');
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

function urlItem(id: string, label: string, verdicts: UrlVerdict[], total: number): QualityCheckItem {
  const broken = verdicts.filter((v) => v.kind === 'broken').map((v) => `${v.url} → ${v.reason}`);
  const unverifiable = verdicts.filter((v) => v.kind === 'unverifiable').map((v) => `No verificable: ${v.url} → ${v.reason}`);
  const result = item(id, label, broken, unverifiable);
  if (!total) result.details.push('Ninguno que comprobar.');
  else if (!broken.length && !unverifiable.length) result.details.push(`${total} comprobado${total === 1 ? '' : 's'}.`);
  return result;
}

export interface QualityOptions {
  missingLocal?: string[];
  /** Resultado de mobileOverflow (null = cabe a 375 px; undefined = no se comprobó). */
  mobileProblem?: string | null;
  fetcher?: Fetcher;
}

export async function runQualityCheck(html: string, opts: QualityOptions = {}): Promise<QualityReport> {
  const checks = staticChecks(html, opts.missingLocal);
  const { links, images } = collectUrls(html);
  const verdicts = await checkUrls([...links, ...images.filter((u) => !links.includes(u))], opts.fetcher);
  checks.unshift(
    urlItem('links', 'Enlaces', verdicts.filter((v) => links.includes(v.url)), links.length),
    urlItem('images', 'Imágenes publicadas', verdicts.filter((v) => images.includes(v.url)), images.length)
  );
  if (opts.mobileProblem !== undefined) {
    checks.push(item('mobile', 'Móvil (375 px)', opts.mobileProblem ? [opts.mobileProblem] : []));
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
