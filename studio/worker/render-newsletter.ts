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
/** Alto máximo antes de reducir: lo que pase se recorta (el final de una pieza muy larga es el pie legal). */
const SHEET_MAX_H = 3000;
/** Alto final de la hoja, en JPEG: el modelo de visión auxiliar de Hermes no pudo analizar la hoja de 1356×3000 en PNG
 *  (1,4 MB) y sí la de 2000 px de alto en JPEG (180 KB) — 2026-10-06. */
const SHEET_OUT_H = 2000;

export interface RenderSheet {
  sheet: string;
  shots: string[];
}

export async function renderSheet(htmlPath: string, outDir = path.join(path.dirname(htmlPath), '_trabajo')): Promise<RenderSheet> {
  fs.mkdirSync(outDir, { recursive: true });
  const shots = [
    { file: path.join(outDir, 'render-600.png'), width: 600, dark: false, label: '600 px' },
    { file: path.join(outDir, `render-${MOBILE_WIDTH}.png`), width: MOBILE_WIDTH, dark: false, label: `${MOBILE_WIDTH} px` },
    { file: path.join(outDir, 'render-oscuro.png'), width: 600, dark: true, label: 'Oscuro' },
  ];
  const browser = await launchBrowser();
  try {
    for (const s of shots) {
      const page = await browser.newPage({ viewport: { width: s.width, height: 900 }, javaScriptEnabled: false, colorScheme: s.dark ? 'dark' : 'light' });
      await page.goto(`file://${path.resolve(htmlPath)}`, { waitUntil: 'load', timeout: 30000 });
      await page.screenshot({ path: s.file, fullPage: true });
      await page.close();
    }
  } finally {
    await browser.close().catch(() => undefined);
  }
  // Las tres columnas al mismo ancho, con su etiqueta encima.
  const cols = await Promise.all(
    shots.map(async (s) => {
      const buf = await sharp(s.file).resize({ width: SHEET_COL }).png().toBuffer();
      const h = (await sharp(buf).metadata()).height || 0;
      return { buf, h, label: s.label };
    })
  );
  const gap = 24;
  const head = 36;
  const height = Math.min(SHEET_MAX_H, head + Math.max(...cols.map((c) => c.h)));
  const width = cols.length * SHEET_COL + (cols.length + 1) * gap;
  const layers = cols.flatMap((c, i) => {
    const left = gap + i * (SHEET_COL + gap);
    const label = Buffer.from(
      `<svg width="${SHEET_COL}" height="${head}"><text x="0" y="24" font-family="Arial" font-size="18" font-weight="bold" fill="#333">${c.label}</text></svg>`
    );
    return [
      { input: label, left, top: 0 },
      { input: c.h > height - head ? sharp(c.buf).extract({ left: 0, top: 0, width: SHEET_COL, height: height - head }) : c.buf, left, top: head },
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
