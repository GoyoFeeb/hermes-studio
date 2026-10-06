/**
 * store.ts — persistencia de trabajos en archivos planos (JSON + NDJSON de eventos), coherente
 * con que el resto del pipeline Hermes ya usa archivos como fuente de verdad en vez de una
 * base de datos. Suficiente para el volumen de un equipo pequeño con una cola secuencial.
 */
import * as fs from 'fs';
import * as path from 'path';
import { JOBS_DIR } from './paths';
import type { QualityReport } from '../worker/qualityCheck';
import type { JobShare } from './share';
import type { JobReportShare } from './report';

/** 'cancelled' (2026-09-28): cancelado desde la web; el worker lo ve al enviar progreso y para. */
/** 'review' (2026-10-01): Hermes escribió el brief y espera a que el equipo lo apruebe (`reviewBrief`). */
export type JobStatus = 'queued' | 'running' | 'review' | 'blocked' | 'failed' | 'completed' | 'cancelled';

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
   *  brief (buildBriefPrompt en standalone.ts) y lo guarda en briefText (vacío hasta entonces). */
  instruction?: string;
  /** Adaptación a móvil de una newsletter ya terminada (2026-09-25): id del trabajo original.
   *  Hermes parte de su HTML publicado y solo añade/corrige la versión móvil. */
  mobileFixOf?: string;
  /** "Pedir cambios" (2026-09-28): id del trabajo cuya newsletter se retoca y lo que se pide cambiar.
   *  Hermes parte del HTML publicado, sus notas.md y el brief original, en una sesión nueva. */
  revisionOf?: string;
  changeRequest?: string;
  /** "Editar texto" (2026-09-28): versión hecha en Studio, sin Hermes, retocando el texto del trabajo
   *  indicado (ver studio/server/textEdit.ts). Nace terminada. */
  textEditOf?: string;
  /** "Reintentar" (2026-10-01): id del trabajo fallido o cancelado que se relanza. Enlaza los dos en la
   *  misma familia para que el historial no muestre el intento fallido como otra newsletter. */
  retryOf?: string;
  /** El brief ya estaba escrito antes de este turno de Hermes (reintento de un fallido, o brief revisado y
   *  aprobado): no se vuelve a generar y se estima como uno de prompt completo. */
  briefReused?: boolean;
  /** Desde instrucción (2026-10-01): parar tras el brief para que el equipo lo revise antes de la newsletter. */
  reviewBrief?: boolean;
  /** Revisión de dirección de arte al final (2026-10-05): Hermes mira capturas y corrige lo que baje la nota. */
  artReview?: boolean;
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
  /** Control de calidad del worker al terminar (2026-09-28, ver studio/worker/qualityCheck.ts).
   *  Sin definir en las newsletters anteriores a ese control. */
  quality?: QualityReport;
  /** Miniatura para el historial (2026-09-28): JPEG 300×400 que genera el worker en el Mac. */
  thumbRelPath?: string;
  /** El worker no pudo generarla: no se le vuelve a pedir. */
  thumbFailed?: boolean;
  /** Cuándo lo recogió Hermes y cuándo terminó (2026-09-28): la duración real, sin la espera en cola. */
  startedAt?: string;
  finishedAt?: string;
  /** Brief a revisar (2026-10-05, Paredes: «lleva como una hora» con 13 min esperando la aprobación): cuándo quedó
   *  listo y cuánto esperó hasta que Hermes volvió a recogerlo. Esa espera no es trabajo de Hermes: la página la
   *  enseña aparte y no entra en «tardó». */
  briefReadyAt?: string;
  briefWaitSec?: number;
  /** Lo que la petición pedía y el brief no recogía al llegar (requestCoverage.ts): aviso en el panel del brief. */
  briefMissing?: string[];
  /** "Aprobada para envío" (2026-09-28): la versión de su familia que se va a enviar (solo una), quién la
   *  aprobó y qué comprobó (la lista de la página). */
  approvedAt?: string;
  approvedBy?: string;
  approvalChecklist?: string[];
  /** Archivada (2026-09-28): fuera del historial salvo con "Ver archivadas". Se archiva la familia entera. */
  archivedAt?: string;
  /** Enlace de vista previa para el cliente (2026-10-01, ver share.ts). */
  share?: JobShare;
  /** Nombre que el equipo le pone a la newsletter (2026-10-01). Vive en la versión raíz de la familia;
   *  sin él, el historial muestra el asunto. */
  title?: string;
  /** Enlace público al informe de la revisión por programa de correo (2026-10-01, ver report.ts). */
  reportShare?: JobReportShare;
  /** Tiempo de cada fase (2026-10-05, studio/worker/timeline.ts): lo envía el worker al terminar o fallar. */
  timings?: JobTimings;
  /** Revisión de dirección de arte (2026-10-06, punto 7): notas antes y después de la mejora. */
  artReview?: JobArtReview;
  /** El worker no pudo puntuarla después (sin HTML o sin notas legibles): no se le vuelve a pedir. */
  artReviewFailed?: boolean;
}

export interface JobArtReview {
  /** Notas de 1 a 5 por criterio en la primera mirada. */
  before: Record<string, number>;
  /** Tras la pasada de mejora (si la hubo y se pudo puntuar). */
  after?: Record<string, number>;
  /** false = la mejora empeoraba y se recuperó la versión anterior. */
  kept?: boolean;
  /** Se comparó con la portada de la web de la marca. */
  web: boolean;
  problemas: string[];
  mejoras: string[];
  /** Puntuada después de terminar (piezas anteriores al punto 7), sin pasada de mejora. */
  backfill?: boolean;
}

/** Las notas que valen: las de después si la mejora se quedó; si no, las de antes. */
export function finalArtNotes(a: JobArtReview): Record<string, number> {
  return a.after && a.kept !== false ? a.after : a.before;
}

/** Nota final en porcentaje (los criterios cambian con el tiempo: 9 hasta el punto 4, 10 después). */
export function artPct(a: JobArtReview): number {
  const n = Object.values(finalArtNotes(a));
  return n.length ? Math.round((n.reduce((x, y) => x + y, 0) / (n.length * 5)) * 100) : 0;
}

export interface JobTimings {
  phases: { id: string; label: string; sec: number; actions?: number }[];
  hangs: { count: number; sec: number };
  rounds: number;
  totalSec: number;
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
