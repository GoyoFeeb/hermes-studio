/**
 * measureBrand.ts — identidad de una marca medida en su web oficial, sin Hermes (2026-10-05).
 *
 * Auditoría de agentes del 2026-10-05: con brand pack, Nike tardó 9 min (brief en 1); sin él, El Corte Inglés 25,
 * Calvin Klein 48, y Siroko salió en Arial con grises de plantilla. Lo caro y lo que más falla es lo mismo: que
 * Hermes averigüe la tipografía, los colores y el logo navegando. Aquí se mide en 30-60 s con Playwright desde
 * este Mac (en España) — getComputedStyle de titulares, texto y botones, colores por superficie y el logo de la
 * cabecera convertido a PNG — y se guarda en brands/<marca>/tokens/identidad-medida.json. El brief y el encargo
 * lo reciben ya resuelto, y las siguientes newsletters de la marca lo reutilizan.
 *
 * No sustituye al brand pack (brand-tokens.json, agente 02): si existe, manda él y aquí no se mide nada.
 *
 * Uso suelto:  npx tsx studio/worker/measureBrand.ts <slug> [url] ["Nombre de la marca"]
 */
import * as fs from 'fs';
import * as path from 'path';
import type { Browser, Page } from 'playwright';
import sharp from 'sharp';
import { markBlocked } from './brandMemory';
import { isBlockedPage } from './productSheet';
import { launchBrowser } from './renderChecks';

export interface MeasuredIdentity {
  version: 1;
  measuredAt: string;
  url: string;
  title: string;
  headings: { family: string; weight: string; transform: string; letterSpacing: string; color: string } | null;
  body: { family: string; size: string; color: string } | null;
  /** Fuentes cargadas por la web y si se pueden cargar en un email (Google Fonts). */
  fonts: { family: string; googleFonts: boolean }[];
  /** Hojas de Google Fonts que usa la web (se pueden copiar tal cual en un <link>). */
  fontLinks: string[];
  background: string;
  text: string;
  button: { background: string; color: string; radius: string; transform: string } | null;
  /** Colores con más superficie o más uso (sin blancos, negros ni grises), de más a menos. */
  palette: string[];
  /** Ruta del logo en PNG (relativa a la raíz del repo), o null si no se encontró. */
  logo: string | null;
}

const MEASURE_MAX_AGE_DAYS = 90;
const NAV_TIMEOUT = 25000;

export function measuredIdentityPath(root: string, slug: string): string {
  return path.join(root, 'brands', slug, 'tokens', 'identidad-medida.json');
}

export function readMeasuredIdentity(root: string, slug: string): MeasuredIdentity | null {
  try {
    return JSON.parse(fs.readFileSync(measuredIdentityPath(root, slug), 'utf8')) as MeasuredIdentity;
  } catch {
    return null;
  }
}

export function hasBrandPack(root: string, slug: string): boolean {
  return fs.existsSync(path.join(root, 'brands', slug, 'tokens', 'brand-tokens.json'));
}

/** ¿Hay que medir? Sin brand pack y sin una medición de los últimos 90 días. */
export function needsMeasure(root: string, slug: string): boolean {
  if (!slug || hasBrandPack(root, slug)) return false;
  const m = readMeasuredIdentity(root, slug);
  return !m || Date.now() - Date.parse(m.measuredAt) > MEASURE_MAX_AGE_DAYS * 86400000;
}

function norm(t: string): string {
  return t.toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '').replace(/[^a-z0-9]+/g, '');
}

/** Webs que probar, en orden: la que dé el equipo y después las habituales de España. */
export function candidateUrls(slug: string, given?: string): string[] {
  const out: string[] = [];
  if (given && /^https?:\/\//i.test(given)) out.push(given);
  const bases = [...new Set([slug.replace(/-/g, ''), slug])];
  for (const b of bases) {
    out.push(`https://www.${b}.es/`, `https://www.${b}.com/es/`, `https://www.${b}.com/es-es/`, `https://www.${b}.com/`);
  }
  return [...new Set(out)];
}

/** ¿La página es de la marca? El nombre (sin espacios ni signos) en el dominio, el título o el alt del logo. */
export function looksLikeBrand(name: string, slug: string, finalUrl: string, title: string): boolean {
  const keys = [norm(name), norm(slug)].filter((k) => k.length > 2);
  let host = '';
  try {
    host = norm(new URL(finalUrl).hostname.replace(/^www\./, ''));
  } catch {
    return false;
  }
  return keys.some((k) => host.includes(k) || norm(title).includes(k));
}

const EXTRACT_JS = `function () {
  function vis(el) { var r = el.getBoundingClientRect(); var cs = getComputedStyle(el); return r.width > 0 && r.height > 0 && cs.visibility !== 'hidden' && cs.display !== 'none'; }
  function parse(c) { var m = (c || '').match(/rgba?\\(([^)]+)\\)/); if (!m) return null; var p = m[1].split(',').map(parseFloat); return { r: p[0], g: p[1], b: p[2], a: p.length > 3 ? p[3] : 1 }; }
  function hex(c) { return '#' + [c.r, c.g, c.b].map(function (v) { return ('0' + Math.round(v).toString(16)).slice(-2); }).join(''); }
  function neutral(c) { return Math.max(c.r, c.g, c.b) - Math.min(c.r, c.g, c.b) < 24; }
  function first(sel) { var all = document.querySelectorAll(sel); for (var i = 0; i < all.length; i++) if (vis(all[i]) && (all[i].textContent || '').trim().length > 2) return all[i]; return null; }
  var h = first('h1') || first('h2') || first('h3');
  var headings = null;
  if (h) { var hs = getComputedStyle(h); headings = { family: hs.fontFamily, weight: hs.fontWeight, transform: hs.textTransform, letterSpacing: hs.letterSpacing, color: hex(parse(hs.color) || { r: 0, g: 0, b: 0 }) }; }
  // Texto: la combinación de fuente, tamaño y color con más caracteres entre los párrafos visibles (no el primero que
  // aparezca: suele ser el del hero, blanco sobre foto).
  function lum(c) { return (0.299 * c.r + 0.587 * c.g + 0.114 * c.b) / 255; }
  function bgOf(el) {
    for (var n = el; n && n.nodeType === 1; n = n.parentElement) {
      var c = parse(getComputedStyle(n).backgroundColor);
      if (c && c.a > 0.5) return c;
    }
    return { r: 255, g: 255, b: 255, a: 1 };
  }
  var pageBg = parse(getComputedStyle(document.body).backgroundColor);
  var pageLight = !pageBg || pageBg.a < 0.5 || lum(pageBg) > 0.5;
  var votes = {};
  document.querySelectorAll('p, li').forEach(function (p) {
    var t = (p.textContent || '').trim().length;
    if (t < 20 || t > 1500 || !vis(p)) return;
    // Solo el texto sobre el fondo de la página (no el de una banda o un hero de color).
    if ((lum(bgOf(p)) > 0.5) !== pageLight) return;
    var cs = getComputedStyle(p);
    var key = cs.fontFamily + '|' + cs.fontSize + '|' + hex(parse(cs.color) || { r: 0, g: 0, b: 0 });
    votes[key] = (votes[key] || 0) + t;
  });
  var vk = Object.keys(votes).sort(function (a, b) { return votes[b] - votes[a]; })[0];
  var bs = getComputedStyle(document.body);
  var body = vk ? { family: vk.split('|')[0], size: vk.split('|')[1], color: vk.split('|')[2] } : { family: bs.fontFamily, size: bs.fontSize, color: hex(parse(bs.color) || { r: 0, g: 0, b: 0 }) };
  var bg = parse(getComputedStyle(document.body).backgroundColor);
  var background = bg && bg.a > 0.5 ? hex(bg) : '#ffffff';
  // Botones: el estilo más repetido entre los que tienen fondo de color.
  var buttons = {};
  document.querySelectorAll('button, a[class*="btn"], a[class*="button"], a[class*="Button"], [role="button"], input[type="submit"]').forEach(function (b) {
    if (!vis(b)) return;
    var cs = getComputedStyle(b), c = parse(cs.backgroundColor);
    if (!c || c.a < 0.5) return;
    var key = hex(c) + '|' + hex(parse(cs.color) || { r: 0, g: 0, b: 0 }) + '|' + cs.borderRadius + '|' + cs.textTransform;
    buttons[key] = (buttons[key] || 0) + 1;
  });
  var bk = Object.keys(buttons).sort(function (a, b) { return buttons[b] - buttons[a]; })[0];
  var button = bk ? { background: bk.split('|')[0], color: bk.split('|')[1], radius: bk.split('|')[2], transform: bk.split('|')[3] } : null;
  // Paleta: superficie de cada color de fondo (y, con menos peso, color de textos y enlaces).
  var weight = {};
  document.querySelectorAll('body *').forEach(function (el) {
    var r = el.getBoundingClientRect();
    if (!r.width || !r.height || r.top > 3000) return;
    var cs = getComputedStyle(el), c = parse(cs.backgroundColor);
    if (c && c.a > 0.5 && !neutral(c)) weight[hex(c)] = (weight[hex(c)] || 0) + Math.min(r.width * r.height, 400000);
    var t = parse(cs.color);
    // El azul y el morado por defecto de los enlaces no son de la marca.
    if (t && !neutral(t) && ['#0000ee', '#551a8b', '#0000ff'].indexOf(hex(t)) < 0 && (el.textContent || '').trim().length > 1 && el.children.length === 0) weight[hex(t)] = (weight[hex(t)] || 0) + 3000;
  });
  var palette = Object.keys(weight).sort(function (a, b) { return weight[b] - weight[a]; }).slice(0, 6);
  var fonts = [];
  try { document.fonts.forEach(function (f) { if (f.status === 'loaded' && fonts.indexOf(f.family) < 0) fonts.push(f.family.replace(/["']/g, '')); }); } catch (e) {}
  var links = []; document.querySelectorAll('link[href*="fonts.googleapis.com"]').forEach(function (l) { links.push(l.href); });
  // Logo: en la cabecera, con «logo» en clase, id, alt o src, o el enlace a la portada.
  var cands = document.querySelectorAll('header img, header svg, [class*="logo" i] img, [class*="logo" i] svg, [id*="logo" i] img, [id*="logo" i] svg, img[alt*="logo" i], img[src*="logo" i], a[href="/"] img, a[href="/"] svg, svg[class*="logo" i], img[class*="logo" i]');
  var logo = null;
  for (var i = 0; i < cands.length && !logo; i++) {
    var el = cands[i], r = el.getBoundingClientRect();
    if (!vis(el) || r.top > 260 || r.width < 30 || r.width > 500 || r.height < 10 || r.height > 200) continue;
    el.setAttribute('data-studio-logo', '1');
    var isSvg = el.tagName.toLowerCase() === 'svg';
    logo = { svg: isSvg ? el.outerHTML : null, src: isSvg ? null : (el.currentSrc || el.src), width: r.width, height: r.height, color: getComputedStyle(el).color };
  }
  return { title: document.title, headings: headings, body: body, background: background, text: body.color, button: button, palette: palette, fonts: fonts, links: links, logo: logo };
}`;

interface Extracted {
  title: string;
  headings: MeasuredIdentity['headings'];
  body: MeasuredIdentity['body'];
  background: string;
  text: string;
  button: MeasuredIdentity['button'];
  palette: string[];
  fonts: string[];
  links: string[];
  logo: { svg: string | null; src: string | null; width: number; height: number; color: string } | null;
}

async function acceptCookies(page: Page): Promise<void> {
  const button = page.getByRole('button', { name: /^(aceptar|acepto|aceptar todo|aceptar todas|accept|accept all|allow all|permitir todas|de acuerdo|ok)/i }).first();
  await button.click({ timeout: 2500 }).catch(() => undefined);
}

/** Pinta un SVG suelto, con fondo transparente y al doble de tamaño, como PNG. */
async function svgToPng(browser: Browser, svg: string, width: number, height: number, color: string): Promise<Buffer> {
  const page = await browser.newPage({ viewport: { width: Math.ceil(width), height: Math.ceil(height) }, deviceScaleFactor: 2, javaScriptEnabled: false });
  try {
    const sized = svg.replace(/<svg\b/i, `<svg style="width:${width}px;height:${height}px;display:block"`);
    await page.setContent(`<!doctype html><html><body style="margin:0;background:transparent;color:${color}">${sized}</body></html>`);
    return await page.screenshot({ omitBackground: true, clip: { x: 0, y: 0, width: Math.ceil(width), height: Math.ceil(height) } });
  } finally {
    await page.close();
  }
}

async function saveLogo(browser: Browser, page: Page, logo: NonNullable<Extracted['logo']>, outAbs: string): Promise<boolean> {
  let png: Buffer | null = null;
  if (logo.svg) {
    png = await svgToPng(browser, logo.svg, logo.width, logo.height, logo.color);
  } else if (logo.src) {
    const res = await page.request.get(logo.src, { headers: { Referer: page.url() } }).catch(() => null);
    const buf = res && res.ok() ? await res.body() : null;
    if (buf && /<svg[\s>]/i.test(buf.subarray(0, 2000).toString('utf8'))) {
      png = await svgToPng(browser, buf.toString('utf8'), logo.width, logo.height, logo.color);
    } else if (buf) {
      png = await sharp(buf).png().toBuffer().catch(() => null);
    }
    // Si la web no deja descargarlo, una captura del propio elemento.
    if (!png) png = await page.locator('[data-studio-logo="1"]').first().screenshot({ omitBackground: true }).catch(() => null);
  }
  if (!png) return false;
  fs.mkdirSync(path.dirname(outAbs), { recursive: true });
  fs.writeFileSync(outAbs, png);
  return true;
}

function cleanFamily(f: string): string {
  return f.split(',')[0].trim().replace(/^['"]|['"]$/g, '');
}

/** Mide la web y guarda identidad-medida.json (y el logo). Devuelve null si ninguna web candidata es de la marca. */
export async function measureBrand(root: string, slug: string, name: string, givenUrl?: string): Promise<MeasuredIdentity | null> {
  const browser = await launchBrowser();
  try {
    const context = await browser.newContext({
      locale: 'es-ES',
      viewport: { width: 1280, height: 900 },
      deviceScaleFactor: 2,
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36',
    });
    for (const url of candidateUrls(slug, givenUrl)) {
      const page = await context.newPage();
      try {
        const res = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: NAV_TIMEOUT }).catch(() => null);
        // Memoria de bloqueos (punto 2, 2026-10-07): solo con la web que da el equipo (las adivinadas pueden no ser suyas).
        if (res && url === givenUrl && isBlockedPage(res.status(), await page.title().catch(() => ''))) markBlocked(root, slug, url, 'medición de identidad');
        if (!res || res.status() >= 400) continue;
        await page.waitForLoadState('networkidle', { timeout: 8000 }).catch(() => undefined);
        await acceptCookies(page);
        const title = await page.title().catch(() => '');
        if (!looksLikeBrand(name, slug, page.url(), title)) continue;
        const x = (await page.evaluate(`(${EXTRACT_JS})()`)) as Extracted;
        const logoRel = path.join('brands', slug, 'design-input', 'logo-medido.png');
        const logoOk = x.logo ? await saveLogo(browser, page, x.logo, path.join(root, logoRel)).catch(() => false) : false;
        // Familias de Google Fonts: las de los <link> de la web (aunque no hayan terminado de cargar).
        const google = new Set(x.links.flatMap((l) => [...l.matchAll(/family=([^&:]+)/g)].map((m) => decodeURIComponent(m[1]).replace(/\+/g, ' ').toLowerCase())));
        const used = [x.headings?.family, x.body?.family].filter((f): f is string => !!f).map(cleanFamily);
        const families = [...new Set([...used, ...x.fonts])].filter((f) => f && !/^(sans-serif|serif|system-ui|-apple-system|arial|helvetica)$/i.test(f));
        const identity: MeasuredIdentity = {
          version: 1,
          measuredAt: new Date().toISOString(),
          url: page.url(),
          title: title.slice(0, 200),
          headings: x.headings,
          body: x.body,
          fonts: families.slice(0, 8).map((f) => ({ family: f, googleFonts: google.has(f.toLowerCase()) })),
          fontLinks: x.links.slice(0, 4),
          background: x.background,
          text: x.text,
          button: x.button,
          palette: x.palette,
          logo: logoOk ? logoRel : null,
        };
        const out = measuredIdentityPath(root, slug);
        fs.mkdirSync(path.dirname(out), { recursive: true });
        fs.writeFileSync(out, JSON.stringify(identity, null, 2));
        return identity;
      } finally {
        await page.close().catch(() => undefined);
      }
    }
    return null;
  } finally {
    await browser.close().catch(() => undefined);
  }
}

/** Nota para el brief y el encargo: la identidad ya medida, para que Hermes no la vuelva a buscar. */
export function identityNote(m: MeasuredIdentity): string {
  const head = m.headings ? cleanFamily(m.headings.family) : null;
  const body = m.body ? cleanFamily(m.body.family) : null;
  const embeddable = m.fonts.filter((f) => f.googleFonts).map((f) => f.family);
  return [
    '',
    `## Identidad de la marca ya medida en su web (Studio, ${m.measuredAt.slice(0, 10)}, ${m.url})`,
    '- Medida automáticamente con getComputedStyle. Úsala tal cual; no la vuelvas a medir salvo que veas en la web que no cuadra.',
    head ? `- Titulares: ${head} (peso ${m.headings!.weight}${m.headings!.transform !== 'none' ? `, ${m.headings!.transform}` : ''}, color ${m.headings!.color}).` : '',
    body ? `- Texto: ${body} (${m.body!.size}, color ${m.body!.color}).` : '',
    embeddable.length
      ? `- Se pueden cargar en el email (Google Fonts): ${embeddable.join(', ')}${m.fontLinks[0] ? ` — <link href="${m.fontLinks[0]}">` : ''}.`
      : '- La fuente de la web no está en Google Fonts: busca la alternativa web más parecida y dilo en notas.md.',
    `- Fondo ${m.background}, texto ${m.text}.`,
    m.button ? `- Botón: fondo ${m.button.background}, texto ${m.button.color}, radio ${m.button.radius}${m.button.transform !== 'none' ? `, ${m.button.transform}` : ''}.` : '',
    m.palette.length ? `- Colores de marca por superficie: ${m.palette.join(', ')}.` : '',
    m.logo ? `- Logo oficial ya descargado en PNG: ${m.logo} (Studio lo copia a la carpeta de la newsletter como logo-medido.png).` : '- No se encontró el logo en la cabecera: descárgalo tú (PNG).',
  ]
    .filter(Boolean)
    .join('\n');
}

if (require.main === module) {
  const [slug, url, name] = process.argv.slice(2);
  if (!slug) {
    console.error('Uso: npx tsx studio/worker/measureBrand.ts <slug> [url] ["Nombre"]');
    process.exit(1);
  }
  const root = path.resolve(__dirname, '..', '..');
  measureBrand(root, slug, name || slug, url)
    .then((m) => {
      if (!m) {
        console.error('No se encontró la web de la marca. Pasa la URL como segundo argumento.');
        process.exitCode = 1;
        return;
      }
      console.log(identityNote(m));
    })
    .catch((err) => {
      console.error(err);
      process.exitCode = 1;
    });
}
