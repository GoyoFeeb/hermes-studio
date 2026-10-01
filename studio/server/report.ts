/**
 * report.ts — informe de la revisión automática por programa de correo, compartible sin contraseña
 * (2026-10-01, como los enlaces de "Email Preflight" de Migma).
 *
 * Para quien monta el envío en la plataforma del cliente o lleva su cuenta: ve qué se ha comprobado en
 * Outlook, Gmail, Apple Mail y móvil sin entrar en Studio. Enlace propio, distinto del de vista previa del
 * cliente (share.ts): se puede pasar el informe sin dar acceso a comentar o aprobar, y al revés.
 *   - token de 24 bytes aleatorios, caduca a los REPORT_DAYS días, se desactiva desde la página del trabajo;
 *   - solo el informe: ni la pieza, ni el brief, ni el registro; página sin scripts y noindex.
 */
import * as crypto from 'crypto';
import { listJobs, updateJob, type Job } from './store';
import { resultMeta } from './standalone';
import { clientMatrix, type ClientRow } from './clientMatrix';

export const REPORT_DAYS = 14;
const TOKEN_RE = /^[A-Za-z0-9_-]{32}$/;

export interface JobReportShare {
  token: string;
  createdAt: string;
  expiresAt: string;
  by?: string;
}

export function isReportActive(r: JobReportShare | undefined, now = Date.now()): r is JobReportShare {
  return !!r && Date.parse(r.expiresAt) > now;
}

export function createReportShare(job: Job, by?: string): JobReportShare {
  if (isReportActive(job.reportShare)) return job.reportShare;
  const now = Date.now();
  const reportShare: JobReportShare = {
    token: crypto.randomBytes(24).toString('base64url'),
    createdAt: new Date(now).toISOString(),
    expiresAt: new Date(now + REPORT_DAYS * 24 * 60 * 60 * 1000).toISOString(),
    by: by || undefined,
  };
  updateJob(job.id, { reportShare });
  return reportShare;
}

export function revokeReportShare(job: Job): void {
  updateJob(job.id, { reportShare: undefined });
}

export function findReportJob(token: string): Job | null {
  if (!TOKEN_RE.test(token)) return null;
  const wanted = Buffer.from(token);
  for (const job of listJobs()) {
    const r = job.reportShare;
    if (!isReportActive(r) || job.status !== 'completed' || !job.quality || job.archivedAt) continue;
    const got = Buffer.from(r.token);
    if (got.length === wanted.length && crypto.timingSafeEqual(got, wanted)) return job;
  }
  return null;
}

/** Página sin scripts: CSP que no deja ejecutar ni cargar nada de fuera. */
export const REPORT_HEADERS: Record<string, string> = {
  'Content-Security-Policy': "default-src 'none'; style-src 'unsafe-inline'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'",
  'X-Robots-Tag': 'noindex, nofollow',
  'Referrer-Policy': 'no-referrer',
  'Cache-Control': 'private, no-store',
  'X-Content-Type-Options': 'nosniff',
};

const esc = (s: string): string =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');

const STATUS_TEXT: Record<ClientRow['status'], string> = { ok: 'Correcto', warning: 'Revisar', error: 'Error', unknown: 'Sin medir' };

const STYLE = `
  :root { color-scheme: light; --bg: #eef0f5; --card: #fff; --text: #0e1545; --muted: #5b6285; --line: #d7dae6;
    --ok: #0f7a52; --ok-bg: #e3f6ee; --warn: #8a5d00; --warn-bg: #fff4d6; --err: #b42318; --err-bg: #fde8e7; }
  * { box-sizing: border-box; }
  body { margin: 0; background: var(--bg); color: var(--text); font: 15px/1.5 -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
  main { max-width: 820px; margin: 0 auto; padding: 24px 16px 40px; }
  h1 { margin: 0; font-size: 21px; }
  h2 { margin: 0; font-size: 16px; }
  .meta { margin: 4px 0 0; color: var(--muted); font-size: 14px; }
  .subject { margin: 16px 0 0; padding: 12px 14px; border: 1px solid var(--line); border-radius: 10px; background: var(--card); font-size: 14px; }
  .subject b { display: block; font-size: 15px; }
  .subject span { color: var(--muted); }
  .note { margin: 16px 0; padding: 10px 14px; border-radius: 10px; background: #e8ebf5; font-size: 13px; color: var(--muted); }
  .rows { display: grid; gap: 12px; }
  .row { padding: 14px 16px; border: 1px solid var(--line); border-radius: 12px; background: var(--card); }
  .row-head { display: flex; flex-wrap: wrap; align-items: baseline; justify-content: space-between; gap: 4px 12px; }
  .scope { color: var(--muted); font-size: 13px; }
  .pill { padding: 2px 10px; border-radius: 999px; font-size: 12px; font-weight: 700; letter-spacing: .5px; text-transform: uppercase; }
  .pill.ok { background: var(--ok-bg); color: var(--ok); }
  .pill.warning { background: var(--warn-bg); color: var(--warn); }
  .pill.error { background: var(--err-bg); color: var(--err); }
  .pill.unknown { background: #eceef4; color: var(--muted); }
  ul { margin: 10px 0 0; padding: 0 0 0 18px; font-size: 14px; }
  li { margin: 4px 0; overflow-wrap: anywhere; }
  li.error { color: var(--err); }
  li.warning { color: var(--warn); }
  li .label { color: var(--muted); }
  .tip { margin: 8px 0 0; font-size: 13px; color: var(--muted); }
  footer { margin-top: 24px; color: var(--muted); font-size: 13px; }
  .gone { max-width: 520px; margin: 15vh auto; padding: 0 16px; text-align: center; }
`;

const fmt = (iso: string): string =>
  new Date(iso).toLocaleString('es-ES', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Madrid' });

export function renderReportPage(job: Job): string | null {
  if (!job.quality || !job.reportShare) return null;
  const rows = clientMatrix(job.quality);
  const meta = resultMeta(job);
  const name = esc(job.input.clientName);
  const q = job.quality;
  const summary = q.errors || q.warnings
    ? [q.errors ? `${q.errors} error${q.errors === 1 ? '' : 'es'}` : '', q.warnings ? `${q.warnings} aviso${q.warnings === 1 ? '' : 's'}` : ''].filter(Boolean).join(' · ')
    : 'Todo correcto';
  const rowHtml = rows
    .map((r) => {
      const items = r.items
        .filter((i) => i.text && i.level !== 'ok')
        .map((i) => `<li class="${i.level}"><span class="label">${esc(i.label)}:</span> ${esc(i.text)}</li>`)
        .join('');
      const okLabels = [...new Set(r.items.filter((i) => i.level === 'ok' && !r.items.some((o) => o.checkId === i.checkId && o.level !== 'ok')).map((i) => i.label))];
      return `<section class="row">
        <div class="row-head"><div><h2>${esc(r.name)}</h2><span class="scope">${esc(r.scope)}</span></div><span class="pill ${r.status}">${STATUS_TEXT[r.status]}</span></div>
        ${items ? `<ul>${items}</ul>` : ''}
        ${okLabels.length && r.id === 'all' ? `<p class="tip">Correcto: ${esc(okLabels.join(', '))}.</p>` : ''}
        ${r.notes.map((n) => `<p class="tip">${esc(n)}</p>`).join('')}
      </section>`;
    })
    .join('');
  return `<!doctype html>
<html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow"><title>${name} · revisión técnica de la newsletter</title><style>${STYLE}</style></head>
<body><main>
  <h1>Revisión técnica · newsletter de ${name}</h1>
  <p class="meta">Revisada el ${esc(fmt(q.checkedAt))} · ${esc(summary)}</p>
  ${meta?.subject ? `<p class="subject"><b>${esc(meta.subject)}</b>${meta.preheader ? `<span>${esc(meta.preheader)}</span>` : ''}</p>` : ''}
  <p class="note">Comprobaciones automáticas del código de la pieza, agrupadas por programa de correo. No son capturas de cada programa.</p>
  <div class="rows">${rowHtml}</div>
  <footer>Informe generado con Hermes Studio. Enlace válido hasta el ${esc(fmt(job.reportShare.expiresAt))}.</footer>
</main></body></html>`;
}

export function renderReportGone(): string {
  return `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow"><title>Informe no disponible</title><style>${STYLE}</style></head>
<body><div class="gone"><h1>Este informe ya no está disponible</h1><p class="meta">Ha caducado o se ha desactivado. Pide un enlace nuevo a quien te lo envió.</p></div></body></html>`;
}
