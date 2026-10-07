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

// ---------------------------------------------------------------- identidad del brief anterior (T1, 2026-10-07)
// Repetimos mucho las mismas marcas y cada brief volvía a investigar su identidad (tipografías, paleta, botón, tono). Si
// un brief de los últimos 90 días ya la tiene, el nuevo parte de ella. Con brand pack no hace falta: se usa el pack.

const IDENTITY_MAX_AGE_DAYS = 90;

export interface PreviousIdentity {
  /** Carpeta de la pieza cuyo brief la trae. */
  dir: string;
  /** Fecha del brief (AAAA-MM-DD). */
  date: string;
  text: string;
}

/** La sección «2. Identidad de marca» del brief más reciente de la marca (≤ 90 días), sin la línea de instrucciones que a
 *  veces se cuela en el título. */
export function previousIdentity(root: string, slug: string, currentDir = '', now = Date.now()): PreviousIdentity | null {
  if (!slug) return null;
  for (const year of listDirs(path.join(root, 'newsletters')).sort().reverse()) {
    const base = path.join(root, 'newsletters', year, slug, 'hermes');
    for (const name of listDirs(base).filter((d) => !d.startsWith('_')).sort().reverse()) {
      const rel = path.relative(root, path.join(base, name));
      const file = path.join(base, name, 'brief.md');
      if (rel === currentDir || !fs.existsSync(file)) continue;
      const date = name.match(/^(\d{4}-\d{2}-\d{2})/)?.[1];
      if (!date || now - Date.parse(date) > IDENTITY_MAX_AGE_DAYS * 86400000) return null;
      const lines = fs.readFileSync(file, 'utf8').split('\n');
      const start = lines.findIndex((l) => /^##\s*2\.\s*Identidad/i.test(l));
      if (start < 0) continue;
      const end = lines.findIndex((l, i) => i > start && /^##\s/.test(l));
      const text = lines.slice(start + 1, end < 0 ? undefined : end).join('\n').trim();
      if (text.length < 80) continue;
      return { dir: rel, date, text: text.length > 2500 ? `${text.slice(0, 2497)}…` : text };
    }
  }
  return null;
}

export function previousIdentityNote(prev: PreviousIdentity | null): string {
  if (!prev) return '';
  return [
    '',
    `## Nota de entorno: identidad de marca ya investigada (brief del ${prev.date}, ${prev.dir})`,
    '- Parte de ella para la sección «2. Identidad de marca»: no vuelvas a investigar tipografías, paleta, botón ni tono.',
    '  Solo comprueba lo que no cuadre con esta petición (otra línea de producto, otra submarca) y dilo si cambias algo.',
    '',
    prev.text,
  ].join('\n');
}

// ---------------------------------------------------------------- la mejor pieza anterior como referencia (C2, 2026-10-07)
// Con marcas repetidas, cada borrador empezaba sin listón. La pieza con mejor nota de arte de la marca (desde
// revision-visual.md) se le da como captura: «este es el nivel; no la copies, supérala».

/** Mínimo para ser referencia: 38/50 (lo que hoy saca una pieza buena). */
const REFERENCE_MIN = 0.76;

/** Nota final de una pieza según su revision-visual.md: la de tras la mejora si se quedó, si no la primera. */
export function pieceScore(pieceAbs: string): { total: number; max: number } | null {
  let text = '';
  try {
    text = fs.readFileSync(path.join(pieceAbs, '_trabajo', 'revision-visual.md'), 'utf8');
  } catch {
    return null;
  }
  const totals = [...text.matchAll(/\(total (\d+)\/(\d+)\)/g)].map((m) => ({ total: Number(m[1]), max: Number(m[2]) }));
  if (!totals.length) {
    // Formato anterior (hasta el 06-10): «peticion 4 · texto_imagen 4 · …» sin total.
    const line = text.split('\n').find((l) => /^[a-z_]+ [1-5]( · [a-z_]+ [1-5]){4,}/.test(l.trim()));
    const notes = line ? [...line.matchAll(/[a-z_]+ ([1-5])/g)].map((m) => Number(m[1])) : [];
    return notes.length ? { total: notes.reduce((a, b) => a + b, 0), max: notes.length * 5 } : null;
  }
  const improvedKept = /## Tras la mejora/.test(text) && totals.length > 1 && !/Resultado:[^\n]*empeoraba/.test(text);
  return improvedKept ? totals[totals.length - 1] : totals[0];
}

export interface ReferencePiece {
  dir: string;
  total: number;
  max: number;
  /** Captura a 600 px de esa pieza (render-600.png). */
  render: string;
}

export function bestPreviousPiece(root: string, slug: string, currentDir = ''): ReferencePiece | null {
  if (!slug) return null;
  let best: ReferencePiece | null = null;
  for (const year of listDirs(path.join(root, 'newsletters'))) {
    const base = path.join(root, 'newsletters', year, slug, 'hermes');
    for (const name of listDirs(base).filter((d) => !d.startsWith('_')).sort()) {
      const abs = path.join(base, name);
      const rel = path.relative(root, abs);
      const render = path.join(abs, '_trabajo', 'render-600.png');
      if (rel === currentDir || !fs.existsSync(path.join(abs, 'newsletter.html')) || !fs.existsSync(render)) continue;
      const s = pieceScore(abs);
      if (!s || s.total / s.max < REFERENCE_MIN) continue;
      // A igual nota, la más reciente (los nombres empiezan por la fecha y van en orden).
      if (!best || s.total / s.max >= best.total / best.max) best = { dir: rel, total: s.total, max: s.max, render };
    }
  }
  return best;
}

export function referenceNote(ref: ReferencePiece | null, brandName: string, file: string): string {
  if (!ref) return '';
  return [
    '',
    `## Referencia: la mejor pieza anterior de ${brandName} (nota de arte ${ref.total}/${ref.max}, ${ref.dir})`,
    `- Captura a 600 px: ${file}. Mírala UNA vez con vision_analyze antes de escribir: es el listón de calidad de esta`,
    '  marca (identidad, aire, jerarquía, fotos). NO la copies: el concepto, las escenas y los titulares de esta pieza son',
    '  nuevos y salen del brief. Supérala.',
  ].join('\n');
}
