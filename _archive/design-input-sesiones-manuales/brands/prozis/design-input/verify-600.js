const { chromium } = require('playwright');
const path = require('path');

const file = '/Users/javifeebbo/Desktop/newsletter-system-reutilizable/sistema-final/newsletters/2026/prozis/hermes/2026-09-24-n7361m/newsletter.html';

(async () => {
  const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage({ viewport: { width: 1280, height: 2000 } });
  await page.goto('file://' + file, { waitUntil: 'networkidle' });
  await page.waitForTimeout(500);
  const result = await page.evaluate(() => {
    const tables = [...document.querySelectorAll('body > table')];
    const info = tables.map(t => {
      const r = t.getBoundingClientRect();
      return { w: Math.round(r.width), x: Math.round(r.x), right: Math.round(r.right) };
    });
    return {
      scrollWidth: document.documentElement.scrollWidth,
      viewport: window.innerWidth,
      tables: info
    };
  });
  console.log('scrollWidth', result.scrollWidth, 'viewport', result.viewport, 'overflow', result.scrollWidth > result.viewport ? 'YES' : 'no');
  result.tables.forEach((t, i) => console.log(`table ${i}: w=${t.w} x=${t.x} right=${t.right} ${t.w===600 && t.x===340 ? 'OK' : 'CHECK'}`));
  await browser.close();
})();
