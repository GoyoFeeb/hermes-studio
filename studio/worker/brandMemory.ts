/**
 * brandMemory.ts — lo que Studio recuerda de una marca entre piezas (auditoría de tiempo, punto 2, 2026-10-07).
 *
 * Cada pieza de una marca cuya web bloquea a Studio empezaba de cero: la medición fallaba, Hermes insistía con el
 * navegador (brief de Lacoste del 06-10: 44 visitas, 17 min) y volvía a buscar el logo y las fotos que ya había
 * encontrado en piezas anteriores. Aquí:
 *  - la memoria de webs que bloquean (brands/<marca>/tokens/acceso-web.json, 30 días);
 *  - los assets de las últimas piezas terminadas de la marca, con su origen según notas.md;
 *  - el logo de una pieza terminada, guardado en la marca si esta no tiene ninguno.
 */
import * as fs from 'fs';
import * as path from 'path';
import { imageKind } from './brandCard';

const BLOCK_MAX_AGE_DAYS = 30;

export interface WebAccess {
  blockedAt: string;
  url: string;
  /** Quién lo detectó: la ficha de producto, la medición de identidad… */
  via: string;
}

export function webAccessPath(root: string, slug: string): string {
  return path.join(root, 'brands', slug, 'tokens', 'acceso-web.json');
}

export function markBlocked(root: string, slug: string, url: string, via: string, now = new Date()): void {
  if (!slug) return;
  const file = webAccessPath(root, slug);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const info: WebAccess = { blockedAt: now.toISOString(), url, via };
  fs.writeFileSync(file, JSON.stringify(info, null, 2) + '\n');
}

/** La web se ha leído bien: se olvida el bloqueo. */
export function markOpen(root: string, slug: string): void {
  if (!slug) return;
  fs.rmSync(webAccessPath(root, slug), { force: true });
}

/** El bloqueo registrado, si es de los últimos 30 días. */
export function blockedInfo(root: string, slug: string, now = Date.now()): WebAccess | null {
  if (!slug) return null;
  try {
    const info = JSON.parse(fs.readFileSync(webAccessPath(root, slug), 'utf8')) as WebAccess;
    const age = now - Date.parse(info.blockedAt);
    return Number.isFinite(age) && age <= BLOCK_MAX_AGE_DAYS * 86400000 ? info : null;
  } catch {
    return null;
  }
}

/** Aviso para el brief (y el borrador de «Prompt completo») cuando la web de la marca bloquea a Studio. */
export function blockedNote(brandName: string, info: WebAccess | null): string {
  if (!info) return '';
  const day = new Date(info.blockedAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'long' });
  return [
    '',
    '## Nota de entorno: la web oficial bloquea las visitas automáticas',
    `- La web oficial de ${brandName} (${info.url}) bloquea a Studio (comprobado el ${day}). No la abras con el navegador`,
    '  ni con web_extract: no vas a conseguir más que el aviso de bloqueo y se pierden minutos.',
    '- Usa web_search (los resultados traen precios, nombres y textos oficiales) y los assets de piezas anteriores de',
    '  esta marca (abajo, si los hay). Lo que no encuentres así, pendiente: la entrega sigue adelante.',
  ].join('\n');
}

const IMAGE = /\.(png|jpe?g|webp|gif|svg)$/i;
/** Archivos de trabajo que no son assets de la pieza. */
const NOT_ASSET = /^(render|hoja|captura|screenshot|fotos-producto|contacto)/i;

export interface PreviousPiece {
  /** Carpeta relativa al repo. */
  dir: string;
  logos: string[];
  photos: string[];
  /** Líneas de notas.md sobre el origen de las imágenes (como mucho 8). */
  origins: string[];
}

/** Las últimas piezas terminadas de la marca (con newsletter.html), sin intentos fallidos ni cancelados ni la carpeta
 *  del encargo actual. Las fotos generadas con IA (C2PA) no se ofrecen como oficiales. */
export function previousPieces(root: string, slug: string, currentDir = '', limit = 3): PreviousPiece[] {
  if (!slug) return [];
  const pieces: PreviousPiece[] = [];
  for (const year of listDirs(path.join(root, 'newsletters')).sort().reverse()) {
    const base = path.join(root, 'newsletters', year, slug, 'hermes');
    for (const name of listDirs(base).filter((d) => !d.startsWith('_')).sort().reverse()) {
      const abs = path.join(base, name);
      const rel = path.relative(root, abs);
      if (rel === currentDir || !fs.existsSync(path.join(abs, 'newsletter.html'))) continue;
      const files = fs.readdirSync(abs).filter((f) => IMAGE.test(f) && !NOT_ASSET.test(f) && isRealImage(path.join(abs, f)) && !isAi(path.join(abs, f)));
      if (!files.length) continue;
      pieces.push({
        dir: rel,
        logos: files.filter((f) => /logo/i.test(f)),
        photos: files.filter((f) => !/logo/i.test(f)),
        origins: imageOrigins(path.join(abs, 'notas.md')),
      });
      if (pieces.length >= limit) return pieces;
    }
  }
  return pieces;
}

export function previousPiecesNote(pieces: PreviousPiece[]): string {
  if (!pieces.length) return '';
  return [
    '',
    '## Nota de entorno: assets de piezas anteriores de esta marca',
    '- Ya descargados y usados en piezas terminadas. Si te sirven, cópialos a la carpeta de este encargo (cp) en vez de',
    '  volver a buscarlos; su origen está en las notas de cada pieza. Una foto de otra campaña solo vale si encaja con',
    '  lo que pide este encargo (no presentes un producto anterior como el de ahora).',
    ...pieces.flatMap((p) => [
      `- ${p.dir}/`,
      ...(p.logos.length ? [`  · Logo: ${p.logos.join(', ')}`] : []),
      ...(p.photos.length ? [`  · Fotos: ${p.photos.slice(0, 12).join(', ')}${p.photos.length > 12 ? '…' : ''}`] : []),
      ...p.origins.map((o) => `  · ${o}`),
    ]),
  ].join('\n');
}

/** Al terminar una pieza: si la marca no tiene ningún logo en design-input, se guarda el de la pieza. Devuelve la ruta
 *  relativa del logo guardado, o null. */
export function rememberLogo(root: string, slug: string, pieceAbs: string): string | null {
  if (!slug || !fs.existsSync(pieceAbs)) return null;
  const dir = path.join(root, 'brands', slug, 'design-input');
  const has = fs.existsSync(dir) && fs.readdirSync(dir).some((f) => /logo/i.test(f) && IMAGE.test(f));
  if (has) return null;
  const logos = fs
    .readdirSync(pieceAbs)
    .filter((f) => /logo/i.test(f) && /\.(png|jpe?g)$/i.test(f) && isRealImage(path.join(pieceAbs, f)) && !isAi(path.join(pieceAbs, f)))
    // La versión para fondo claro, no la blanca.
    .sort((a, b) => Number(/white|blanc/i.test(a)) - Number(/white|blanc/i.test(b)) || a.length - b.length);
  if (!logos.length) return null;
  fs.mkdirSync(dir, { recursive: true });
  const out = path.join(dir, `logo-pieza${path.extname(logos[0]).toLowerCase()}`);
  fs.copyFileSync(path.join(pieceAbs, logos[0]), out);
  return path.relative(root, out);
}

function listDirs(abs: string): string[] {
  try {
    return fs.readdirSync(abs, { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name);
  } catch {
    return [];
  }
}

function isRealImage(abs: string): boolean {
  return /\.svg$/i.test(abs) || !!imageKind(abs);
}

function isAi(abs: string): boolean {
  try {
    return fs.readFileSync(abs).includes('trainedAlgorithmicMedia');
  } catch {
    return false;
  }
}

/** Las líneas de notas.md que dicen de dónde salió cada imagen (sección «Origen…» o líneas con URL y nombre de imagen). */
function imageOrigins(notesAbs: string): string[] {
  let text = '';
  try {
    text = fs.readFileSync(notesAbs, 'utf8');
  } catch {
    return [];
  }
  const lines = text.split('\n');
  const start = lines.findIndex((l) => /^#{1,4}\s.*(origen|imágenes|imagenes)/i.test(l));
  const section = start >= 0 ? lines.slice(start + 1).filter((_, i, a) => !a.slice(0, i + 1).some((l) => /^#{1,4}\s/.test(l))) : [];
  const picked = (section.length ? section : lines.filter((l) => IMAGE.test(l.split(/\s/).find((w) => IMAGE.test(w)) || '') && /https?:\/\//.test(l)))
    .map((l) => l.replace(/^\s*[-*\d.]+\s*/, '').trim())
    .filter((l) => l && /\.(png|jpe?g|webp|gif|svg)\b/i.test(l));
  return picked.slice(0, 8).map((l) => (l.length > 220 ? `${l.slice(0, 217)}…` : l));
}
