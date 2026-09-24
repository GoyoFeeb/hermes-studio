/**
 * store.ts — persistencia de trabajos en archivos planos (JSON + NDJSON de eventos), coherente
 * con que el resto del pipeline Hermes ya usa archivos como fuente de verdad en vez de una
 * base de datos. Suficiente para el volumen de un equipo pequeño con una cola secuencial.
 */
import * as fs from 'fs';
import * as path from 'path';
import { JOBS_DIR } from './paths';

export type JobStatus = 'queued' | 'running' | 'blocked' | 'failed' | 'completed';

export interface JobInput {
  clientSlug: string;
  clientName: string;
  brandMode: 'existing' | 'new';
  brandUrl?: string;
  briefText: string;
  ctaLabel?: string;
  ctaUrl?: string;
  legalNotes?: string;
  requesterName?: string;
  /** 'standalone' (2026-09-24): prompt creativo pegado → HTML suelto (ver standalone.ts).
   *  Sin definir = pipeline de 9 fases. En standalone, briefText guarda el prompt pegado. */
  mode?: 'pipeline' | 'standalone';
  imageMode?: 'official' | 'ai';
}

export interface Job {
  id: string;
  createdAt: string;
  updatedAt: string;
  input: JobInput;
  status: JobStatus;
  currentPhase: string | null;
  campaignSlug?: string;
  campaignRelPath?: string;
  resultRelPath?: string;
  blockedReason?: string;
  error?: string;
  /** Progreso estimado de Hermes (lo envía el worker; ver estimateProgress en hermes-worker.ts). */
  progress?: {
    pct: number;
    stage: string;
    stageLabel: string;
    detail: string;
    actions: number;
    elapsedSec: number;
    etaSec: number | null;
  };
}

export interface JobEvent {
  ts: string;
  phase: string;
  level: 'info' | 'error' | 'success';
  message: string;
}

function jobFile(id: string): string {
  return path.join(JOBS_DIR, `${id}.json`);
}

function eventsFile(id: string): string {
  return path.join(JOBS_DIR, `${id}.events.ndjson`);
}

function ensureStore(): void {
  fs.mkdirSync(JOBS_DIR, { recursive: true });
}

export function createJob(input: JobInput): Job {
  ensureStore();
  const id = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  const now = new Date().toISOString();
  const job: Job = { id, createdAt: now, updatedAt: now, input, status: 'queued', currentPhase: null };
  fs.writeFileSync(jobFile(id), JSON.stringify(job, null, 2));
  fs.writeFileSync(eventsFile(id), '');
  return job;
}

export function getJob(id: string): Job | null {
  try {
    return JSON.parse(fs.readFileSync(jobFile(id), 'utf8'));
  } catch {
    return null;
  }
}

export function updateJob(id: string, patch: Partial<Job>): Job {
  const job = getJob(id);
  if (!job) throw new Error(`Job ${id} no encontrado`);
  const updated: Job = { ...job, ...patch, updatedAt: new Date().toISOString() };
  fs.writeFileSync(jobFile(id), JSON.stringify(updated, null, 2));
  return updated;
}

export function listJobs(): Job[] {
  ensureStore();
  return fs
    .readdirSync(JOBS_DIR)
    .filter((f) => f.endsWith('.json'))
    .map((f) => JSON.parse(fs.readFileSync(path.join(JOBS_DIR, f), 'utf8')) as Job)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function appendEvent(id: string, ev: Omit<JobEvent, 'ts'>): void {
  ensureStore();
  const line = JSON.stringify({ ts: new Date().toISOString(), ...ev }) + '\n';
  fs.appendFileSync(eventsFile(id), line);
}

export function readEvents(id: string): JobEvent[] {
  try {
    return fs
      .readFileSync(eventsFile(id), 'utf8')
      .split('\n')
      .filter(Boolean)
      .map((l) => JSON.parse(l));
  } catch {
    return [];
  }
}
