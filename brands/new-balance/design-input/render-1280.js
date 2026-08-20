// Render newsletter at 1280px viewport to verify centered 600px column + body bg
const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const fileUrl = 'file://' + '/Users/javifeebbo/Desktop/newsletter-system-reutilizable/sistema-final/new-balance-740n-stoneware.html';
  await page.goto(fileUrl, { waitUntil: 'networkidle' });
  await page.waitForTimeout(800);
  const full = await page.evaluate(() => document.documentElement.scrollHeight);
  await page.setViewportSize({ width: 1280, height: Math.min(full, 9000) });
  await page.waitForTimeout(400);
  await page.screenshot({ path: '/Users/javifeebbo/Desktop/newsletter-system-reutilizable/sistema-final/brands/new-balance/design-input/preview-740n-1280.png', fullPage: true });
  // Verify column centering: measure the main 600px table bounding box vs viewport
  const box = await page.evaluate(() => {
    const t = document.querySelector('table.wrap') || document.querySelector('table[width="600"]');
    const r = t.getBoundingClientRect();
    return { left: r.left, width: r.width, scrollWidth: document.documentElement.scrollWidth, vw: window.innerWidth };
  });
  console.log('column:', JSON.stringify(box));
  const bodyBg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
  console.log('body bg:', bodyBg);
  await browser.close();
})();
