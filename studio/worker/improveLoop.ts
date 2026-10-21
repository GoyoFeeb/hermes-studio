/**
 * improveLoop.ts — iteraciones de mejora tras la primera nota y el control de calidad (2026-10-21).
 *
 * La revisión visual deja criterios por debajo del máximo y una lista de mejoras, y con
 * HERMES_ART_REVISE_PASSES=0 esa lista no se aplica. Este bucle sí: le pasa al modelo lo que
 * flojea (los más bajos primero, con la razón de cada nota y todas las mejoras propuestas),
 * vuelve a puntuar y se queda con la mejor versión. Una pasada que baja la nota se descarta y
 * el bucle sigue desde esa mejor versión, con otro encargo, hasta el objetivo o hasta
 * HERMES_IMPROVE_MAX_PASSES.
 *
 * HERMES_ART_REVISE_PASSES no hace falta subirlo: esa pasada es la reescritura de gusto con
 * comparaciones A/B, y este bucle la sustituye para entregar. Déjala en 0.
 */
import * as os from 'os';
import * as path from 'path';

export const IMPROVE_REVISE_CAP_MS = 6 * 60 * 1000;
export const IMPROVE_SCORE_CAP_MS = 4 * 60 * 1000;
export const IMPROVE_MIN_START_MS = 3 * 60 * 1000;
export const SCORE_PER_CRITERION = 5;

const CRITERION_LABELS: Record<string, string> = {
  peticion: 'petición',
  texto_imagen: 'texto e imagen',
  identidad: 'identidad',
  concepto: 'concepto',
  jerarquia: 'jerarquía',
  aire: 'aire',
  originalidad: 'originalidad',
  movil: 'móvil',
  oscuro: 'oscuro',
  copy: 'copy',
};

export function criterionLabel(id: string): string {
  return CRITERION_LABELS[id] || id;
}

export interface ImproveSettings {
  maxPasses: number;
  /** Fracción del máximo visual (1 = 100 %). */
  target: number;
}

export interface ImproveSnapshot {
  notas: Record<string, number> | null;
  total: number | null;
  max: number | null;
  per: number;
  qcErrors: number;
  qcLines: string[];
  mejoras: string[];
  problemas: string[];
  defectos: string[];
  /** Por qué el revisor puso cada nota. */
  pruebas: Record<string, string>;
}

/** Tras una pasada descartada: el siguiente encargo se estrecha y no repite lo que bajó la nota. */
export interface ImproveRetry {
  focus: string[];
  avoid: string[];
}

export interface ImproveNotes {
  notas: Record<string, number>;
  total: number;
  max: number;
}

export interface ImprovePass {
  n: number;
  before: ImproveNotes;
  after: ImproveNotes | null;
  qcBefore: number;
  qcAfter: number | null;
  kept: boolean;
  changed: string[];
  reason: string;
  durationMs: number;
}

/** Lo que se guarda en el trabajo y se pinta en la página. */
export interface JobImprove {
  target: number;
  maxPasses: number;
  initial: ImproveNotes;
  final: ImproveNotes;
  passes: ImprovePass[];
  reached: boolean;
  /** Ids de criterio que siguen por debajo del máximo en la versión entregada. */
  belowMax: string[];
  qcErrors: number;
  /** Errores de QC que una pasada conservada quitó (el texto, no solo el número). */
  qcFixed?: string[];
  closed?: boolean;
}

function intEnv(raw: string | undefined, fallback: number, min: number, max: number): number {
  if (raw == null || String(raw).trim() === '') return fallback;
  const n = Number(raw);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, Math.floor(n)));
}

/** Fracción. Vacío, no numérico o ≤ 0 dejan el defecto. Por encima de 1 se recorta a 1; por debajo de 0,5, a 0,5. */
function targetEnv(raw: string | undefined, fallback: number): number {
  if (raw == null || String(raw).trim() === '') return fallback;
  const n = Number(raw);
  if (!Number.isFinite(n) || n <= 0) return fallback;
  return Math.min(1, Math.max(0.5, n));
}

export function improveSettings(env: NodeJS.ProcessEnv = process.env): ImproveSettings {
  return {
    maxPasses: intEnv(env.HERMES_IMPROVE_MAX_PASSES, 3, 0, 6),
    target: targetEnv(env.HERMES_IMPROVE_TARGET, 1),
  };
}

export function snapshotOf(opts: {
  notas?: Record<string, number> | null;
  mejoras?: string[];
  problemas?: string[];
  defectos?: string[];
  qcLines?: string[];
  pruebas?: Record<string, string> | null;
  per?: number;
}): ImproveSnapshot {
  const per = opts.per && opts.per > 0 ? opts.per : SCORE_PER_CRITERION;
  const notas = opts.notas && Object.keys(opts.notas).length ? { ...opts.notas } : null;
  const values = notas ? Object.values(notas) : [];
  const qcLines = (opts.qcLines || []).map((line) => line.trim()).filter(Boolean);
  const pruebas: Record<string, string> = {};
  for (const [key, value] of Object.entries(opts.pruebas || {})) {
    if (!/^[a-z_]{2,24}$/.test(key) || typeof value !== 'string') continue;
    const clean = value.replace(/\s+/g, ' ').trim();
    if (!clean) continue;
    pruebas[key] = clean.slice(0, 400);
    if (Object.keys(pruebas).length >= 12) break;
  }
  return {
    notas,
    total: notas ? values.reduce((a, b) => a + b, 0) : null,
    max: notas ? values.length * per : null,
    per,
    qcErrors: qcLines.length,
    qcLines,
    mejoras: [...(opts.mejoras || [])],
    problemas: [...(opts.problemas || [])],
    defectos: [...(opts.defectos || [])],
    pruebas,
  };
}

/** Carpeta escribible para la mejora de la versión B. `/app` en el contenedor no lo es. */
export function improveTempDir(id: string, env: NodeJS.ProcessEnv = process.env, tmp: string = os.tmpdir()): string {
  const configured = (env.HERMES_IMPROVE_TMP || '').trim();
  const root = configured || tmp;
  const safe = id.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 80) || 'job';
  return path.join(root, 'hermes-improve', safe);
}

/** Criterios por debajo del máximo, del más flojo al menos. */
export function criteriaByWeakness(snap: ImproveSnapshot): string[] {
  if (!snap.notas) return [];
  return Object.keys(snap.notas)
    .filter((k) => snap.notas![k] < snap.per)
    .sort((a, b) => snap.notas![a] - snap.notas![b] || a.localeCompare(b));
}

export function criteriaBelowMax(snap: ImproveSnapshot): string[] {
  if (!snap.notas) return [];
  return Object.keys(snap.notas).filter((k) => snap.notas![k] < snap.per);
}

export function criteriaAtMax(snap: ImproveSnapshot): string[] {
  if (!snap.notas) return [];
  return Object.keys(snap.notas).filter((k) => snap.notas![k] >= snap.per);
}

/** Objetivo visual alcanzado y sin errores de QC. Sin nota visual, basta con el QC limpio. */
export function reachedTarget(snap: ImproveSnapshot, target: number): boolean {
  if (snap.qcErrors > 0) return false;
  if (snap.total == null || snap.max == null || snap.max <= 0) return true;
  return snap.total / snap.max >= target - 1e-9;
}

export function shouldImprove(snap: ImproveSnapshot, target: number, maxPasses: number): boolean {
  if (maxPasses < 1) return false;
  if (reachedTarget(snap, target)) return false;
  return criteriaBelowMax(snap).length > 0 || snap.qcErrors > 0;
}

function notesOf(snap: ImproveSnapshot): ImproveNotes | null {
  if (!snap.notas || snap.total == null || snap.max == null) return null;
  return { notas: { ...snap.notas }, total: snap.total, max: snap.max };
}

function emptyNotes(): ImproveNotes {
  return { notas: {}, total: 0, max: 0 };
}

/** Un criterio que ya estaba en el máximo no puede bajar: eso no se queda aunque el total suba. */
export function droppedMaxCriterion(best: ImproveSnapshot, next: ImproveSnapshot): string | null {
  if (!best.notas || !next.notas) return null;
  for (const key of Object.keys(best.notas)) {
    if (best.notas[key] >= best.per && (next.notas[key] ?? 0) < best.notas[key]) return key;
  }
  return null;
}

export function compareRevision(
  best: ImproveSnapshot,
  next: ImproveSnapshot | null,
  htmlChanged: boolean
): { keep: boolean; reason: string } {
  if (!htmlChanged) return { keep: false, reason: 'Hermes no cambió el HTML' };
  if (!next || (best.total != null && next.total == null)) return { keep: false, reason: 'no se pudo volver a puntuar' };
  const dropped = droppedMaxCriterion(best, next);
  if (dropped) return { keep: false, reason: `bajó ${criterionLabel(dropped)}, que ya estaba en el máximo` };
  if (best.total != null && next.total != null) {
    if (next.total < best.total) return { keep: false, reason: 'la nota bajó' };
    if (next.qcErrors > best.qcErrors) return { keep: false, reason: 'añadía errores de calidad' };
    if (next.total === best.total && next.qcErrors >= best.qcErrors) return { keep: false, reason: 'la nota no subió' };
    if (next.total > best.total) return { keep: true, reason: 'se queda: la nota sube' };
    return { keep: true, reason: 'se queda: menos errores de calidad' };
  }
  if (next.qcErrors > best.qcErrors) return { keep: false, reason: 'añadía errores de calidad' };
  if (next.qcErrors < best.qcErrors) return { keep: true, reason: 'se queda: menos errores de calidad' };
  if (best.total == null && next.total != null) return { keep: true, reason: 'se queda: la nota sube' };
  return { keep: false, reason: 'la nota no subió' };
}

export const EMAIL_CONSTRAINTS =
  'Restricciones de email (obligatorias): maqueta con tablas, sin flex ni grid; ancho de 600 px; el HTML por debajo de ' +
  '102 KB (Gmail recorta a partir de ahí); compatible con Outlook y Gmail (botones con VML, condicionales <!--[if mso]>); ' +
  'modo oscuro legible (texto claro sobre fondo oscuro y el logo visible); accesible (alt en todas las imágenes, contraste ' +
  'suficiente, cuerpo de al menos 14 px en la columna de 375 px).';

function criterionBrief(snap: ImproveSnapshot, key: string, criteria: Record<string, string>): string {
  const note = snap.notas?.[key];
  const desc = criteria[key] ? ` ${criteria[key]}` : '';
  const why = snap.pruebas[key] ? ` Por qué: ${snap.pruebas[key]}` : '';
  return `- ${key} ${note}/${snap.per}.${desc}${why}`;
}

export function improvePrompt(opts: {
  filePath: string;
  brand: string;
  snap: ImproveSnapshot;
  criteria?: Record<string, string>;
  webPath?: string;
  checkCmd: string;
  retry?: ImproveRetry | null;
  /** Aprendizajes ya vistos en otras piezas (generales y de esta marca). */
  learnings?: string;
}): string {
  const failing = criteriaByWeakness(opts.snap);
  const solid = criteriaAtMax(opts.snap);
  const criteria = opts.criteria || {};
  const retry = opts.retry && (opts.retry.focus.length || opts.retry.avoid.length) ? opts.retry : null;
  const lines: string[] = [
    `Revisa la newsletter ${opts.filePath} (${opts.brand}) y sube solo lo que está flojo. La pieza ya está hecha: no la rehagas.`,
    opts.webPath ? `Portada de la web de la marca, para no alejarte de ella: ${opts.webPath}.` : '',
    '',
    'Quédate con lo que ya puntúa bien y con la fidelidad a la marca (tipografía, colores, tono y fotos). No inventes precios, cifras ni enlaces.',
    EMAIL_CONSTRAINTS,
    '',
  ];
  if (opts.learnings?.trim()) lines.push(opts.learnings.trim(), '');
  if (opts.snap.notas && opts.snap.total != null && opts.snap.max != null) {
    lines.push(
      `Nota visual actual: ${opts.snap.total}/${opts.snap.max}.`,
      ...Object.entries(opts.snap.notas).map(([k, n]) => `- ${k} ${n}/${opts.snap.per}`),
      ''
    );
  }
  if (solid.length && !retry) {
    lines.push(
      `No toques estos criterios: ya están en el máximo (${opts.snap.per}/${opts.snap.per}).`,
      ...solid.map((k) => `- ${k}`),
      ''
    );
  }
  if (retry) {
    lines.push(
      'La pasada anterior se descartó. No repitas lo que hizo bajar la nota:',
      ...retry.avoid.map((line) => `- ${line}`),
      ''
    );
    if (retry.focus.length) {
      lines.push('Esta pasada céntrate solo en los uno o dos criterios más flojos. No toques el resto:');
      for (const key of retry.focus) lines.push(criterionBrief(opts.snap, key, criteria));
      lines.push('');
    }
  } else if (failing.length) {
    lines.push('Empieza por los criterios más flojos, en este orden, y súbelos:');
    for (const key of failing) lines.push(criterionBrief(opts.snap, key, criteria));
    lines.push('');
  }
  if (opts.snap.problemas.length) {
    lines.push('Problemas que bajan la nota:', ...opts.snap.problemas.map((p) => `- ${p}`), '');
  }
  if (opts.snap.mejoras.length && !retry) {
    lines.push(
      'Mejoras propuestas: aplícalas todas, empezando por las de los criterios más flojos. No dejes ninguna sin hacer, salvo que rompa una restricción de email o baje un criterio que ya está en el máximo.',
      ...opts.snap.mejoras.map((p) => `- ${p}`),
      ''
    );
  } else if (opts.snap.mejoras.length && retry) {
    const focus = new Set(retry.focus);
    const related = opts.snap.mejoras.filter((line) => [...focus].some((key) => line.toLowerCase().includes(key.replace(/_/g, ' ')) || line.toLowerCase().includes(key)));
    const picked = related.length ? related : opts.snap.mejoras.slice(0, 2);
    lines.push(
      'De las mejoras propuestas, aplica solo las de esos criterios:',
      ...picked.map((p) => `- ${p}`),
      ''
    );
  }
  if (opts.snap.defectos.length) {
    lines.push('Defectos claros (arréglalos):', ...opts.snap.defectos.map((p) => `- ${p}`), '');
  }
  if (opts.snap.qcLines.length) {
    lines.push('Errores del control de calidad (hay que dejarlos a cero):', ...opts.snap.qcLines.map((p) => `- ${p}`), '');
  }
  lines.push(
    'No cambies textos, fotos, colores ni enlaces que no hagan falta para esos puntos. Todo texto nuevo es de la marca para su cliente: nunca escribas que la pieza habla de sí misma.',
    `Después ejecuta \`${opts.checkCmd}\` y deja la pieza sin errores.`,
    'En la última línea, y solo en esa línea, un JSON con lo que cambiaste: {"cambios": ["qué y dónde", "..."]}. Si no cambias nada, {"cambios": []}.',
    'Nadie va a responder preguntas: no uses clarify. Respuesta final: esa línea JSON.'
  );
  return lines.filter((line, i, arr) => line !== '' || (i > 0 && arr[i - 1] !== '')).join('\n');
}

function clipList(items: unknown, max = 8): string[] {
  if (!Array.isArray(items)) return [];
  const out: string[] = [];
  for (const item of items) {
    if (typeof item !== 'string') continue;
    const clean = item.replace(/\s+/g, ' ').trim();
    if (!clean) continue;
    out.push(clean.slice(0, 240));
    if (out.length >= max) break;
  }
  return out;
}

function extractObject(text: string, start: number): string | null {
  if (text[start] !== '{') return null;
  let depth = 0;
  let quote = false;
  let escape = false;
  for (let i = start; i < text.length; i++) {
    const ch = text[i];
    if (quote) {
      if (escape) escape = false;
      else if (ch === '\\') escape = true;
      else if (ch === '"') quote = false;
      continue;
    }
    if (ch === '"') quote = true;
    else if (ch === '{') depth++;
    else if (ch === '}') {
      depth--;
      if (depth === 0) return text.slice(start, i + 1);
    }
  }
  return null;
}

/** Lo que el modelo dice que cambió. JSON `cambios` o, si no hay, las viñetas. */
export function parseChanges(output: string): string[] {
  if (!output?.trim()) return [];
  const idx = output.lastIndexOf('"cambios"');
  if (idx >= 0) {
    const start = output.lastIndexOf('{', idx);
    const obj = start >= 0 ? extractObject(output, start) : null;
    if (obj) {
      try {
        const parsed = JSON.parse(obj) as { cambios?: unknown };
        const list = clipList(parsed.cambios);
        if (list.length || Array.isArray(parsed.cambios)) return list;
      } catch {
        // sigue con las viñetas
      }
    }
  }
  const bullets = output
    .split('\n')
    .map((line) => line.match(/^\s*[-*]\s+(.+)/)?.[1] || '')
    .filter(Boolean);
  return clipList(bullets);
}

export function formatScore(total: number | null, max: number | null): string {
  if (total == null || max == null) return 'sin nota';
  return `${total}/${max}`;
}

type ScoreLine = { notas: Record<string, number> | null; total: number | null; max: number | null };

/** Total y cada criterio. El que cambia va `3→4`; el que no, solo la nota. */
export function formatPassScoreLine(before: ScoreLine, after: ScoreLine | null): string {
  const head = `${formatScore(before.total, before.max)} → ${formatScore(after?.total ?? null, after?.max ?? null)}`;
  const keys = Object.keys(before.notas || {});
  if (!keys.length) return head;
  const parts = keys.map((key) => {
    const from = before.notas![key];
    const to = after?.notas?.[key];
    if (to == null || to === from) return `${key} ${from}`;
    return `${key} ${from}→${to}`;
  });
  return `${head} (${parts.join(', ')})`;
}

/**
 * Lo que cabe en el comentario de ClickUp. Con notas: todos los criterios en 3 o menos;
 * si no hay ninguno tan bajo, los 3 más flojos de los que no están en el máximo.
 * Sin notas, los 3 primeros de `belowMax` (registros antiguos).
 */
export function commentCriteria(finalNotes: ImproveNotes | null | undefined, belowMax: string[]): string[] {
  const notas = finalNotes?.notas || {};
  const keys = Object.keys(notas);
  if (!keys.length) return belowMax.slice(0, 3);
  const below = [
    ...keys.filter((key) => notas[key] < SCORE_PER_CRITERION),
    ...belowMax.filter((key) => notas[key] == null),
  ];
  const score = (key: string) => notas[key] ?? SCORE_PER_CRITERION;
  const byWeak = (a: string, b: string) => score(a) - score(b) || a.localeCompare(b);
  const severe = below.filter((key) => score(key) <= 3).sort(byWeak);
  if (severe.length) return severe;
  return [...new Set(below)].sort(byWeak).slice(0, 3);
}

/** La pasada que se descarta: el siguiente encargo mira solo los 1–2 criterios más flojos de la mejor versión. */
export function retryFrom(best: ImproveSnapshot, next: ImproveSnapshot | null, changed: string[], reason: string): ImproveRetry {
  const avoid = [reason];
  if (best.notas && next?.notas) {
    for (const key of Object.keys(best.notas)) {
      const from = best.notas[key];
      const to = next.notas[key];
      if (to != null && to < from) avoid.push(`bajó ${criterionLabel(key)} ${from} → ${to}`);
    }
  }
  for (const change of changed) avoid.push(`no repitas: ${change}`);
  return { focus: criteriaByWeakness(best).slice(0, 2), avoid: avoid.filter(Boolean).slice(0, 8) };
}

export function formatImproveComment(imp: Pick<JobImprove, 'initial' | 'final' | 'passes' | 'reached' | 'belowMax' | 'qcErrors'>): string {
  const n = imp.passes.length;
  const passes = n === 1 ? '1 pasada' : `${n} pasadas`;
  if (!imp.initial.max || !imp.final.max) {
    const from = imp.passes[0]?.qcBefore ?? 0;
    const to = imp.qcErrors;
    return `errores de calidad ${from} → ${to} (${passes})`;
  }
  let line = `nota visual ${imp.initial.total}/${imp.initial.max} → ${imp.final.total}/${imp.final.max} (${passes})`;
  if (!imp.reached) {
    const names = commentCriteria(imp.final, imp.belowMax).map(criterionLabel);
    if (names.length) line += `. Siguen por debajo del máximo: ${names.join(', ')}`;
    else if (imp.qcErrors > 0) line += `. Quedan ${imp.qcErrors} error${imp.qcErrors === 1 ? '' : 'es'} de calidad`;
  }
  return line;
}

export interface ImproveLoopDeps {
  opening: ImproveSnapshot;
  /** Nota de la pieza que hay ahora (puede ser la misma que `opening`). */
  best: ImproveSnapshot;
  maxPasses: number;
  target: number;
  timeLeftMs: () => number;
  minStartMs: number;
  alive?: () => boolean;
  now?: () => number;
  readHtml: () => string;
  restoreHtml: (html: string) => void;
  revise: (prompt: string, pass: number) => Promise<string>;
  rescore: () => Promise<ImproveSnapshot | null>;
  promptFor: (snap: ImproveSnapshot, pass: number, retry?: ImproveRetry | null) => string;
  onKeep?: (snap: ImproveSnapshot) => void;
  log?: (line: string) => void;
}

function belowOf(snap: ImproveSnapshot): string[] {
  return criteriaBelowMax(snap);
}

/** Corre las pasadas. Devuelve el registro aunque no haya ninguna (el llamador decide si lo guarda). */
export async function runImproveLoop(deps: ImproveLoopDeps): Promise<JobImprove> {
  const now = deps.now || Date.now;
  const alive = deps.alive || (() => true);
  let best = deps.best;
  const passes: ImprovePass[] = [];
  const openingNotes = notesOf(deps.opening) || emptyNotes();
  const qcFixed: string[] = [];
  let retry: ImproveRetry | null = null;

  for (let n = 1; n <= deps.maxPasses; n++) {
    if (!alive()) break;
    if (reachedTarget(best, deps.target)) break;
    if (!shouldImprove(best, deps.target, deps.maxPasses)) break;
    if (deps.timeLeftMs() < deps.minStartMs) {
      deps.log?.(`sin tiempo para otra pasada (${Math.round(deps.timeLeftMs() / 1000)} s)`);
      break;
    }
    const beforeHtml = deps.readHtml();
    const beforeSnap = best;
    const started = now();
    let output = '';
    try {
      output = await deps.revise(deps.promptFor(best, n, retry), n);
    } catch (err) {
      output = '';
      deps.log?.(`pasada ${n}: el modelo falló (${(err as Error).message || 'error'})`);
    }
    if (!alive()) {
      if (deps.readHtml() !== beforeHtml) deps.restoreHtml(beforeHtml);
      break;
    }
    const htmlChanged = deps.readHtml() !== beforeHtml;
    let next: ImproveSnapshot | null = null;
    if (htmlChanged) {
      try {
        next = await deps.rescore();
      } catch (err) {
        next = null;
        deps.log?.(`pasada ${n}: no se pudo volver a puntuar (${(err as Error).message || 'error'})`);
      }
    }
    const durationMs = Math.max(0, now() - started);
    const decision = compareRevision(beforeSnap, next, htmlChanged);
    const changed = parseChanges(output);
    const beforeNotes = notesOf(beforeSnap) || emptyNotes();
    const afterNotes = next ? notesOf(next) : null;
    if (!decision.keep) {
      if (htmlChanged) deps.restoreHtml(beforeHtml);
      passes.push({
        n,
        before: beforeNotes,
        after: afterNotes,
        qcBefore: beforeSnap.qcErrors,
        qcAfter: next ? next.qcErrors : null,
        kept: false,
        changed,
        reason: decision.reason,
        durationMs,
      });
      deps.log?.(
        `pasada ${n}: ${formatPassScoreLine(beforeSnap, next)} en ${Math.round(durationMs / 1000)} s — ${decision.reason}`
      );
      // Una pasada que baja (o no cambia) no para el bucle: se vuelve a la mejor versión y se prueba otra.
      retry = retryFrom(beforeSnap, next, changed, decision.reason);
      continue;
    }
    retry = null;
    for (const line of beforeSnap.qcLines) {
      if (next && !next.qcLines.includes(line) && !qcFixed.includes(line)) qcFixed.push(line);
    }
    best = next as ImproveSnapshot;
    if (!changed.length) changed.push('Revisión de los criterios flojos.');
    passes.push({
      n,
      before: beforeNotes,
      after: afterNotes,
      qcBefore: beforeSnap.qcErrors,
      qcAfter: best.qcErrors,
      kept: true,
      changed,
      reason: decision.reason,
      durationMs,
    });
    deps.onKeep?.(best);
    deps.log?.(
      `pasada ${n}: ${formatPassScoreLine(beforeNotes, best)} en ${Math.round(durationMs / 1000)} s — ${decision.reason}`
    );
    if (reachedTarget(best, deps.target)) break;
  }

  const finalNotes = notesOf(best) || openingNotes;
  return {
    target: deps.target,
    maxPasses: deps.maxPasses,
    initial: openingNotes,
    final: finalNotes,
    passes,
    reached: reachedTarget(best, deps.target),
    belowMax: belowOf(best),
    qcErrors: best.qcErrors,
    ...(qcFixed.length ? { qcFixed: qcFixed.slice(0, 20) } : {}),
  };
}

function asNotes(raw: unknown): ImproveNotes | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;
  const notas: Record<string, number> = {};
  if (r.notas && typeof r.notas === 'object') {
    for (const [k, n] of Object.entries(r.notas as Record<string, unknown>).slice(0, 20)) {
      const num = Number(n);
      if (/^[a-z_]{2,24}$/.test(k) && num >= 1 && num <= 5) notas[k] = Math.round(num);
    }
  }
  const total = Number(r.total);
  const max = Number(r.max);
  if (!Number.isFinite(total) || !Number.isFinite(max) || max < 0 || max > 200 || total < 0 || total > max) return null;
  if (max > 0 && !Object.keys(notas).length) return null;
  return { notas, total: Math.round(total), max: Math.round(max) };
}

/** Lo que manda el worker por la red. Vacío o mal formado: no se guarda. */
export function sanitizeImproveRecord(raw: unknown): JobImprove | undefined {
  if (!raw || typeof raw !== 'object') return undefined;
  const r = raw as Record<string, unknown>;
  const initial = asNotes(r.initial);
  const finalNotes = asNotes(r.final);
  if (!initial || !finalNotes) return undefined;
  const target = Number(r.target);
  const maxPasses = Number(r.maxPasses);
  const passesIn = Array.isArray(r.passes) ? r.passes.slice(0, 8) : [];
  const passes: ImprovePass[] = [];
  for (const item of passesIn) {
    if (!item || typeof item !== 'object') continue;
    const p = item as Record<string, unknown>;
    const before = asNotes(p.before);
    if (!before) continue;
    const after = p.after == null ? null : asNotes(p.after);
    const n = Math.round(Number(p.n));
    if (!Number.isFinite(n) || n < 1 || n > 8) continue;
    passes.push({
      n,
      before,
      after,
      qcBefore: Math.max(0, Math.min(40, Math.round(Number(p.qcBefore) || 0))),
      qcAfter: p.qcAfter == null || p.qcAfter === '' ? null : Math.max(0, Math.min(40, Math.round(Number(p.qcAfter) || 0))),
      kept: p.kept === true,
      changed: clipList(p.changed),
      reason: typeof p.reason === 'string' ? p.reason.replace(/\s+/g, ' ').trim().slice(0, 240) : '',
      durationMs: Math.max(0, Math.min(60 * 60 * 1000, Math.round(Number(p.durationMs) || 0))),
    });
  }
  const belowMax = Array.isArray(r.belowMax)
    ? r.belowMax.filter((id) => typeof id === 'string' && /^[a-z_]{2,24}$/.test(id)).slice(0, 20)
    : [];
  return {
    target: Number.isFinite(target) ? Math.min(1, Math.max(0.5, target)) : 1,
    maxPasses: Number.isFinite(maxPasses) ? Math.min(6, Math.max(0, Math.round(maxPasses))) : passes.length,
    initial,
    final: finalNotes,
    passes,
    reached: r.reached === true,
    belowMax,
    qcErrors: Math.max(0, Math.min(40, Math.round(Number(r.qcErrors) || 0))),
    ...(clipList(r.qcFixed, 20).length ? { qcFixed: clipList(r.qcFixed, 20) } : {}),
    ...(r.closed === true ? { closed: true } : {}),
  };
}
