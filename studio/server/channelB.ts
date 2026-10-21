/**
 * channelB.ts — versión B de una newsletter, la que adjunta un sistema externo (Creas IT) al mismo
 * trabajo y al mismo brief que Hermes (versión A).
 *
 * No crea un trabajo hijo: vive en el job (`channelB`) y en archivos junto a la pieza de Hermes
 * (`newsletter-b.html`), para que ?job=<id> enseñe las dos. Las imágenes incrustadas se publican
 * en /assets como las de Hermes. El mismo revisor del servidor (`qualityCheck.ts`) corre sobre el
 * HTML ya publicado, para comparar A y B con los mismos criterios. Las medidas que exigen Chromium
 * (renderChecks) siguen en el worker: este servicio no abre navegador.
 *
 * Autenticación: STUDIO_SERVICE_TOKEN (Bearer), distinto de WORKER_TOKEN. Sin la variable, las
 * rutas de escritura no existen. Ver studio/CHANNEL-B.md.
 */
import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import { ROOT } from './paths';
import { writeMirrored } from './mirror';
import { appendEvent, updateJob, type Job, type JobChannelB } from './store';
import { sanitizeImproveRecord, type JobImprove } from '../worker/improveLoop';
import { rememberJob } from './learnings';
import { publishEmbeddedImages, standaloneOutputDir } from './standalone';
import { findPreheader, runQualityCheck, type Fetcher } from '../worker/qualityCheck';

const MAX_HTML_BYTES = 12 * 1024 * 1024;
const MAX_TEXT_CHARS = 200_000;
const MAX_REVIEW_JSON = 32_000;
export const CHANNEL_B_HTML = 'newsletter-b.html';
export const CHANNEL_B_TEXT = 'newsletter-b.txt';

export class ChannelBInputError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ChannelBInputError';
  }
}

export interface ChannelBAttachment {
  html: string;
  text?: string;
  subject?: string;
  preheader?: string;
  author?: string;
  channel: string;
  review?: unknown;
}

/** Bearer de longitud constante. Secreto vacío o cabecera distinta: false. */
export function bearerMatches(header: string | undefined, secret: string): boolean {
  if (!secret || !header?.startsWith('Bearer ')) return false;
  const token = header.slice('Bearer '.length);
  const a = Buffer.from(token);
  const b = Buffer.from(secret);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

function clip(value: unknown, max: number): string | undefined {
  if (typeof value !== 'string') return undefined;
  const clean = value.replace(/\s+/g, ' ').trim();
  return clean ? clean.slice(0, max) : undefined;
}

function sanitizeReview(raw: unknown, depth = 0): unknown {
  if (raw == null || depth > 6) return null;
  if (typeof raw === 'string') return raw.slice(0, 2000);
  if (typeof raw === 'number') return Number.isFinite(raw) ? raw : null;
  if (typeof raw === 'boolean') return raw;
  if (Array.isArray(raw)) return raw.slice(0, 40).map((item) => sanitizeReview(item, depth + 1));
  if (typeof raw === 'object') {
    const out: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(raw as Record<string, unknown>).slice(0, 40)) {
      if (key === '__proto__' || key === 'constructor' || key === 'prototype') continue;
      if (!/^[\w .:-]{1,80}$/.test(key)) continue;
      out[key] = sanitizeReview(value, depth + 1);
    }
    return out;
  }
  return null;
}

/** Valida el JSON del canal externo antes de tocar el disco. */
export function parseChannelBBody(body: unknown): ChannelBAttachment {
  if (!body || typeof body !== 'object') throw new ChannelBInputError('Falta el cuerpo de la versión B.');
  const raw = body as Record<string, unknown>;
  if (typeof raw.html !== 'string' || !/<html[\s>]/i.test(raw.html)) {
    throw new ChannelBInputError('Falta el HTML de la newsletter (tiene que incluir <html>).');
  }
  if (Buffer.byteLength(raw.html, 'utf8') > MAX_HTML_BYTES) {
    throw new ChannelBInputError('El HTML pesa más de 12 MB.');
  }
  let text: string | undefined;
  if (raw.text != null) {
    if (typeof raw.text !== 'string') throw new ChannelBInputError('El texto plano tiene que ser una cadena.');
    if (raw.text.length > MAX_TEXT_CHARS) throw new ChannelBInputError('El texto plano es demasiado largo.');
    text = raw.text;
  }
  let channel = 'creas-it';
  if (raw.channel != null) {
    if (typeof raw.channel !== 'string' || !/^[a-z0-9][a-z0-9-]{0,39}$/.test(raw.channel)) {
      throw new ChannelBInputError('El canal tiene que ser un identificador corto (letras, números y guiones).');
    }
    channel = raw.channel;
  }
  let review: unknown;
  if (raw.review != null) {
    review = sanitizeReview(raw.review);
    if (JSON.stringify(review).length > MAX_REVIEW_JSON) {
      throw new ChannelBInputError('El informe de revisión externo es demasiado grande.');
    }
  }
  return {
    html: raw.html,
    text,
    subject: clip(raw.subject, 300),
    preheader: clip(raw.preheader, 300),
    author: clip(raw.author, 80),
    channel,
    review,
  };
}

function htmlSubject(html: string): string | null {
  const title = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] || '';
  const subject = title
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&nbsp;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return subject || null;
}

function readRel(rel: string | undefined): string | null {
  if (!rel || rel.split(/[\\/]+/).some((seg) => seg === '..' || seg.startsWith('.'))) return null;
  try {
    return fs.readFileSync(path.join(ROOT, rel), 'utf8');
  } catch {
    return null;
  }
}

export function readChannelBHtml(job: Job): string | null {
  return readRel(job.channelB?.resultRelPath);
}

export function readChannelBText(job: Job): string | null {
  return readRel(job.channelB?.textRelPath);
}

/** Reservada al pedirla. Ya no vuelve a la cola: un intento que no pudo ni crear la carpeta
 *  (EACCES en /app) se repetía en cada arranque cuando la reserva vencía. */
export const CHANNEL_B_IMPROVE_CLAIM_MS = 25 * 60 * 1000;

/** La B tiene errores de QC, no se cerró una pasada y nadie la ha reservado todavía. */
export function channelBImproveDue(
  job: { status: string; channelB?: Pick<JobChannelB, 'quality' | 'improve' | 'improveClaimedAt'> | null },
  _now = Date.now()
): boolean {
  const b = job.channelB;
  if (!b?.quality || b.quality.errors < 1) return false;
  if (b.improve?.closed) return false;
  if (job.status === 'cancelled' || job.status === 'failed') return false;
  const claimed = b.improveClaimedAt ? Date.parse(b.improveClaimedAt) : NaN;
  if (Number.isFinite(claimed)) return false;
  return true;
}

export function claimChannelBImprove(job: Job, now = Date.now()): Job {
  if (!job.channelB) return job;
  return updateJob(job.id, { channelB: { ...job.channelB, improveClaimedAt: new Date(now).toISOString() } });
}

/**
 * Guarda el HTML mejorado de la B y el registro de pasadas. El QC se vuelve a correr aquí, sobre
 * el archivo ya escrito, para que el panel no dependa del informe que manda el worker.
 */
export async function applyChannelBImprove(
  job: Job,
  html: string,
  improve: unknown,
  opts: { fetcher?: Fetcher } = {}
): Promise<Job> {
  if (!job.channelB) throw new ChannelBInputError('Este trabajo no tiene versión B.');
  if (typeof html !== 'string' || !/<html[\s>]/i.test(html)) throw new ChannelBInputError('Falta el HTML de la versión mejorada.');
  if (Buffer.byteLength(html, 'utf8') > MAX_HTML_BYTES) throw new ChannelBInputError('El HTML pesa más de 12 MB.');
  const record = sanitizeImproveRecord(improve);
  if (!record) throw new ChannelBInputError('El registro de mejoras no es válido.');
  const published = publishEmbeddedImages(html, job);
  const quality = await runQualityCheck(published.html, { fetcher: opts.fetcher });
  const outAbs = path.join(ROOT, path.dirname(job.channelB.resultRelPath));
  writeMirrored(path.join(outAbs, CHANNEL_B_HTML), published.html, 'utf8');
  const { improveClaimedAt: _claimed, ...rest } = job.channelB;
  const channelB: JobChannelB = {
    ...rest,
    bytes: Buffer.byteLength(published.html, 'utf8'),
    quality,
    improve: { ...record, closed: true },
  };
  appendEvent(job.id, {
    phase: 'creas',
    level: quality.errors ? 'error' : 'success',
    message: `Mejora de la versión B: ${record.passes.length} pasada(s), ${quality.errors} error(es) de calidad.`,
  });
  const saved = updateJob(job.id, { channelB });
  try {
    rememberJob({
      jobId: job.id,
      clientSlug: job.input.clientSlug,
      channel: 'b',
      at: new Date().toISOString(),
      improve: saved.channelB?.improve,
    });
  } catch (err) {
    console.error(`[learnings] ${(err as Error).message}`);
  }
  return saved;
}

/**
 * Publica la versión B en el trabajo. Sustituye una B anterior si la había; no toca el HTML de
 * Hermes ni su estado. El peso y la revisión son los del HTML final (imágenes ya en /assets).
 */
export async function attachChannelB(job: Job, raw: unknown, opts: { fetcher?: Fetcher } = {}): Promise<Job> {
  const input = parseChannelBBody(raw);
  const outRel = standaloneOutputDir(job);
  const outAbs = path.join(ROOT, outRel);
  fs.mkdirSync(outAbs, { recursive: true });

  const published = publishEmbeddedImages(input.html, job);
  const quality = await runQualityCheck(published.html, { fetcher: opts.fetcher });
  const htmlRel = path.join(outRel, CHANNEL_B_HTML);
  writeMirrored(path.join(outAbs, CHANNEL_B_HTML), published.html, 'utf8');

  let textRel: string | undefined;
  if (input.text != null) {
    textRel = path.join(outRel, CHANNEL_B_TEXT);
    writeMirrored(path.join(outAbs, CHANNEL_B_TEXT), input.text.endsWith('\n') ? input.text : `${input.text}\n`, 'utf8');
  }

  if (input.review != null) {
    writeMirrored(path.join(outAbs, 'revision-b.json'), JSON.stringify(input.review, null, 2) + '\n', 'utf8');
  }

  const subject = input.subject ?? htmlSubject(published.html);
  const preheader = input.preheader ?? findPreheader(published.html);
  const channelB: JobChannelB = {
    status: 'ready',
    attachedAt: new Date().toISOString(),
    channel: input.channel,
    ...(input.author ? { author: input.author } : {}),
    subject,
    preheader,
    hasText: input.text != null,
    bytes: Buffer.byteLength(published.html, 'utf8'),
    resultRelPath: htmlRel,
    ...(textRel ? { textRelPath: textRel } : {}),
    quality,
    ...(input.review != null ? { externalReview: input.review } : {}),
  };
  const who = input.author || 'Creas IT';
  const kb = Math.max(1, Math.round(channelB.bytes / 1024));
  appendEvent(job.id, {
    phase: 'creas',
    level: quality.errors ? 'error' : 'success',
    message: `${who} ha adjuntado su versión (${kb} KB, ${quality.errors} error(es), ${quality.warnings} aviso(s)).`,
  });
  return updateJob(job.id, { channelB });
}
