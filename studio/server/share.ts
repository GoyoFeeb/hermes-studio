/**
 * share.ts — enlace de vista previa para el cliente (2026-10-01).
 *
 * Antes, para enseñar una newsletter a un cliente había que descargarla y mandársela (la web de Studio
 * pide la contraseña del equipo). Ahora cada versión terminada puede tener un enlace de solo lectura,
 * `/p/<token>`, que no pide contraseña:
 *   - el token son 24 bytes aleatorios (192 bits): no se puede adivinar ni recorrer;
 *   - caduca a los SHARE_DAYS días y se puede desactivar antes desde la página del trabajo;
 *   - solo muestra la pieza: ni el registro, ni el brief, ni las demás versiones, ni acciones;
 *   - la pieza se pinta en un marco sin scripts (la escribe un modelo que ha leído webs) y la página
 *     lleva una CSP estricta que el marco hereda; noindex y sin Referer.
 *
 * Revisión del cliente (2026-10-01, como Knak/Migma): en la misma página el cliente puede comentar
 * pinchando en la pieza (misma referencia que "Señalar" de Studio, pick.js) y decir "Aprobar" o "Pedir
 * cambios". Studio lo muestra en la página del trabajo y lo convierte en un "Pedir cambios" a Hermes.
 * El enlace se puede pasar a una versión nueva de la misma newsletter: el cliente conserva la URL.
 */
import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import { getJob, listJobs, updateJob, type Job } from './store';
import { readResultHtml, resultMeta, versionFamily } from './standalone';
import { STUDIO_DIR } from './paths';
import { BRAND_BASE_STYLE, BRAND_FONTS, brandFooter, brandHeader } from './brandPage';
import { readBrandCard } from './brandCards';

export const SHARE_DAYS = 14;
export const SHARE_TOKEN_RE = /^[A-Za-z0-9_-]{32}$/;
/** Las visitas se cuentan como mucho una vez por minuto (recargar no infla el número ni escribe en disco). */
const VIEW_THROTTLE_MS = 60 * 1000;

export interface ShareComment {
  id: string;
  /** Versión sobre la que se escribió (el enlace puede pasar a una versión nueva). */
  jobId: string;
  author: string;
  text: string;
  /** Referencia de lo señalado en la pieza (formato de pick.js) y su ruta desde <body> para volver a marcarlo. */
  ref?: string;
  path?: number[];
  at: string;
  resolvedAt?: string;
  resolvedBy?: string;
}

export interface ShareDecision {
  kind: 'approved' | 'changes';
  jobId: string;
  author: string;
  note?: string;
  at: string;
  /** Atendida por el equipo (2026-10-05): deja de salir en «Te esperan» y en el aviso de la pestaña Cliente.
   *  Antes solo se borraba al pasar el enlace a una versión nueva. */
  resolvedAt?: string;
  resolvedBy?: string;
}

export interface JobShare {
  token: string;
  createdAt: string;
  expiresAt: string;
  by?: string;
  views?: number;
  lastViewedAt?: string;
  comments?: ShareComment[];
  decision?: ShareDecision;
}

export const MAX_COMMENTS = 100;
export class ShareInputError extends Error {}

const cleanLine = (v: unknown, max: number): string =>
  typeof v === 'string' ? v.replace(/[\u0000-\u001f\u007f]+/g, ' ').replace(/\s+/g, ' ').trim().slice(0, max) : '';
const cleanText = (v: unknown, max: number): string =>
  typeof v === 'string' ? v.replace(/\r\n?/g, '\n').replace(/[\u0000-\u0009\u000b-\u001f\u007f]+/g, ' ').trim().slice(0, max) : '';

/** Comentario del cliente: autor y texto obligatorios; lo señalado, opcional y acotado. */
export function addShareComment(job: Job, body: Record<string, unknown>): ShareComment {
  const share = job.share!;
  const author = cleanLine(body.author, 80);
  const text = cleanText(body.text, 2000);
  if (author.length < 2) throw new ShareInputError('Escribe tu nombre para que el equipo sepa quién comenta.');
  if (text.length < 2) throw new ShareInputError('El comentario está vacío.');
  if ((share.comments || []).length >= MAX_COMMENTS) throw new ShareInputError('Esta newsletter ya tiene demasiados comentarios.');
  const ref = cleanLine(body.ref, 300);
  const p = Array.isArray(body.path) && body.path.length <= 80 && body.path.every((n) => Number.isInteger(n) && n >= 0 && n < 10000) ? (body.path as number[]) : undefined;
  const comment: ShareComment = {
    id: crypto.randomBytes(6).toString('base64url'),
    jobId: job.id,
    author,
    text,
    ref: ref.startsWith('[Señalado:') ? ref : undefined,
    path: ref.startsWith('[Señalado:') ? p : undefined,
    at: new Date().toISOString(),
  };
  updateJob(job.id, { share: { ...share, comments: [...(share.comments || []), comment] } });
  return comment;
}

export function setShareDecision(job: Job, body: Record<string, unknown>): ShareDecision {
  const share = job.share!;
  const kind = body.kind === 'approved' ? 'approved' : body.kind === 'changes' ? 'changes' : null;
  if (!kind) throw new ShareInputError('Decisión no válida.');
  const author = cleanLine(body.author, 80);
  if (author.length < 2) throw new ShareInputError('Escribe tu nombre para que el equipo sepa quién decide.');
  const note = cleanText(body.note, 2000) || undefined;
  const open = (share.comments || []).filter((c) => c.jobId === job.id && !c.resolvedAt).length;
  if (kind === 'changes' && !note && !open) throw new ShareInputError('Cuenta qué hay que cambiar: deja un comentario en la pieza o escríbelo aquí.');
  const decision: ShareDecision = { kind, jobId: job.id, author, note, at: new Date().toISOString() };
  updateJob(job.id, { share: { ...share, decision } });
  return decision;
}

export function resolveShareComment(job: Job, commentId: string, resolved: boolean, by?: string): boolean {
  const share = job.share;
  if (!share?.comments?.some((c) => c.id === commentId)) return false;
  const comments = share.comments.map((c) =>
    c.id !== commentId ? c : resolved ? { ...c, resolvedAt: new Date().toISOString(), resolvedBy: by || undefined } : { ...c, resolvedAt: undefined, resolvedBy: undefined }
  );
  updateJob(job.id, { share: { ...share, comments } });
  return true;
}

export function resolveShareDecision(job: Job, resolved: boolean, by?: string): ShareDecision | null {
  const share = job.share;
  const d = share?.decision;
  if (!share || !d || d.jobId !== job.id) return null;
  const decision: ShareDecision = resolved ? { ...d, resolvedAt: new Date().toISOString(), resolvedBy: by || undefined } : { ...d, resolvedAt: undefined, resolvedBy: undefined };
  updateJob(job.id, { share: { ...share, decision } });
  return decision;
}

/** Pasa el enlace del cliente de `from` a `to` (otra versión de la misma newsletter): misma URL, misma
 *  caducidad, comentarios conservados (cada uno dice de qué versión es) y la decisión se borra: es otra pieza. */
export function moveShare(from: Job, to: Job): JobShare {
  const share: JobShare = { ...from.share!, decision: undefined };
  updateJob(from.id, { share: undefined });
  updateJob(to.id, { share });
  return share;
}

export function isShareActive(share: JobShare | undefined, now = Date.now()): share is JobShare {
  return !!share && Date.parse(share.expiresAt) > now;
}

/** Crea el enlace (o devuelve el que ya está activo, para no invalidar uno ya enviado al cliente). */
export function createShare(job: Job, by?: string): JobShare {
  if (isShareActive(job.share)) return job.share;
  const now = Date.now();
  const share: JobShare = {
    token: crypto.randomBytes(24).toString('base64url'),
    createdAt: new Date(now).toISOString(),
    expiresAt: new Date(now + SHARE_DAYS * 24 * 60 * 60 * 1000).toISOString(),
    by: by || undefined,
  };
  updateJob(job.id, { share });
  return share;
}

export function revokeShare(job: Job): void {
  updateJob(job.id, { share: undefined });
}

/** Trabajo terminado con ese enlace activo, o null (caducado, desactivado, archivado o inexistente). */
export function findSharedJob(token: string): Job | null {
  if (!SHARE_TOKEN_RE.test(token)) return null;
  const wanted = Buffer.from(token);
  for (const job of listJobs()) {
    const share = job.share;
    if (!isShareActive(share) || job.status !== 'completed' || job.archivedAt) continue;
    const got = Buffer.from(share.token);
    if (got.length === wanted.length && crypto.timingSafeEqual(got, wanted)) return job;
  }
  return null;
}

export function recordShareView(job: Job): void {
  const share = job.share;
  if (!share) return;
  const last = share.lastViewedAt ? Date.parse(share.lastViewedAt) : 0;
  if (Date.now() - last < VIEW_THROTTLE_MS) return;
  updateJob(job.id, { share: { ...share, views: (share.views || 0) + 1, lastViewedAt: new Date().toISOString() } });
}

const esc = (s: string): string =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');

/** Los enlaces de la pieza se abren en otra pestaña (dentro del marco no llevarían a ningún sitio útil). */
function withBaseTarget(html: string): string {
  const base = '<base target="_blank">';
  return /<head[^>]*>/i.test(html) ? html.replace(/<head[^>]*>/i, (m) => m + base) : base + html;
}

/** Cabeceras de la página pública: la CSP también la hereda el marco `srcdoc` (sin scripts en la pieza).
 *  connect-src 'self': la propia página envía comentarios y la decisión a /p/<token>/… */
export function shareHeaders(nonce: string): Record<string, string> {
  return {
    'Content-Security-Policy': [
      "default-src 'none'",
      `script-src 'nonce-${nonce}'`,
      "style-src 'unsafe-inline' https:",
      "img-src 'self' https: data:",
      'font-src https: data:',
      "frame-src 'self'",
      "connect-src 'self'",
      "base-uri 'self'",
      "form-action 'none'",
      "frame-ancestors 'none'",
    ].join('; '),
    'X-Robots-Tag': 'noindex, nofollow',
    'Referrer-Policy': 'no-referrer',
    'Cache-Control': 'private, no-store',
    'X-Content-Type-Options': 'nosniff',
  };
}

/** pick.js (qué se señala y cómo se describe) es el mismo que usa Studio: se incrusta en la página para no
 *  depender de los archivos de la web, que en Railway están detrás de la contraseña. */
let pickSource: string | null = null;
function pickScript(): string {
  if (pickSource == null) {
    try {
      pickSource = fs.readFileSync(path.join(STUDIO_DIR, 'web', 'pick.js'), 'utf8');
    } catch {
      pickSource = '';
    }
  }
  return pickSource;
}

// Identidad de Feebbo (2026-10-05, ver brandPage.ts): antes, fondo gris claro y fuente del sistema.
const PAGE_STYLE = BRAND_BASE_STYLE + `
  :root { --pick: #fb73ff; }
  button, input, textarea { font: inherit; color: inherit; }
  header { width: 100%; max-width: 1180px; margin: 0 auto; padding: 24px 16px 8px; }
  h1 { margin: 0; font-size: clamp(26px, 4vw, 36px); font-weight: 600; line-height: 1.15; }
  h1 .accent { color: var(--pink); }
  h2 { margin: 0 0 8px; font-family: 'Barlow', sans-serif; font-size: 14px; font-weight: 600; letter-spacing: 5px; text-transform: uppercase; color: var(--pink); }
  .meta { margin: 8px 0 0; max-width: 720px; color: var(--lilac); font-size: 15px; }
  .subject { margin: 16px 0 0; padding: 14px 18px; border-radius: 16px; background: var(--card-grad), var(--card-base); font-size: 14px; max-width: 800px; }
  .subject b { display: block; font-size: 16px; font-weight: 600; }
  .subject span { color: var(--lilac); }
  .bar { display: flex; flex-wrap: wrap; align-items: center; gap: 8px 12px; margin: 20px 0 0; }
  .views { display: flex; gap: 4px; padding: 4px; border: 1px solid var(--line); border-radius: 45px; }
  .views button { border: 0; border-radius: 45px; padding: 6px 16px; background: transparent; color: var(--muted); font-size: 14px; font-weight: 600; cursor: pointer; }
  .views button[aria-pressed="true"] { background: #313a82; color: var(--text); }
  .btn { display: inline-flex; align-items: center; justify-content: center; border: 1px solid transparent; border-radius: 45px; padding: 10px 22px;
    background: var(--button); color: var(--text); font-size: 14px; font-weight: 600; text-decoration: none; cursor: pointer; transition: background .15s, color .15s; }
  .btn:hover { background: var(--btn-hover); color: #fff; }
  .btn-primary { border-color: var(--pink); }
  .btn-primary:hover { background: var(--pink); color: var(--on-pink); }
  .btn[aria-pressed="true"] { background: var(--pink); border-color: var(--pink); color: var(--on-pink); }
  .btn:disabled { opacity: .5; cursor: default; }
  .layout { width: 100%; max-width: 1180px; margin: 0 auto; padding: 16px 16px 48px; display: grid; grid-template-columns: minmax(0, 1fr) 360px; gap: 24px; align-items: start; }
  .stage { margin: 0 auto; width: 100%; max-width: 800px; transition: max-width .2s ease; }
  .stage.is-mobile { max-width: 375px; }
  .stage.is-picking iframe { outline: 3px solid var(--pick); outline-offset: 3px; }
  iframe { display: block; width: 100%; height: 900px; border: 0; border-radius: 12px; background: #fff; box-shadow: 0 10px 28px rgba(0, 0, 0, 0.35); }
  aside { position: sticky; top: 16px; display: grid; gap: 16px; }
  .panel { padding: 20px; border-radius: 22px; background: var(--card-grad), var(--card-base); }
  .panel p { margin: 0 0 8px; }
  .hint { color: var(--muted); font-size: 13px; }
  label { display: block; margin: 12px 0 6px; font-size: 13px; font-weight: 600; }
  input[type=text], textarea { width: 100%; padding: 10px 14px; border: 1px solid var(--line); border-radius: 10px; background: var(--field); font-size: 16px; }
  input[type=text]:focus, textarea:focus { outline: none; border-color: var(--pink); box-shadow: 0 0 0 3px rgba(251, 115, 255, 0.18); }
  textarea { min-height: 96px; resize: vertical; }
  .actions { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 12px; }
  .ref { display: block; margin: 0 0 6px; padding: 6px 10px; border-left: 3px solid var(--pick); background: rgba(251, 115, 255, 0.08); font-size: 13px; }
  .comments { list-style: none; margin: 12px 0 0; padding: 0; display: grid; gap: 10px; }
  .comments li { padding: 12px 14px; border: 1px solid var(--line); border-radius: 12px; background: rgba(5, 12, 42, 0.35); }
  .comments li.is-resolved { opacity: .6; }
  .c-head { display: flex; justify-content: space-between; gap: 8px; font-size: 13px; color: var(--muted); }
  .c-head b { color: var(--text); }
  .c-text { margin: 4px 0 0; white-space: pre-wrap; overflow-wrap: anywhere; }
  .linkbtn { border: 0; padding: 0; background: none; color: var(--pink); font-size: 13px; font-weight: 600; text-decoration: underline; cursor: pointer; }
  .decision { padding: 12px 14px; border-radius: 12px; font-size: 14px; }
  .decision.approved { background: var(--ok-bg); color: var(--ok); }
  .decision.changes { background: var(--warn-bg); color: var(--warn); }
  .error { color: var(--err); font-size: 13px; }
  .older summary { cursor: pointer; font-size: 13px; color: var(--muted); }
  .jump { display: none; }
  .team-title { margin: -4px 0 12px; font-size: 18px; font-weight: 600; color: var(--text); }
  /* Móvil (2026-10-05): «Aprobar o comentar» queda fijo abajo mientras se baja por la pieza; antes, revisión y
     comentarios solo aparecían al final, tras miles de píxeles. Se esconde al llegar a la revisión. */
  @media (max-width: 960px) {
    .jump.is-floating { position: fixed; left: 16px; right: 16px; bottom: 16px; z-index: 20; background: var(--pink); color: var(--on-pink); border-color: var(--pink); box-shadow: 0 10px 28px rgba(0, 0, 0, 0.45); }
    body.has-floating-jump { padding-bottom: 72px; }
  }
  /* Rediseño (2026-10-07): la marca del cliente arriba, la pieza en su marco, chinchetas y la decisión siempre a mano. */
  .client-id { display: flex; align-items: center; gap: 18px; }
  .client-logo { flex: none; display: flex; align-items: center; justify-content: center; width: 120px; height: 68px; padding: 10px 16px; border-radius: 14px; background: #fff; box-shadow: 0 10px 24px rgba(0, 0, 0, 0.3); }
  .client-logo.is-dark { background: #14183f; }
  .client-logo img { display: block; max-width: 100%; max-height: 100%; object-fit: contain; }
  .client-logo.is-initials { width: 68px; color: #14183f; font-family: 'Barlow', sans-serif; font-weight: 800; font-size: 24px; }
  .subject { display: flex; align-items: center; gap: 14px; }
  .subject-dot { flex: none; display: inline-flex; align-items: center; justify-content: center; width: 40px; height: 40px; border-radius: 50%; background: linear-gradient(135deg, var(--pink), #8a3ffc); color: #fff; font-weight: 700; }
  .subject-text { min-width: 0; }
  .stage { padding: 28px; border-radius: 24px; background: radial-gradient(120% 80% at 50% 0%, rgba(251, 115, 255, 0.10), transparent 60%), rgba(5, 12, 42, 0.35); max-width: 860px; }
  .stage.is-mobile { max-width: 451px; } /* 375 de pantalla + 2×10 de marco + 2×28 de aire */
  .device { position: relative; margin: 0 auto; border-radius: 14px; overflow: hidden; background: #fff; box-shadow: 0 24px 60px rgba(0, 0, 0, 0.45); transition: border-radius .25s ease; }
  .device-bar { display: flex; align-items: center; gap: 6px; height: 34px; padding: 0 14px; background: #eef0f7; color: #4f5679; font-size: 12px; }
  .device-bar i { width: 10px; height: 10px; border-radius: 50%; background: #d3d7e6; }
  .device-bar i:nth-child(1) { background: #ff6159; } .device-bar i:nth-child(2) { background: #ffbd2e; } .device-bar i:nth-child(3) { background: #28c941; }
  .device-bar span { flex: 1; min-width: 0; margin-left: 10px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; text-align: center; font-weight: 600; }
  .device iframe { border-radius: 0; box-shadow: none; }
  .stage.is-mobile .device { border: 10px solid #0a0f2a; border-radius: 40px; }
  .stage.is-mobile .device-bar { height: 26px; justify-content: center; background: #0a0f2a; }
  .stage.is-mobile .device-bar i, .stage.is-mobile .device-bar span { display: none; }
  .stage.is-mobile .device-bar::after { content: ''; width: 90px; height: 6px; border-radius: 3px; background: #1d2450; }
  .stage.is-picking .device { outline: 3px solid var(--pick); outline-offset: 3px; }
  .stage.is-picking iframe { outline: 0; }
  .pins { position: absolute; inset: 0; pointer-events: none; }
  .pin { position: absolute; z-index: 2; display: inline-flex; align-items: center; justify-content: center; width: 28px; height: 28px; margin: -6px 0 0 -6px; border: 2px solid #fff; border-radius: 50% 50% 50% 4px; background: var(--pink); color: var(--on-pink); font-size: 13px; font-weight: 800; box-shadow: 0 6px 14px rgba(0, 0, 0, 0.35); cursor: pointer; pointer-events: auto; animation: pin-drop .5s cubic-bezier(.34, 1.6, .64, 1) both; animation-delay: calc(var(--i, 0) * 60ms); transition: transform .15s; }
  .pin:hover { transform: scale(1.15); }
  .pin.is-resolved { background: #8b91b8; }
  @keyframes pin-drop { from { opacity: 0; transform: translateY(-14px) scale(.6); } }
  .c-num { display: inline-flex; align-items: center; justify-content: center; min-width: 20px; height: 20px; margin-right: 6px; padding: 0 5px; border-radius: 10px 10px 10px 3px; background: var(--pink); color: var(--on-pink); font-size: 11px; font-weight: 800; }
  .comments li.is-flash { animation: c-flash 1.6s ease; }
  @keyframes c-flash { 0%, 40% { box-shadow: 0 0 0 3px var(--pink); } 100% { box-shadow: 0 0 0 0 transparent; } }
  .jump, .jump.is-floating { display: none !important; }
  .decide-bar { position: fixed; left: 50%; bottom: 16px; z-index: 30; transform: translateX(-50%); display: flex; align-items: center; gap: 18px; width: min(760px, calc(100vw - 24px)); padding: 12px 12px 12px 22px; border: 1px solid var(--line); border-radius: 999px; background: rgba(8, 14, 48, 0.92); -webkit-backdrop-filter: blur(10px); backdrop-filter: blur(10px); box-shadow: 0 18px 44px rgba(0, 0, 0, 0.5); animation: bar-in .6s cubic-bezier(.22, 1, .36, 1) .3s both; }
  .decide-bar p { display: flex; flex-direction: column; margin: 0 auto 0 0; min-width: 0; font-size: 13px; color: var(--lilac); }
  .decide-bar p b { font-size: 15px; color: var(--text); }
  .decide-actions { display: flex; gap: 8px; flex: none; }
  .btn-approve { background: #2fbf71; color: #062614; border-color: #2fbf71; }
  .btn-approve:hover { background: #3fd585; color: #062614; }
  .decide-bar.is-approved { border-color: rgba(47, 191, 113, 0.6); }
  .decide-bar.is-approved p b { color: #2fbf71; }
  .decide-bar.is-changes { border-color: rgba(244, 165, 36, 0.6); }
  .decide-bar.is-changes p b { color: #f4a524; }
  @keyframes bar-in { from { opacity: 0; transform: translate(-50%, 24px); } }
  body { padding-bottom: 96px; }
  @media (max-width: 600px) {
    /* En un teléfono, sin marco de teléfono (le quitaba ancho a la pieza) y la barra en una línea. */
    .decide-bar { gap: 10px; padding: 8px 8px 8px 16px; bottom: 10px; }
    .decide-bar p span { display: none; }
    .decide-bar p b { font-size: 14px; }
    .decide-actions .btn { padding: 9px 14px; }
    .stage { padding: 0; background: none; }
    .stage.is-mobile .device { border: 0; border-radius: 12px; }
    .stage.is-mobile .device-bar { display: none; }
    .client-logo { width: 88px; height: 52px; }
    body { padding-bottom: 84px; }
  }
  @media (prefers-reduced-motion: reduce) { .pin, .decide-bar, .comments li.is-flash { animation: none; } }
  .gone { max-width: 560px; margin: 15vh auto; padding: 0 16px; text-align: center; }
  .gone .meta { margin-left: auto; margin-right: auto; }
  .sr-only { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
  :focus-visible { outline: 2px solid var(--pink); outline-offset: 2px; }
  @media (max-width: 960px) { .layout { grid-template-columns: minmax(0, 1fr); } aside { position: static; } .jump { display: inline-flex; } }
  @media (prefers-reduced-motion: reduce) { .stage { transition: none; } }
`;

const fmtDate = (iso: string): string =>
  new Date(iso).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Europe/Madrid' });

/** Lo que el cliente ve de la revisión (nada del equipo: ni quién creó el enlace ni las visitas). */
function publicState(job: Job): unknown {
  const share = job.share!;
  return {
    jobId: job.id,
    comments: (share.comments || []).map((c) => ({
      id: c.id,
      current: c.jobId === job.id,
      author: c.author,
      text: c.text,
      ref: c.ref || null,
      path: c.path || null,
      at: c.at,
      resolved: !!c.resolvedAt,
    })),
    decision: share.decision && share.decision.jobId === job.id ? share.decision : null,
  };
}

/** JSON dentro de <script type="application/json">: sin "<" literal no puede cerrar la etiqueta. */
const jsonForScript = (v: unknown): string => JSON.stringify(v).replace(/</g, '\\u003c').replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029');

export function renderSharePage(job: Job, nonce: string): string | null {
  const html = readResultHtml(job);
  if (!html || !job.share) return null;
  const meta = resultMeta(job);
  const name = esc(job.input.clientName);
  // Nombre que el equipo puso a la newsletter (vive en la versión original): el cliente veía solo «Newsletter de
  // Nike» y no sabía cuál de ellas era (2026-10-05).
  const rootId = versionFamily(job)[0]?.id;
  const teamTitle = (rootId && rootId !== job.id ? getJob(rootId)?.title : job.title) || null;
  const subject = meta?.subject
    ? `<p class="subject"><span class="subject-dot" aria-hidden="true">${esc((job.input.clientName || '?').slice(0, 1).toUpperCase())}</span><span class="subject-text"><b>${esc(meta.subject)}</b>${meta.preheader ? `<span>${esc(meta.preheader)}</span>` : ''}</span></p>`
    : '';
  // Logo de la marca (2026-10-07): de su ficha (data URI ya validado al guardarla); sin ficha, sus iniciales.
  const card = job.input.clientSlug ? readBrandCard(job.input.clientSlug)?.card : null;
  const logo =
    card?.logo && /^data:image\/(png|jpeg|webp|svg\+xml);base64,[A-Za-z0-9+/=]+$/.test(card.logo)
      ? `<span class="client-logo${card.logoOnDark ? ' is-dark' : ''}"><img src="${card.logo}" alt="${name}"></span>`
      : `<span class="client-logo is-initials" aria-hidden="true">${esc((job.input.clientName || '?').split(/\s+/).slice(0, 2).map((w) => w[0] || '').join('').toUpperCase())}</span>`;
  return `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>${name} · vista previa de la newsletter</title>
${BRAND_FONTS}
<style>${PAGE_STYLE}</style>
</head>
<body>
${brandHeader('Vista previa')}
<header>
  <div class="client-id">
    ${logo}
    <div>
      <h1>Newsletter de <span class="accent">${name}</span></h1>
      ${teamTitle ? `<p class="team-title">${esc(teamTitle)}</p>` : ''}
    </div>
  </div>
  <p class="meta">Vista previa para revisar. No es un envío: los enlaces de baja y personalización se activan en la plataforma de envío.</p>
  ${subject}
  <div class="bar">
    <div class="views" role="group" aria-label="Ver como">
      <button type="button" data-view="desktop" aria-pressed="true">Escritorio</button>
      <button type="button" data-view="mobile" aria-pressed="false">Móvil</button>
    </div>
    <button type="button" class="btn" id="pick" aria-pressed="false">Comentar en la pieza</button>
    <a class="btn jump" href="#review">Aprobar o comentar ↓</a>
  </div>
</header>
<div class="layout">
  <main>
    <div class="stage" id="stage">
      <!-- Marco de navegador o de móvil (2026-10-07) y las chinchetas de los comentarios encima de la pieza. -->
      <div class="device" id="device">
        <div class="device-bar" aria-hidden="true"><i></i><i></i><i></i><span>${meta?.subject ? esc(meta.subject) : `Newsletter de ${name}`}</span></div>
        <iframe id="frame" title="Newsletter de ${name}" sandbox="allow-same-origin allow-popups allow-popups-to-escape-sandbox" srcdoc="${esc(withBaseTarget(html))}"></iframe>
        <div class="pins" id="pins"></div>
      </div>
    </div>
  </main>
  <aside id="review">
    <section class="panel" aria-labelledby="dec-title">
      <h2 id="dec-title">Tu revisión</h2>
      <div id="decision-box"></div>
      <div class="actions" id="decision-actions">
        <button type="button" class="btn btn-primary" data-decide="approved">Aprobar</button>
        <button type="button" class="btn" data-decide="changes">Pedir cambios</button>
      </div>
      <form id="decision-form" hidden>
        <p id="decision-form-title"></p>
        <label for="decision-note">Nota para el equipo <span class="hint" id="decision-note-hint">(opcional)</span></label>
        <textarea id="decision-note" maxlength="2000"></textarea>
        <label for="decision-author">Tu nombre</label>
        <input type="text" id="decision-author" maxlength="80" autocomplete="name">
        <p class="error" id="decision-error" role="alert" hidden></p>
        <div class="actions">
          <button type="submit" class="btn btn-primary">Enviar</button>
          <button type="button" class="btn" id="decision-cancel">Cancelar</button>
        </div>
      </form>
    </section>
    <section class="panel" aria-labelledby="com-title">
      <h2 id="com-title">Comentarios</h2>
      <p class="hint" id="com-hint">Pulsa «Comentar en la pieza» y toca el texto, la imagen o el botón que quieras comentar. También puedes dejar un comentario general.</p>
      <form id="comment-form">
        <span class="ref" id="comment-ref" hidden></span>
        <label for="comment-text">Comentario</label>
        <textarea id="comment-text" maxlength="2000" placeholder="Qué cambiarías y por qué"></textarea>
        <label for="comment-author">Tu nombre</label>
        <input type="text" id="comment-author" maxlength="80" autocomplete="name">
        <p class="error" id="comment-error" role="alert" hidden></p>
        <div class="actions">
          <button type="submit" class="btn btn-primary">Enviar comentario</button>
          <button type="button" class="btn" id="comment-clear" hidden>Quitar lo señalado</button>
        </div>
      </form>
      <ul class="comments" id="comments" aria-live="polite"></ul>
      <details class="older" id="older" hidden><summary id="older-summary"></summary><ul class="comments" id="older-list"></ul></details>
    </section>
  </aside>
</div>
<!-- Barra fija de decisión (2026-10-07): lo que el cliente tiene que hacer, siempre a mano. -->
<div class="decide-bar" id="decide-bar">
  <p id="decide-text"><b>¿Lista para enviar?</b><span>Apruébala o pide cambios: el equipo lo ve al momento.</span></p>
  <div class="decide-actions" id="decide-actions">
    <button type="button" class="btn btn-approve" data-bar-decide="approved">✓ Aprobar</button>
    <button type="button" class="btn" data-bar-decide="changes">Pedir cambios</button>
  </div>
</div>
${brandFooter(`Enlace válido hasta el ${esc(fmtDate(job.share.expiresAt))}.`)}
<p class="sr-only" id="sr" role="status" aria-live="polite"></p>
<script type="application/json" id="state">${jsonForScript(publicState(job))}</script>
<script nonce="${nonce}">${pickScript()}</script>
<script nonce="${nonce}">
(function () {
  'use strict';
  var jump = document.querySelector('.jump');
  var review = document.getElementById('review');
  var stage = document.getElementById('stage');
  if (!jump || !review || !stage || !('IntersectionObserver' in window)) return;
  var reviewSeen = false;
  var stageSeen = false;
  function sync() {
    var on = stageSeen && !reviewSeen;
    jump.classList.toggle('is-floating', on);
    document.body.classList.toggle('has-floating-jump', on);
  }
  new IntersectionObserver(function (e) { reviewSeen = e[0].isIntersecting; sync(); }).observe(review);
  new IntersectionObserver(function (e) { stageSeen = e[0].isIntersecting || e[0].boundingClientRect.top < 0; sync(); }).observe(stage);
})();
</script>
<script nonce="${nonce}">
(function () {
  'use strict';
  var state = JSON.parse(document.getElementById('state').textContent);
  var base = location.pathname.replace(/\\/$/, '');
  var frame = document.getElementById('frame');
  var stage = document.getElementById('stage');
  var picking = false;
  var picked = null; // { ref, path }
  var $ = function (id) { return document.getElementById(id); };
  var announce = function (t) { $('sr').textContent = t; };

  function remembered() { try { return localStorage.getItem('hermesReviewer') || ''; } catch (e) { return ''; } }
  function remember(n) { try { localStorage.setItem('hermesReviewer', n); } catch (e) { /* sin almacenamiento */ } }
  $('comment-author').value = remembered();
  $('decision-author').value = remembered();

  function doc() { try { return frame.contentDocument; } catch (e) { return null; } }
  function fit() {
    var d = doc();
    if (!d || !d.documentElement) return;
    frame.style.height = '0px';
    frame.style.height = Math.max(400, d.documentElement.scrollHeight) + 'px';
    if (typeof placePins === 'function') placePins();
  }

  // ---- vista
  var viewButtons = document.querySelectorAll('[data-view]');
  function setView(view) {
    stage.classList.toggle('is-mobile', view === 'mobile');
    viewButtons.forEach(function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-view') === view)); });
    setTimeout(fit, 250);
  }
  viewButtons.forEach(function (b) { b.addEventListener('click', function () { setView(b.getAttribute('data-view')); }); });
  if (window.matchMedia('(max-width: 600px)').matches) setView('mobile');
  window.addEventListener('resize', fit);

  // ---- señalar en la pieza (misma lógica que Studio, pick.js)
  var CSS = '[data-hr-hover]{outline:3px solid #e6007e!important;outline-offset:-3px;cursor:crosshair!important}' +
    '[data-hr-picked]{outline:3px dashed #8a3ffc!important;outline-offset:-3px}' +
    '[data-hr-flash]{outline:4px solid #ffb020!important;outline-offset:2px}' +
    'html[data-hr-picking] *{cursor:crosshair!important}';
  function pathOf(el) {
    var p = [];
    while (el && el.parentElement && el.tagName !== 'BODY') { p.unshift([].indexOf.call(el.parentElement.children, el)); el = el.parentElement; }
    return p;
  }
  function byPath(d, p) { var el = d.body; for (var i = 0; i < p.length && el; i++) el = el.children[p[i]]; return el || null; }
  function hasBg(el) { return el.hasAttribute('background') || /background(-image)?\\s*:[^;]*url\\(/i.test(el.getAttribute('style') || ''); }
  function target(start) {
    var chain = [];
    for (var el = start; el && el.nodeType === 1; el = el.parentElement) {
      var tag = el.tagName.toLowerCase();
      chain.push({ el: el, tag: tag, text: tag === 'img' ? '' : el.textContent, isImage: tag === 'img', hasBackground: hasBg(el) });
      if (tag === 'body') break;
    }
    var i = HermesPick.chooseTarget(chain);
    return i >= 0 ? chain[i] : null;
  }
  function describe(d, t) {
    if (t.isImage) { var imgs = [].slice.call(d.querySelectorAll('img')); return HermesPick.describe({ kind: 'image', index: imgs.indexOf(t.el) + 1, total: imgs.length, alt: t.el.getAttribute('alt') || '' }); }
    if (t.tag === 'a' || t.tag === 'button') {
      var style = (t.el.getAttribute('style') || '') + ' ' + ((t.el.parentElement && t.el.parentElement.getAttribute('style')) || '');
      return HermesPick.describe({ kind: 'link', text: t.el.textContent, href: t.el.getAttribute('href') || '', isButton: t.tag === 'button' || /background(-color)?\\s*:|padding\\s*:\\s*[1-9]/i.test(style) });
    }
    if (t.hasBackground && !/^(h[1-6]|p|li|blockquote)$/.test(t.tag)) return HermesPick.describe({ kind: 'background', text: t.el.textContent });
    return HermesPick.describe({ kind: 'text', tag: t.tag, text: t.el.textContent });
  }
  function clearAttr(d, a) { if (d) [].forEach.call(d.querySelectorAll('[' + a + ']'), function (el) { el.removeAttribute(a); }); }
  function setPicking(on) {
    picking = on;
    $('pick').setAttribute('aria-pressed', String(on));
    $('pick').textContent = on ? 'Toca la pieza… (Esc para salir)' : 'Comentar en la pieza';
    stage.classList.toggle('is-picking', on);
    var d = doc();
    if (d) { d.documentElement.toggleAttribute('data-hr-picking', on); if (!on) clearAttr(d, 'data-hr-hover'); }
  }
  function arm() {
    var d = doc();
    if (!d || !d.body) return;
    if (!d.querySelector('style[data-hr]')) { var st = d.createElement('style'); st.setAttribute('data-hr', ''); st.textContent = CSS; (d.head || d.documentElement).appendChild(st); }
    d.addEventListener('mouseover', function (e) {
      if (!picking) return;
      clearAttr(d, 'data-hr-hover');
      var t = target(e.target);
      if (t) t.el.setAttribute('data-hr-hover', '');
    });
    d.addEventListener('click', function (e) {
      if (!picking) return;
      e.preventDefault();
      e.stopPropagation();
      var t = target(e.target);
      if (!t) return;
      clearAttr(d, 'data-hr-picked');
      t.el.setAttribute('data-hr-picked', '');
      picked = { ref: describe(d, t), path: pathOf(t.el) };
      $('comment-ref').textContent = picked.ref;
      $('comment-ref').hidden = false;
      $('comment-clear').hidden = false;
      setPicking(false);
      $('comment-text').focus();
      announce('Señalado. Escribe tu comentario.');
    }, true);
    d.addEventListener('keydown', function (e) { if (e.key === 'Escape' && picking) setPicking(false); });
  }
  frame.addEventListener('load', function () { fit(); arm(); });
  $('pick').addEventListener('click', function () { setPicking(!picking); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && picking) setPicking(false); });
  $('comment-clear').addEventListener('click', function () {
    picked = null;
    clearAttr(doc(), 'data-hr-picked');
    $('comment-ref').hidden = true;
    $('comment-clear').hidden = true;
  });

  function flash(p) {
    var d = doc();
    var el = d && p ? byPath(d, p) : null;
    if (!el) return;
    el.scrollIntoView({ block: 'center' });
    var r = el.getBoundingClientRect();
    var fr = frame.getBoundingClientRect();
    window.scrollTo({ top: window.scrollY + fr.top + r.top - window.innerHeight / 2, behavior: 'smooth' });
    el.setAttribute('data-hr-flash', '');
    setTimeout(function () { el.removeAttribute('data-hr-flash'); }, 2500);
  }

  // ---- pintar
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function when(iso) { return new Date(iso).toLocaleString('es-ES', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }); }
  function item(c, n) {
    return '<li id="c-' + esc(c.id) + '"' + (c.resolved ? ' class="is-resolved"' : '') + '><div class="c-head"><span>' + (n ? '<span class="c-num">' + n + '</span>' : '') + '<b>' + esc(c.author) + '</b> · ' + esc(when(c.at)) + (c.resolved ? ' · resuelto' : '') + '</span>' +
      (c.path && c.current ? '<button type="button" class="linkbtn" data-path="' + esc(JSON.stringify(c.path)) + '">Ver</button>' : '') + '</div>' +
      (c.ref ? '<span class="ref">' + esc(c.ref) + '</span>' : '') + '<p class="c-text">' + esc(c.text) + '</p></li>';
  }
  function render() {
    var cur = state.comments.filter(function (c) { return c.current; });
    var old = state.comments.filter(function (c) { return !c.current; });
    $('comments').innerHTML = cur.map(function (c, i) { return item(c, i + 1); }).join('');
    $('older').hidden = !old.length;
    $('older-summary').textContent = 'Comentarios sobre la versión anterior (' + old.length + ')';
    $('older-list').innerHTML = old.map(function (c) { return item(c, 0); }).join('');
    var d = state.decision;
    $('decision-box').innerHTML = d
      ? '<p class="decision ' + d.kind + '">' + (d.kind === 'approved' ? '✓ Aprobada' : 'Cambios pedidos') + ' por <b>' + esc(d.author) + '</b> el ' + esc(when(d.at)) + (d.note ? '<br>' + esc(d.note) : '') + '</p>'
      : '<p class="hint">Cuando la hayas revisado, apruébala o pide cambios. El equipo lo ve al momento.</p>';
    // Barra fija: la pregunta o, ya decidido, lo que se dijo.
    $('decide-actions').hidden = !!d;
    $('decide-bar').className = 'decide-bar' + (d ? ' is-' + d.kind : '');
    $('decide-text').innerHTML = d
      ? '<b>' + (d.kind === 'approved' ? '✓ Aprobada' : 'Cambios pedidos') + '</b><span>por ' + esc(d.author) + ' el ' + esc(when(d.at)) + '</span>'
      : '<b>¿Lista para enviar?</b><span>Apruébala o pide cambios: el equipo lo ve al momento.</span>';
    placePins();
  }
  // ---- chinchetas: un número sobre lo comentado, el mismo que en la lista (2026-10-07)
  function placePins() {
    var d = doc();
    var box = $('pins');
    if (!d || !d.body || !box) return;
    var cur = state.comments.filter(function (c) { return c.current; });
    var html = '';
    cur.forEach(function (c, i) {
      if (!c.path) return;
      var el = byPath(d, c.path);
      if (!el) return;
      var r = el.getBoundingClientRect();
      // Justo a la izquierda de lo comentado (encima tapaba la primera letra).
      var x = Math.max(8, frame.offsetLeft + r.left - 22);
      var y = frame.offsetTop + r.top + 4;
      html += '<button type="button" class="pin' + (c.resolved ? ' is-resolved' : '') + '" data-pin="' + esc(c.id) + '" style="left:' + x + 'px;top:' + y + 'px;--i:' + i + '" aria-label="Comentario ' + (i + 1) + ': ' + esc(c.text.slice(0, 60)) + '">' + (i + 1) + '</button>';
    });
    box.innerHTML = html;
  }
  document.addEventListener('click', function (e) {
    var pin = e.target.closest && e.target.closest('[data-pin]');
    if (pin) {
      var li = document.getElementById('c-' + pin.getAttribute('data-pin'));
      if (li) {
        li.scrollIntoView({ behavior: 'smooth', block: 'center' });
        li.classList.remove('is-flash');
        void li.offsetWidth;
        li.classList.add('is-flash');
      }
      return;
    }
    var bar = e.target.closest && e.target.closest('[data-bar-decide]');
    if (bar) {
      var btn = document.querySelector('[data-decide="' + bar.getAttribute('data-bar-decide') + '"]');
      if (btn) btn.click();
      $('review').scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('[data-path]');
    if (b) flash(JSON.parse(b.getAttribute('data-path')));
  });
  render();

  async function post(pathname, body) {
    var res = await fetch(base + pathname, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    var data = await res.json().catch(function () { return {}; });
    if (!res.ok) throw new Error(data.error || 'No se ha podido enviar. Inténtalo de nuevo.');
    return data;
  }

  // ---- comentar
  $('comment-form').addEventListener('submit', async function (e) {
    e.preventDefault();
    var err = $('comment-error');
    err.hidden = true;
    var author = $('comment-author').value.trim();
    var btn = e.target.querySelector('button[type=submit]');
    btn.disabled = true;
    try {
      var data = await post('/comments', { author: author, text: $('comment-text').value, ref: picked ? picked.ref : '', path: picked ? picked.path : null });
      remember(author);
      $('decision-author').value = author;
      state.comments.push(data.comment);
      $('comment-text').value = '';
      $('comment-clear').click();
      render();
      announce('Comentario enviado.');
    } catch (ex) {
      err.textContent = ex.message;
      err.hidden = false;
    } finally {
      btn.disabled = false;
    }
  });

  // ---- aprobar o pedir cambios
  var deciding = null;
  document.querySelectorAll('[data-decide]').forEach(function (b) {
    b.addEventListener('click', function () {
      deciding = b.getAttribute('data-decide');
      $('decision-form').hidden = false;
      $('decision-actions').hidden = true;
      $('decision-form-title').textContent = deciding === 'approved' ? 'Vas a aprobar esta newsletter.' : 'Vas a pedir cambios. Los comentarios que hayas dejado ya le llegan al equipo.';
      $('decision-note-hint').textContent = deciding === 'approved' ? '(opcional)' : '(si no has comentado en la pieza)';
      $('decision-note').focus();
    });
  });
  $('decision-cancel').addEventListener('click', function () {
    $('decision-form').hidden = true;
    $('decision-actions').hidden = false;
  });
  $('decision-form').addEventListener('submit', async function (e) {
    e.preventDefault();
    var err = $('decision-error');
    err.hidden = true;
    var author = $('decision-author').value.trim();
    try {
      var data = await post('/decision', { kind: deciding, author: author, note: $('decision-note').value });
      remember(author);
      state.decision = data.decision;
      $('decision-form').hidden = true;
      $('decision-actions').hidden = false;
      $('decision-note').value = '';
      render();
      announce(deciding === 'approved' ? 'Aprobación enviada.' : 'Petición de cambios enviada.');
    } catch (ex) {
      err.textContent = ex.message;
      err.hidden = false;
    }
  });
})();
</script>
</body>
</html>`;
}

export function renderShareGone(): string {
  return `<!doctype html>
<html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow"><title>Enlace no disponible</title>${BRAND_FONTS}<style>${PAGE_STYLE}</style></head>
<body>${brandHeader('Vista previa')}<div class="gone"><h1>Este enlace ya no está disponible</h1>
<p class="meta">Ha caducado o se ha desactivado. Pide un enlace nuevo a quien te lo envió.</p></div>${brandFooter('Hermes Studio')}</body></html>`;
}
