#!/usr/bin/env npx tsx
/**
 * capture-brand-site.ts — captura la web de una marca para el kit de diseño del hero.
 * Uso: npx tsx scripts/capture-brand-site.ts --brand tarifalo --url https://tarifalo.com/
 * Salida: brands/{brand}/design-input/site-1280.png y site-390.png
 * Requiere red (en el sandbox de sesiones no la hay — correr en un entorno con salida).
 */
import * as path from 'path';
import * as fs from 'fs';
import { chromium } from 'playwright';

const ROOT = path.resolve(import.meta.dirname, '..');
function arg(name: string): string | undefined {
  const i = process.argv.indexOf('--' + name);
  return i >= 0 ? process.argv[i + 1] : undefined;
}
(async () => {
  const brand = arg('brand'); const url = arg('url');
  if (!brand || !url) { console.error('Uso: --brand {slug} --url {https://...}'); process.exit(1); }
  const outDir = path.join(ROOT, 'brands', brand, 'design-input');
  fs.mkdirSync(outDir, { recursive: true });
  const browser = await chromium.launch();
  // Fix (auditoría enterprise 2026-07-28): sin try/finally, un page.goto() fallido (timeout,
  // DNS, web caída) lanzaba antes de llegar a browser.close() y dejaba el proceso de Chromium
  // huérfano en background — sin mensaje contextual, solo el stack trace crudo de Playwright.
  try {
    for (const [name, width] of [['site-1280', 1280], ['site-390', 390]] as const) {
      const ctx = await browser.newContext({ viewport: { width, height: 900 } });
      try {
        const page = await ctx.newPage();
        await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
        await page.screenshot({ path: path.join(outDir, `${name}.png`), fullPage: false });
        console.log(`✅ ${name}.png`);
      } finally {
        await ctx.close();
      }
    }
  } catch (err) {
    console.error(`\n❌ Error capturando ${url}: ${(err as Error).message}\n`);
    process.exitCode = 1;
  } finally {
    await browser.close();
  }
})();
