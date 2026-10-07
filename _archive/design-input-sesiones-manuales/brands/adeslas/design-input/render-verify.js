// Verifica centrado 600px (x=340) + genera screenshots desktop/mobile
const { chromium } = require('playwright');
const path = require('path');

const htmlPath = '/Users/javifeebbo/Desktop/newsletter-system-reutilizable/sistema-final/adeslas-newsletter.html';
const outDir = '/Users/javifeebbo/Desktop/newsletter-system-reutilizable/sistema-final/brands/adeslas/design-input';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await page.goto('file://' + htmlPath, { waitUntil: 'networkidle' });
  await page.waitForTimeout(800);

  // medir todas las tablas top-level
  const tables = await page.evaluate(() => {
    const out = [];
    document.querySelectorAll('body > center > table').forEach((t, i) => {
      const r = t.getBoundingClientRect();
      out.push({ i, w: r.width, x: r.x, right: r.right });
    });
    return out;
  });
  console.log('TABLAS (esperado w=600, x=340 en 1280):');
  tables.forEach(t => console.log('  #' + t.i, 'w=' + t.w, 'x=' + t.x.toFixed(1), 'right=' + t.right.toFixed(1)));
  const ok = tables.every(t => Math.abs(t.w - 600) < 1 && Math.abs(t.x - 340) < 2);
  console.log('CENTER OK:', ok, '| scrollWidth=', await page.evaluate(() => document.documentElement.scrollWidth));

  await page.screenshot({ path: path.join(outDir, 'preview-1280.png'), fullPage: true });

  // mobile
  await page.setViewportSize({ width: 375, height: 800 });
  await page.waitForTimeout(400);
  await page.screenshot({ path: path.join(outDir, 'preview-375.png'), fullPage: true });

  await browser.close();
  console.log('screenshots guardados');
})();
