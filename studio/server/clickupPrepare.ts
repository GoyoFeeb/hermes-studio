/**
 * clickupPrepare.ts — antes de producir, deja la tarea de JAVI AI lista (2026-10-21).
 *
 * Si no tiene asignado, se la pone a Javier Condado (o a CLICKUP_DEFAULT_ASSIGNEE_ID).
 * Si no tiene estado, pasa a BACKLOG; si ya tiene uno, no se toca.
 * Si la descripción no es un brief con los campos obligatorios, el modelo la reescribe
 * en español y se guarda en la tarea, con el texto original debajo. Un marcador evita
 * repetirlo. El trabajo de Studio usa esa descripción.
 *
 * El modelo es el del worker: HERMES_PROVIDER y HERMES_INFERENCE_MODEL (o HERMES_MODEL_BRIEF).
 * Sin proveedor, la tarea sigue y el brief queda como llegó.
 */
import { canonicalProvider, ANTHROPIC_PROVIDER, NOUS_API_PROVIDER, NOUS_INFERENCE_BASE, DEFAULT_NOUS_MODEL } from '../worker/hermesCloudProfile';

export const DEFAULT_ASSIGNEE_NAME = 'Javier Condado';
export const BACKLOG_STATUS = 'BACKLOG';
export const BRIEF_MARKER = '<!-- hermes-brief -->';
export const ORIGINAL_HEADING = 'Descripción original:';
export const BRIEF_COMMENT = 'He reestructurado la descripción en un brief para producir la pieza. El texto original queda bajo «Descripción original:».';

const DESC_MAX = 40_000;
const ASSIGNEE_CACHE = new Map<string, string | null>();

export interface PrepareTask {
  name?: string;
  description?: string;
  text_content?: string;
  markdown_description?: string;
  assignees?: { id?: number | string; username?: string }[] | null;
  status?: { status?: string } | string | null;
  list?: { id?: string | number };
}

export interface PrepareNote {
  message: string;
  level?: 'info' | 'error';
}

export interface PrepareResult {
  task: PrepareTask;
  notes: PrepareNote[];
}

export interface PrepareOptions {
  token: string;
  comment: boolean;
  listId?: string;
  env?: NodeJS.ProcessEnv;
  doFetch?: typeof fetch;
  /** Sustituye la llamada al modelo (tests). */
  complete?: (prompt: string) => Promise<string>;
}

export interface BriefModelConfig {
  provider: 'anthropic' | 'openai';
  model: string;
  apiKey: string;
  url: string;
}

interface MemberHit {
  id: string;
  username: string;
  teamId: string;
}

const FIELD_RES: RegExp[] = [
  /cliente\s*\/\s*marca\s*:/i,
  /url de la marca\s*:/i,
  /producto\s*\/\s*servicio\s*:/i,
  /objetivo\s*:/i,
  /formato\s*:/i,
  /cta\s*:/i,
  /idioma\s*:/i,
  /tono\s*:/i,
  /p[uú]blico\s*:/i,
  /mensajes clave\s*:/i,
  /im[aá]genes(?:\s*\([^)\n]{0,40}\))?\s*:/i,
];

export function clearAssigneeCache(): void {
  ASSIGNEE_CACHE.clear();
}

function fold(value: string): string {
  return value.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase().replace(/\s+/g, ' ').trim();
}

function userId(value: unknown): string | null {
  if (typeof value === 'number' && Number.isSafeInteger(value) && value > 0) return String(value);
  if (typeof value === 'string' && /^[1-9][0-9]{0,15}$/.test(value.trim())) return value.trim();
  return null;
}

export function taskText(task: PrepareTask): string {
  const markdown = task.markdown_description?.trim();
  if (markdown) return markdown;
  const text = task.text_content?.trim();
  if (text) return text;
  return (task.description || '').replace(/\s+$/g, '').trim();
}

/** Ya está reescrito (marcador) o trae los once campos como etiqueta. */
export function briefIsStructured(text: string): boolean {
  if (!text) return false;
  if (text.includes(BRIEF_MARKER)) return true;
  return FIELD_RES.every((re) => re.test(text));
}

export function taskHasAssignee(task: PrepareTask): boolean {
  return (task.assignees || []).some((person) => userId(person?.id) != null);
}

/** Nombre del estado, o vacío si la tarea no trae uno. */
export function taskStatusName(task: PrepareTask): string {
  const status = task.status;
  if (!status) return '';
  if (typeof status === 'string') return status.trim();
  if (typeof status.status === 'string') return status.status.trim();
  return '';
}

export function composeBriefDescription(structured: string, original: string): string {
  const body = structured
    .replace(/```(?:markdown|md|text)?/gi, '')
    .replace(/<!--\s*hermes-brief\s*-->/gi, '')
    .replace(new RegExp(`\\n*${ORIGINAL_HEADING.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[\\s\\S]*$`, 'i'), '')
    .trim();
  const source = original.trim() || '(sin descripción)';
  const head = `${BRIEF_MARKER}\n${body}\n\n${ORIGINAL_HEADING}\n`;
  const room = DESC_MAX - head.length;
  const kept = room > 0 ? source.slice(0, room) : '';
  return `${head}${kept}`.slice(0, DESC_MAX);
}

export function briefModelConfigFromEnv(env: NodeJS.ProcessEnv = process.env): BriefModelConfig | null {
  const explicit = canonicalProvider(env.HERMES_PROVIDER || '');
  const anthropicKey = (env.ANTHROPIC_API_KEY || '').trim();
  const nousKey = (env.NOUS_API_KEY || '').trim();
  const modelOverride = (env.HERMES_MODEL_BRIEF || env.HERMES_INFERENCE_MODEL || '').trim();
  const provider = explicit || (anthropicKey ? ANTHROPIC_PROVIDER : nousKey ? NOUS_API_PROVIDER : '');
  if (provider === ANTHROPIC_PROVIDER) {
    if (!anthropicKey || /[\r\n]/.test(anthropicKey)) return null;
    const base = (env.ANTHROPIC_BASE_URL || 'https://api.anthropic.com').trim().replace(/\/$/, '');
    return {
      provider: 'anthropic',
      model: modelOverride || 'claude-sonnet-5-5',
      apiKey: anthropicKey,
      url: `${base}/v1/messages`,
    };
  }
  if (provider === NOUS_API_PROVIDER) {
    if (!nousKey || /[\r\n]/.test(nousKey)) return null;
    return {
      provider: 'openai',
      model: modelOverride || DEFAULT_NOUS_MODEL,
      apiKey: nousKey,
      url: `${NOUS_INFERENCE_BASE}/chat/completions`,
    };
  }
  return null;
}

export function briefPrompt(name: string, description: string): string {
  return [
    'Reescribe el encargo de abajo como un brief estructurado, en español.',
    'Infiere el objetivo real de quien lo escribió. No inventes precios, porcentajes, urgencia ni exclusividad que no estén en el texto.',
    'Si un dato no se puede saber, escribe «No indicado». Si falta el CTA pero hay URL de la marca, propón un CTA corto que apunte a esa URL.',
    'Devuelve solo estas líneas, sin el texto original y sin comentarios:',
    'Cliente/Marca: …',
    'URL de la marca: …',
    'Producto/servicio: …',
    'Objetivo: …',
    'Formato: …',
    'CTA: "texto" → https://…',
    'Idioma: …',
    'Tono: …',
    'Público: …',
    'Mensajes clave: …',
    'Imágenes: …',
    '',
    `Nombre de la tarea: ${name || '(sin nombre)'}`,
    '',
    'Texto de la persona:',
    description || '(sin descripción)',
  ].join('\n');
}

function stripModelText(text: string): string {
  const fenced = text.match(/```(?:markdown|md|text)?\s*([\s\S]*?)```/i);
  return (fenced ? fenced[1] : text).trim();
}

export function acceptBriefReply(text: string): string | null {
  const clean = stripModelText(text || '');
  if (!clean || !briefIsStructured(clean)) return null;
  return clean;
}

export async function completeBrief(prompt: string, env: NodeJS.ProcessEnv, doFetch: typeof fetch): Promise<string> {
  const cfg = briefModelConfigFromEnv(env);
  if (!cfg) throw new Error('sin proveedor para reescribir el brief');
  if (cfg.provider === 'anthropic') {
    const res = await doFetch(cfg.url, {
      method: 'POST',
      headers: { 'x-api-key': cfg.apiKey, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
      body: JSON.stringify({ model: cfg.model, max_tokens: 1200, messages: [{ role: 'user', content: prompt }] }),
      signal: AbortSignal.timeout(20000),
    });
    if (!res.ok) throw new Error(`modelo → ${res.status}`);
    const data = (await res.json()) as { content?: { type?: string; text?: string }[] };
    return (data.content || []).filter((block) => block.type === 'text').map((block) => block.text || '').join('\n');
  }
  const res = await doFetch(cfg.url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${cfg.apiKey}`, 'content-type': 'application/json' },
    body: JSON.stringify({ model: cfg.model, max_tokens: 1200, messages: [{ role: 'user', content: prompt }] }),
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) throw new Error(`modelo → ${res.status}`);
  const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
  return data.choices?.[0]?.message?.content || '';
}

function membersFromTeams(data: unknown): MemberHit[] {
  const teams = data && typeof data === 'object' && Array.isArray((data as { teams?: unknown }).teams) ? (data as { teams: unknown[] }).teams : [];
  const out: MemberHit[] = [];
  for (const team of teams) {
    if (!team || typeof team !== 'object') continue;
    const record = team as { id?: unknown; members?: unknown };
    const teamId = record.id != null ? String(record.id) : '';
    const members = Array.isArray(record.members) ? record.members : [];
    for (const member of members) {
      if (!member || typeof member !== 'object') continue;
      const row = member as { id?: unknown; username?: unknown; user?: { id?: unknown; username?: unknown } };
      const person = row.user && typeof row.user === 'object' ? row.user : row;
      const id = userId(person.id);
      const username = typeof person.username === 'string' ? person.username : '';
      if (id && username) out.push({ id, username, teamId });
    }
  }
  return out;
}

export function memberIdByName(members: { id: string; username: string; teamId?: string }[], name: string, teamId?: string): string | null {
  const wanted = fold(name);
  const pool = teamId ? members.filter((member) => member.teamId === teamId) : members;
  const hit = pool.find((member) => fold(member.username) === wanted);
  return hit ? hit.id : null;
}

async function resolveAssigneeId(token: string, env: NodeJS.ProcessEnv, doFetch: typeof fetch): Promise<string | null> {
  const override = userId(env.CLICKUP_DEFAULT_ASSIGNEE_ID || '');
  if (override) return override;
  const teamId = (env.CLICKUP_TEAM_ID || '').trim();
  const key = `${token}\0${teamId}\0${fold(DEFAULT_ASSIGNEE_NAME)}`;
  if (ASSIGNEE_CACHE.has(key)) return ASSIGNEE_CACHE.get(key) || null;
  const res = await doFetch('https://api.clickup.com/api/v2/team', {
    headers: { Authorization: token },
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) throw new Error(`miembros de ClickUp → ${res.status}`);
  const id = memberIdByName(membersFromTeams(await res.json()), DEFAULT_ASSIGNEE_NAME, teamId || undefined);
  ASSIGNEE_CACHE.set(key, id);
  return id;
}

async function backlogName(listId: string, token: string, doFetch: typeof fetch): Promise<string> {
  if (!listId) return BACKLOG_STATUS;
  try {
    const res = await doFetch(`https://api.clickup.com/api/v2/list/${encodeURIComponent(listId)}`, {
      headers: { Authorization: token },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return BACKLOG_STATUS;
    const data = (await res.json()) as { statuses?: { status?: unknown }[] };
    const hit = (data.statuses || []).find((row) => fold(typeof row?.status === 'string' ? row.status : '') === 'backlog');
    return hit && typeof hit.status === 'string' && hit.status.trim() ? hit.status.trim() : BACKLOG_STATUS;
  } catch {
    return BACKLOG_STATUS;
  }
}

async function putTask(taskId: string, token: string, patch: Record<string, unknown>, doFetch: typeof fetch): Promise<void> {
  const res = await doFetch(`https://api.clickup.com/api/v2/task/${encodeURIComponent(taskId)}`, {
    method: 'PUT',
    headers: { Authorization: token, 'Content-Type': 'application/json' },
    body: JSON.stringify(patch),
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) throw new Error(`actualización de ClickUp → ${res.status}`);
}

async function postNote(taskId: string, token: string, text: string, doFetch: typeof fetch): Promise<void> {
  const res = await doFetch(`https://api.clickup.com/api/v2/task/${encodeURIComponent(taskId)}/comment`, {
    method: 'POST',
    headers: { Authorization: token, 'Content-Type': 'application/json' },
    body: JSON.stringify({ comment_text: text, notify_all: false }),
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) throw new Error(`comentario de ClickUp → ${res.status}`);
}

function withDescription(task: PrepareTask, description: string): PrepareTask {
  return { ...task, markdown_description: description, text_content: description, description };
}

/**
 * Asigna, pone BACKLOG si falta el estado y, si el brief no está estructurado, lo reescribe.
 * Si ClickUp no guarda la descripción, el trabajo igual recibe el brief estructurado.
 */
export async function prepareClickupTask(task: PrepareTask, taskId: string, options: PrepareOptions): Promise<PrepareResult> {
  const notes: PrepareNote[] = [];
  const env = options.env || process.env;
  const doFetch = options.doFetch || fetch;
  const token = options.token;
  let next = task;
  const patch: Record<string, unknown> = {};

  if (!taskHasAssignee(task)) {
    try {
      const id = token ? await resolveAssigneeId(token, env, doFetch) : null;
      const numeric = id ? Number(id) : NaN;
      if (id && Number.isSafeInteger(numeric)) {
        patch.assignees = { add: [numeric], rem: [] };
        notes.push({ message: `Tarea asignada a ${DEFAULT_ASSIGNEE_NAME} (${id}).` });
      } else {
        notes.push({ message: `La tarea no tiene asignado y no se encontró a ${DEFAULT_ASSIGNEE_NAME}.`, level: 'error' });
      }
    } catch (err) {
      notes.push({ message: `No se pudo asignar la tarea: ${(err as Error).message}`, level: 'error' });
    }
  }

  if (!taskStatusName(task)) {
    const listId = options.listId || (task.list?.id != null ? String(task.list.id) : '');
    const status = token ? await backlogName(listId, token, doFetch) : BACKLOG_STATUS;
    patch.status = status;
    notes.push({ message: `Estado pasado a ${status}: la tarea no tenía estado.` });
  }

  const original = taskText(task);
  const source = [task.name?.trim(), original].filter((part) => part).join('\n\n');
  let structured: string | null = null;
  if (source && !briefIsStructured(original)) {
    try {
      const raw = options.complete
        ? await options.complete(briefPrompt(task.name || '', original))
        : await completeBrief(briefPrompt(task.name || '', original), env, doFetch);
      const accepted = acceptBriefReply(raw);
      if (!accepted) {
        notes.push({ message: 'El modelo no devolvió un brief con los campos obligatorios: se deja la descripción como estaba.', level: 'error' });
      } else {
        structured = composeBriefDescription(accepted, original);
        next = withDescription(task, structured);
        patch.markdown_description = structured;
        patch.description = structured;
      }
    } catch (err) {
      notes.push({ message: `No se pudo reescribir el brief: ${(err as Error).message}`, level: 'error' });
    }
  }

  let wrote = false;
  if (token && Object.keys(patch).length) {
    try {
      await putTask(taskId, token, patch, doFetch);
      wrote = true;
    } catch (err) {
      notes.push({ message: `No se pudo guardar la tarea en ClickUp: ${(err as Error).message}`, level: 'error' });
    }
  }

  if (structured && wrote && options.comment && token) {
    try {
      await postNote(taskId, token, BRIEF_COMMENT, doFetch);
      notes.push({ message: 'Comentario de brief reestructurado publicado en ClickUp.' });
    } catch (err) {
      notes.push({ message: `No se pudo comentar que el brief se reestructuró: ${(err as Error).message}`, level: 'error' });
    }
  } else if (structured && wrote) {
    notes.push({ message: 'Brief reestructurado y guardado en la tarea.' });
  } else if (structured) {
    notes.push({ message: 'Brief reestructurado para el trabajo. ClickUp no guardó la descripción.', level: 'error' });
  }

  return { task: next, notes };
}
