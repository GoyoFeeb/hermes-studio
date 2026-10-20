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
import { slugify } from './campaignFs';
import { queueCommentLine } from './queueEta';
import { listJobs, type Job, type JobInput } from './store';

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
  creator?: { username?: string };
  attachments?: { title?: string; name?: string; url?: string }[];
  custom_fields?: unknown[];
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
  knownBrand: (slug: string) => boolean;
  /** Fichas de marca ya sincronizadas. Si no está, la marca sale del texto de la tarea. */
  brandRecords?: () => KnownBrand[];
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
    user?: { username?: string };
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

export async function postClickupComment(taskId: string, token: string, text: string, doFetch: typeof fetch = fetch): Promise<void> {
  const res = await doFetch(`https://api.clickup.com/api/v2/task/${encodeURIComponent(taskId)}/comment`, {
    method: 'POST',
    headers: { Authorization: token, 'Content-Type': 'application/json' },
    body: JSON.stringify({ comment_text: text, notify_all: false }),
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) throw new Error(`comentario de ClickUp → ${res.status}`);
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

  const input = task ? inputFromTask(task, payload, deps, taskId) : { ...fresh.input, clickupPending: false };
  const title = task?.name?.trim().slice(0, 140);
  deps.updateJob(jobId, { input, ...(title && !fresh.title ? { title } : {}) });
  if (task && !taskDescription(task)) {
    deps.log(jobId, 'La tarea de ClickUp no trae descripción: el brief es solo el nombre.', 'error');
  }
  if (task) deps.log(jobId, `Encargo actualizado desde ClickUp (${taskId}).`);
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
      const job = deps.createJob(inputFromTask(task, payload, deps, taskId));
      deps.log(job.id, `Abierto desde la tarea de ClickUp ${taskId}.`);
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

async function commentOnTask(taskId: string, jobId: string, deps: ClickupDeps): Promise<void> {
  if (!deps.comment || !deps.apiToken) return;
  try {
    const job = deps.getJob(jobId);
    const queue = job && deps.queueFor ? deps.queueFor(job) : null;
    await deps.postComment(taskId, deps.apiToken, clickupJobComment(deps.webBase, jobId, queue));
    deps.log(jobId, queue ? 'Comentario publicado en la tarea de ClickUp (con la cola).' : 'Comentario publicado en la tarea de ClickUp.');
  } catch (err) {
    deps.log(jobId, `No se pudo comentar en ClickUp: ${(err as Error).message}`, 'error');
  }
}

function provisionalInput(taskId: string, payload: ClickupPayload): JobInput {
  const requesterName = requesterFrom(payload, undefined);
  return baseInput({
    clientName: 'Sin marca',
    instruction: [
      `Tarea de ClickUp ${taskId}.${requesterName ? ` La abrió ${requesterName}.` : ''}`,
      `Enlace: https://app.clickup.com/t/${taskId}`,
      'La descripción y los adjuntos se están leyendo de ClickUp. Si este texto no cambia, falta CLICKUP_API_TOKEN o la API no respondió: completa el encargo a mano.',
      'No hay web oficial en la tarea. No inventes el dominio de la marca.',
    ].join('\n'),
    requesterName,
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
    requesterName: requesterFrom(payload, task.creator?.username),
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

/** Campo o línea etiquetada, si no una ficha conocida, si no el texto tras newsletter o el guion. */
export function deriveClient(taskName: string, description: string, fromField?: string, known?: KnownBrand[]): DerivedClient {
  const field = cleanLabel(fromField || '');
  if (field) return { name: field };
  const labeled = `${taskName}\n${description}`.match(/(?:^|\n)\s*(?:marca|brand|cliente|client)\s*[:：]\s*([^\n,]{2,80})/i);
  const fromLabel = labeled ? cleanLabel(labeled[1]) : undefined;
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
  const fromTask = cleanPerson(creator);
  if (fromTask) return fromTask;
  for (const item of payload.history_items || []) {
    const name = cleanPerson(item?.user?.username);
    if (name) return name;
  }
  return undefined;
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
