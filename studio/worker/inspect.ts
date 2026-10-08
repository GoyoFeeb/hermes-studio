/**
 * inspect.ts — la comprobación completa de una newsletter, igual para el worker y para Hermes (2026-10-05).
 *
 * Arreglos automáticos (autoFix.ts) → medición renderizando (renderChecks.ts) → control de calidad
 * (qualityCheck.ts). El worker la ejecuta al recibir la pieza; Hermes, antes de entregarla, con
 * `npm run check-newsletter -- <ruta>` (check-newsletter.ts), así corrige en su turno lo que antes volvía en
 * una ronda aparte.
 */
import * as fs from 'fs';
import * as path from 'path';
import { autoFix, compressLocalImages, hasAttr } from './autoFix';
import { renderChecks, resolveLocal, type RenderReport } from './renderChecks';
import { runQualityCheck, visibleText, type QualityReport, type Fetcher } from './qualityCheck';
import { buildBrandCard } from './brandCard';
import { readMeasuredIdentity } from './measureBrand';
import { asksForOffer, missingInPiece, offerFigures, pieceShowsFigure } from '../server/requestCoverage';
import { VERIFIED_FILE } from './claims';

/** Petición del equipo, en `_trabajo/` junto a la pieza (la escribe el worker al recibir el encargo). */
export const REQUEST_FILE = 'peticion.txt';

export interface InspectOptions {
  /** Aplica los arreglos automáticos y guarda el HTML. */
  fix?: boolean;
  /** Mide espacios, legibilidad y estructura (en «Pedir cambios» y «Adaptar a móvil» no se fuerzan). */
  design?: boolean;
  /** Carpeta de la marca (brands/<slug>) para la paleta. */
  brandSlug?: string;
  fetcher?: Fetcher;
}

export interface InspectResult {
  report: QualityReport;
  render: RenderReport | null;
  /** Arreglos automáticos aplicados. */
  applied: string[];
}

/** Imágenes con ruta local que no existen. */
export function missingLocalImages(html: string, htmlDir: string, root: string): string[] {
  const refs = [
    ...[...html.matchAll(/\b(?:src|background)\s*=\s*(["'])([^"']+)\1/gi)].map((m) => m[2]),
    ...[...html.matchAll(/url\(\s*(["']?)([^"')]+)\1\s*\)/gi)].map((m) => m[2]),
  ];
  return [...new Set(refs.filter((r) => /\.(png|jpe?g|gif|webp|svg)([?#]|$)/i.test(r) && !/^(https?:|data:|cid:|\{\{)/i.test(r) && !resolveLocal(r, htmlDir, root)))];
}

/** Colores de la marca: los del brand pack y los medidos en su web (measureBrand.ts). */
export function brandPalette(root: string, slug: string | undefined): string[] {
  if (!slug) return [];
  const out = new Set<string>();
  try {
    for (const c of buildBrandCard(root, slug).colors) out.add(c.value.trim().toLowerCase());
  } catch {
    // sin brand pack
  }
  const measured = readMeasuredIdentity(root, slug);
  for (const c of measured?.palette || []) out.add(c.toLowerCase());
  return [...out];
}

export async function inspectNewsletter(htmlPath: string, root: string, opts: InspectOptions = {}): Promise<InspectResult> {
  const dir = path.dirname(htmlPath);
  const applied: string[] = [];
  const palette = brandPalette(root, opts.brandSlug);
  let render: RenderReport | null = null;
  if (opts.fix) {
    const before = fs.readFileSync(htmlPath, 'utf8');
    // Solo hace falta renderizar antes si hay imágenes sin width (el arreglo necesita su ancho pintado).
    const needsWidths = [...before.matchAll(/<img\b[^>]*>/gi)].some((m) => !hasAttr(m[0], 'width'));
    const widths = needsWidths ? (await renderChecks(htmlPath, root, palette))?.imgWidths : undefined;
    const fixed = autoFix(before, widths);
    if (fixed.html !== before) fs.writeFileSync(htmlPath, fixed.html);
    applied.push(...fixed.applied, ...(await compressLocalImages(fixed.html, dir, root)));
  }
  render = await renderChecks(htmlPath, root, palette);
  const html = fs.readFileSync(htmlPath, 'utf8');
  // Lo que pidió el equipo (ocasión, oferta) tiene que estar en el texto de la pieza (Paredes, 2026-10-05).
  let request = '';
  try {
    request = opts.design ? fs.readFileSync(path.join(dir, '_trabajo', REQUEST_FILE), 'utf8') : '';
  } catch {
    // trabajo con prompt pegado o anterior a esta comprobación
  }
  // Lo verificado del encargo (brief + ficha de producto): sin él, los claims solo avisan (claims.ts).
  let verified: string | undefined;
  try {
    verified = fs.readFileSync(path.join(dir, '_trabajo', VERIFIED_FILE), 'utf8');
  } catch {
    // pieza suelta o anterior a esta comprobación
  }
  // La oferta con su cifra (Q1, 2026-10-07): solo si la pide la petición del equipo. Con «Prompt completo» se leía el
  // prompt, y los prompts nombran ofertas como algo a verificar («vigencia de cualquier oferta», Nike 08-10) o colaban
  // «saltes» por «sales» (Jordan 08-10: la corrección añadió «La oferta es de 190 €», el precio normal).
  const offerAsk = request;
  const pieceText = `${html.match(/<title>([\s\S]*?)<\/title>/i)?.[1] || ''} ${visibleText(html)}`;
  const report = await runQualityCheck(html, {
    offer: opts.design && offerAsk ? { asked: asksForOffer(offerAsk), verifiedFigures: offerFigures(verified || ''), pieceHasFigure: pieceShowsFigure(pieceText) } : undefined,
    verified,
    requestMissing: request ? missingInPiece(request, `${html.match(/<title>([\s\S]*?)<\/title>/i)?.[1] || ''} ${visibleText(html)}`).map((t) => t.label) : undefined,
    missingLocal: missingLocalImages(html, dir, root),
    mobileProblem: render ? render.mobile : undefined,
    layoutProblems: opts.design && render ? render.layout : undefined,
    design: opts.design && render ? render.design : undefined,
    darkFindings: render ? render.dark : undefined,
    imageFindings: render ? render.images : undefined,
    // Solo en piezas nuevas (design): «Pedir cambios» y «Adaptar a móvil» no se fuerzan a cambiar la portada.
    photoFindings: opts.design && render ? render.photos : undefined,
    frameFindings: opts.design && render ? render.frame : undefined,
    fetcher: opts.fetcher,
  });
  return { report, render, applied };
}
