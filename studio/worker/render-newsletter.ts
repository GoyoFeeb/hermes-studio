/**
 * render-newsletter.ts — una sola hoja con la pieza a 600 px, a 375 px y en oscuro (2026-10-06).
 *
 * Hermes se escribía en cada pieza su propio render.js/verify.js, levantaba un servidor local y miraba 3-6 capturas
 * con vision_analyze (159 llamadas y 47 min en las sesiones del 24-sep al 5-oct). Con esto: un comando y una imagen.
 * La revisión de dirección de arte del worker usa la misma hoja.
 *
 * Uso:  npm run render-newsletter -- <ruta/newsletter.html>
 * Deja en <carpeta>/_trabajo/: render-600.png, render-375.png, render-oscuro.png, render-hoja.jpg (las tres juntas) y
 * render-escritorio.jpg (la de 600 px a tamaño real, en tramos, para la revisión de arte).
 */
import * as fs from 'fs';
import * as path from 'path';
import sharp from 'sharp';
import type { Browser } from 'playwright';
import { MOBILE_WIDTH, launchBrowser } from './renderChecks';
import { BROWSER_UA, isBlockedPage } from './productSheet';

/** Ancho de cada columna en la hoja: se lee la composición, no la letra pequeña (para eso, las capturas sueltas). */
const SHEET_COL = 420;
/** Alto máximo de la hoja antes de reducirla. Si una columna lo pasa, se reducen las tres por igual: antes se recortaba
 *  lo que sobraba, y la de 375 px (ampliada al ancho común, la más alta) perdía su final, botón y pie incluidos (Nike y
 *  El Corte Inglés, 06-10: la revisión de arte puso un 2 en móvil por un corte que no estaba en la pieza). */
const SHEET_MAX_H = 3000;
/** Alto final de la hoja, en JPEG: el modelo de visión auxiliar de Hermes no pudo analizar la hoja de 1356×3000 en PNG
 *  (1,4 MB) y sí la de 2000 px de alto en JPEG (180 KB) — 2026-10-06. */
const SHEET_OUT_H = 2000;

/** Ventana de las capturas de escritorio: por encima de la media query de móvil (620 px). */
const DESKTOP_SHOT = 640;

export interface RenderSheet {
  sheet: string;
  shots: string[];
  /** La columna de 600 px a tamaño real, en tramos (render-escritorio.jpg), para la revisión de arte. */
  desktop?: { path: string; width: number; height: number };
}

/** Ancho común de las columnas de la hoja: SHEET_COL, o menos si la columna más alta (alturas a SHEET_COL de ancho) no
 *  cabría en SHEET_MAX_H con la etiqueta. */
export function sheetColumnWidth(heightsAtCol: number[], head = 36): number {
  const tallest = Math.max(1, ...heightsAtCol);
  return Math.max(120, Math.floor(SHEET_COL * Math.min(1, (SHEET_MAX_H - head) / tallest)));
}

/** Alto de una captura escalada a `width` de ancho. */
async function sheetHeightAt(file: string, width: number): Promise<number> {
  const m = await sharp(file).metadata();
  return m.width && m.height ? Math.ceil((m.height * width) / m.width) : 0;
}

export async function renderSheet(htmlPath: string, outDir = path.join(path.dirname(htmlPath), '_trabajo')): Promise<RenderSheet> {
  fs.mkdirSync(outDir, { recursive: true });
  const shots = [
    // Escritorio de verdad (2026-10-08): con una ventana de 600 px la pieza entraba en su versión móvil (la media query
    // es de 620) y la hoja nunca enseñaba el escritorio (Spotify y Jordan: columnas apiladas que nadie vio). Ventana de
    // 640 y recorte de los 600 px del centro.
    { file: path.join(outDir, 'render-600.png'), width: 600, dark: false, label: '600 px' },
    { file: path.join(outDir, `render-${MOBILE_WIDTH}.png`), width: MOBILE_WIDTH, dark: false, label: `${MOBILE_WIDTH} px` },
    { file: path.join(outDir, 'render-oscuro.png'), width: 600, dark: true, label: 'Oscuro' },
  ];
  const browser = await launchBrowser();
  try {
    for (const s of shots) await shootPage(browser, htmlPath, s.width, s.dark, s.file);
  } finally {
    await browser.close().catch(() => undefined);
  }
  // Las tres columnas al mismo ancho, con su etiqueta encima; si la más alta no cabe, todas más estrechas (nunca se corta).
  const gap = 24;
  const head = 36;
  const natural = await Promise.all(shots.map(async (s) => sheetHeightAt(s.file, SHEET_COL)));
  const colW = sheetColumnWidth(natural, head);
  const cols = await Promise.all(
    shots.map(async (s) => {
      const buf = await sharp(s.file).resize({ width: colW }).png().toBuffer();
      const h = (await sharp(buf).metadata()).height || 0;
      return { buf, h, label: s.label };
    })
  );
  const height = Math.min(SHEET_MAX_H, head + Math.max(...cols.map((c) => c.h)));
  const width = cols.length * colW + (cols.length + 1) * gap;
  const layers = cols.flatMap((c, i) => {
    const left = gap + i * (colW + gap);
    const label = Buffer.from(
      `<svg width="${colW}" height="${head}"><text x="0" y="24" font-family="Arial" font-size="18" font-weight="bold" fill="#333">${c.label}</text></svg>`
    );
    return [
      { input: label, left, top: 0 },
      { input: c.h > height - head ? sharp(c.buf).extract({ left: 0, top: 0, width: colW, height: height - head }) : c.buf, left, top: head },
    ];
  });
  const resolved = await Promise.all(layers.map(async (l) => ({ ...l, input: Buffer.isBuffer(l.input) ? l.input : await (l.input as sharp.Sharp).toBuffer() })));
  const sheet = path.join(outDir, 'render-hoja.jpg');
  const full = await sharp({ create: { width, height, channels: 3, background: '#d9d9d9' } }).composite(resolved).png().toBuffer();
  await sharp(full).resize({ height: Math.min(height, SHEET_OUT_H) }).jpeg({ quality: 80 }).toFile(sheet);
  const desktop = await desktopSheet(shots[0].file, path.join(outDir, 'render-escritorio.jpg')).catch(() => undefined);
  return { sheet, shots: shots.map((s) => s.file), ...(desktop ? { desktop } : {}) };
}

/** Captura de la pieza a `width` px (600 = escritorio: ventana de 640 y recorte de los 600 del centro). */
export async function shootPage(browser: Browser, htmlPath: string, width: number, dark: boolean, file: string): Promise<void> {
  const desktop = width === 600;
  const page = await browser.newPage({ viewport: { width: desktop ? DESKTOP_SHOT : width, height: 900 }, javaScriptEnabled: false, colorScheme: dark ? 'dark' : 'light' });
  try {
    await page.goto(`file://${path.resolve(htmlPath)}`, { waitUntil: 'load', timeout: 30000 });
    if (desktop) {
      const height = (await page.evaluate('document.documentElement.scrollHeight')) as number;
      await page.screenshot({ path: file, fullPage: true, clip: { x: (DESKTOP_SHOT - 600) / 2, y: 0, width: 600, height } });
    } else await page.screenshot({ path: file, fullPage: true });
  } finally {
    await page.close();
  }
}

// --- Hoja de escritorio para la revisión de arte (2026-10-16) ----------------------------------------------------
// En render-hoja.jpg la columna de 600 px se ve al ~55 % (columnas de 420 px y la hoja reducida a 2.000 px de alto):
// la nota de arte no leía el texto de escritorio y pedía «letra más grande a 600 px» en piezas con 15-16 px
// (Alo, Diesel, Novo Resort). Aquí la columna va a tamaño real, en tramos puestos uno al lado del otro.

/** Alto orientativo de cada tramo y solape entre tramos (lo que queda en el corte se ve entero en uno de los dos). */
export const DESKTOP_TILE_H = 1600;
export const DESKTOP_TILE_OVERLAP = 60;
export const DESKTOP_TILES_MAX = 3;

/** Tramos [inicio, fin) de una captura de `height` px: uno por cada ~1.600 px, como mucho 3, con solape. */
export function desktopTiles(height: number): [number, number][] {
  const n = Math.min(DESKTOP_TILES_MAX, Math.max(1, Math.ceil(height / DESKTOP_TILE_H)));
  const step = Math.ceil(height / n);
  return Array.from({ length: n }, (_, i) => [Math.max(0, i * step - (i ? DESKTOP_TILE_OVERLAP : 0)), Math.min(height, (i + 1) * step)] as [number, number]);
}

/** La captura de escritorio (600 px de ancho) a tamaño real, en tramos de izquierda a derecha. */
export async function desktopSheet(shot: string, out: string): Promise<{ path: string; width: number; height: number }> {
  const meta = await sharp(shot).metadata();
  const w = meta.width || 600;
  const h = meta.height || 0;
  const tiles = desktopTiles(h);
  const gap = 24;
  const head = 36;
  const tileH = Math.max(...tiles.map(([a, b]) => b - a));
  const width = tiles.length * w + (tiles.length + 1) * gap;
  const height = head + tileH;
  const layers = await Promise.all(
    tiles.map(async ([a, b], i) => {
      const left = gap + i * (w + gap);
      const label = Buffer.from(
        `<svg width="${w}" height="${head}"><text x="0" y="24" font-family="Arial" font-size="18" font-weight="bold" fill="#333">600 px · tramo ${i + 1} de ${tiles.length}</text></svg>`
      );
      return [
        { input: label, left, top: 0 },
        { input: await sharp(shot).extract({ left: 0, top: a, width: w, height: b - a }).png().toBuffer(), left, top: head },
      ];
    })
  );
  await sharp({ create: { width, height, channels: 3, background: '#d9d9d9' } }).composite(layers.flat()).jpeg({ quality: 82 }).toFile(out);
  return { path: out, width, height };
}

// --- Comparación antes / después (2026-10-16) --------------------------------------------------------------------
// La mejora de arte se decidía con dos notas sueltas, y volver a puntuar la misma pieza movía hasta ±4/50. Ahora la
// revisión mira las dos versiones juntas, a la misma escala, y dice cuál es mejor en cada criterio.

const PAIR_MAX_H = 2400;

/** Dos capturas (A y B) del mismo ancho, una al lado de la otra y con su etiqueta, reducidas por igual si no caben. */
async function pairImage(a: string, b: string, labels: [string, string], out: string): Promise<{ path: string; width: number; height: number }> {
  const head = 36;
  const gap = 24;
  const ma = await sharp(a).metadata();
  const mb = await sharp(b).metadata();
  const w = Math.max(ma.width || 0, mb.width || 0);
  const tallest = Math.max(ma.height || 0, mb.height || 0);
  const scale = Math.min(1, (PAIR_MAX_H - head) / Math.max(1, tallest));
  const colW = Math.round(w * scale);
  const cols = await Promise.all([a, b].map(async (f) => {
    const buf = await sharp(f).resize({ width: colW }).png().toBuffer();
    return { buf, h: (await sharp(buf).metadata()).height || 0 };
  }));
  const width = 2 * colW + 3 * gap;
  const height = head + Math.max(...cols.map((c) => c.h));
  const layers = cols.flatMap((c, i) => {
    const left = gap + i * (colW + gap);
    const label = Buffer.from(
      `<svg width="${colW}" height="${head}"><text x="0" y="26" font-family="Arial" font-size="22" font-weight="bold" fill="#111">${labels[i]}</text></svg>`
    );
    return [{ input: label, left, top: 0 }, { input: c.buf, left, top: head }];
  });
  await sharp({ create: { width, height, channels: 3, background: '#d9d9d9' } }).composite(layers).jpeg({ quality: 82 }).toFile(out);
  return { path: out, width, height };
}

export interface PairSheets {
  desktop: { path: string; width: number; height: number };
  mobile: { path: string; width: number; height: number };
}

/** Escritorio (600 px) y móvil (375 px) de A y de B, en dos imágenes. `baseDir` es la carpeta de la pieza: las versiones
 *  se copian ahí un momento para que sus imágenes (rutas relativas) se vean. */
export async function renderPair(htmlA: string, htmlB: string, baseDir: string, outDir: string): Promise<PairSheets> {
  fs.mkdirSync(outDir, { recursive: true });
  const copies = [htmlA, htmlB].map((src, i) => {
    // Nombre único: dos comparaciones de la misma pieza a la vez no se pisan la copia.
    const dst = path.join(baseDir, `.comparar-${process.pid}-${Date.now().toString(36)}-${i ? 'b' : 'a'}.html`);
    fs.copyFileSync(src, dst);
    return dst;
  });
  const shot = (tag: string, w: number): string => path.join(outDir, `comparar-${tag}-${w}.png`);
  const browser = await launchBrowser();
  try {
    for (const [i, file] of copies.entries()) {
      const tag = i ? 'b' : 'a';
      await shootPage(browser, file, 600, false, shot(tag, 600));
      await shootPage(browser, file, MOBILE_WIDTH, false, shot(tag, MOBILE_WIDTH));
    }
  } finally {
    await browser.close().catch(() => undefined);
    for (const c of copies) fs.rmSync(c, { force: true });
  }
  return {
    desktop: await pairImage(shot('a', 600), shot('b', 600), ['A · 600 px', 'B · 600 px'], path.join(outDir, 'comparar-escritorio.jpg')),
    mobile: await pairImage(shot('a', MOBILE_WIDTH), shot('b', MOBILE_WIDTH), [`A · ${MOBILE_WIDTH} px`, `B · ${MOBILE_WIDTH} px`], path.join(outDir, 'comparar-movil.jpg')),
  };
}

/** Portada de la web de la marca tal como se ve al abrirla (1280×900, JPEG), para que la revisión de dirección de arte
 *  compare la pieza con la marca de verdad y no con lo que recuerda (2026-10-06, punto 5). null si la web bloquea a
 *  Studio o no carga: la revisión sigue sin ella. */
export async function captureBrandWeb(url: string, outFile: string): Promise<string | null> {
  const browser = await launchBrowser();
  try {
    const ctx = await browser.newContext({ userAgent: BROWSER_UA, locale: 'es-ES', viewport: { width: 1280, height: 900 } });
    const page = await ctx.newPage();
    const res = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 25000 });
    await page.waitForLoadState('load', { timeout: 10000 }).catch(() => undefined);
    if (isBlockedPage(res?.status(), await page.title().catch(() => ''))) return null;
    // Sin aceptar avisos de cookies: si tapan parte de la portada, la revisión lo sabe (se le dice en la pregunta).
    await page.waitForTimeout(1200);
    fs.mkdirSync(path.dirname(outFile), { recursive: true });
    await sharp(await page.screenshot()).jpeg({ quality: 75 }).toFile(outFile);
    return outFile;
  } catch {
    return null;
  } finally {
    await browser.close().catch(() => undefined);
  }
}

if (require.main === module) {
  const file = process.argv[2];
  if (!file || !fs.existsSync(file)) {
    console.error('Uso: npm run render-newsletter -- <ruta/newsletter.html>');
    process.exit(2);
  }
  renderSheet(path.resolve(process.cwd(), file))
    .then(({ sheet, shots }) => {
      const rel = (p: string): string => path.relative(process.cwd(), p);
      console.log(`Hoja con 600 px, ${MOBILE_WIDTH} px y oscuro: ${rel(sheet)} — mírala con vision_analyze (una sola vez por revisión).`);
      console.log(`Capturas sueltas para ver detalle: ${shots.map(rel).join(', ')}`);
    })
    .catch((err) => {
      console.error(`✗ ${(err as Error).message}`);
      process.exitCode = 1;
    });
}
