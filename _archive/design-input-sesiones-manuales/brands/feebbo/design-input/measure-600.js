// measure-600.js — verifica la norma 600px: cada tabla top-level width=600, x=340, right=940 @1280
const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await page.goto('file://' + path.resolve(process.argv[2]), { waitUntil: 'load' });
  const out = await page.evaluate(() => {
    const tables = [...document.querySelectorAll('body > table')];
    return tables.map((t, i) => {
      const r = t.getBoundingClientRect();
      return { i, x: Math.round(r.x), width: Math.round(r.width), right: Math.round(r.right), bg: t.getAttribute('bgcolor') };
    });
  });
  console.log(JSON.stringify(out, null, 1));
  console.log('scrollWidth:', await page.evaluate(() => document.documentElement.scrollWidth));
  await browser.close();
})();
