#!/usr/bin/env npx tsx
/**
 * preview-html.ts — Genera una captura PNG de preview visual del HTML exportado.
 *
 * Uso:
 *   npx tsx scripts/preview-html.ts --campaign newsletters/{year}/{client}/{campaign}
 *   npx tsx scripts/preview-html.ts --campaign /ruta/absoluta --force --width 600 --height 2000
 *
 * Dependencias requeridas:
 *   - playwright
 *   - navegador Chromium (playwright install chromium)
 *
 * Instalación:
 *   npm install playwright
 *   npx playwright install chromium
 */

import * as fs from 'fs';
import * as path from 'path';
import { parseArgs, resolveCampaignPath } from './lib/cli';

// ── Configuración ──────────────────────────────────────────────────────────

const ROOT = path.resolve(import.meta.dirname, '..');

// ── Verificar dependencias ─────────────────────────────────────────────────

function checkPlaywright(): boolean {
  try {
    require.resolve('playwright', { paths: [ROOT] });
    return true;
  } catch {
    console.error('\n  ❌ Falta dependencia playwright.');
    console.error('\n     Instala playwright y el navegador Chromium antes de generar preview:\n');
    console.error('     npm install playwright');
    console.error('     npx playwright install chromium\n');
    return false;
  }
}

// ── Generar preview ────────────────────────────────────────────────────────

async function generatePreview(
  campaignDir: string,
  width: number,
  height: number,
  force: boolean
): Promise<void> {
  let htmlPath = path.join(campaignDir, '09-exports', 'final.html');
  const destDir = path.join(campaignDir, '09-exports');
  const pngPath = path.join(destDir, 'final-preview.png');

  // Comprobar que existe final.html
  // Preferir final-preview.html (con rutas absolutas) sobre final.html
  const previewHtmlPath = htmlPath.replace('final.html', 'final-preview.html');
  if (fs.existsSync(previewHtmlPath)) {
    htmlPath = previewHtmlPath;
    console.log(`   Usando preview local: final-preview.html`);
  } else if (!fs.existsSync(htmlPath)) {
    console.error(`\n  ❌ No se encuentra 09-exports/final.html en ${campaignDir}`);
    console.error('     Ejecuta primero: npm run export-html -- --campaign <ruta>\n');
    process.exit(1);
  }

  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
  }

  // No sobrescribir sin --force
  if (fs.existsSync(pngPath) && !force) {
    console.error(`\n  ❌ Ya existe final-preview.png en ${destDir}.`);
    console.error('     Usa --force para sobrescribir.\n');
    process.exit(1);
  }

  const { chromium } = require('playwright');

  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const context = await browser.newContext({
    viewport: { width, height },
    deviceScaleFactor: 1,
  });

  const page = await context.newPage();

  try {
    // Cargar el HTML local como file://
    const fileUrl = `file://${htmlPath}`;
    await page.goto(fileUrl, { waitUntil: 'networkidle' });

    // Capturar página completa (fullPage) o viewport según la altura
    const actualHeight = await page.evaluate(() => document.body.scrollHeight);
    const captureHeight = Math.max(actualHeight, height);

    await page.setViewportSize({ width, height: captureHeight });

    await page.screenshot({
      path: pngPath,
      fullPage: true,
    });

    const sizeKb = ((await fs.promises.stat(pngPath)).size / 1024).toFixed(1);
    console.log(`\n  ✅ final-preview.png generado (${sizeKb} KB, ${width}x${captureHeight}px)`);
  } catch (err) {
    console.error(`\n  ❌ Error al generar preview: ${(err as Error).message}\n`);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

// ── Main ───────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  console.log('\n═══════════════════════════════════════════════════');
  console.log('   Hermes Newsletter System — Preview HTML');
  console.log('═══════════════════════════════════════════════════\n');

  const args = parseArgs(["force"]);

  if (!args.campaign) {
    console.error('\n  ❌ Error: falta --campaign\n');
    console.error('  Uso: npx tsx scripts/preview-html.ts --campaign newsletters/{year}/{client}/{campaign} [--force] [--width 600] [--height 2000]\n');
    process.exit(1);
  }

  if (!checkPlaywright()) {
    process.exit(1);
  }

  const campaignDir = resolveCampaignPath(ROOT, args.campaign);
  const force = args.force === 'true';
  const width = parseInt(args.width || '600', 10);
  const height = parseInt(args.height || '2000', 10);

  console.log(`   Campaña:  ${campaignDir}`);
  console.log(`   Viewport:  ${width}x${height}`);
  if (force) console.log('   Modo:     --force (sobrescribir si existe)');

  await generatePreview(campaignDir, width, height, force);

  console.log('\n═══════════════════════════════════════════════════');
  console.log('   ✅ Preview generado.\n');
  process.exit(0);
}

main();
