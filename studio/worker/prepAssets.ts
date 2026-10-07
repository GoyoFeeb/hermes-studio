/**
 * prepAssets.ts — Studio prepara las imágenes antes del borrador (auditoría de tiempo, punto 6, 2026-10-07).
 *
 * En tres días de sesiones, Hermes hizo a mano unas 400 acciones de imagen: pasar el logo a blanco o transparente (73),
 * recortar el margen de las fotos de producto (~200), mirar medidas con sips (77) y convertir formatos (46). Cada una son
 * 5-60 s de modelo. Aquí se hace en segundos y sin modelo:
 *  - el logo oficial en PNG, sin márgenes, a 2x del tamaño de email, y su versión para el fondo contrario (blanca si es
 *    oscuro, negra si es claro) cuando tiene fondo transparente;
 *  - una copia «-recorte» de las fotos de producto sobre fondo liso, sin el margen sobrante;
 *  - las medidas y la orientación de cada foto, para el encargo.
 * Los originales no se tocan: todo lo preparado son copias.
 */
import * as fs from 'fs';
import * as path from 'path';
import sharp from 'sharp';
import { brandAssets } from './brandCard';

/** Ancho máximo del logo preparado: 2x de los ~200 px que ocupa en un email. */
const LOGO_MAX_W = 400;

export interface PreparedLogo {
  file: string;
  width: number;
  height: number;
  /** Tono del logo: oscuro, claro o de color (luminancia media de sus píxeles visibles). */
  tone: 'dark' | 'light' | 'color';
  transparent: boolean;
  /** Versión para el fondo contrario (solo con fondo transparente). */
  counterpart?: { file: string; color: 'white' | 'black' };
}

export interface PreparedPhoto {
  file: string;
  width: number;
  height: number;
  /** Copia sin el margen sobrante (fotos de producto sobre fondo liso). */
  crop?: { file: string; width: number; height: number };
}

export interface PreparedAssets {
  logo: PreparedLogo | null;
  photos: PreparedPhoto[];
}

const WHITE_NAME = (f: string): boolean => /white|blanc|negativ/i.test(f.replace(/on-white/i, ''));

/** El logo de partida: el medido en la web o el mejor de design-input (nunca la versión blanca si hay otra). */
export function logoSource(root: string, slug: string): string | null {
  if (!slug) return null;
  const measured = path.join(root, 'brands', slug, 'design-input', 'logo-medido.png');
  if (fs.existsSync(measured)) return measured;
  const { dir, logos } = brandAssets(root, slug);
  const score = (f: string): number =>
    (WHITE_NAME(f) ? 100 : 0) + (/email/i.test(f) ? -2 : 0) + (/black|negro|color|dark/i.test(f) ? -1 : 0) + (/\.(jpe?g|webp|gif)$/i.test(f) ? 1 : 0);
  const best = [...logos].sort((a, b) => score(a) - score(b) || a.length - b.length)[0];
  return best ? path.join(root, dir, best) : null;
}

/** Luminancia media y transparencia de una imagen RGBA. */
async function analyse(buf: Buffer): Promise<{ lum: number; transparent: boolean; visible: number }> {
  const { data, info } = await sharp(buf).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  let sum = 0;
  let n = 0;
  let clear = 0;
  for (let i = 0; i < data.length; i += info.channels) {
    const a = data[i + 3];
    if (a < 16) clear++;
    if (a < 128) continue;
    sum += (0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]) / 255;
    n++;
  }
  const total = data.length / info.channels;
  return { lum: n ? sum / n : 1, transparent: clear / total > 0.05, visible: n };
}

/** Todos los píxeles visibles de un color (blanco o negro), conservando la transparencia. */
async function recolor(buf: Buffer, color: 'white' | 'black'): Promise<Buffer> {
  const { data, info } = await sharp(buf).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const v = color === 'white' ? 255 : 17;
  for (let i = 0; i < data.length; i += info.channels) data[i] = data[i + 1] = data[i + 2] = v;
  return sharp(data, { raw: info }).png().toBuffer();
}

export async function prepareLogo(src: string, outAbs: string): Promise<PreparedLogo | null> {
  const isSvg = /\.svg$/i.test(src);
  let buf = await sharp(src, isSvg ? { density: 300 } : {}).ensureAlpha().png().toBuffer();
  // La transparencia se mira en el original: tras quitar los márgenes, un logo macizo ya no tiene píxeles transparentes.
  const transparent = (await analyse(buf)).transparent;
  // Sin márgenes: trim corta el borde del color de la esquina (transparente o el fondo liso).
  buf = await sharp(buf).trim().png().toBuffer().catch(() => buf);
  buf = await sharp(buf).resize({ width: LOGO_MAX_W, withoutEnlargement: true }).png().toBuffer();
  const meta = await sharp(buf).metadata();
  const a = await analyse(buf);
  if (!meta.width || !meta.height || !a.visible) return null;
  const file = 'logo-email.png';
  fs.writeFileSync(path.join(outAbs, file), buf);
  const tone: PreparedLogo['tone'] = a.lum < 0.35 ? 'dark' : a.lum > 0.75 ? 'light' : 'color';
  const logo: PreparedLogo = { file, width: meta.width, height: meta.height, tone, transparent };
  if (transparent) {
    const color = tone === 'light' ? 'black' : 'white';
    const cfile = `logo-email-${color === 'white' ? 'blanco' : 'negro'}.png`;
    fs.writeFileSync(path.join(outAbs, cfile), await recolor(buf, color));
    logo.counterpart = { file: cfile, color };
  }
  return logo;
}

/** Recorte de una foto sobre fondo liso: el recuadro de lo que no es fondo, con un 10 % de aire a los lados y un 14 % arriba
 *  y abajo (lo que hacía el script de Hermes). null si el fondo no es liso o si apenas sobra margen. */
export async function cropOnPlainBackground(abs: string): Promise<{ left: number; top: number; width: number; height: number } | null> {
  const { data, info } = await sharp(abs).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width: w, height: h, channels: c } = info;
  const px = (x: number, y: number): [number, number, number] => {
    const i = (y * w + x) * c;
    return [data[i], data[i + 1], data[i + 2]];
  };
  const bg = px(0, 0);
  const far = (p: [number, number, number], d: number): boolean => Math.max(Math.abs(p[0] - bg[0]), Math.abs(p[1] - bg[1]), Math.abs(p[2] - bg[2])) > d;
  // Fondo liso: casi todo el borde es del color de la esquina.
  const edge: [number, number][] = [];
  for (let x = 0; x < w; x += 4) edge.push([x, 0], [x, h - 1]);
  for (let y = 0; y < h; y += 4) edge.push([0, y], [w - 1, y]);
  const same = edge.filter(([x, y]) => !far(px(x, y), 20)).length;
  if (same / edge.length < 0.9) return null;
  let minX = w;
  let minY = h;
  let maxX = -1;
  let maxY = -1;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    if (!far(px(x, y), 28)) continue;
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
  }
  if (maxX < 0) return null;
  const mx = Math.round((maxX - minX + 1) * 0.1);
  const my = Math.round((maxY - minY + 1) * 0.14);
  const left = Math.max(0, minX - mx);
  const top = Math.max(0, minY - my);
  const width = Math.min(w - left, maxX - minX + 1 + mx * 2);
  const height = Math.min(h - top, maxY - minY + 1 + my * 2);
  // Si el recorte deja más del 85 % de la foto, no merece la pena.
  return (width * height) / (w * h) > 0.85 ? null : { left, top, width, height };
}

export async function prepareAssets(
  root: string,
  slug: string,
  outAbs: string,
  photos: { file: string; ambient?: boolean }[]
): Promise<PreparedAssets> {
  const src = logoSource(root, slug);
  const logo = src ? await prepareLogo(src, outAbs).catch(() => null) : null;
  const out: PreparedPhoto[] = [];
  for (const p of photos) {
    const abs = path.join(outAbs, p.file);
    const meta = await sharp(abs).metadata().catch(() => null);
    if (!meta?.width || !meta.height) continue;
    const photo: PreparedPhoto = { file: p.file, width: meta.width, height: meta.height };
    // Solo fotos de producto (las de ambiente se usan como son).
    const box = p.ambient ? null : await cropOnPlainBackground(abs).catch(() => null);
    if (box) {
      const ext = path.extname(p.file);
      const file = `${p.file.slice(0, -ext.length)}-recorte${ext}`;
      await sharp(abs).extract(box).toFile(path.join(outAbs, file));
      photo.crop = { file, width: box.width, height: box.height };
    }
    out.push(photo);
  }
  return { logo, photos: out };
}

const orientation = (w: number, h: number): string => (w / h > 1.15 ? 'horizontal' : h / w > 1.15 ? 'vertical' : 'cuadrada');

export function preparedNote(prep: PreparedAssets, outputDir: string): string {
  if (!prep.logo && !prep.photos.length) return '';
  const lines = ['', `## Imágenes preparadas por Studio en ${outputDir}/ (úsalas tal cual: no las recortes, recolorees, conviertas ni midas)`];
  const l = prep.logo;
  if (l) {
    const tone = l.tone === 'dark' ? 'oscuro' : l.tone === 'light' ? 'claro' : 'de color';
    // Con 240 px o más tiene resolución para pantallas 2x; con menos, mejor a su tamaño que ampliado.
    const size = l.width >= 240 ? `a 2x: en el HTML, width="${Math.round(l.width / 2)}"` : `ya pequeño: en el HTML, como mucho width="${l.width}"`;
    lines.push(`- Logo oficial: ${l.file} (${l.width}×${l.height}, ${tone}${l.transparent ? ', fondo transparente' : ', con fondo propio'}), sin márgenes; ${size}.`);
    if (l.counterpart) {
      lines.push(
        `- Versión ${l.counterpart.color === 'white' ? 'blanca' : 'negra'} del mismo logo: ${l.counterpart.file}, para fondos ${l.counterpart.color === 'white' ? 'oscuros y el modo oscuro' : 'claros'}.`
      );
    }
  }
  for (const p of prep.photos) {
    lines.push(
      `- ${p.file}: ${p.width}×${p.height}, ${orientation(p.width, p.height)}` +
        (p.crop ? ` · recortada sin el margen sobrante: ${p.crop.file} (${p.crop.width}×${p.crop.height}, ${orientation(p.crop.width, p.crop.height)})` : '')
    );
  }
  return lines.join('\n');
}
