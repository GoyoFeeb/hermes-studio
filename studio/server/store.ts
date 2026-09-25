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
  /** Instrucción básica ("quiero una newsletter de Adeslas", 2026-09-24): Hermes genera primero el
   *  brief con la skill newsletter-creative-brief y lo guarda en briefText (vacío hasta entonces). */
  instruction?: string;
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
    lastActionAt?: number | null;
  };
}

export interface JobEvent {
  ts: string;
  phase: string;
  level: 'info' | 'error' | 'success';
  message: string;
}

/** Formato real de los ids (ver createJob). El id llega en la URL y acaba en una ruta de disco:
 *  sin esta comprobación, `/api/jobs/..%2F..%2Falgo` leía cualquier .json del servidor
 *  (auditoría 2026-09-24). */
const JOB_ID_RE = /^[a-z0-9]{6,12}-[a-z0-9]{4,8}$/;

export function isValidJobId(id: unknown): id is string {
  return typeof id === 'string' && JOB_ID_RE.test(id);
}

function jobFile(id: string): string {
  if (!isValidJobId(id)) throw new Error(`Id de trabajo no válido: ${String(id).slice(0, 40)}`);
  return path.join(JOBS_DIR, `${id}.json`);
}

function eventsFile(id: string): string {
  if (!isValidJobId(id)) throw new Error(`Id de trabajo no válido: ${String(id).slice(0, 40)}`);
  return path.join(JOBS_DIR, `${id}.events.ndjson`);
}

/** Escritura atómica: un corte a mitad de escritura dejaba un .json truncado que hacía fallar
 *  listJobs() — y con él la cola del worker y el historial (auditoría 2026-09-24). */
function writeJobFile(id: string, job: Job): void {
  const file = jobFile(id);
  const tmp = `${file}.${process.pid}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(job, null, 2));
  fs.renameSync(tmp, file);
}

function ensureStore(): void {
  fs.mkdirSync(JOBS_DIR, { recursive: true });
}

export function createJob(input: JobInput): Job {
  ensureStore();
  const id = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  const now = new Date().toISOString();
  const job: Job = { id, createdAt: now, updatedAt: now, input, status: 'queued', currentPhase: null };
  writeJobFile(id, job);
  fs.writeFileSync(eventsFile(id), '');
  return job;
}

export function getJob(id: string): Job | null {
  if (!isValidJobId(id)) return null;
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
  writeJobFile(id, updated);
  return updated;
}

export function listJobs(): Job[] {
  ensureStore();
  return fs
    .readdirSync(JOBS_DIR)
    .filter((f) => f.endsWith('.json'))
    .flatMap((f) => {
      try {
        return [JSON.parse(fs.readFileSync(path.join(JOBS_DIR, f), 'utf8')) as Job];
      } catch {
        return []; // un archivo dañado no debe tumbar la lista entera
      }
    })
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function appendEvent(id: string, ev: Omit<JobEvent, 'ts'>): void {
  ensureStore();
  const line = JSON.stringify({ ts: new Date().toISOString(), ...ev }) + '\n';
  fs.appendFileSync(eventsFile(id), line);
}

export function readEvents(id: string): JobEvent[] {
  if (!isValidJobId(id)) return [];
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
