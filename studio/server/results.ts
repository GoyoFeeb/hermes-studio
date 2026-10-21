/**
 * results.ts — una pieza terminada por página, la más nueva primero (2026-10-21).
 *
 * GET /api/results acepta offset, un cursor opaco o ?job= para abrir esa pieza.
 * La ruta vive detrás del mismo acceso que el resto de /api (cuenta @feebbo.com).
 */
import type { ImproveNotes, ImprovePass, JobImprove } from '../worker/improveLoop';
import type { QualityReport } from '../worker/qualityCheck';
import { durationSec } from './standalone';
import { artPct, finalArtNotes, type Job, type JobArtReview } from './store';

export const RESULTS_DEFAULT_LIMIT = 1;
export const RESULTS_MAX_LIMIT = 20;

const ART_LABELS: Record<string, string> = {
  peticion: 'Petición',
  texto_imagen: 'Texto e imagen',
  identidad: 'Identidad',
  concepto: 'Concepto',
  jerarquia: 'Jerarquía',
  aire: 'Aire',
  originalidad: 'Originalidad',
  movil: 'Móvil',
  oscuro: 'Oscuro',
  copy: 'Textos',
};
const ART_ORDER = Object.keys(ART_LABELS);

export interface ResultCriterion {
  id: string;
  label: string;
  score: number;
}

export interface ResultArt {
  pct: number;
  score: number;
  max: number;
  criteria: ResultCriterion[];
}

export interface ResultCheck {
  id: string;
  label: string;
  status: string;
  errorCount: number;
}

export interface ResultQuality {
  errors: number;
  warnings: number;
  checks: ResultCheck[];
}

export interface ResultImproveCriterion {
  id: string;
  label: string;
  before: number | null;
  after: number | null;
}

export interface ResultImprovePass {
  n: number;
  before: string | null;
  after: string | null;
  kept: boolean;
  reason: string;
  durationSec: number;
  changed: string[];
  criteria: ResultImproveCriterion[];
}

export interface ResultImprove {
  initial: string | null;
  final: string | null;
  passCount: number;
  reached: boolean;
  belowMax: string[];
  qcErrors: number;
  durationSec: number;
  passes: ResultImprovePass[];
}

export interface ResultVersion {
  label: 'A' | 'B';
  preview: string;
  art: ResultArt | null;
  quality: ResultQuality | null;
  improve: ResultImprove | null;
}

export interface ResultUsageStep {
  id: string;
  label: string;
  inputTokens: number;
  outputTokens: number;
  cacheTokens: number;
  cacheReadTokens: number;
  cacheWriteTokens: number;
  costEur: number | null;
  costUsd: number | null;
  durationSec: number;
  model: string | null;
}

export interface ResultUsage {
  known: boolean;
  durationSec: number | null;
  inputTokens: number | null;
  outputTokens: number | null;
  cacheTokens: number | null;
  cacheReadTokens: number | null;
  cacheWriteTokens: number | null;
  tokens: number | null;
  costEur: number | null;
  costUsd: number | null;
  steps: ResultUsageStep[];
}

export interface ResultItem {
  id: string;
  createdAt: string;
  finishedAt: string | null;
  clientName: string;
  clientSlug: string;
  campaignName: string | null;
  title: string | null;
  clickupUrl: string | null;
  clickupTaskId: string | null;
  requesterName: string | null;
  durationSec: number | null;
  previewA: string;
  previewB: string | null;
  art: ResultArt | null;
  quality: ResultQuality | null;
  improve: ResultImprove | null;
  usage: ResultUsage;
  versions: { a: ResultVersion; b: ResultVersion | null };
}

export interface ResultsPage {
  total: number;
  offset: number;
  limit: number;
  prevCursor: string | null;
  nextCursor: string | null;
  prevJob: string | null;
  nextJob: string | null;
  items: ResultItem[];
}

export type ResultsOutcome = { ok: true; page: ResultsPage } | { ok: false; status: 404 };

export function encodeResultsCursor(offset: number): string {
  return Buffer.from(`offset:${offset}`, 'utf8').toString('base64url');
}

export function decodeResultsCursor(cursor: string): number | null {
  try {
    const text = Buffer.from(cursor, 'base64url').toString('utf8');
    const match = text.match(/^offset:(\d+)$/);
    if (!match) return null;
    const n = Number(match[1]);
    return Number.isSafeInteger(n) && n >= 0 ? n : null;
  } catch {
    return null;
  }
}

function queryString(value: unknown): string | null {
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  if (typeof value !== 'string') return null;
  const clean = value.trim();
  return clean ? clean : null;
}

function queryLimit(value: unknown): number {
  const raw = queryString(value);
  const n = raw == null ? RESULTS_DEFAULT_LIMIT : Number(raw);
  if (!Number.isFinite(n)) return RESULTS_DEFAULT_LIMIT;
  return Math.min(RESULTS_MAX_LIMIT, Math.max(1, Math.floor(n)));
}

function queryOffset(value: unknown): number {
  const raw = queryString(value);
  if (raw == null) return 0;
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 0) return 0;
  return Math.floor(n);
}

export function resultJobs(jobs: Job[]): Job[] {
  return jobs
    .filter((job) => job.input?.mode === 'standalone' && job.status === 'completed')
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt) || b.id.localeCompare(a.id));
}

function qualityView(report: QualityReport | undefined | null): ResultQuality | null {
  if (!report) return null;
  return {
    errors: report.errors,
    warnings: report.warnings,
    checks: (report.checks || []).map((check) => ({
      id: check.id,
      label: check.label,
      status: check.status,
      errorCount: check.errorCount,
    })),
  };
}

function scoreText(notes: ImproveNotes | null | undefined): string | null {
  if (!notes?.max) return null;
  return `${notes.total}/${notes.max}`;
}

function passCriteria(pass: ImprovePass): ResultImproveCriterion[] {
  const before = pass.before?.notas || {};
  const after = pass.after?.notas || null;
  const ids = [...Object.keys(before), ...Object.keys(after || {}).filter((id) => !(id in before))];
  return ids
    .filter((id) => {
      const from = before[id];
      const to = after ? after[id] : undefined;
      return !(from === 5 && (to === undefined || to === 5));
    })
    .map((id) => ({
      id,
      label: ART_LABELS[id] || id,
      before: typeof before[id] === 'number' ? before[id] : null,
      after: after && typeof after[id] === 'number' ? after[id] : null,
    }));
}

/** Pasadas que suben la nota o quitan errores. Sin pasadas, la ficha no enseña la sección. */
export function improveView(record: JobImprove | undefined): ResultImprove | null {
  if (!record?.passes?.length) return null;
  return {
    initial: scoreText(record.initial),
    final: scoreText(record.final),
    passCount: record.passes.length,
    reached: record.reached === true,
    belowMax: (record.belowMax || []).map((id) => ART_LABELS[id] || id),
    qcErrors: record.qcErrors || 0,
    durationSec: Math.round(record.passes.reduce((sum, pass) => sum + (pass.durationMs || 0), 0) / 1000),
    passes: record.passes.map((pass) => ({
      n: pass.n,
      before: scoreText(pass.before),
      after: pass.after ? scoreText(pass.after) : null,
      kept: pass.kept === true,
      reason: pass.reason || '',
      durationSec: Math.round((pass.durationMs || 0) / 1000),
      changed: pass.changed || [],
      criteria: passCriteria(pass),
    })),
  };
}

export function artView(review: JobArtReview | undefined): ResultArt | null {
  if (!review?.before) return null;
  const notes = finalArtNotes(review);
  const ids = [
    ...ART_ORDER.filter((id) => typeof notes[id] === 'number' && Number.isFinite(notes[id])),
    ...Object.keys(notes).filter((id) => !ART_ORDER.includes(id) && typeof notes[id] === 'number' && Number.isFinite(notes[id])),
  ];
  const criteria = ids.map((id) => ({ id, label: ART_LABELS[id] || id, score: notes[id] }));
  if (!criteria.length) return null;
  const score = criteria.reduce((sum, row) => sum + row.score, 0);
  return { pct: artPct(review), score, max: criteria.length * 5, criteria };
}

export function usageView(job: Job): ResultUsage {
  const steps = (job.usageSteps || []).map((step) => ({
    id: step.id,
    label: step.label,
    inputTokens: step.inputTokens,
    outputTokens: step.outputTokens,
    cacheTokens: step.cacheTokens,
    cacheReadTokens: step.cacheReadTokens,
    cacheWriteTokens: step.cacheWriteTokens,
    costEur: step.costEur,
    costUsd: step.costUsd,
    durationSec: step.durationSec,
    model: step.model,
  }));
  const input = job.inputTokens ?? 0;
  const output = job.outputTokens ?? 0;
  const cache = job.cacheTokens ?? 0;
  const fromSteps = steps.some((step) => step.inputTokens + step.outputTokens + step.cacheTokens > 0);
  const known = input + output + cache > 0 || fromSteps;
  return {
    known,
    durationSec: durationSec(job),
    inputTokens: known ? input : null,
    outputTokens: known ? output : null,
    cacheTokens: known ? cache : null,
    cacheReadTokens: known ? job.cacheReadTokens ?? 0 : null,
    cacheWriteTokens: known ? job.cacheWriteTokens ?? 0 : null,
    tokens: known ? input + output + cache : null,
    costEur: known ? job.costEur ?? null : null,
    costUsd: known ? job.costUsd ?? null : null,
    steps: known ? steps : [],
  };
}

export function resultItem(job: Job): ResultItem {
  const art = artView(job.artReview);
  const quality = qualityView(job.quality);
  const improve = improveView(job.improve);
  const usage = usageView(job);
  const previewA = `/api/jobs/${encodeURIComponent(job.id)}/result`;
  const previewB = job.channelB ? `/api/jobs/${encodeURIComponent(job.id)}/channel-b` : null;
  const taskId = job.input.clickupTaskId || null;
  return {
    id: job.id,
    createdAt: job.createdAt,
    finishedAt: job.finishedAt || null,
    clientName: job.input.clientName,
    clientSlug: job.input.clientSlug,
    campaignName: job.input.campaignName || null,
    title: job.title || null,
    clickupTaskId: taskId,
    clickupUrl: job.input.clickupUrl || (taskId ? `https://app.clickup.com/t/${taskId}` : null),
    requesterName: job.input.requesterName || null,
    durationSec: durationSec(job),
    usage,
    previewA,
    previewB,
    art,
    quality,
    improve,
    versions: {
      a: { label: 'A', preview: previewA, art, quality, improve },
      b: previewB
        ? {
            label: 'B',
            preview: previewB,
            art: null,
            quality: qualityView(job.channelB?.quality),
            improve: improveView(job.channelB?.improve),
          }
        : null,
    },
  };
}

function pageAt(ordered: Job[], offset: number, limit: number): ResultsPage {
  const total = ordered.length;
  const lastStart = total === 0 ? 0 : Math.floor((total - 1) / limit) * limit;
  const start = total === 0 ? 0 : Math.min(Math.max(0, offset), lastStart);
  const slice = ordered.slice(start, start + limit);
  const prevStart = start - limit;
  const nextStart = start + limit;
  return {
    total,
    offset: start,
    limit,
    prevCursor: prevStart >= 0 ? encodeResultsCursor(prevStart) : null,
    nextCursor: nextStart < total ? encodeResultsCursor(nextStart) : null,
    prevJob: start > 0 ? ordered[start - 1].id : null,
    nextJob: start + 1 < total ? ordered[start + 1].id : null,
    items: slice.map(resultItem),
  };
}

/** offset, cursor (gana al offset) o job (gana a los dos y abre esa pieza). */
export function paginateResults(jobs: Job[], query: Record<string, unknown>): ResultsOutcome {
  const ordered = resultJobs(jobs);
  const limit = queryLimit(query.limit);
  const jobId = queryString(query.job);
  if (jobId) {
    const index = ordered.findIndex((job) => job.id === jobId);
    if (index < 0) return { ok: false, status: 404 };
    return { ok: true, page: pageAt(ordered, index, limit) };
  }
  const cursor = queryString(query.cursor);
  const fromCursor = cursor ? decodeResultsCursor(cursor) : null;
  const offset = fromCursor != null ? fromCursor : queryOffset(query.offset);
  return { ok: true, page: pageAt(ordered, offset, limit) };
}
