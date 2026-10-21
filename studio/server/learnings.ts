/**
 * learnings.ts — lo que las pasadas de mejora enseñan, para que el siguiente primer borrador
 * salga más alto (2026-10-21).
 *
 * El disco manda (`studio/data/learnings.json`), igual que los trabajos. La copia a Supabase
 * sale por el mismo sitio que el resto (`supabase.saveLearnings`): cuando la base pase al
 * Amazon del equipo, se cambia el repositorio, no quién llama. La lógica (extraer, deduplicar,
 * ordenar, acotar) no toca el disco.
 *
 * Se guarda poco: las N generales y las N de cada marca que más se repiten y más mueven la nota.
 * El encargo solo ve esas. El mismo aprendizaje entra en general y en la marca.
 */
import * as fs from 'fs';
import * as path from 'path';
import { DATA_DIR } from './paths';
import { emailAllowed } from './auth';
import { supabase } from './supabase';
import { criterionLabel, type ImprovePass, type JobImprove } from '../worker/improveLoop';

export const LEARNING_TOP_GENERAL = 12;
export const LEARNING_TOP_CLIENT = 8;
/** El archivo guarda un poco más que el encargo, para que la frecuencia pueda subir antes de caerse de la lista. */
const STORE_GENERAL = 36;
const STORE_CLIENT = 24;
const AVOID_MAX = 6;
const MAX_SCORES = 400;
const MAX_INGESTED = 800;
const MAX_JOB_IDS = 8;

const CRITERIA = ['peticion', 'texto_imagen', 'identidad', 'concepto', 'jerarquia', 'aire', 'originalidad', 'movil', 'oscuro', 'copy'];
const KIND = ['raise', 'drop', 'qc', 'weak'] as const;

export type LearningKind = (typeof KIND)[number];

export interface Learning {
  id: string;
  /** `general` o el slug de la marca. */
  scope: string;
  /** Clave estable para no duplicar. El texto se puede editar sin perder el recuento. */
  key: string;
  kind: LearningKind;
  text: string;
  criteria: string[];
  count: number;
  /** Suma del movimiento de nota (sube positivo, baja negativo). Un criterio flojo suma el hueco hasta 5. */
  impact: number;
  updatedAt: string;
  jobIds: string[];
}

export interface InitialScore {
  jobId: string;
  clientSlug: string;
  channel: 'a' | 'b';
  total: number;
  max: number;
  at: string;
}

export interface LearningBank {
  learnings: Learning[];
  scores: InitialScore[];
  /** `jobId:canal` ya incorporado: un reintento de la ruta no cuenta dos veces. */
  ingested: string[];
}

export interface AppliedLearning {
  id: string;
  scope: string;
  kind: LearningKind;
  text: string;
}

export interface LearningsRepository {
  load(): LearningBank;
  save(bank: LearningBank): void;
}

export interface JobLearningInput {
  jobId: string;
  clientSlug: string;
  channel: 'a' | 'b';
  at: string;
  improve?: JobImprove | null;
  /** Primera nota si el bucle no llegó a correr. */
  opening?: { notas: Record<string, number>; total: number; max: number } | null;
}

export function emptyBank(): LearningBank {
  return { learnings: [], scores: [], ingested: [] };
}

export function rankOf(learning: Pick<Learning, 'count' | 'impact'>): number {
  return learning.count * 10 + Math.abs(learning.impact);
}

function slugOf(raw: string | undefined): string {
  const slug = (raw || '').trim().toLowerCase();
  return /^[a-z0-9][a-z0-9-]{0,59}$/.test(slug) ? slug : '';
}

function cleanText(raw: string, max = 240): string {
  return raw.replace(/\s+/g, ' ').trim().slice(0, max);
}

function normKey(kind: string, text: string): string {
  const norm = text
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .slice(0, 180);
  return `${kind}:${norm}`;
}

function criteriaIn(text: string, extra: string[] = []): string[] {
  const low = text.toLowerCase();
  const found = CRITERIA.filter((id) => low.includes(id.replace(/_/g, ' ')) || low.includes(id) || low.includes(criterionLabel(id)));
  return [...new Set([...extra, ...found])].filter((id) => CRITERIA.includes(id)).slice(0, 4);
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

function newId(): string {
  return `l${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

interface Observation {
  kind: LearningKind;
  key: string;
  text: string;
  criteria: string[];
  impact: number;
}

function moved(pass: ImprovePass, dir: 'up' | 'down'): string[] {
  if (!pass.after) return [];
  return Object.keys(pass.before.notas).filter((key) => {
    const to = pass.after?.notas[key];
    if (to == null) return false;
    return dir === 'up' ? to > pass.before.notas[key] : to < pass.before.notas[key];
  });
}

function observationsOf(input: JobLearningInput): { obs: Observation[]; score: InitialScore | null } {
  const imp = input.improve;
  const notes = imp?.initial?.max ? imp.initial : input.opening?.max ? input.opening : null;
  const obs: Observation[] = [];
  let score: InitialScore | null = null;
  if (notes && notes.max > 0 && notes.total >= 0) {
    score = {
      jobId: input.jobId,
      clientSlug: slugOf(input.clientSlug),
      channel: input.channel,
      total: notes.total,
      max: notes.max,
      at: input.at,
    };
    for (const [id, note] of Object.entries(notes.notas || {})) {
      if (!CRITERIA.includes(id) || note >= 4) continue;
      obs.push({
        kind: 'weak',
        key: `weak:${id}`,
        text: `${criterionLabel(id)} suele salir bajo en el primer borrador (última nota ${note}/5). Súbelo antes de entregar: es de los que más cuesta recuperar.`,
        criteria: [id],
        impact: 5 - note,
      });
    }
  }
  for (const pass of imp?.passes || []) {
    if (!pass.after || !pass.before.max) continue;
    const delta = pass.after.total - pass.before.total;
    const changes = (pass.changed || []).map((line) => cleanText(line)).filter(Boolean);
    if (pass.kept && delta > 0 && changes.length) {
      const each = delta / changes.length;
      const criteria = moved(pass, 'up');
      for (const change of changes) {
        obs.push({ kind: 'raise', key: normKey('raise', change), text: change, criteria: criteriaIn(change, criteria), impact: each });
      }
    } else if (!pass.kept && delta < 0 && changes.length) {
      const each = delta / changes.length;
      const criteria = moved(pass, 'down');
      for (const change of changes) {
        obs.push({ kind: 'drop', key: normKey('drop', change), text: change, criteria: criteriaIn(change, criteria), impact: each });
      }
    }
  }
  for (const line of imp?.qcFixed || []) {
    const text = cleanText(line);
    if (!text) continue;
    obs.push({
      kind: 'qc',
      key: normKey('qc', text),
      text: `Error de calidad que ya se ha arreglado y no debe volver: ${text}`,
      criteria: [],
      impact: 1,
    });
  }
  return { obs, score };
}

function upsert(list: Learning[], scope: string, obs: Observation, jobId: string, at: string): void {
  const found = list.find((item) => item.scope === scope && item.key === obs.key);
  if (found) {
    found.count += 1;
    found.impact = round1(found.impact + obs.impact);
    found.updatedAt = at;
    if (!found.jobIds.includes(jobId)) found.jobIds = [...found.jobIds, jobId].slice(-MAX_JOB_IDS);
    for (const id of obs.criteria) if (!found.criteria.includes(id)) found.criteria.push(id);
    found.criteria = found.criteria.slice(0, 4);
    return;
  }
  list.push({
    id: newId(),
    scope,
    key: obs.key,
    kind: obs.kind,
    text: obs.text,
    criteria: obs.criteria,
    count: 1,
    impact: round1(obs.impact),
    updatedAt: at,
    jobIds: [jobId],
  });
}

function bounded(learnings: Learning[]): Learning[] {
  const scopes = [...new Set(learnings.map((item) => item.scope))];
  const kept: Learning[] = [];
  for (const scope of scopes) {
    const limit = scope === 'general' ? STORE_GENERAL : STORE_CLIENT;
    const ranked = learnings
      .filter((item) => item.scope === scope)
      .sort((a, b) => rankOf(b) - rankOf(a) || b.updatedAt.localeCompare(a.updatedAt));
    kept.push(...ranked.slice(0, limit));
  }
  return kept;
}

/** Incorpora un trabajo ya cerrado. La segunda vez con el mismo id y canal no cambia nada. */
export function absorbLearnings(bank: LearningBank, input: JobLearningInput): LearningBank {
  if (!input.jobId || (input.channel !== 'a' && input.channel !== 'b')) return bank;
  const token = `${input.jobId}:${input.channel}`;
  if (bank.ingested.includes(token)) return bank;
  const { obs, score } = observationsOf(input);
  if (!obs.length && !score) return bank;
  const learnings = bank.learnings.map((item) => ({ ...item, criteria: [...item.criteria], jobIds: [...item.jobIds] }));
  const slug = slugOf(input.clientSlug);
  for (const item of obs) {
    upsert(learnings, 'general', item, input.jobId, input.at);
    if (slug) upsert(learnings, slug, item, input.jobId, input.at);
  }
  const scores = score ? [...bank.scores.filter((item) => !(item.jobId === score.jobId && item.channel === score.channel)), score].slice(-MAX_SCORES) : bank.scores;
  return {
    learnings: bounded(learnings),
    scores,
    ingested: [...bank.ingested, token].slice(-MAX_INGESTED),
  };
}

export function editLearning(bank: LearningBank, id: string, text: string, at = new Date().toISOString()): LearningBank | null {
  const clean = cleanText(text);
  if (!clean || !bank.learnings.some((item) => item.id === id)) return null;
  return {
    ...bank,
    learnings: bank.learnings.map((item) => (item.id === id ? { ...item, text: clean, updatedAt: at } : item)),
  };
}

export function deleteLearning(bank: LearningBank, id: string): LearningBank {
  return { ...bank, learnings: bank.learnings.filter((item) => item.id !== id) };
}

function rankedScope(bank: LearningBank, scope: string, kinds: LearningKind[]): Learning[] {
  return bank.learnings
    .filter((item) => item.scope === scope && kinds.includes(item.kind))
    .sort((a, b) => rankOf(b) - rankOf(a) || b.updatedAt.localeCompare(a.updatedAt));
}

/** Lo que cabe en un encargo: las mejores generales, las de la marca, y lo que no hay que repetir. */
export function selectLearnings(bank: LearningBank, clientSlug: string): { use: Learning[]; avoid: Learning[] } {
  const slug = slugOf(clientSlug);
  const clientUse = slug ? rankedScope(bank, slug, ['raise', 'weak', 'qc']).slice(0, LEARNING_TOP_CLIENT) : [];
  const seen = new Set(clientUse.map((item) => item.key));
  const generalUse = rankedScope(bank, 'general', ['raise', 'weak', 'qc'])
    .filter((item) => !seen.has(item.key))
    .slice(0, LEARNING_TOP_GENERAL);
  const clientAvoid = slug ? rankedScope(bank, slug, ['drop']) : [];
  const avoidSeen = new Set(clientAvoid.map((item) => item.key));
  const avoid = [...clientAvoid, ...rankedScope(bank, 'general', ['drop']).filter((item) => !avoidSeen.has(item.key))].slice(0, AVOID_MAX);
  return { use: [...clientUse, ...generalUse], avoid };
}

export function formatLearningBlock(bank: LearningBank, clientSlug: string): string {
  const { use, avoid } = selectLearnings(bank, clientSlug);
  if (!use.length && !avoid.length) return '';
  const slug = slugOf(clientSlug);
  const client = use.filter((item) => item.scope === slug);
  const general = use.filter((item) => item.scope === 'general');
  const lines = [
    '## Aprendizajes de piezas anteriores',
    'Salen de newsletters ya entregadas. Aplícalos en este borrador para que la nota de partida suba.',
  ];
  const bullet = (item: Learning) => `- ${item.text}`;
  if (client.length) lines.push('', `De ${slug}:`, ...client.map(bullet));
  if (general.length) lines.push('', 'Generales:', ...general.map(bullet));
  if (avoid.length) lines.push('', 'No repitas lo que ya hizo bajar la nota:', ...avoid.map(bullet));
  return lines.join('\n');
}

export function appliedLearnings(bank: LearningBank, clientSlug: string): AppliedLearning[] {
  const { use, avoid } = selectLearnings(bank, clientSlug);
  return [...use, ...avoid].map((item) => ({ id: item.id, scope: item.scope, kind: item.kind, text: item.text }));
}

export function promptLearnings(clientSlug: string, repo: LearningsRepository = learningsRepository()): { block: string; applied: AppliedLearning[] } {
  const bank = repo.load();
  return { block: formatLearningBlock(bank, clientSlug), applied: appliedLearnings(bank, clientSlug) };
}

export interface ScoreTrend {
  recentAvg: number | null;
  previousAvg: number | null;
  /** Puntos porcentuales: la media de las 10 últimas notas iniciales menos la de las 10 anteriores. */
  delta: number | null;
  points: { jobId: string; clientSlug: string; channel: 'a' | 'b'; total: number; max: number; pct: number; at: string }[];
}

export function initialScoreTrend(scores: InitialScore[]): ScoreTrend {
  const points = [...scores]
    .filter((item) => item.max > 0)
    .sort((a, b) => a.at.localeCompare(b.at))
    .map((item) => ({ ...item, pct: Math.round((item.total / item.max) * 100) }));
  const avg = (rows: { pct: number }[]): number | null => (rows.length ? Math.round(rows.reduce((sum, row) => sum + row.pct, 0) / rows.length) : null);
  const recent = points.slice(-10);
  const previous = points.slice(-20, -10);
  const recentAvg = avg(recent);
  const previousAvg = avg(previous);
  return {
    recentAvg,
    previousAvg,
    delta: recentAvg != null && previousAvg != null ? recentAvg - previousAvg : null,
    points,
  };
}

export function learningView(bank: LearningBank): { learnings: Learning[]; trend: ScoreTrend } {
  return {
    learnings: [...bank.learnings].sort((a, b) => a.scope.localeCompare(b.scope) || rankOf(b) - rankOf(a)),
    trend: initialScoreTrend(bank.scores),
  };
}

/** Solo una cuenta de Google @feebbo.com. La contraseña compartida no entra. */
export function canEditLearnings(user: { via?: string; email?: string } | null | undefined): boolean {
  return !!user && user.via === 'google' && emailAllowed(user.email, ['feebbo.com']);
}

function asKind(raw: unknown): LearningKind | null {
  return KIND.includes(raw as LearningKind) ? (raw as LearningKind) : null;
}

export function sanitizeBank(raw: unknown): LearningBank {
  const bank = emptyBank();
  if (!raw || typeof raw !== 'object') return bank;
  const body = raw as Record<string, unknown>;
  if (Array.isArray(body.learnings)) {
    for (const item of body.learnings) {
      if (!item || typeof item !== 'object') continue;
      const row = item as Record<string, unknown>;
      const kind = asKind(row.kind);
      const id = typeof row.id === 'string' ? row.id : '';
      const scope = typeof row.scope === 'string' ? row.scope : '';
      const key = typeof row.key === 'string' ? row.key.slice(0, 200) : '';
      const text = typeof row.text === 'string' ? cleanText(row.text) : '';
      if (!kind || !/^l[a-z0-9]{4,24}$/.test(id) || !key || !text) continue;
      if (scope !== 'general' && !slugOf(scope)) continue;
      bank.learnings.push({
        id,
        scope,
        key,
        kind,
        text,
        criteria: Array.isArray(row.criteria) ? row.criteria.filter((id): id is string => typeof id === 'string' && CRITERIA.includes(id)).slice(0, 4) : [],
        count: Math.max(1, Math.min(10000, Math.round(Number(row.count) || 1))),
        impact: round1(Math.max(-500, Math.min(500, Number(row.impact) || 0))),
        updatedAt: typeof row.updatedAt === 'string' ? row.updatedAt.slice(0, 40) : new Date(0).toISOString(),
        jobIds: Array.isArray(row.jobIds) ? row.jobIds.filter((id): id is string => typeof id === 'string').slice(-MAX_JOB_IDS) : [],
      });
    }
  }
  if (Array.isArray(body.scores)) {
    for (const item of body.scores.slice(-MAX_SCORES)) {
      if (!item || typeof item !== 'object') continue;
      const row = item as Record<string, unknown>;
      const total = Number(row.total);
      const max = Number(row.max);
      if (typeof row.jobId !== 'string' || (row.channel !== 'a' && row.channel !== 'b')) continue;
      if (!Number.isFinite(total) || !Number.isFinite(max) || max <= 0 || total < 0 || total > max) continue;
      bank.scores.push({
        jobId: row.jobId,
        clientSlug: slugOf(typeof row.clientSlug === 'string' ? row.clientSlug : ''),
        channel: row.channel,
        total,
        max,
        at: typeof row.at === 'string' ? row.at.slice(0, 40) : '',
      });
    }
  }
  if (Array.isArray(body.ingested)) {
    bank.ingested = body.ingested.filter((id): id is string => typeof id === 'string' && id.length < 80).slice(-MAX_INGESTED);
  }
  return bank;
}

export function createFileLearningsRepository(file: string, mirror?: (bank: LearningBank) => void): LearningsRepository {
  return {
    load(): LearningBank {
      try {
        return sanitizeBank(JSON.parse(fs.readFileSync(file, 'utf8')));
      } catch {
        return emptyBank();
      }
    },
    save(bank: LearningBank): void {
      const clean = sanitizeBank(bank);
      fs.mkdirSync(path.dirname(file), { recursive: true });
      const tmp = `${file}.${process.pid}.tmp`;
      fs.writeFileSync(tmp, JSON.stringify(clean));
      fs.renameSync(tmp, file);
      try {
        mirror?.(clean);
      } catch {
        // La copia no tumba el disco, que es el que manda.
      }
    },
  };
}

const LEARNINGS_FILE = path.join(DATA_DIR, 'learnings.json');

let singleton: LearningsRepository | null = null;

/** El repositorio del proceso. Los tests construyen el suyo con `createFileLearningsRepository`. */
export function learningsRepository(): LearningsRepository {
  if (!singleton) {
    singleton = createFileLearningsRepository(LEARNINGS_FILE, (bank) => supabase.saveLearnings(bank));
  }
  return singleton;
}

export function rememberJob(input: JobLearningInput, repo: LearningsRepository = learningsRepository()): LearningBank {
  const next = absorbLearnings(repo.load(), input);
  const prev = repo.load();
  if (next.ingested.length === prev.ingested.length && next.learnings.length === prev.learnings.length) return prev;
  repo.save(next);
  return next;
}

export function openingFromArt(before: Record<string, number> | undefined): JobLearningInput['opening'] {
  if (!before) return null;
  const notas: Record<string, number> = {};
  for (const [key, note] of Object.entries(before)) {
    if (CRITERIA.includes(key) && note >= 1 && note <= 5) notas[key] = note;
  }
  const values = Object.values(notas);
  if (!values.length) return null;
  return { notas, total: values.reduce((sum, note) => sum + note, 0), max: values.length * 5 };
}
