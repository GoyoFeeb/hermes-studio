/**
 * render-newsletter.ts — una sola hoja con la pieza a 600 px, a 375 px y en oscuro (2026-10-06).
 *
 * Hermes se escribía en cada pieza su propio render.js/verify.js, levantaba un servidor local y miraba 3-6 capturas
 * con vision_analyze (159 llamadas y 47 min en las sesiones del 24-sep al 5-oct). Con esto: un comando y una imagen.
 * La revisión de dirección de arte del worker usa la misma hoja.
 *
 * Uso:  npm run render-newsletter -- <ruta/newsletter.html>
 * Deja en <carpeta>/_trabajo/: render-600.png, render-375.png, render-oscuro.png y render-hoja.jpg (las tres juntas).
 */
import * as fs from 'fs';
import * as path from 'path';
import sharp from 'sharp';
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
    for (const s of shots) {
      const desktop = s.width === 600;
      const page = await browser.newPage({ viewport: { width: desktop ? DESKTOP_SHOT : s.width, height: 900 }, javaScriptEnabled: false, colorScheme: s.dark ? 'dark' : 'light' });
      await page.goto(`file://${path.resolve(htmlPath)}`, { waitUntil: 'load', timeout: 30000 });
      if (desktop) {
        const height = (await page.evaluate('document.documentElement.scrollHeight')) as number;
        await page.screenshot({ path: s.file, fullPage: true, clip: { x: (DESKTOP_SHOT - 600) / 2, y: 0, width: 600, height } });
      } else await page.screenshot({ path: s.file, fullPage: true });
      await page.close();
    }
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
  return { sheet, shots: shots.map((s) => s.file) };
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
