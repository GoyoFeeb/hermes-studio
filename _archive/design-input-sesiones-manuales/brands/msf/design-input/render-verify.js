// Renderiza las copias del HTML final y verifica que las dos imágenes aparecen renderizadas (naturalWidth > 0).
// Uso: node render-verify.js
const path = require('path');
const fs = require('fs');
const { chromium } = require('/Users/javifeebbo/Desktop/newsletter-system-reutilizable/sistema-final/node_modules/playwright');

const downloads = '/Users/javifeebbo/Downloads';

(async () => {
  // 1) Copia nueva con nombre distinto (protocolo anti-caché/pestaña vieja)
  const src = downloads + '/msf-newsletter.html';
  const fresh = downloads + '/msf-newsletter-FINAL.html';
  fs.copyFileSync(src, fresh);
  console.log('Copia nueva creada:', fresh, Math.round(fs.statSync(fresh).size / 1024) + ' KB');

  const browser = await chromium.launch();
  for (const target of [src, fresh]) {
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
    await page.goto('file://' + target, { waitUntil: 'networkidle' });
    await page.waitForTimeout(400);
    const imgs = await page.evaluate(() => [...document.images].map(img => ({
      alt: img.alt.slice(0, 40),
      w: img.naturalWidth,
      h: img.naturalHeight,
      src: img.src.slice(0, 30),
    })));
    console.log('=== ' + target + ' ===');
    imgs.forEach(i => console.log(`  img alt="${i.alt}" natural=${i.w}x${i.h} src=${i.src}... ${i.w > 0 ? 'VISIBLE' : 'ROTA'}`));
    await page.screenshot({ path: downloads + '/verify-' + (target === fresh ? 'final' : 'dl') + '.png', fullPage: true });
    await page.close();
  }
  await browser.close();
})();
