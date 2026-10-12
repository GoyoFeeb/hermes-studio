/**
 * brandCapture.ts — versión no interactiva de la fase 02 (Brand Visual Analyst): en vez de un
 * agente conduciendo un navegador turno a turno (el ideal descrito en
 * agents/02-brand-visual-analyst.md), el backend usa Playwright para capturar screenshots +
 * getComputedStyle de un puñado fijo de selectores clave, y le pasa esos datos ya extraídos a
 * Claude para que los interprete. Es menos exhaustivo que un análisis interactivo, pero es lo
 * único fiable para un servicio desatendido con varios compañeros enviando trabajos — se
 * documenta como limitación conocida en studio/README.md.
 *
 * Extiende el patrón de scripts/capture-brand-site.ts (mismas rutas de salida
 * brands/{marca}/design-input/site-{1280,390}.png) añadiendo la extracción de estilos y un
 * intento best-effort de descargar el logo del header.
 */
import { chromium } from 'playwright';
import * as fs from 'fs';
import * as path from 'path';
import { ROOT } from './paths';
import { writeMirrored } from './mirror';

export interface BrandCaptureResult {
  screenshots: Array<{ viewport: number; relPath: string; base64: string; mediaType: string }>;
  computedStyles: Record<string, unknown>;
  capturedLogoRelPath?: string;
}

const SELECTOR_PROBES: Record<string, string> = {
  body: 'body',
  h1: 'h1',
  h2: 'h2',
  paragraph: 'p',
  primaryButton: 'button, a[class*="btn" i], a[class*="cta" i], a[class*="button" i]',
  header: 'header, [class*="header" i], nav',
  link: 'a',
};

export async function captureBrandSite(brandSlug: string, url: string): Promise<BrandCaptureResult> {
  const outDir = path.join(ROOT, 'brands', brandSlug, 'design-input');
  fs.mkdirSync(outDir, { recursive: true });

  const browser = await chromium.launch();
  try {
    const screenshots: BrandCaptureResult['screenshots'] = [];
    let computedStyles: Record<string, unknown> = {};
    let capturedLogoRelPath: string | undefined;

    for (const viewportWidth of [1280, 390]) {
      const context = await browser.newContext({ viewport: { width: viewportWidth, height: 900 } });
      const page = await context.newPage();
      await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });

      if (viewportWidth === 1280) {
        computedStyles = await page.evaluate((selectors) => {
          function styleOf(sel: string) {
            const el = document.querySelector(sel);
            if (!el) return null;
            const cs = getComputedStyle(el);
            return {
              color: cs.color,
              backgroundColor: cs.backgroundColor,
              fontFamily: cs.fontFamily,
              fontSize: cs.fontSize,
              fontWeight: cs.fontWeight,
              lineHeight: cs.lineHeight,
              borderRadius: cs.borderRadius,
            };
          }
          const out: Record<string, unknown> = {};
          for (const [key, sel] of Object.entries(selectors)) out[key] = styleOf(sel);
          return out;
        }, SELECTOR_PROBES);

        const logoSrc = await page.evaluate(() => {
          const img = document.querySelector(
            'header img, [class*="logo" i] img, nav img'
          ) as HTMLImageElement | null;
          return img ? img.src : null;
        });

        if (logoSrc && /^https?:\/\//.test(logoSrc)) {
          try {
            const resp = await page.request.get(logoSrc);
            if (resp.ok()) {
              const ext = logoSrc.split('.').pop()?.split('?')[0]?.slice(0, 4) || 'png';
              const relPath = path.join('brands', brandSlug, 'design-input', `logo-captured.${ext}`);
              writeMirrored(path.join(ROOT, relPath), await resp.body());
              capturedLogoRelPath = relPath;
            }
          } catch {
            // Best-effort: sin logo capturado, la fase 06 decide cómo adaptarse (ver dataPhase.ts).
          }
        }
      }

      const buf = await page.screenshot({ fullPage: false });
      const relPath = path.join('brands', brandSlug, 'design-input', `site-${viewportWidth}.png`);
      writeMirrored(path.join(ROOT, relPath), buf);
      screenshots.push({
        viewport: viewportWidth,
        relPath,
        base64: buf.toString('base64'),
        mediaType: 'image/png',
      });

      await context.close();
    }

    return { screenshots, computedStyles, capturedLogoRelPath };
  } finally {
    await browser.close();
  }
}
