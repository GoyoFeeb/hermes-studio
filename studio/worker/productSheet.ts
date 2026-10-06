/**
 * productSheet.ts — ficha de producto extraída por Studio antes de la primera versión (2026-10-06).
 *
 * Paredes (2026-10-05): la primera versión tardó 37 min y 12 de ellos fueron Hermes navegando paredes.es para sacar
 * lo que el brief había dejado «pendiente»: el precio, el umbral de envío (la ficha decía 25 € en un sitio y 29,99 € en
 * otro) y las URL de las fotos. Es trabajo mecánico: aquí se hace con Chromium en unos segundos.
 * - Páginas: las URL de ficha de producto que cita el brief (no la home ni imágenes sueltas), como mucho 3.
 * - Precio: solo de los datos estructurados de la página (JSON-LD Product, microdatos o metas de producto). Lo que se
 *   lee «a ojo» del texto no cuenta: si no hay dato estructurado, la nota dice que no se ponga.
 * - Envío: frases literales de la página. Si dan umbrales distintos, la nota dice que no se cite.
 * - Fotos: las grandes de la ficha, descargadas con fetchImage (comprobadas y comprimidas) y una hoja de contacto
 *   numerada en _trabajo/fotos-producto.png para elegir con una sola mirada.
 *
 * Galería de campaña (2026-10-06, punto 2 de la auditoría): de las 10 últimas piezas, solo una recibió fotos de Studio
 * (las de la ficha); Adeslas salió con 1 foto y Polo con 2, sin imagen principal. Además de las fichas, se leen las
 * páginas oficiales que el brief cita en «6. Imágenes» y la portada medida de la marca: hasta 15 fotos, con su tamaño,
 * y las horizontales de ≥ 1000 px marcadas como candidatas a imagen principal. El resumen va a _trabajo/galeria.json,
 * que lee la comprobación de la imagen principal (photoFindings, renderChecks.ts).
 *
 * Uso suelto:  npx tsx studio/worker/productSheet.ts <carpeta-del-trabajo> <url> [url…]
 */
import * as fs from 'fs';
import * as path from 'path';
import sharp from 'sharp';
import { launchBrowser } from './renderChecks';
import { fetchImage, saveImage } from './fetch-image';

export const BROWSER_UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36';
const UA = BROWSER_UA;
const MAX_PAGES = 3;
const MAX_PHOTOS = 15;
/** De las fichas, como mucho estas: el resto del cupo es para las fotos de campaña. */
const MAX_PRODUCT_PHOTOS = 8;
/** Fotos por página de galería (la portada trae muchas). */
const MAX_PER_GALLERY_PAGE = 4;
/** Páginas de galería: las de la sección 6 del brief más la portada. */
const MAX_GALLERY_PAGES = 3;
/** Candidata a imagen principal: horizontal y ancha (fetchImage la deja en 1200 px como mucho). */
export const HERO_MIN_WIDTH = 1000;
export const HERO_MIN_RATIO = 1.2;
/** Resumen de la galería, en `_trabajo/` (lo lee inspect.ts). */
export const GALLERY_FILE = 'galeria.json';
const SKIP_HOSTS = /(^|\.)(google|googleapis|gstatic|facebook|instagram|twitter|x|tiktok|youtube|pinterest|linkedin|wikipedia)\.[a-z.]+$/i;
const IMAGE_EXT = /\.(jpe?g|png|gif|webp|avif|svg)(\?|$)/i;

export interface ProductPage {
  url: string;
  title: string | null;
  price: { amount: number; currency: string; source: string } | null;
  shipping: string[];
  images: string[];
  /** 'gallery': página de campaña o portada (solo fotos). */
  kind?: 'product' | 'gallery';
  /** La web no deja leer la página a un navegador automático (403 de Akamai o Cloudflare, «Un momento…»). */
  blocked?: boolean;
}

/** ¿Página de bloqueo anti-robots en vez de la de la marca? El 2026-10-06, segurcaixaadeslas.es («Un momento…») y
 *  ralphlauren.es («Access Denied») respondían 403 al navegador de Studio. No se intenta saltar el bloqueo. */
export function isBlockedPage(status: number | null | undefined, title: string): boolean {
  if (status === 403 || status === 429 || status === 503) return true;
  return /^\s*(access denied|un momento|just a moment|attention required|acceso denegado|forbidden|request blocked)\b/i.test(title || '');
}

export interface GalleryPhoto {
  file: string;
  from: string;
  width?: number;
  height?: number;
  hero?: boolean;
}

export interface ProductSheet {
  pages: ProductPage[];
  photos: GalleryPhoto[];
  contactSheet: string | null;
}

/** URL de ficha de producto citadas en un texto (brief): sin la home, sin imágenes sueltas ni redes. Si alguna parece
 *  ficha con claridad (.html, /p/, /product…, o un código de referencia con letras y números como DC26164), solo esas:
 *  el 2026-10-06 la página de categoría «/es/1048-novedades» de Paredes contaba como ficha por llevar un número y
 *  colaba la foto de otro producto. Si ninguna lo parece, todas (en orden de aparición). */
export function productUrls(text: string): string[] {
  const urls = pageUrls(text);
  const strong = urls.filter((u) => looksProduct(u));
  return (strong.length ? strong : urls).slice(0, MAX_PAGES);
}

/** URL de páginas citadas en un texto (sin la home, imágenes sueltas ni redes), en orden y sin repetir. */
function pageUrls(text: string): string[] {
  const seen = new Set<string>();
  const urls: string[] = [];
  for (const m of text.matchAll(/https?:\/\/[^\s<>()\]"'`«»]+/g)) {
    const raw = m[0].replace(/[.,;:]+$/, '');
    let u: URL;
    try {
      u = new URL(raw);
    } catch {
      continue;
    }
    if (SKIP_HOSTS.test(u.hostname) || IMAGE_EXT.test(u.pathname)) continue;
    // La home o la portada de un idioma (/, /es/, /es-es/) no es una ficha.
    if (/^\/?([a-z]{2}([-_][a-z]{2})?\/?)?$/i.test(u.pathname)) continue;
    const key = `${u.hostname}${u.pathname}`.replace(/\/$/, '');
    if (seen.has(key)) continue;
    seen.add(key);
    urls.push(u.toString());
  }
  return urls;
}

/** Dominio registrable aproximado (paredes.es, segurcaixaadeslas.es): las fotos de campaña solo de la marca. */
const siteOf = (u: string): string => {
  try {
    return new URL(u).hostname.split('.').slice(-2).join('.');
  } catch {
    return '';
  }
};

/** Portada de la marca cuando no está medida (con brand pack no se mide: 17 de 18 marcas): el dominio oficial que más
 *  cita el brief, con URL o escrito a secas («segurcaixaadeslas.es»); a secas, solo si lleva una palabra de la marca. */
export function brandHome(text: string, slug: string): string | null {
  const count = new Map<string, number>();
  const add = (host: string, n = 1): void => {
    host = host.toLowerCase().replace(/\.$/, '');
    if (SKIP_HOSTS.test(host) || /^(fonts|cdn|static|assets|img|images|media)\./.test(host) || !/\.[a-z]{2,}$/.test(host)) return;
    count.set(host, (count.get(host) || 0) + n);
  };
  for (const m of text.matchAll(/https?:\/\/([a-z0-9.-]+)/gi)) add(m[1]);
  if (!count.size) {
    const words = slug.toLowerCase().split('-').filter((w) => w.length >= 4);
    for (const m of text.matchAll(/\b((?:www\.)?[a-z0-9-]+\.(?:es|com|eu|net|org|shop|store))\b/gi)) {
      if (words.some((w) => m[1].toLowerCase().includes(w))) add(m[1]);
    }
  }
  const best = [...count.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
  return best ? `https://${best}/` : null;
}

/** Páginas de la galería de campaña: las que el brief cita en «6. Imágenes» (que no sean ya fichas) y la portada de la
 *  marca, solo del dominio de la marca (el de la portada o el de las fichas). */
export function galleryUrls(text: string, home?: string | null): string[] {
  const products = productUrls(text);
  const sites = new Set([...(home ? [siteOf(home)] : []), ...products.map(siteOf)].filter(Boolean));
  const sec6 = text.match(/^#{2,3}\s*6\.?[^\n]*\n([\s\S]*?)(?=^#{1,3}\s*\d+\.|(?![\s\S]))/m)?.[1] || '';
  const pages = pageUrls(sec6).filter((u) => !products.includes(u) && (!sites.size || sites.has(siteOf(u))));
  const out = pages.slice(0, home ? MAX_GALLERY_PAGES - 1 : MAX_GALLERY_PAGES);
  if (home && !out.some((u) => u.replace(/\/$/, '') === home.replace(/\/$/, ''))) out.push(home);
  return out;
}

/** Señal clara de ficha de producto en la ruta. Un número suelto no lo es (las categorías también lo llevan). */
export function looksProduct(url: string): boolean {
  let p: string;
  try {
    p = new URL(url).pathname;
  } catch {
    return false;
  }
  // Código de referencia: letras y dígitos mezclados (DC26164, IB1873-702, S1bYkOza); no un número ni una palabra.
  const code = p.split(/[\/_.-]/).some((t) => t.length >= 5 && /[a-z]/i.test(t) && /\d/.test(t));
  return /\.html?$|\/p\/|\/products?\/|\/producto|\/t\//i.test(p) || code;
}

/** Umbrales distintos de «envío gratis» en las frases de envío (25 € y 29,99 € en Paredes). */
export function shippingThresholds(lines: string[]): number[] {
  const values = new Set<number>();
  for (const line of lines) {
    if (!/gratis|gratuit|free/i.test(line)) continue;
    // Solo el umbral («a partir de 29,99 €», «superiores a 25€»), no el coste del envío («si no, 6 €»).
    for (const m of line.matchAll(/(?:a partir de|superiores? a|m[aá]s de|desde|over)\s*(\d{1,4}(?:[.,]\d{1,2})?)\s?(?:€|eur)/gi)) {
      values.add(Number(m[1].replace(',', '.')));
    }
  }
  return [...values].sort((a, b) => a - b);
}

export function formatEuros(amount: number, currency: string): string {
  const n = amount.toFixed(2).replace('.', ',').replace(/,00$/, '');
  return currency.toUpperCase() === 'EUR' ? `${n} €` : `${n} ${currency}`;
}

/** Lo que se lee de la página, dentro del navegador (sin dependencias: va serializado a page.evaluate). */
function extractInPage(): { title: string | null; price: { amount: number; currency: string; source: string } | null; shipping: string[]; images: string[]; structured: number } {
  const abs = (u: string): string => {
    try {
      return new URL(u, location.href).toString();
    } catch {
      return '';
    }
  };
  const images: string[] = [];
  const addImg = (u: unknown): void => {
    if (typeof u === 'string' && u) images.push(abs(u));
    else if (Array.isArray(u)) u.forEach(addImg);
    else if (u && typeof u === 'object' && 'url' in (u as Record<string, unknown>)) addImg((u as Record<string, unknown>).url);
  };
  let title: string | null = null;
  let price: { amount: number; currency: string; source: string } | null = null;
  const products: Record<string, unknown>[] = [];
  const walk = (n: unknown): void => {
    if (!n || typeof n !== 'object') return;
    if (Array.isArray(n)) return n.forEach(walk);
    const o = n as Record<string, unknown>;
    const t = o['@type'];
    if (t === 'Product' || (Array.isArray(t) && t.includes('Product'))) products.push(o);
    if (o['@graph']) walk(o['@graph']);
  };
  for (const s of Array.from(document.querySelectorAll('script[type="application/ld+json"]'))) {
    try {
      walk(JSON.parse(s.textContent || ''));
    } catch {
      // JSON-LD roto: se ignora
    }
  }
  for (const p of products) {
    title = title || (typeof p.name === 'string' ? p.name : null);
    addImg(p.image);
    const offers = ([] as unknown[]).concat(p.offers || []);
    for (const off of offers) {
      const o = (off || {}) as Record<string, unknown>;
      const amount = Number(String(o.price ?? o.lowPrice ?? '').replace(',', '.'));
      if (!price && amount > 0) price = { amount, currency: String(o.priceCurrency || 'EUR'), source: 'JSON-LD' };
    }
  }
  if (!price) {
    const meta = (sel: string): string | null => document.querySelector(sel)?.getAttribute('content') || null;
    const amount = Number((meta('meta[property="product:price:amount"]') || meta('meta[property="og:price:amount"]') || meta('[itemprop="price"]') || '').replace(',', '.'));
    if (amount > 0) {
      price = {
        amount,
        currency: meta('meta[property="product:price:currency"]') || meta('meta[property="og:price:currency"]') || meta('[itemprop="priceCurrency"]') || 'EUR',
        source: 'metadatos de producto',
      };
    }
  }
  // Sin datos estructurados (Nike): el elemento de precio de la ficha (clase, id o data-testid con «price»/«precio»).
  if (!price) {
    for (const el of Array.from(document.querySelectorAll('[class*="price" i], [id*="price" i], [data-testid*="price" i], [class*="precio" i]'))) {
      const m = (el.textContent || '').replace(/\s+/g, ' ').match(/(\d{1,4}(?:[.,]\d{2})?)\s?€/);
      if (m && el.textContent!.length < 60) {
        price = { amount: Number(m[1].replace('.', '').replace(',', '.')), currency: 'EUR', source: 'precio visible en la ficha' };
        break;
      }
    }
  }
  title = title || document.querySelector('h1')?.textContent?.trim() || null;
  addImg(document.querySelector('meta[property="og:image"]')?.getAttribute('content'));
  const structured = new Set(images.filter(Boolean)).size;
  // Galería: solo imágenes del dominio de la marca o de los mismos servidores que las de los datos de producto. En
  // Paredes se colaban los banners de otra campaña servidos por una herramienta de marketing (connectif.cloud).
  const label = (h: string): string => h.split('.').slice(-2)[0];
  const okHosts = new Set([label(location.hostname), ...images.map((u) => { try { return label(new URL(u).hostname); } catch { return ''; } })]);
  for (const img of Array.from(document.images)) {
    const src = img.currentSrc || img.src;
    let host = '';
    try {
      host = label(new URL(src).hostname);
    } catch {
      continue;
    }
    if (okHosts.has(host) && img.naturalWidth >= 500 && img.naturalHeight >= 400 && !/logo|icon|sprite|payment/i.test(src)) addImg(src);
  }
  // Envío: también el texto de pestañas y acordeones cerrados (innerText no lo ve: en Paredes, «25 €» y «29,99 €»).
  const found: string[] = [];
  for (const el of Array.from(document.body.querySelectorAll('p, li, span, dd, dt, td, h2, h3, h4, h5, strong, b, div'))) {
    const text = (el.textContent || '').replace(/\s+/g, ' ').trim();
    if (text.length > 8 && text.length <= 200 && /env[ií]os?|entrega|devoluci/i.test(text) && /€|gratis|gratuit|\d+\s*(h|horas|d[ií]as)/i.test(text)) found.push(text);
  }
  // Se queda la frase más corta: un bloque que contiene a otra ya encontrada sobra.
  const shipping = Array.from(new Set(found)).filter((t, _, all) => !all.some((o) => o !== t && t.includes(o))).slice(0, 6);
  return { title, price, shipping, images: Array.from(new Set(images.filter(Boolean))), structured };
}

/** Las fotos de la galería que son de ESTE producto: en Paredes, junto a la Eden negro salían la Tolox, la Legaria y la
 *  Eden kaki (recomendados). Se quedan las que más palabras comparten con la URL de la ficha; si ninguna comparte
 *  nada (nombres de archivo con hash, como en Shopify), todas. */
export function ownGallery(pageUrl: string, imgs: string[]): string[] {
  const words = (u: string): string[] => decodeURIComponent(u).toLowerCase().split(/[^a-z0-9áéíóúñü]+/).filter((w) => w.length >= 4 && !/^\d+$/.test(w));
  let slug: string[] = [];
  try {
    slug = words(new URL(pageUrl).pathname.split('/').filter(Boolean).pop() || '');
  } catch {
    return imgs;
  }
  const score = (img: string): number => {
    try {
      const file = words(new URL(img).pathname.split('/').pop() || '');
      return slug.filter((w) => file.includes(w)).length;
    } catch {
      return 0;
    }
  };
  const best = Math.max(0, ...imgs.map(score));
  return best === 0 ? imgs : imgs.filter((i) => score(i) === best);
}

/** Fotos que el navegador ya recibió al cargar las páginas, por URL: se guardan de aquí en vez de pedirlas otra vez
 *  (el 2026-10-06, la portada de Adeslas cargaba sus 15 fotos y luego daba 403 a cada descarga suelta). */
type Received = Map<string, Buffer>;
const MIN_RECEIVED_BYTES = 15 * 1024;
const MAX_RECEIVED = 80;

async function readPages(urls: string[], galleryFrom = urls.length): Promise<{ pages: ProductPage[]; received: Received }> {
  const browser = await launchBrowser();
  const pages: ProductPage[] = [];
  const received: Received = new Map();
  try {
    const ctx = await browser.newContext({ userAgent: UA, locale: 'es-ES', viewport: { width: 1280, height: 900 }, extraHTTPHeaders: { 'Accept-Language': 'es-ES,es;q=0.9' } });
    // tsx compila con keepNames: las funciones anidadas de extractInPage llaman a __name, que en la página no existe.
    await ctx.addInitScript({ content: 'globalThis.__name = globalThis.__name || ((f) => f);' });
    for (const [n, url] of urls.entries()) {
      const gallery = n >= galleryFrom;
      const page = await ctx.newPage();
      const pending: Promise<void>[] = [];
      page.on('response', (r) => {
        if (r.request().resourceType() !== 'image' || !r.ok() || received.size >= MAX_RECEIVED) return;
        pending.push(
          r.body().then(
            (b) => {
              if (b.length >= MIN_RECEIVED_BYTES && !received.has(r.url())) received.set(r.url(), b);
            },
            () => undefined
          )
        );
      });
      try {
        const res = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 25000 });
        await page.waitForLoadState('load', { timeout: 10000 }).catch(() => undefined);
        if (isBlockedPage(res?.status(), await page.title().catch(() => ''))) {
          if (process.env.PRODUCT_SHEET_DEBUG) console.error(`${url}: bloqueada (${res?.status()})`);
          pages.push({ url, title: null, price: null, shipping: [], images: [], kind: gallery ? 'gallery' : 'product', blocked: true });
          continue;
        }
        // Galerías con carga diferida: se baja la página por tramos para que carguen.
        for (let y = 0; y < 4; y++) {
          await page.mouse.wheel(0, 900);
          await page.waitForTimeout(400);
        }
        const { structured, images, ...data } = await page.evaluate(extractInPage);
        await Promise.all(pending);
        // En una página de campaña o la portada no hay «este producto»: valen todas las fotos grandes de la marca.
        const imgs = gallery ? images : [...images.slice(0, structured), ...ownGallery(url, images.slice(structured))];
        pages.push({ url, ...data, images: imgs, kind: gallery ? 'gallery' : 'product' });
      } catch (err) {
        if (process.env.PRODUCT_SHEET_DEBUG) console.error(`${url}: ${(err as Error).message}`);
        pages.push({ url, title: null, price: null, shipping: [], images: [], kind: gallery ? 'gallery' : 'product' });
      } finally {
        await page.close().catch(() => undefined);
      }
    }
  } finally {
    await browser.close().catch(() => undefined);
  }
  return { pages, received };
}

/** Hoja de contacto numerada (4 columnas de 280 px) para elegir las fotos con una sola mirada. */
async function contactSheet(files: string[], out: string, hero: boolean[] = []): Promise<string | null> {
  if (!files.length) return null;
  const cell = 280;
  const cols = Math.min(4, files.length);
  const rows = Math.ceil(files.length / cols);
  const tiles = await Promise.all(
    files.map(async (f, i) => {
      const img = await sharp(f).resize(cell - 16, cell - 16, { fit: 'contain', background: '#ffffff' }).toBuffer();
      const label = Buffer.from(
        hero[i]
          ? `<svg width="64" height="28"><rect width="64" height="28" rx="4" fill="#c4161c"/><text x="32" y="20" font-family="Arial" font-size="16" fill="#fff" text-anchor="middle">${i + 1} ★</text></svg>`
          : `<svg width="40" height="28"><rect width="40" height="28" rx="4" fill="#111"/><text x="20" y="20" font-family="Arial" font-size="16" fill="#fff" text-anchor="middle">${i + 1}</text></svg>`
      );
      return [
        { input: img, left: (i % cols) * cell + 8, top: Math.floor(i / cols) * cell + 8 },
        { input: label, left: (i % cols) * cell + 12, top: Math.floor(i / cols) * cell + 12 },
      ];
    })
  );
  await sharp({ create: { width: cols * cell, height: rows * cell, channels: 3, background: '#eeeeee' } })
    .composite(tiles.flat())
    .png()
    .toFile(out);
  return out;
}

/** Tamaño que devuelve fetchImage («foto-1.jpg (1200×800, 90 KB)») y si es candidata a imagen principal. */
export function photoSize(saved: string): { width?: number; height?: number; hero: boolean } {
  const m = saved.match(/\((\d+)×(\d+)/);
  if (!m) return { hero: false };
  const width = Number(m[1]);
  const height = Number(m[2]);
  return { width, height, hero: width >= HERO_MIN_WIDTH && width / height >= HERO_MIN_RATIO };
}

/** Lee las fichas y las páginas de la galería, descarga las fotos (salvo con imágenes de IA) y deja la hoja de
 *  contacto y el resumen de la galería. */
export async function buildProductSheet(urls: string[], outAbs: string, opts: { photos?: boolean; gallery?: string[] } = {}): Promise<ProductSheet> {
  const products = urls.slice(0, MAX_PAGES);
  const { pages, received } = await readPages([...products, ...(opts.photos === false ? [] : opts.gallery || [])], products.length);
  const photos: GalleryPhoto[] = [];
  if (opts.photos !== false) {
    // Si alguna página es una ficha de verdad (tiene precio de producto), las fotos de producto salen solo de las
    // fichas: una página sin precio entre ellas suele ser una categoría o una portada con fotos de otros productos.
    const productPages = pages.filter((p) => p.kind !== 'gallery');
    const sources = productPages.some((p) => p.price) ? productPages.filter((p) => p.price) : productPages;
    const queue = [
      ...sources.flatMap((p) => p.images.map((img) => ({ img, from: p.url, gallery: false }))),
      ...pages.filter((p) => p.kind === 'gallery').flatMap((p) => p.images.map((img) => ({ img, from: p.url, gallery: true }))),
    ];
    const seen = new Set<string>();
    const perPage = new Map<string, number>();
    let fromProducts = 0;
    for (const { img, from, gallery } of queue) {
      if (photos.length >= MAX_PHOTOS) break;
      if (!gallery && fromProducts >= MAX_PRODUCT_PHOTOS) continue;
      if (gallery && (perPage.get(from) || 0) >= MAX_PER_GALLERY_PAGE) continue;
      // La misma foto en otro tamaño (…-large_default/…, ?w=800): se descarga una vez.
      const key = img.replace(/[?#].*$/, '').replace(/[-_](large|medium|small|home|thumb)[-_]default/i, '');
      if (seen.has(key)) continue;
      seen.add(key);
      try {
        const name = `foto-${photos.length + 1}`;
        const got = received.get(img);
        const saved = got ? await saveImage(got, img, outAbs, name).catch(() => fetchImage(img, outAbs, name)) : await fetchImage(img, outAbs, name);
        photos.push({ file: saved, from: img, ...photoSize(saved) });
        if (gallery) perPage.set(from, (perPage.get(from) || 0) + 1);
        else fromProducts++;
      } catch {
        // foto que no se deja descargar: se sigue con las demás
      }
    }
  }
  const sheetFile = path.join(outAbs, '_trabajo', 'fotos-producto.png');
  fs.mkdirSync(path.dirname(sheetFile), { recursive: true });
  const files = photos.map((p) => path.join(outAbs, p.file.split(' ')[0]));
  const sheet = await contactSheet(files, sheetFile, photos.map((p) => !!p.hero)).catch(() => null);
  if (opts.photos !== false) {
    fs.writeFileSync(
      path.join(outAbs, '_trabajo', GALLERY_FILE),
      JSON.stringify(
        { photos: photos.length, heroCandidates: photos.filter((p) => p.hero).map((p) => p.file.split(' ')[0]), blocked: pages.filter((p) => p.blocked).map((p) => p.url) },
        null,
        2
      )
    );
  }
  return { pages, photos, contactSheet: sheet };
}

/** Sección del encargo con lo extraído: Hermes no tiene que volver a navegar estas páginas. */
export function productSheetNote(sheet: ProductSheet, outputDir: string): string {
  const useful = sheet.pages.filter((p) => p.kind !== 'gallery' && (p.title || p.price || p.shipping.length || p.images.length));
  const blocked = sheet.pages.filter((p) => p.blocked).map((p) => p.url);
  if (!useful.length && !sheet.photos.length && !blocked.length) return '';
  const lines = ['', '## Ficha de producto y galería de campaña ya extraídas por Studio (no vuelvas a navegar estas páginas)'];
  if (blocked.length) {
    lines.push(`- La web oficial bloquea la lectura automática de Studio en: ${blocked.join(', ')}. De ahí no hay datos ni fotos de Studio.`);
    if (!sheet.photos.some((p) => p.hero)) {
      lines.push('- Imagen principal OBLIGATORIA igualmente: elige tú una foto oficial de la campaña (`npm run fetch-image` o tus herramientas) y ponla a todo el ancho (600 px) como primer bloque tras el logo.');
    }
  }
  for (const p of useful) {
    lines.push(`- ${p.url}${p.title ? ` — «${p.title}»` : ''}`);
    lines.push(
      p.price
        ? `  · Precio: ${formatEuros(p.price.amount, p.price.currency)} (${p.price.source} de la página; es el dato verificado, cítalo con esta URL).`
        : '  · Precio: no se encontró en la página. Si el brief no lo trae con fuente, no pongas precio.'
    );
    if (p.shipping.length) {
      lines.push(`  · Envío, texto literal de la página: ${p.shipping.map((s) => `«${s}»`).join('; ')}.`);
      const t = shippingThresholds(p.shipping);
      if (t.length > 1) lines.push(`  · La página da umbrales de envío gratis distintos (${t.map((v) => formatEuros(v, 'EUR')).join(' y ')}): NO cites el envío gratis.`);
    }
  }
  if (sheet.photos.length) {
    const gallery = sheet.pages.filter((p) => p.kind === 'gallery').map((p) => p.url);
    if (gallery.length) lines.push(`- Galería de campaña leída de: ${gallery.join(', ')}`);
    lines.push(`- Fotos oficiales ya descargadas en ${outputDir}/ (enlázalas con esa ruta relativa, ya comprobadas y comprimidas):`);
    for (const ph of sheet.photos) lines.push(`  · ${ph.file}${ph.hero ? ' ★ candidata a imagen principal' : ''} — de ${ph.from}`);
    if (sheet.contactSheet) {
      lines.push(`- Hoja de contacto numerada con todas (★ = candidata a imagen principal): ${outputDir}/_trabajo/fotos-producto.png. Mírala UNA vez para elegir.`);
    }
    const heroes = sheet.photos.filter((p) => p.hero).length;
    lines.push(
      heroes
        ? '- Imagen principal OBLIGATORIA: el primer bloque tras el logo es una foto a todo el ancho (600 px) elegida entre las ★ (Studio lo comprueba).'
        : '- Imagen principal OBLIGATORIA: el primer bloque tras el logo es una foto a todo el ancho (600 px); ninguna es horizontal grande, así que recorta la que mejor funcione.'
    );
    if (sheet.photos.length >= 5) lines.push('- Usa al menos 3 fotos distintas de la galería y no repitas ninguna: una pieza de una sola foto parece una plantilla.');
    lines.push('- Si te falta una foto concreta, `npm run fetch-image` una vez; para lo demás, no navegues.');
  }
  return lines.join('\n');
}

if (require.main === module) {
  const [dir, ...urls] = process.argv.slice(2);
  if (!dir || !urls.length) {
    console.error('Uso: npx tsx studio/worker/productSheet.ts <carpeta-del-trabajo> <url> [url…]');
    process.exit(2);
  }
  const outAbs = path.resolve(process.cwd(), dir);
  buildProductSheet(productUrls(urls.join(' ')), outAbs, { gallery: urls.filter((u) => !looksProduct(u)) })
    .then((s) => console.log(productSheetNote(s, dir) || 'No se pudo extraer nada de esas páginas.'))
    .catch((err) => {
      console.error(err);
      process.exitCode = 1;
    });
}
