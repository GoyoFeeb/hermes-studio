/**
 * brandPage.ts — identidad de Feebbo Digital para las páginas que ve gente de fuera (2026-10-05).
 *
 * El enlace del cliente (share.ts, /p/<token>) y el informe técnico (report.ts, /r/<token>) tenían un estilo
 * propio — fondo gris claro y fuente del sistema, sin logo — mientras Studio ya seguía feebbodigital.com. Era lo
 * único que veía el cliente final y lo menos Feebbo. Aquí, lo común a las dos: colores de la web (azul noche,
 * rosa #FB73FF, lila), Work Sans y Barlow, cabecera con el logo y pie negro como .footer-feebbo.
 *
 * El logo va dentro de la página (SVG en línea, sin pedir nada a otro sitio): el informe no puede cargar imágenes.
 * Las fuentes vienen de Google Fonts: cada CSP lo permite (style-src fonts.googleapis.com, font-src
 * fonts.gstatic.com); sin ellas la página cae a Arial y sigue siendo legible.
 */
import * as fs from 'fs';
import * as path from 'path';
import { STUDIO_DIR } from './paths';

export const BRAND_FONTS =
  '<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>' +
  '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Barlow:wght@500;600;700;800&family=Work+Sans:wght@400;500;600;700&display=swap">';

let logoSource: string | null = null;
/** El logo oficial (blanco) de studio/web, con sus id renombrados para que no choquen si se usa dos veces. */
export function feebboLogo(suffix: string): string {
  if (logoSource === null) {
    try {
      logoSource = fs.readFileSync(path.join(STUDIO_DIR, 'web', 'feebbo-logo.svg'), 'utf8');
    } catch {
      logoSource = '';
    }
  }
  if (!logoSource) return '<span class="brand-word">FEEBBO</span>';
  return logoSource
    .replace(/<\?xml[^>]*>/, '')
    .replace(/\bid="([^"]+)"/g, `id="$1-${suffix}"`)
    .replace(/url\(#([^)]+)\)/g, `url(#$1-${suffix})`)
    .replace('<svg ', '<svg role="img" aria-label="Feebbo Digital" ');
}

/** Variables, tipografía, cabecera y pie compartidos. Cada página añade lo suyo detrás. */
export const BRAND_BASE_STYLE = `
  :root { color-scheme: dark;
    --bg: #050c2a; --panel: #0e1545; --field: #0a1030; --text: #edf3fc; --muted: #8991ae; --line: #262b59; --line-strong: #3a3f78;
    --pink: #fb73ff; --pink-soft: #cf95d0; --lilac: #c6bbff; --button: #262b59; --btn-hover: #5867f1; --on-pink: #081136;
    --card-base: #0a1258; --card-grad: linear-gradient(156deg, rgba(16, 40, 125, 0.8) 11%, rgba(16, 40, 125, 0.2) 76%);
    --ok: #4fd1a5; --ok-bg: rgba(79, 209, 165, 0.15); --warn: #ffcc00; --warn-bg: rgba(255, 204, 0, 0.15);
    --err: #ff7a8a; --err-bg: rgba(255, 122, 138, 0.15); }
  * { box-sizing: border-box; }
  [hidden] { display: none !important; }
  body { margin: 0; min-height: 100vh; display: flex; flex-direction: column; background: var(--bg); color: var(--text);
    font: 15px/1.55 'Work Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; -webkit-font-smoothing: antialiased; }
  body::before { content: ''; position: fixed; inset: 0; z-index: -1; pointer-events: none;
    background: radial-gradient(900px 500px at 85% -10%, rgba(16, 40, 125, 0.55), transparent 70%), radial-gradient(700px 420px at -10% 30%, rgba(178, 85, 195, 0.12), transparent 70%); }
  a { color: var(--pink); }
  .brand-bar { width: 100%; max-width: 1180px; margin: 0 auto; padding: 24px 16px 0; display: flex; align-items: center; justify-content: space-between; gap: 16px; }
  .brand-bar svg { display: block; width: 99px; height: auto; }
  .brand-word { font-family: 'Barlow', sans-serif; font-weight: 800; letter-spacing: 2px; }
  .eyebrow { margin: 0; font-family: 'Barlow', sans-serif; font-size: 14px; font-weight: 600; letter-spacing: 5px; text-transform: uppercase; color: var(--pink); }
  .brand-foot { margin-top: auto; padding: 40px 16px; background: #000; color: #fff; }
  .brand-foot-inner { max-width: 1180px; margin: 0 auto; display: flex; flex-wrap: wrap; justify-content: space-between; gap: 16px 40px; }
  .brand-foot p { margin: 0; font-size: 12px; line-height: 20px; color: var(--muted); }
  .brand-foot b { display: block; font-size: 14px; color: #fff; }
  .brand-foot a { color: #fff; text-decoration: none; }
  .brand-foot a:hover { color: var(--pink); }
  @media (max-width: 600px) { .eyebrow { letter-spacing: 3px; } }
`;

export function brandHeader(label: string): string {
  return `<div class="brand-bar">${feebboLogo('top')}<p class="eyebrow">${label}</p></div>`;
}

/** Pie negro: copyright a la izquierda y, a la derecha, lo que diga la página (caducidad del enlace). */
export function brandFooter(note: string): string {
  return `<footer class="brand-foot"><div class="brand-foot-inner">
    <p>© Feebbo Digital<br>${note}</p>
    <p><b>Correo</b><a href="mailto:info@feebbodigital.com">info@feebbodigital.com</a></p>
  </div></footer>`;
}
