// Captura desktop a 1280px + verificación de overflow y centrado de la columna de 600px.
const path = require('path');
const root = '/Users/javifeebbo/Desktop/newsletter-system-reutilizable/sistema-final';

import('playwright').then(async ({ chromium }) => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 2000 }, deviceScaleFactor: 1 });
  await page.goto('file://' + path.join(root, 'zara-studio-newsletter.html'), { waitUntil: 'networkidle' });
  await page.waitForTimeout(1200);

  // 1. Overflow check
  const metrics = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    viewport: window.innerWidth,
    bodyBg: getComputedStyle(document.body).backgroundColor,
    firstWrap: (() => {
      const w = document.querySelector('.wrap');
      if (!w) return null;
      const r = w.getBoundingClientRect();
      return { left: Math.round(r.left), width: Math.round(r.width) };
    })(),
    sideBySide: (() => {
      const img = document.querySelector('.col-i img');
      const h2 = document.querySelector('.col-t h2');
      if (!img || !h2) return null;
      const ri = img.getBoundingClientRect();
      const rh = h2.getBoundingClientRect();
      return { imgX: Math.round(ri.x), imgW: Math.round(ri.width), h2X: Math.round(rh.x), sameRow: Math.abs(ri.y - rh.y) < ri.height * 0.6 };
    })(),
  }));
  console.log('METRICS:', JSON.stringify(metrics, null, 1));

  await page.screenshot({ path: path.join(root, 'brands/zara/design-input/preview-1280.png'), fullPage: true });
  console.log('OK preview-1280.png');
  await browser.close();
}).catch(e => { console.error(e); process.exit(1); });
