// Capturas full-page del HTML final a 1280 (desktop) y 375 (móvil) para verificación visual.
// Uso: node render-msf.js
const path = require('path');
const { chromium } = require('/Users/javifeebbo/Desktop/newsletter-system-reutilizable/sistema-final/node_modules/playwright');

const file = 'file:///Users/javifeebbo/Desktop/newsletter-system-reutilizable/sistema-final/msf-newsletter.html';
const outDir = '/Users/javifeebbo/Desktop/newsletter-system-reutilizable/sistema-final/brands/msf/design-input';

(async () => {
  const browser = await chromium.launch();
  for (const [name, width, height] of [['preview-1280', 1280, 900], ['preview-375', 375, 812]]) {
    const page = await browser.newPage({ viewport: { width, height } });
    await page.goto(file, { waitUntil: 'networkidle' });
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(outDir, name + '.png'), fullPage: true });
    const metrics = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
    }));
    console.log(name, 'scrollWidth=' + metrics.scrollWidth, 'clientWidth=' + metrics.clientWidth, 'OK=' + (metrics.scrollWidth === metrics.clientWidth));
    await page.close();
  }
  await browser.close();
})();
