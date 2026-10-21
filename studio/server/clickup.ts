/**
 * clickup.ts — webhook firmado de ClickUp que abre un trabajo de Studio (2026-10-19).
 *
 * ClickUp firma el cuerpo en bruto con HMAC-SHA256 (cabecera X-Signature, hex). Sin
 * CLICKUP_WEBHOOK_SECRET la ruta responde 401 y no crea nada. El id de tarea deduplica
 * los reintentos. taskCreated solo trae task_id: el nombre y la descripción se leen
 * después con CLICKUP_API_TOKEN (GET /api/v2/task/{id}) y pasan al brief del trabajo.
 * Mientras tanto el trabajo lleva clickupPending y el worker no lo coge.
 *
 * Variables solo del servicio hermes-studio. Ver studio/CLICKUP.md.
 */
import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import { slugify } from './campaignFs';
import { JOBS_DIR } from './paths';
import { queueCommentLine } from './queueEta';
import { finalArtNotes, isValidJobId, listJobs, type Job, type JobArtReview, type JobInput } from './store';

export const DEFAULT_CLICKUP_LIST_ID = '901223474074';
export const DEFAULT_STUDIO_WEB_ORIGIN = 'https://hermes-studio-beta.vercel.app';
export const DEFAULT_CLICKUP_WEBHOOK_ENDPOINT =
  'https://hermes-studio-production-761e.up.railway.app/api/integrations/clickup';

/** Mismo cupo que POST /api/jobs (5 cada 10 min), con contador propio. */
export const CLICKUP_RATE_LIMIT = {
  windowMs: 10 * 60 * 1000,
  max: 5,
  keyPrefix: 'clickup-webhook',
  message: 'Demasiados avisos de ClickUp en poco tiempo. Espera unos minutos.',
} as const;

/** Pasado este margen, un trabajo que sigue en clickupPending entra en la cola igual. */
export const CLICKUP_ENRICH_MS = 2 * 60 * 1000;

const INSTRUCTION_MAX = 12_000;
const CLIENT_FIELDS = new Set(['cliente', 'client', 'marca', 'brand']);
const CAMPAIGN_FIELDS = new Set(['campana', 'campaign']);

export interface ClickupEnv {
  secret: string;
  apiToken: string;
  listId: string;
  comment: boolean;
  webBase: string;
}

export interface ClickupTask {
  id?: string;
  name?: string;
  url?: string;
  description?: string;
  text_content?: string;
  markdown_description?: string;
  list?: { id?: string | number };
  creator?: { id?: string | number; username?: string };
  attachments?: { title?: string; name?: string; url?: string }[];
  custom_fields?: unknown[];
  assignees?: { id?: number | string; username?: string }[] | null;
  status?: { status?: string } | string | null;
}

export interface ClickupDeps {
  secret: string;
  listId: string;
  apiToken: string;
  comment: boolean;
  webBase: string;
  findJob: (taskId: string) => { id: string } | null;
  createJob: (input: JobInput) => { id: string };
  getJob: (id: string) => Job | null;
  updateJob: (id: string, patch: Partial<Job>) => void;
  fetchTask: (taskId: string, token: string) => Promise<ClickupTask | null>;
  postComment: (taskId: string, token: string, text: string) => Promise<void>;
  /** Si el trabajo sigue en cola y no lo van a coger al momento, la frase que se añade al comentario. */
  queueFor?: (job: Job) => { ahead: number; startsInSec: number } | null;
  /** Reloj del aviso de cola. En producción es setTimeout; los tests pasan el suyo. */
  schedule?: (fn: () => void, ms: number) => void;
  knownBrand: (slug: string) => boolean;
  /** Fichas de marca ya sincronizadas. Si no está, la marca sale del texto de la tarea. */
  brandRecords?: () => KnownBrand[];
  /** Asignado por defecto, BACKLOG si no hay estado y brief estructurado. Sin esto, la tarea se usa tal cual. */
  prepareTask?: (task: ClickupTask, taskId: string) => Promise<{ task: ClickupTask; notes: { message: string; level?: 'info' | 'error' }[] }>;
  log: (id: string, message: string, level?: 'info' | 'error' | 'success') => void;
}

export interface KnownBrand {
  slug: string;
  name?: string | null;
}

export interface DerivedClient {
  name: string;
  /** Slug de la ficha, cuando la marca sale de un registro conocido. */
  slug?: string;
}

export interface ClickupOutcome {
  status: number;
  body: Record<string, unknown>;
  /** Lectura de la tarea y comentario. La ruta HTTP no lo espera. */
  after?: Promise<void>;
}

interface ClickupPayload {
  event?: string;
  task_id?: string | number;
  history_items?: {
    field?: string;
    parent_id?: string | number;
    before?: unknown;
    after?: unknown;
    user?: { id?: string | number; username?: string };
  }[];
}

type Decision =
  | { action: 'ignore'; reason: 'event' | 'list' | 'no-task' }
  | { action: 'create'; taskId: string; confirmList: boolean };

const confirming = new Map<string, Promise<{ id: string; created: boolean } | null>>();

export function clickupConfigFromEnv(env: NodeJS.ProcessEnv = process.env): ClickupEnv {
  const listId = (env.CLICKUP_LIST_ID || '').trim() || DEFAULT_CLICKUP_LIST_ID;
  return {
    secret: env.CLICKUP_WEBHOOK_SECRET || '',
    apiToken: env.CLICKUP_API_TOKEN || '',
    listId,
    comment: env.CLICKUP_COMMENT === '1',
    webBase: httpsOrigin(env.STUDIO_WEB_URL) || DEFAULT_STUDIO_WEB_ORIGIN,
  };
}

export function signClickupBody(raw: Buffer | string, secret: string): string {
  return crypto.createHmac('sha256', secret).update(raw).digest('hex');
}

/** HMAC-SHA256 hex del cuerpo en bruto. Longitudes distintas no pasan por timingSafeEqual. */
export function verifyClickupSignature(rawBody: Buffer, signature: string | undefined, secret: string): boolean {
  if (!secret || !signature) return false;
  const provided = signature.trim().toLowerCase().replace(/^sha256=/, '');
  if (!/^[0-9a-f]{64}$/.test(provided)) return false;
  const expected = signClickupBody(rawBody, secret);
  return crypto.timingSafeEqual(Buffer.from(provided, 'utf8'), Buffer.from(expected, 'utf8'));
}

export function clickupReadyForClaim(job: { input: { clickupPending?: boolean }; createdAt: string }, now = Date.now()): boolean {
  if (!job.input.clickupPending) return true;
  const created = Date.parse(job.createdAt);
  return Number.isFinite(created) && now - created > CLICKUP_ENRICH_MS;
}

export function findJobByClickupTaskId(taskId: string): Job | null {
  const hits = listJobs().filter((job) => job.input.clickupTaskId === taskId);
  hits.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  return hits[0] || null;
}

export function clickupJobPageUrl(webBase: string, jobId: string): string {
  return `${webBase}/?job=${encodeURIComponent(jobId)}`;
}

/** Vista previa directa. A es el HTML de Hermes; B, el canal adjunto. */
export function clickupPreviewUrl(webBase: string, jobId: string, version: 'a' | 'b'): string {
  const path = version === 'b' ? 'channel-b' : 'result';
  return `${webBase}/api/jobs/${encodeURIComponent(jobId)}/${path}`;
}

export function clickupJobComment(
  webBase: string,
  jobId: string,
  queue?: { ahead: number; startsInSec: number } | null
): string {
  const page = `Hermes Studio ha creado un trabajo para esta tarea:\n${clickupJobPageUrl(webBase, jobId)}`;
  const line = queueCommentLine(queue);
  return line ? `${page}\n${line}` : page;
}

/** Comentario corto cuando el worker recoge el trabajo. */
export function clickupStartedComment(): string {
  return 'Hermes ha empezado este trabajo.';
}

/** Cuánto puede tardar otra réplica en publicar el aviso de fin antes de que se considere caducado. */
export const CLICKUP_END_CLAIM_MS = 20_000;

/** 10 criterios de 1 a 5 (studio/worker/hermes-worker.ts, ART_CRITERIA). */
const ART_SCORE_MAX = 50;

export interface ClickupTextPart {
  text: string;
  attributes?: Record<string, unknown>;
}

/** Mención de la doc de ClickUp: solo `type` y `user.id`. Sin `text`: ese campo se pega al final. */
export interface ClickupTagPart {
  type: 'tag';
  user: { id: number };
  text?: string;
  attributes?: Record<string, unknown>;
}

/** Cuerpo de POST /task/{id}/comment. Con mención, `comment` (no `comment_text`) y notify_all en false. */
export interface ClickupCommentBody {
  notify_all: false;
  comment_text?: string;
  comment?: (ClickupTextPart | ClickupTagPart)[];
}

export interface ClickupEndNotice {
  at?: string;
  outcome?: 'completed' | 'failed';
  claim?: string;
  claimedAt?: string;
}

export interface ClickupEndJob {
  id: string;
  startedAt?: string;
  finishedAt?: string;
  briefWaitSec?: number;
  error?: string;
  artReview?: JobArtReview;
  input: { clickupTaskId?: string; requesterName?: string; clickupCreatorId?: string };
  /** Versión B adjunta. Si está, el aviso de fin incluye su vista previa. */
  channelB?: unknown;
}

export interface ClickupEndDeps {
  comment: boolean;
  apiToken: string;
  webBase: string;
  getJob: (id: string) => ClickupEndJob | null;
  postComment: (taskId: string, token: string, body: ClickupCommentBody) => Promise<void>;
  log: (id: string, message: string, level?: 'info' | 'error' | 'success') => void;
  /** Candado entre réplicas. En producción es withStoreLock; sin él, solo ordena dentro de este proceso. */
  lock?: <T>(fn: () => T | Promise<T>) => Promise<T>;
  /** Carpeta del fichero `{id}.clickup-end` (no acaba en .json: listJobs no lo lee). */
  noticeDir?: string;
  replicaId?: string;
  now?: () => number;
  claimMs?: number;
  waitMs?: number;
  pollMs?: number;
}

/** Id de usuario de ClickUp: entero positivo en rango seguro. Un correo o un id de tarea no vale. */
export function clickupUserId(value: unknown): string | undefined {
  if (typeof value === 'number' && Number.isSafeInteger(value) && value > 0) return String(value);
  if (typeof value === 'string' && /^[1-9][0-9]{0,15}$/.test(value.trim())) return value.trim();
  return undefined;
}

export function formatDurationMSS(sec: number): string {
  const s = Math.max(0, Math.round(sec));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

/** Primera línea del fallo, recortada. El volcado de Hermes va debajo y no entra en el comentario. */
export function oneLineReason(error: string | undefined): string {
  const line = (error || '').split(/\r?\n/).map((part) => part.trim()).find(Boolean) || '';
  const clean = line.replace(/\s+/g, ' ').trim();
  const clipped = clean.length > 180 ? `${clean.slice(0, 179).trimEnd()}…` : clean;
  const reason = clipped || 'Hermes no pudo terminar la newsletter.';
  return /[.!?…]$/.test(reason) ? reason : `${reason}.`;
}

/** Texto de los bloques en el orden enviado. ClickUp pinta ese orden; el nombre del tag lo pone él. */
export function clickupCommentPlain(body: ClickupCommentBody): string {
  if (body.comment) return body.comment.map((part) => part.text || '').join('');
  return body.comment_text || '';
}

/** Mismo criterio que durationSec: de que Hermes lo recoge a que termina, sin la espera del brief. */
function jobDurationSec(job: ClickupEndJob): number | null {
  if (!job.startedAt || !job.finishedAt) return null;
  const start = Date.parse(job.startedAt);
  const end = Date.parse(job.finishedAt);
  if (!Number.isFinite(start) || !Number.isFinite(end)) return null;
  return Math.max(1, Math.round((end - start) / 1000) - (job.briefWaitSec || 0));
}

function artScoreOutOf50(review: JobArtReview | undefined): number | null {
  if (!review?.before) return null;
  const values = Object.values(finalArtNotes(review)).filter((n) => typeof n === 'number' && Number.isFinite(n));
  if (!values.length) return null;
  return values.reduce((sum, n) => sum + n, 0);
}

function mentionUserId(value: string | undefined): number | null {
  const id = clickupUserId(value);
  if (!id) return null;
  const n = Number(id);
  return Number.isSafeInteger(n) ? n : null;
}

function mentionBody(userId: number, rest: string): ClickupCommentBody {
  const tail = rest.startsWith(' ') ? rest : ` ${rest}`;
  // Doc de comment-formatting: el array se pinta en el orden enviado (texto, tag, texto).
  // El tag es `{type:'tag', user:{id}}` y no lleva `text` ni `attributes`: ClickUp escribe
  // el nombre en ese hueco. Un `text` en el tag se concatena al final de comment_text
  // («…40/50@Goyo») y dar la vuelta al array no lo mueve.
  return {
    notify_all: false,
    comment: [
      { type: 'tag', user: { id: userId } },
      { text: tail },
    ],
  };
}

function previewBlock(job: ClickupEndJob, webBase: string): string {
  const lines = [`Vista previa A: ${clickupPreviewUrl(webBase, job.id, 'a')}`];
  if (job.channelB) lines.push(`Vista previa B: ${clickupPreviewUrl(webBase, job.id, 'b')}`);
  return lines.join('\n');
}

/** Texto del aviso de fin. Sin id de creador, el mismo texto en comment_text y sin @.
 *  La mención va la primera. Al terminar se añaden la ficha y las vistas previas. */
export function clickupEndComment(job: ClickupEndJob, outcome: 'completed' | 'failed', webBase: string): ClickupCommentBody {
  const page = clickupJobPageUrl(webBase, job.id);
  const userId = mentionUserId(job.input.clickupCreatorId);
  if (outcome === 'failed') {
    const reason = oneLineReason(job.error);
    const rest = `el trabajo ha fallado: ${reason} ${page}`;
    if (userId) return mentionBody(userId, rest);
    return { notify_all: false, comment_text: `El trabajo ha fallado: ${reason} ${page}` };
  }
  const bits = [page];
  const sec = jobDurationSec(job);
  if (sec != null) bits.push(`duración ${formatDurationMSS(sec)}`);
  const score = artScoreOutOf50(job.artReview);
  if (score != null) bits.push(`nota visual ${score}/${ART_SCORE_MAX}`);
  const detail = `${bits.join(' · ')}\n${previewBlock(job, webBase)}`;
  if (userId) return mentionBody(userId, `tu trabajo está listo: ${detail}`);
  return { notify_all: false, comment_text: `Tu trabajo está listo: ${detail}` };
}

let endNoticeTail: Promise<void> = Promise.resolve();

function inProcessLock<T>(fn: () => T | Promise<T>): Promise<T> {
  const run = endNoticeTail.then(() => fn());
  endNoticeTail = run.then(
    () => undefined,
    () => undefined
  );
  return run;
}

function noticePath(dir: string, jobId: string): string {
  return path.join(dir, `${jobId}.clickup-end`);
}

function readEndNotice(dir: string, jobId: string): ClickupEndNotice | null {
  try {
    const raw = JSON.parse(fs.readFileSync(noticePath(dir, jobId), 'utf8')) as ClickupEndNotice;
    if (!raw || typeof raw !== 'object') return null;
    return raw;
  } catch {
    return null;
  }
}

function writeEndNotice(dir: string, jobId: string, notice: ClickupEndNotice | null): void {
  const file = noticePath(dir, jobId);
  if (!notice) {
    fs.rmSync(file, { force: true });
    return;
  }
  fs.mkdirSync(dir, { recursive: true });
  const tmp = `${file}.${process.pid}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(notice));
  fs.renameSync(tmp, file);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Un comentario por fin de trabajo. El fichero `{id}.clickup-end` (junto al JSON del trabajo, pero
 * sin extensión .json) se reserva bajo el candado antes del POST: otra réplica o un reintento de
 * /complete o /fail ve la reserva y no vuelve a publicar. Si ClickUp no responde, se suelta y el
 * siguiente intento puede publicar.
 */
export async function deliverClickupEndNotice(jobId: string, outcome: 'completed' | 'failed', deps: ClickupEndDeps): Promise<boolean> {
  try {
    return await postClickupEndNotice(jobId, outcome, deps);
  } catch (err) {
    try {
      deps.log(jobId, `No se pudo publicar en ClickUp el aviso de fin: ${(err as Error).message}`, 'error');
    } catch {
      console.error(`[clickup] ${jobId}: ${(err as Error).message}`);
    }
    return false;
  }
}

async function postClickupEndNotice(jobId: string, outcome: 'completed' | 'failed', deps: ClickupEndDeps): Promise<boolean> {
  if (!deps.comment || !deps.apiToken || !isValidJobId(jobId)) return false;
  if (!deps.getJob(jobId)?.input.clickupTaskId) return false;
  const dir = deps.noticeDir || JOBS_DIR;
  const lock = deps.lock ?? inProcessLock;
  const now = () => deps.now?.() ?? Date.now();
  const claimMs = deps.claimMs ?? CLICKUP_END_CLAIM_MS;
  const waitMs = deps.waitMs ?? CLICKUP_END_CLAIM_MS;
  const pollMs = deps.pollMs ?? 150;
  const claim = `${(deps.replicaId || 'studio').replace(/[^a-zA-Z0-9._-]/g, '').slice(0, 40) || 'studio'}-${crypto.randomBytes(4).toString('hex')}`;
  const deadline = now() + waitMs;

  for (;;) {
    const slot = await lock(() => {
      const job = deps.getJob(jobId);
      if (!job?.input.clickupTaskId) return { kind: 'skip' as const };
      const current = readEndNotice(dir, jobId);
      if (current?.at) return { kind: 'skip' as const };
      const claimedAt = current?.claimedAt ? Date.parse(current.claimedAt) : NaN;
      const fresh = current?.claim && current.claim !== claim && Number.isFinite(claimedAt) && now() - claimedAt < claimMs;
      if (fresh) return { kind: 'busy' as const };
      writeEndNotice(dir, jobId, { claim, claimedAt: new Date(now()).toISOString(), outcome });
      return {
        kind: 'go' as const,
        taskId: job.input.clickupTaskId,
        body: clickupEndComment(job, outcome, deps.webBase),
      };
    });
    if (slot.kind === 'skip') return false;
    if (slot.kind === 'busy') {
      if (now() >= deadline) return false;
      await sleep(pollMs);
      continue;
    }
    try {
      await deps.postComment(slot.taskId, deps.apiToken, slot.body);
    } catch (err) {
      await lock(() => {
        const current = readEndNotice(dir, jobId);
        if (current?.claim === claim && !current.at) writeEndNotice(dir, jobId, null);
      });
      deps.log(jobId, `No se pudo publicar en ClickUp el aviso de fin: ${(err as Error).message}`, 'error');
      return false;
    }
    await lock(() => {
      const current = readEndNotice(dir, jobId);
      if (current?.at) return;
      if (current?.claim && current.claim !== claim) return;
      writeEndNotice(dir, jobId, { at: new Date(now()).toISOString(), outcome, claim });
    });
    deps.log(
      jobId,
      outcome === 'completed' ? 'Comentario de trabajo listo publicado en ClickUp.' : 'Comentario de fallo publicado en ClickUp.',
      'success'
    );
    return true;
  }
}

/** Unos 30 s después de crear el trabajo: si sigue en cola, se avisa en ClickUp. */
export const QUEUE_NOTICE_DELAY_MS = 30_000;

const queueNoticePosted = new Set<string>();

/** El aviso de cola, también cuando la previsión decía que iba a empezar enseguida. */
export function queueWaitComment(info: { ahead: number; startsInSec: number } | null | undefined): string {
  return queueCommentLine(info) || 'En cola: Hermes todavía no lo ha recogido; empezará en cuanto haya un hueco libre.';
}

export function resetQueueNotices(): void {
  queueNoticePosted.clear();
}

/** Publica «En cola…» si el trabajo sigue en cola y aún no se ha avisado. */
export async function deliverQueueNotice(jobId: string, deps: ClickupDeps): Promise<boolean> {
  if (queueNoticePosted.has(jobId)) return false;
  if (!deps.comment || !deps.apiToken) return false;
  const job = deps.getJob(jobId);
  if (!job || job.status !== 'queued' || !job.input.clickupTaskId) return false;
  const forecast = deps.queueFor ? deps.queueFor(job) : null;
  const text = queueWaitComment(forecast);
  queueNoticePosted.add(jobId);
  try {
    await deps.postComment(job.input.clickupTaskId, deps.apiToken, text);
    deps.log(jobId, 'Aviso de cola publicado en ClickUp: el trabajo sigue en espera.');
    return true;
  } catch (err) {
    queueNoticePosted.delete(jobId);
    deps.log(jobId, `No se pudo avisar de la cola en ClickUp: ${(err as Error).message}`, 'error');
    return false;
  }
}

function armQueueNotice(jobId: string, deps: ClickupDeps): void {
  if (!deps.comment || !deps.apiToken) return;
  const schedule = deps.schedule ?? ((fn: () => void, ms: number) => {
    const timer = setTimeout(fn, ms);
    timer.unref?.();
  });
  schedule(() => {
    void deliverQueueNotice(jobId, deps);
  }, QUEUE_NOTICE_DELAY_MS);
}

export function clickupWebhookCreateBody(endpoint: string, listId: string): { endpoint: string; events: ['taskCreated']; list_id: number } {
  if (!/^https:\/\/[^\s]+$/.test(endpoint)) throw new Error('El endpoint del webhook tiene que ser https.');
  const list_id = Number(listId);
  if (!Number.isSafeInteger(list_id) || list_id <= 0) throw new Error('CLICKUP_LIST_ID no es un id de lista válido.');
  return { endpoint, events: ['taskCreated'], list_id };
}

export async function fetchClickupTask(taskId: string, token: string, doFetch: typeof fetch = fetch): Promise<ClickupTask | null> {
  const res = await doFetch(
    `https://api.clickup.com/api/v2/task/${encodeURIComponent(taskId)}?include_markdown_description=true`,
    { headers: { Authorization: token }, signal: AbortSignal.timeout(8000) }
  );
  if (!res.ok) {
    console.error(`[clickup] GET /task/${taskId} → ${res.status}`);
    return null;
  }
  const data = (await res.json()) as unknown;
  if (!data || typeof data !== 'object') return null;
  const record = data as ClickupTask & { task?: ClickupTask };
  const nested = record.task;
  if (
    nested &&
    typeof nested === 'object' &&
    !record.name &&
    !record.description &&
    !record.text_content &&
    !record.markdown_description
  ) {
    return nested;
  }
  return record;
}

export async function postClickupCommentBody(taskId: string, token: string, body: ClickupCommentBody, doFetch: typeof fetch = fetch): Promise<void> {
  const res = await doFetch(`https://api.clickup.com/api/v2/task/${encodeURIComponent(taskId)}/comment`, {
    method: 'POST',
    headers: { Authorization: token, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) throw new Error(`comentario de ClickUp → ${res.status}`);
}

export async function postClickupComment(taskId: string, token: string, text: string, doFetch: typeof fetch = fetch): Promise<void> {
  await postClickupCommentBody(taskId, token, { comment_text: text, notify_all: false }, doFetch);
}

export async function handleClickupWebhook(raw: Buffer, signature: string | undefined, deps: ClickupDeps): Promise<ClickupOutcome> {
  if (!deps.secret) return { status: 401, body: { error: 'Integración de ClickUp desactivada.' } };
  if (!verifyClickupSignature(raw, signature, deps.secret)) return { status: 401, body: { error: 'Firma no válida.' } };

  let payload: ClickupPayload;
  try {
    payload = JSON.parse(raw.toString('utf8')) as ClickupPayload;
  } catch {
    return { status: 400, body: { error: 'El cuerpo no es JSON.' } };
  }

  const decision = classifyClickupEvent(payload, deps.listId);
  if (decision.action === 'ignore') return { status: 200, body: { ignored: true, reason: decision.reason } };

  const existing = deps.findJob(decision.taskId);
  if (existing) return { status: 200, body: { id: existing.id, deduped: true } };

  if (decision.confirmList) return createAfterListCheck(decision.taskId, payload, deps);

  const job = deps.createJob(provisionalInput(decision.taskId, payload));
  deps.log(job.id, `Abierto desde la tarea de ClickUp ${decision.taskId}.`);
  armQueueNotice(job.id, deps);
  return { status: 201, body: { id: job.id }, after: finishClickupJob(job.id, payload, deps) };
}

export function classifyClickupEvent(payload: ClickupPayload, listId: string): Decision {
  const event = payload?.event;
  if (event !== 'taskCreated' && event !== 'taskUpdated' && event !== 'taskMoved') {
    return { action: 'ignore', reason: 'event' };
  }
  const taskId = taskIdOf(payload?.task_id);
  if (!taskId) return { action: 'ignore', reason: 'no-task' };
  if (event === 'taskCreated') {
    const where = createdInList(payload, listId);
    if (where === 'no') return { action: 'ignore', reason: 'list' };
    return { action: 'create', taskId, confirmList: where === 'unknown' };
  }
  // taskUpdated / taskMoved: solo si la tarea entra ahora en la lista (field section_moved).
  if ((event === 'taskUpdated' || event === 'taskMoved') && entersList(payload, listId)) {
    return { action: 'create', taskId, confirmList: false };
  }
  return { action: 'ignore', reason: 'list' };
}

function finishClickupJob(jobId: string, payload: ClickupPayload, deps: ClickupDeps): Promise<void> {
  return enrichClickupJob(jobId, payload, deps).catch((err) => {
    console.error(`[clickup] ${jobId}: ${(err as Error).message}`);
    try {
      const job = deps.getJob(jobId);
      if (job?.input.clickupPending && job.status === 'queued') {
        deps.updateJob(jobId, { input: { ...job.input, clickupPending: false } });
      }
    } catch (inner) {
      console.error(`[clickup] ${jobId}: ${(inner as Error).message}`);
    }
  });
}

async function enrichClickupJob(jobId: string, payload: ClickupPayload, deps: ClickupDeps): Promise<void> {
  const current = deps.getJob(jobId);
  if (!current?.input.clickupPending || !current.input.clickupTaskId) return;
  const taskId = current.input.clickupTaskId;

  let task: ClickupTask | null = null;
  if (!deps.apiToken) {
    deps.log(jobId, 'Sin CLICKUP_API_TOKEN: el encargo no tiene la descripción de la tarea.');
  } else {
    let fetchError = false;
    try {
      task = await deps.fetchTask(taskId, deps.apiToken);
    } catch (err) {
      fetchError = true;
      deps.log(jobId, `No se pudo leer la tarea en ClickUp: ${(err as Error).message}`, 'error');
    }
    if (!fetchError && !task) deps.log(jobId, 'ClickUp no devolvió la tarea; el encargo queda con lo que traía el aviso.', 'error');
  }

  const fresh = deps.getJob(jobId);
  if (!fresh || fresh.status !== 'queued' || !fresh.input.clickupPending) return;

  if (task?.list && task.list.id != null && String(task.list.id) !== deps.listId) {
    deps.updateJob(jobId, {
      status: 'cancelled',
      error: 'La tarea de ClickUp no está en la lista configurada.',
      input: { ...fresh.input, clickupPending: false },
    });
    deps.log(jobId, 'Cancelado: la tarea no está en la lista de ClickUp configurada.', 'error');
    return;
  }

  let ready = task;
  if (task) {
    const prepared = await applyPrepare(task, taskId, deps);
    ready = prepared.task;
    logPrepareNotes(jobId, prepared.notes, deps);
  }

  const input = ready ? inputFromTask(ready, payload, deps, taskId) : { ...fresh.input, clickupPending: false };
  const title = ready?.name?.trim().slice(0, 140);
  deps.updateJob(jobId, { input, ...(title && !fresh.title ? { title } : {}) });
  if (ready && !taskDescription(ready)) {
    deps.log(jobId, 'La tarea de ClickUp no trae descripción: el brief es solo el nombre.', 'error');
  }
  if (ready) deps.log(jobId, `Encargo actualizado desde ClickUp (${taskId}).`);
  await commentOnTask(taskId, jobId, deps);
}

async function createAfterListCheck(taskId: string, payload: ClickupPayload, deps: ClickupDeps): Promise<ClickupOutcome> {
  if (!deps.apiToken) return { status: 200, body: { ignored: true, reason: 'list' } };

  let pending = confirming.get(taskId);
  const owner = !pending;
  if (!pending) {
    pending = (async () => {
      const again = deps.findJob(taskId);
      if (again) return { id: again.id, created: false };
      const task = await deps.fetchTask(taskId, deps.apiToken);
      if (!task) throw new Error('fetch-failed');
      const list = task.list?.id != null ? String(task.list.id) : '';
      if (list !== deps.listId) return null;
      const raced = deps.findJob(taskId);
      if (raced) return { id: raced.id, created: false };
      const prepared = await applyPrepare(task, taskId, deps);
      const job = deps.createJob(inputFromTask(prepared.task, payload, deps, taskId));
      deps.log(job.id, `Abierto desde la tarea de ClickUp ${taskId}.`);
      logPrepareNotes(job.id, prepared.notes, deps);
      armQueueNotice(job.id, deps);
      await commentOnTask(taskId, job.id, deps);
      return { id: job.id, created: true };
    })();
    confirming.set(taskId, pending);
  }

  try {
    const result = await pending;
    if (!result) return { status: 200, body: { ignored: true, reason: 'list' } };
    if (!owner || !result.created) return { status: 200, body: { id: result.id, deduped: true } };
    return { status: 201, body: { id: result.id } };
  } catch {
    return { status: 500, body: { error: 'No se pudo leer la tarea en ClickUp.' } };
  } finally {
    if (owner) confirming.delete(taskId);
  }
}

async function applyPrepare(
  task: ClickupTask,
  taskId: string,
  deps: ClickupDeps
): Promise<{ task: ClickupTask; notes: { message: string; level?: 'info' | 'error' }[] }> {
  if (!deps.prepareTask) return { task, notes: [] };
  try {
    const prepared = await deps.prepareTask(task, taskId);
    if (!prepared?.task) return { task, notes: [] };
    return { task: prepared.task, notes: prepared.notes || [] };
  } catch (err) {
    return { task, notes: [{ message: `No se pudo preparar la tarea de ClickUp: ${(err as Error).message}`, level: 'error' }] };
  }
}

function logPrepareNotes(
  jobId: string,
  notes: { message: string; level?: 'info' | 'error' }[],
  deps: ClickupDeps
): void {
  for (const note of notes) deps.log(jobId, note.message, note.level === 'error' ? 'error' : 'info');
}

async function commentOnTask(taskId: string, jobId: string, deps: ClickupDeps): Promise<void> {
  if (!deps.comment || !deps.apiToken) return;
  try {
    const job = deps.getJob(jobId);
    const queue = job && deps.queueFor ? deps.queueFor(job) : null;
    await deps.postComment(taskId, deps.apiToken, clickupJobComment(deps.webBase, jobId, queue));
    if (queueCommentLine(queue)) queueNoticePosted.add(jobId);
    deps.log(jobId, queueCommentLine(queue) ? 'Comentario publicado en la tarea de ClickUp (con la cola).' : 'Comentario publicado en la tarea de ClickUp.');
  } catch (err) {
    deps.log(jobId, `No se pudo comentar en ClickUp: ${(err as Error).message}`, 'error');
  }
}

function provisionalInput(taskId: string, payload: ClickupPayload): JobInput {
  const person = clickupPersonFields(payload, undefined);
  return baseInput({
    clientName: 'Sin marca',
    instruction: [
      `Tarea de ClickUp ${taskId}.${person.requesterName ? ` La abrió ${person.requesterName}.` : ''}`,
      `Enlace: https://app.clickup.com/t/${taskId}`,
      'La descripción y los adjuntos se están leyendo de ClickUp. Si este texto no cambia, falta CLICKUP_API_TOKEN o la API no respondió: completa el encargo a mano.',
      'No hay web oficial en la tarea. No inventes el dominio de la marca.',
    ].join('\n'),
    requesterName: person.requesterName,
    ...creatorIdField(person.clickupCreatorId),
    clickupTaskId: taskId,
    clickupUrl: `https://app.clickup.com/t/${taskId}`,
    clickupPending: true,
    brandMode: 'new',
  });
}

function inputFromTask(task: ClickupTask, payload: ClickupPayload, deps: ClickupDeps, taskId: string): JobInput {
  const description = taskDescription(task);
  const campaignName = customFieldText(task.custom_fields, CAMPAIGN_FIELDS);
  const picked = deriveClient(task.name || '', description, customFieldText(task.custom_fields, CLIENT_FIELDS), deps.brandRecords?.());
  const clientName = picked.name;
  const brandUrl = deriveBrandUrl(description);
  const clientSlug = picked.slug || slugify(clientName);
  const clickupUrl = clickupTaskUrl(taskId, task.url);
  return baseInput({
    clientName,
    clientSlug,
    brandMode: deps.knownBrand(clientSlug) ? 'existing' : 'new',
    brandUrl,
    instruction: buildInstruction({ name: task.name || taskId, description, attachments: task.attachments, clientName, campaignName, brandUrl, clickupUrl }),
    ...clickupPersonFields(payload, task.creator),
    clickupTaskId: taskId,
    clickupUrl,
    campaignName,
    clickupPending: false,
    ...clickupBriefFields(task, taskId),
  });
}

/** Nombre + descripción + adjuntos y enlaces. Vacío si la tarea no trae nada de eso. */
export function briefFromClickupTask(task: ClickupTask, taskId = ''): string {
  const name = (task.name || '').trim();
  const description = taskDescription(task);
  const files = attachmentLines(task.attachments);
  if (!name && !description && !files.length) return '';
  const title = name || (taskId ? `Tarea ${taskId}` : 'Tarea de ClickUp');
  const known = new Set(files.map((file) => file.url));
  const links = externalLinks(`${description}\n${name}`, known);
  const foot = [
    files.length ? `\n\n## Adjuntos\n${files.map((file) => `- ${file.title}: ${file.url}`).join('\n')}` : '',
    links.length ? `\n\n## Enlaces\n${links.map((url) => `- ${url}`).join('\n')}` : '',
  ].join('');
  const head = `# ${title}`;
  const room = INSTRUCTION_MAX - head.length - foot.length - 2;
  const body = description && room > 0 ? `\n\n${description.slice(0, room)}` : '';
  return `${head}${body}${foot}`.slice(0, INSTRUCTION_MAX);
}

function clickupBriefFields(task: ClickupTask, taskId: string): { briefText: string; briefReused?: boolean } {
  const briefText = briefFromClickupTask(task, taskId);
  return briefText ? { briefText, briefReused: true } : { briefText: '' };
}

function attachmentLines(attachments: ClickupTask['attachments']): { title: string; url: string }[] {
  return (attachments || [])
    .map((file) => ({ title: cleanLabel(file?.title || file?.name || '') || 'archivo', url: (file?.url || '').trim() }))
    .filter((file) => /^https:\/\/[^\s"'<>]{4,2000}$/.test(file.url))
    .slice(0, 15);
}

function externalLinks(text: string, skip: Set<string>): string[] {
  const matches = text.match(/https:\/\/[^\s<>"'`)\]}]+/gi) || [];
  const out: string[] = [];
  for (const match of matches) {
    const url = match.replace(/[.,;]+$/g, '');
    if (!/^https:\/\/[^\s"'<>]{4,2000}$/.test(url) || isClickupHost(url) || skip.has(url) || out.includes(url)) continue;
    out.push(url);
  }
  return out.slice(0, 15);
}

function baseInput(fields: JobInput): JobInput {
  const clientSlug = fields.clientSlug || slugify(fields.clientName);
  return {
    mode: 'standalone',
    imageMode: 'official',
    artReview: true,
    briefText: '',
    brandMode: 'new',
    ...fields,
    clientSlug,
  };
}

const GENERIC_BRAND = new Set([
  'prueba', 'test', 'tests', 'demo', 'e2e', 'studio', 'newsletter', 'newsletters', 'news',
  'email', 'mailing', 'pieza', 'marca', 'brand', 'cliente', 'client', 'campana', 'campaign',
  'sandbox', 'staging',
]);
const TEST_LEAD = /^(?:prueba|test|tests|demo|sandbox|staging)\b/i;
const BRAND_STOP = new Set(['con', 'para', 'de', 'del', 'por', 'en', 'el', 'la', 'los', 'las', 'y', 'e', 'o', 'u', 'un', 'una', 'the', 'with', 'for', 'and', 'a', 'an', 'que', 'sobre']);

/**
 * Un nombre de cliente no se queda con el enlace que ClickUp pega al lado.
 * `[etiqueta](url)` deja la etiqueta (si la etiqueta es otra URL, se quita);
 * también se quitan URLs sueltas, entre paréntesis o entre ángulos.
 */
function stripClientLinkNoise(value: string): string {
  let text = value;
  text = text.replace(/\[([^\]]*)\]\(\s*(?:https?:\/\/|www\.)[^)\s]*\s*\)/gi, (_match, label: string) => {
    const inner = String(label).trim();
    if (!inner || /^(?:https?:\/\/|www\.)/i.test(inner)) return '';
    return inner;
  });
  text = text.replace(/\(\s*(?:https?:\/\/|www\.)[^)]*\)/gi, '');
  text = text.replace(/<\s*(?:https?:\/\/|www\.)[^>]*>/gi, '');
  text = text.replace(/(?:https?:\/\/|www\.)[^\s<>"'`)\]}]+/gi, '');
  return text.replace(/\(\s*\)/g, '').replace(/\[\s*\]/g, '');
}

function clientNameFrom(value: string): string | undefined {
  return cleanLabel(stripClientLinkNoise(value));
}

/** Campo o línea etiquetada, si no una ficha conocida, si no el texto tras newsletter o el guion. */
export function deriveClient(taskName: string, description: string, fromField?: string, known?: KnownBrand[]): DerivedClient {
  const field = clientNameFrom(fromField || '');
  if (field) return { name: field };
  const labeled = `${taskName}\n${description}`.match(/(?:^|\n)\s*(?:marca|brand|cliente|client)\s*[:：]\s*([^\n,]+)/i);
  const fromLabel = labeled ? clientNameFrom(labeled[1]) : undefined;
  if (fromLabel) return { name: fromLabel };
  const extracted = extractBrandName(taskName, description);
  const match = matchKnownBrand(taskName, description, known || [], extracted);
  if (match) return { name: brandDisplay(match, extracted), slug: match.slug };
  if (extracted) return { name: extracted };
  return { name: 'Sin marca' };
}

export function deriveClientName(taskName: string, description: string, fromField?: string, known?: KnownBrand[]): string {
  return deriveClient(taskName, description, fromField, known).name;
}

function brandDisplay(brand: KnownBrand, extracted?: string): string {
  const named = cleanLabel(brand.name || '');
  if (named) return named;
  if (extracted && slugify(extracted) === brand.slug) return extracted;
  return brand.slug;
}

function extractBrandName(taskName: string, description: string): string | undefined {
  return extractFromText(taskName, true) || extractFromText(description, false);
}

function extractFromText(text: string, allowHead: boolean): string | undefined {
  const raw = text.replace(/\s+/g, ' ').trim();
  if (!raw) return undefined;
  const phrase = raw.match(/\b(?:newsletters?|news|emails?|mailing|pieza)\s+(?:(?:de(?:l| la)?|para|for)\s+)?(.+)$/i);
  if (phrase) {
    const brand = takeBrandTokens(phrase[1]);
    if (brand) return brand;
  }
  const parts = raw.split(/\s+[:–—]\s+|\s+-\s+/);
  if (parts.length >= 2) {
    const left = parts[0].trim();
    if (TEST_LEAD.test(left)) return extractFromText(parts.slice(1).join(' – '), true);
    if (allowHead) {
      const head = cleanLabel(left);
      if (head && !TEST_LEAD.test(head)) return head;
    }
  }
  if (!allowHead || TEST_LEAD.test(raw)) return undefined;
  return cleanLabel(raw);
}

function takeBrandTokens(rest: string): string | undefined {
  const kept: string[] = [];
  for (const token of rest.replace(/[.,;]+$/g, '').trim().split(/\s+/)) {
    const bare = token.replace(/^[("']+|[)"',.;:]+$/g, '');
    if (!bare) continue;
    if (/^[-–—:]+$/.test(bare)) {
      if (kept.length) break;
      continue;
    }
    if (BRAND_STOP.has(norm(bare))) {
      if (kept.length) break;
      continue;
    }
    kept.push(bare);
    if (kept.length >= 4) break;
  }
  const label = cleanLabel(kept.join(' '));
  if (!label || GENERIC_BRAND.has(norm(label))) return undefined;
  return label;
}

function matchKnownBrand(taskName: string, description: string, known: KnownBrand[], extracted?: string): KnownBrand | undefined {
  const title = norm(taskName);
  const body = norm(description);
  const extractedNorm = extracted ? norm(extracted) : '';
  let best: { brand: KnownBrand; score: number } | undefined;
  for (const brand of known) {
    const slug = (brand.slug || '').trim().toLowerCase();
    if (!/^[a-z0-9][a-z0-9-]{0,59}$/.test(slug)) continue;
    const nameNorm = norm(brand.name || '');
    const slugWords = slug.replace(/-/g, ' ');
    let score = 0;
    if (nameNorm && !GENERIC_BRAND.has(nameNorm) && nameNorm.length >= 3) {
      if (hasWord(title, nameNorm)) score = 100;
      else if (hasWord(body, nameNorm)) score = 40;
    }
    if (score === 0 && slugWords.length >= 3 && !GENERIC_BRAND.has(slugWords) && !GENERIC_BRAND.has(slug)) {
      if (hasWord(title, slugWords) || hasWord(title, slug)) score = 30;
      else if (hasWord(body, slugWords) || hasWord(body, slug)) score = 10;
    }
    if (extractedNorm && (nameNorm === extractedNorm || slugWords === extractedNorm || slug === extractedNorm.replace(/\s+/g, '-'))) score += 200;
    if (score > 0 && (!best || score > best.score)) best = { brand, score };
  }
  return best?.brand;
}

function hasWord(haystack: string, needle: string): boolean {
  if (!needle || needle.length < 3) return false;
  const escaped = needle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`(?:^|[^a-z0-9])${escaped}(?=$|[^a-z0-9])`, 'i').test(haystack);
}

export function deriveBrandUrl(text: string): string | undefined {
  const matches = text.match(/https:\/\/[^\s<>"'`)\]}]+/gi) || [];
  for (const match of matches) {
    const url = match.replace(/[.,;]+$/g, '');
    if (!/^https:\/\/[^\s"'<>]{4,300}$/.test(url)) continue;
    if (isClickupHost(url)) continue;
    return url;
  }
  return undefined;
}

function buildInstruction(parts: {
  name: string;
  description: string;
  attachments?: ClickupTask['attachments'];
  clientName: string;
  campaignName?: string;
  brandUrl?: string;
  clickupUrl: string;
}): string {
  const meta = [
    `Marca: ${parts.clientName}`,
    parts.campaignName ? `Campaña: ${parts.campaignName}` : '',
    `Tarea ClickUp: ${parts.clickupUrl}`,
    parts.brandUrl ? `Web oficial: ${parts.brandUrl}` : 'No hay web oficial en la tarea. No inventes el dominio de la marca.',
  ].filter((line) => line !== '');
  const head = `${meta.join('\n')}\n\n# ${parts.name.trim() || 'Tarea de ClickUp'}`;

  const files = (parts.attachments || [])
    .map((file) => ({ title: file?.title || file?.name || 'archivo', url: file?.url || '' }))
    .filter((file) => /^https:\/\/[^\s"'<>]{4,2000}$/.test(file.url))
    .slice(0, 15)
    .map((file) => `- ${cleanLabel(file.title) || 'archivo'}: ${file.url}`);
  const foot = files.length ? `\n\n## Archivos adjuntos\n${files.join('\n')}` : '';
  const room = INSTRUCTION_MAX - head.length - foot.length - 2;
  const body = room > 0 && parts.description ? `\n\n${parts.description.slice(0, room)}` : '';
  return `${head}${body}${foot}`.slice(0, INSTRUCTION_MAX);
}

function taskDescription(task: ClickupTask): string {
  const markdown = task.markdown_description?.trim();
  if (markdown) return markdown;
  const text = task.text_content?.trim();
  if (text) return text;
  return plainFromHtml(task.description || '');
}

function customFieldText(fields: unknown, names: Set<string>): string | undefined {
  if (!Array.isArray(fields)) return undefined;
  for (const field of fields) {
    if (!field || typeof field !== 'object') continue;
    const record = field as { name?: unknown; value?: unknown; type_config?: { options?: unknown } };
    const name = norm(typeof record.name === 'string' ? record.name : '');
    if (!names.has(name)) continue;
    const direct = typeof record.value === 'string' ? cleanLabel(record.value) : undefined;
    if (direct) return direct;
    const options = Array.isArray(record.type_config?.options) ? record.type_config.options : [];
    const picked = options
      .map((option) => (option && typeof option === 'object' ? (option as { id?: unknown; name?: unknown; orderindex?: unknown }) : null))
      .filter((option): option is { id?: unknown; name?: unknown; orderindex?: unknown } => !!option);
    const values = Array.isArray(record.value) ? record.value : [record.value];
    const labels = values
      .map((value) => picked.find((option) => option.id === value || option.orderindex === value || String(option.orderindex) === String(value)))
      .map((option) => (typeof option?.name === 'string' ? cleanLabel(option.name) : undefined))
      .filter((label): label is string => !!label);
    if (labels.length) return labels.join(', ').slice(0, 80);
  }
  return undefined;
}

function requesterFrom(payload: ClickupPayload, creator: string | undefined): string | undefined {
  // El creador de la tarea (creator.username) manda sobre quien disparó el webhook.
  const fromTask = cleanPerson(creator);
  if (fromTask) return fromTask;
  for (const item of payload.history_items || []) {
    const name = cleanPerson(item?.user?.username);
    if (name) return name;
  }
  return undefined;
}

/** Username e id del creador. El id del historial solo entra si es esa misma persona, o si la tarea aún no dice quién. */
function clickupPersonFields(
  payload: ClickupPayload,
  creator: { id?: unknown; username?: string } | undefined
): { requesterName?: string; clickupCreatorId?: string } {
  const requesterName = requesterFrom(payload, creator?.username);
  const fromTask = clickupUserId(creator?.id);
  if (fromTask) return { requesterName, clickupCreatorId: fromTask };
  const taskNamesCreator = !!cleanPerson(creator?.username);
  for (const item of payload.history_items || []) {
    const id = clickupUserId(item?.user?.id);
    if (!id) continue;
    if (taskNamesCreator) {
      if (requesterName && cleanPerson(item?.user?.username) === requesterName) return { requesterName, clickupCreatorId: id };
      continue;
    }
    return { requesterName, clickupCreatorId: id };
  }
  return { requesterName };
}

function creatorIdField(id: string | undefined): { clickupCreatorId?: string } {
  return id ? { clickupCreatorId: id } : {};
}

function createdInList(payload: ClickupPayload, listId: string): 'yes' | 'no' | 'unknown' {
  const parents = (payload.history_items || []).map((item) => item?.parent_id).filter((id) => id != null && id !== '').map(String);
  if (!parents.length) return 'unknown';
  return parents.some((id) => id === listId) ? 'yes' : 'no';
}

function entersList(payload: ClickupPayload, listId: string): boolean {
  return (payload.history_items || []).some((item) => {
    if (item?.field !== 'section_moved') return false;
    const after = item.after && typeof item.after === 'object' ? (item.after as { id?: unknown }).id : undefined;
    const before = item.before && typeof item.before === 'object' ? (item.before as { id?: unknown }).id : undefined;
    const dest = after != null && after !== '' ? String(after) : item.parent_id != null ? String(item.parent_id) : '';
    const origin = before != null && before !== '' ? String(before) : '';
    return dest === listId && origin !== listId;
  });
}

function taskIdOf(value: unknown): string | null {
  if (typeof value !== 'string' && typeof value !== 'number') return null;
  const id = String(value);
  return /^[A-Za-z0-9_-]{3,50}$/.test(id) ? id : null;
}

function clickupTaskUrl(taskId: string, fromApi: string | undefined): string {
  const fallback = `https://app.clickup.com/t/${taskId}`;
  if (!fromApi || !isClickupHost(fromApi) || !fromApi.startsWith('https://')) return fallback;
  return fromApi;
}

function isClickupHost(value: string): boolean {
  try {
    const host = new URL(value).hostname.toLowerCase();
    return host === 'clickup.com' || host.endsWith('.clickup.com');
  } catch {
    return false;
  }
}

function plainFromHtml(html: string): string {
  const hrefs = [...html.matchAll(/href\s*=\s*["'](https:\/\/[^"'<>]+)["']/gi)].map((match) => match[1]);
  const text = html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
  const missing = hrefs.filter((url) => !text.includes(url) && !isClickupHost(url));
  return missing.length ? `${text}\n${missing.join('\n')}`.trim() : text;
}

function cleanLabel(value: string): string | undefined {
  const clean = value.replace(/\s+/g, ' ').replace(/[.,;]+$/g, '').trim();
  if (clean.length < 2) return undefined;
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean)) return undefined;
  return clean.slice(0, 80);
}

function cleanPerson(value: string | undefined): string | undefined {
  if (!value) return undefined;
  const clean = value.replace(/\s+/g, ' ').trim();
  if (!clean || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean)) return undefined;
  return clean.slice(0, 80);
}

function norm(value: string): string {
  return value.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase().trim();
}

function httpsOrigin(value: string | undefined): string | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    if (url.protocol !== 'https:') return null;
    return url.origin;
  } catch {
    return null;
  }
}
