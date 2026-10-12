/**
 * mirror.ts — archivos que, además de escribirse en disco, se copian a Supabase Storage (fase 1, paso 6 de
 * studio/PLAN-SUPABASE-FASE-1.md). El disco sigue mandando; la copia va por la cola de supabase.ts.
 */
import * as fs from 'fs';
import * as path from 'path';
import { ROOT, BRANDS_DIR, NEWSLETTERS_DIR } from './paths';
import { supabase } from './supabase';
import type { Bucket } from './supabase';

/** La misma regla que /assets en index.ts: de brands/ solo las imágenes son públicas. */
const PUBLIC_ASSET_RE = /\.(png|jpe?g|gif|webp|svg)$/i;

const MIME: Record<string, string> = {
  html: 'text/html; charset=utf-8', md: 'text/markdown; charset=utf-8', txt: 'text/plain; charset=utf-8',
  json: 'application/json', js: 'text/javascript', css: 'text/css', svg: 'image/svg+xml', png: 'image/png',
  jpg: 'image/jpeg', jpeg: 'image/jpeg', gif: 'image/gif', webp: 'image/webp', pdf: 'application/pdf', woff: 'font/woff',
};

export function contentTypeOf(file: string): string {
  return MIME[path.extname(file).slice(1).toLowerCase()] ?? 'application/octet-stream';
}

function inside(dir: string, abs: string): string | null {
  const rel = path.relative(dir, abs);
  return rel && !rel.startsWith('..') && !path.isAbsolute(rel) ? rel.split(path.sep).join('/') : null;
}

/** Dónde va un archivo del disco: newsletters/ entero a `newsletters` con su ruta desde la raíz (la de
 *  campaignRelPath); de brands/, las imágenes a `assets` y el resto a `brand-packs`, con su ruta dentro de
 *  brands/. null: no se copia (fuera de esas carpetas, u oculto). */
export function storageTarget(abs: string): { bucket: Bucket; key: string } | null {
  const hidden = (key: string) => key.split('/').some((seg) => seg.startsWith('.'));
  const newsletterKey = inside(NEWSLETTERS_DIR, abs);
  if (newsletterKey) return hidden(newsletterKey) ? null : { bucket: 'newsletters', key: inside(ROOT, abs) as string };
  const brandKey = inside(BRANDS_DIR, abs);
  if (brandKey) return hidden(brandKey) ? null : { bucket: PUBLIC_ASSET_RE.test(abs) ? 'assets' : 'brand-packs', key: brandKey };
  return null;
}

/** fs.writeFileSync y, si el archivo es de los que se copian y no está vacío, su copia a Supabase. */
export function writeMirrored(file: string, data: string | Uint8Array, encoding?: BufferEncoding): void {
  fs.writeFileSync(file, data, encoding);
  const target = storageTarget(path.resolve(file));
  if (!target || !data.length) return;
  supabase.saveFile(target.bucket, target.key, typeof data === 'string' ? data : Buffer.from(data), contentTypeOf(file));
}
