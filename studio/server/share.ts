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
 */
import * as crypto from 'crypto';
import { listJobs, updateJob, type Job } from './store';
import { readResultHtml, resultMeta } from './standalone';

export const SHARE_DAYS = 14;
export const SHARE_TOKEN_RE = /^[A-Za-z0-9_-]{32}$/;
/** Las visitas se cuentan como mucho una vez por minuto (recargar no infla el número ni escribe en disco). */
const VIEW_THROTTLE_MS = 60 * 1000;

export interface JobShare {
  token: string;
  createdAt: string;
  expiresAt: string;
  by?: string;
  views?: number;
  lastViewedAt?: string;
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

/** Cabeceras de la página pública: la CSP también la hereda el marco `srcdoc` (sin scripts en la pieza). */
export function shareHeaders(nonce: string): Record<string, string> {
  return {
    'Content-Security-Policy': [
      "default-src 'none'",
      `script-src 'nonce-${nonce}'`,
      "style-src 'unsafe-inline' https:",
      "img-src 'self' https: data:",
      'font-src https: data:',
      "frame-src 'self'",
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

const PAGE_STYLE = `
  :root { color-scheme: light; --bg: #eef0f5; --text: #0e1545; --muted: #5b6285; --line: #d7dae6; --accent: #050c2a; }
  * { box-sizing: border-box; }
  body { margin: 0; background: var(--bg); color: var(--text); font: 15px/1.5 -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
  header { max-width: 860px; margin: 0 auto; padding: 24px 16px 16px; }
  h1 { margin: 0; font-size: 20px; font-weight: 650; }
  .meta { margin: 4px 0 0; color: var(--muted); font-size: 14px; }
  .subject { margin: 12px 0 0; padding: 12px 14px; border: 1px solid var(--line); border-radius: 10px; background: #fff; font-size: 14px; }
  .subject b { display: block; font-size: 15px; }
  .subject span { color: var(--muted); }
  .views { display: flex; gap: 4px; margin: 16px 0 0; padding: 3px; width: max-content; border: 1px solid var(--line); border-radius: 999px; background: #fff; }
  .views button { border: 0; border-radius: 999px; padding: 6px 14px; background: transparent; color: var(--text); font: inherit; font-size: 14px; cursor: pointer; }
  .views button[aria-pressed="true"] { background: var(--accent); color: #fff; }
  main { padding: 0 16px 40px; }
  .stage { margin: 0 auto; width: 100%; max-width: 800px; transition: max-width .2s ease; }
  .stage.is-mobile { max-width: 375px; }
  iframe { display: block; width: 100%; height: 900px; border: 1px solid var(--line); border-radius: 8px; background: #fff; }
  footer { max-width: 860px; margin: 0 auto; padding: 0 16px 32px; color: var(--muted); font-size: 13px; }
  .gone { max-width: 520px; margin: 15vh auto; padding: 0 16px; text-align: center; }
  @media (prefers-reduced-motion: reduce) { .stage { transition: none; } }
`;

const fmtDate = (iso: string): string =>
  new Date(iso).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Europe/Madrid' });

export function renderSharePage(job: Job, nonce: string): string | null {
  const html = readResultHtml(job);
  if (!html || !job.share) return null;
  const meta = resultMeta(job);
  const name = esc(job.input.clientName);
  const subject = meta?.subject
    ? `<p class="subject"><b>${esc(meta.subject)}</b>${meta.preheader ? `<span>${esc(meta.preheader)}</span>` : ''}</p>`
    : '';
  return `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>${name} · vista previa de la newsletter</title>
<style>${PAGE_STYLE}</style>
</head>
<body>
<header>
  <h1>Newsletter de ${name}</h1>
  <p class="meta">Vista previa para revisar. No es un envío: los enlaces de baja y personalización se activan en la plataforma de envío.</p>
  ${subject}
  <div class="views" role="group" aria-label="Ver como">
    <button type="button" data-view="desktop" aria-pressed="true">Escritorio</button>
    <button type="button" data-view="mobile" aria-pressed="false">Móvil</button>
  </div>
</header>
<main>
  <div class="stage" id="stage">
    <iframe id="frame" title="Newsletter de ${name}" sandbox="allow-same-origin allow-popups allow-popups-to-escape-sandbox" srcdoc="${esc(withBaseTarget(html))}"></iframe>
  </div>
</main>
<footer>Enlace válido hasta el ${esc(fmtDate(job.share.expiresAt))}.</footer>
<script nonce="${nonce}">
(function () {
  var frame = document.getElementById('frame');
  var stage = document.getElementById('stage');
  function fit() {
    try {
      var doc = frame.contentDocument;
      if (!doc || !doc.documentElement) return;
      frame.style.height = '0px';
      frame.style.height = Math.max(400, doc.documentElement.scrollHeight) + 'px';
    } catch (e) { /* sin acceso al marco: se queda la altura por defecto */ }
  }
  frame.addEventListener('load', fit);
  var buttons = document.querySelectorAll('[data-view]');
  function setView(view) {
    stage.classList.toggle('is-mobile', view === 'mobile');
    buttons.forEach(function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-view') === view)); });
    setTimeout(fit, 250);
  }
  buttons.forEach(function (b) { b.addEventListener('click', function () { setView(b.getAttribute('data-view')); }); });
  if (window.matchMedia('(max-width: 600px)').matches) setView('mobile');
  window.addEventListener('resize', fit);
})();
</script>
</body>
</html>`;
}

export function renderShareGone(): string {
  return `<!doctype html>
<html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow"><title>Enlace no disponible</title><style>${PAGE_STYLE}</style></head>
<body><div class="gone"><h1>Este enlace ya no está disponible</h1>
<p class="meta">Ha caducado o se ha desactivado. Pide un enlace nuevo a quien te lo envió.</p></div></body></html>`;
}
