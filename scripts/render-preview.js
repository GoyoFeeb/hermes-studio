#!/usr/bin/env node
/**
 * render-preview.js — Genera capturas PNG de preview visual desde un HTML local.
 *
 * Uso:
 *   node scripts/render-preview.js --file ruta/archivo.html --out-prefix ruta/basename
 *
 * Ejemplo:
 *   node scripts/render-preview.js \
 *     --file newsletters/.../final-premium-v2.html \
 *     --out-prefix newsletters/.../baseline/base
 *
 * Genera:
 *   {prefix}-320.png
 *   {prefix}-375.png
 *   {prefix}-600.png
 *   {prefix}-600-dark.png   (colorScheme: dark, misma pieza)
 *
 * Dependencias: playwright (npm install playwright)
 */

import('playwright').then(async ({ chromium }) => {
  const args = process.argv.slice(2);
  const getArg = (flag) => {
    const i = args.indexOf(flag);
    return i !== -1 && i + 1 < args.length ? args[i + 1] : null;
  };

  const filePath = getArg('--file');
  const outPrefix = getArg('--out-prefix');

  if (!filePath || !outPrefix) {
    console.error('\n  ❌ Uso: node scripts/render-preview.js --file <html> --out-prefix <path>\n');
    process.exit(1);
  }

  const fs = await import('fs');
  const path = await import('path');

  if (!fs.existsSync(filePath)) {
    console.error(`\n  ❌ Archivo no encontrado: ${filePath}\n`);
    process.exit(1);
  }

  // Asegurar directorio de salida
  const outDir = path.dirname(outPrefix);
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  const fileUrl = 'file://' + path.resolve(filePath);
  const sizes = [
    { width: 320,  name: '320' },
    { width: 375,  name: '375' },
    { width: 600,  name: '600' },
  ];

  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  let exitCode = 0;

  try {
    // ── Capturas claro ──────────────────────────────────
    for (const size of sizes) {
      const ctx = await browser.newContext({
        viewport: { width: size.width, height: 3000 },
        deviceScaleFactor: 1,
      });
      const page = await ctx.newPage();
      try {
        await page.goto(fileUrl, { waitUntil: 'networkidle', timeout: 20000 });
        await page.waitForTimeout(600);
        const bodyH = await page.evaluate(() => document.body.scrollHeight);
        await page.setViewportSize({ width: size.width, height: Math.max(bodyH, 2000) });
        const outPath = `${outPrefix}-${size.name}.png`;
        await page.screenshot({ path: outPath, fullPage: true });
        const kb = (await fs.promises.stat(outPath)).size / 1024;
        console.log(`  ✅ ${size.width}px → ${path.basename(outPath)}  (${kb.toFixed(1)} KB)`);
      } catch (err) {
        console.error(`  ❌ ${size.width}px falló: ${err.message}`);
        exitCode = 1;
      }
      await ctx.close();
    }

    // ── Captura dark ────────────────────────────────────
    {
      const ctx = await browser.newContext({
        viewport: { width: 600, height: 3000 },
        deviceScaleFactor: 1,
        colorScheme: 'dark',
      });
      const page = await ctx.newPage();
      try {
        await page.goto(fileUrl, { waitUntil: 'networkidle', timeout: 20000 });
        await page.waitForTimeout(600);
        const bodyH = await page.evaluate(() => document.body.scrollHeight);
        await page.setViewportSize({ width: 600, height: Math.max(bodyH, 2000) });
        const outPath = `${outPrefix}-600-dark.png`;
        await page.screenshot({ path: outPath, fullPage: true });
        const kb = (await fs.promises.stat(outPath)).size / 1024;
        console.log(`  ✅ 600px DARK → ${path.basename(outPath)}  (${kb.toFixed(1)} KB)`);
      } catch (err) {
        console.error(`  ❌ dark falló: ${err.message}`);
        exitCode = 1;
      }
      await ctx.close();
    }

  } finally {
    await browser.close();
  }

  if (exitCode === 0) {
    console.log('\n  ✅ Todas las capturas generadas.\n');
  }
  process.exit(exitCode);

}).catch(err => {
  console.error(`\n  ❌ Error fatal: ${err.message}\n`);
  process.exit(1);
});