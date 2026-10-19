/**
 * fetch-image.ts — descarga una imagen para la newsletter y la deja lista para el correo (2026-10-05).
 *
 * Calvin Klein (2026-10-05): logo SVG enlazado y fotos del CDN de la marca con 403; Hermes las daba por buenas
 * como «problema de red». Hermes improvisaba cada vez la descarga y la conversión. Este comando:
 * - descarga con cabeceras de navegador y la web de la marca como Referer; si la web bloquea (403/429), la abre
 *   en Chromium desde este Mac y la toma de ahí;
 * - comprueba que es una imagen de verdad (no una página de error con extensión .jpg);
 * - SVG → PNG al doble de tamaño, con fondo transparente;
 * - reduce a 1200 px de ancho como mucho y comprime (JPEG 82 / PNG optimizado).
 *
 * Uso:  npm run fetch-image -- <url> <carpeta-del-trabajo> [nombre] [--ancho 1200]
 * Imprime la ruta del archivo guardado (relativa a la carpeta del trabajo, lista para el src).
 */
import * as fs from 'fs';
import * as path from 'path';
import sharp from 'sharp';
import { launchBrowser, NATIVE_WIDTHS_FILE } from './renderChecks';
import { imageKindOf } from './brandCard';

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36',
  Accept: 'image/avif,image/webp,image/png,image/svg+xml,image/*;q=0.8,*/*;q=0.5',
  'Accept-Language': 'es-ES,es;q=0.9',
};

function isSvg(buf: Buffer): boolean {
  const head = buf.subarray(0, 4096).toString('utf8').toLowerCase();
  return /<svg[\s>]/.test(head) && !head.includes('<html');
}

/** Formato real por los primeros bytes: una página de error guardada como .jpg no cuenta (brandCard.ts). */
function isImage(buf: Buffer): boolean {
  return !!imageKindOf(buf);
}

async function download(url: string): Promise<Buffer> {
  const origin = new URL(url).origin;
  try {
    const res = await fetch(url, { headers: { ...HEADERS, Referer: `${origin}/` }, signal: AbortSignal.timeout(20000) });
    if (res.ok) {
      const buf = Buffer.from(await res.arrayBuffer());
      if (isImage(buf)) return buf;
    }
  } catch {
    // se intenta con el navegador
  }
  // La web bloquea las descargas directas: se abre en Chromium (que pasa los controles de bots más sencillos).
  const browser = await launchBrowser();
  try {
    const page = await browser.newPage({ extraHTTPHeaders: { 'Accept-Language': 'es-ES,es;q=0.9' } });
    await page.goto(`${origin}/`, { waitUntil: 'domcontentloaded', timeout: 20000 }).catch(() => undefined);
    const res = await page.goto(url, { waitUntil: 'load', timeout: 20000 });
    const buf = res ? await res.body() : null;
    if (buf && res!.ok() && isImage(buf)) return buf;
    if (res?.ok()) throw new Error('Esa URL no es una imagen (devuelve una página web, a veces de error con extensión .jpg). Busca la URL de la imagen en sí.');
    throw new Error(`La web no deja descargar la imagen (${res ? `HTTP ${res.status()}` : 'sin respuesta'}). Busca otra imagen oficial.`);
  } finally {
    await browser.close().catch(() => undefined);
  }
}

async function svgToPng(svg: string): Promise<Buffer> {
  // Tamaño del SVG (width/height o viewBox); al doble para que se vea nítido en pantallas retina.
  const box = svg.match(/viewBox\s*=\s*["']\s*[-\d.]+[\s,]+[-\d.]+[\s,]+([\d.]+)[\s,]+([\d.]+)/i);
  const w = Number(svg.match(/<svg[^>]*\swidth\s*=\s*["']([\d.]+)(px)?["']/i)?.[1]) || Number(box?.[1]) || 300;
  const target = Math.round(Math.max(w, 200) * 2);
  // density: puntos por pulgada a los que se rasteriza el SVG (72 = su tamaño nominal).
  return sharp(Buffer.from(svg), { density: Math.min(1200, Math.max(72, Math.round((72 * target) / w))) })
    .resize({ width: target, withoutEnlargement: false })
    .png()
    .toBuffer();
}

export async function fetchImage(url: string, outDir: string, name?: string, maxWidth = 1200): Promise<string> {
  return saveImage(await download(url), url, outDir, name, maxWidth);
}

/** La parte de fetchImage que no descarga: comprueba, convierte, reduce y comprime unos bytes ya recibidos (la
 *  galería de productSheet.ts guarda las fotos que el navegador ya cargó con la página: Adeslas da 403 al pedirlas
 *  otra vez). */
export async function saveImage(raw: Buffer, url: string, outDir: string, name?: string, maxWidth = 1200): Promise<string> {
  if (!isImage(raw)) throw new Error('Esos bytes no son una imagen.');
  const base = (name || path.basename(new URL(url).pathname).replace(/\.[a-z0-9]+$/i, '') || 'imagen').replace(/[^a-z0-9_-]+/gi, '-').slice(0, 60);
  let out: Buffer;
  let ext: string;
  if (isSvg(raw)) {
    out = await svgToPng(raw.toString('utf8'));
    ext = 'png';
  } else {
    const meta = await sharp(raw).metadata();
    const img = sharp(raw).rotate().resize({ width: maxWidth, withoutEnlargement: true });
    if (meta.hasAlpha || meta.format === 'png' || meta.format === 'gif') {
      out = await img.png({ compressionLevel: 9 }).toBuffer();
      ext = 'png';
    } else {
      out = await img.jpeg({ quality: 82, mozjpeg: true }).toBuffer();
      ext = 'jpg';
    }
  }
  fs.mkdirSync(outDir, { recursive: true });
  const file = path.join(outDir, `${base}.${ext}`);
  fs.writeFileSync(file, out);
  const meta = await sharp(out).metadata();
  const native = isSvg(raw) ? null : (await sharp(raw).metadata()).width || null;
  if (native) recordNativeWidth(outDir, path.basename(file), native);
  const thumb = native && native < THUMB_MAX_WIDTH ? ` — MINIATURA: el original solo tiene ${native} px de ancho; no la amplíes (se ve borrosa), busca la misma foto más grande` : '';
  return `${path.basename(file)} (${meta.width}×${meta.height}, ${Math.round(out.length / 1024)} KB)${thumb}`;
}

/** Por debajo de este ancho original, la imagen es una miniatura (Nike Vomero Plus, 2026-10-19: Hermes bajó la de
 *  `t_PDP_144` —144 px— y la amplió a 1200 px; la suela salió pixelada a 520 px). */
export const THUMB_MAX_WIDTH = 500;

function recordNativeWidth(outDir: string, file: string, width: number): void {
  const f = path.join(outDir, '_trabajo', NATIVE_WIDTHS_FILE);
  try {
    let all: Record<string, number> = {};
    try {
      all = JSON.parse(fs.readFileSync(f, 'utf8'));
    } catch {
      // primera descarga del trabajo
    }
    all[file] = width;
    fs.mkdirSync(path.dirname(f), { recursive: true });
    fs.writeFileSync(f, JSON.stringify(all, null, 2));
  } catch {
    // sin registro: la comprobación de miniaturas simplemente no actúa
  }
}

if (require.main === module) {
  const args = process.argv.slice(2);
  const wi = args.indexOf('--ancho');
  const maxWidth = wi >= 0 ? Number(args[wi + 1]) || 1200 : 1200;
  const [url, dir, name] = args.filter((a, i) => !a.startsWith('--') && args[i - 1] !== '--ancho');
  if (!url || !dir) {
    console.error('Uso: npm run fetch-image -- <url> <carpeta-del-trabajo> [nombre] [--ancho 1200]');
    process.exit(2);
  }
  fetchImage(url, path.resolve(process.cwd(), dir), name, maxWidth)
    .then((saved) => console.log(`Guardada: ${saved}. Enlázala en el HTML con esa ruta relativa.`))
    .catch((err) => {
      console.error(`✗ ${(err as Error).message}`);
      process.exitCode = 1;
    });
}
