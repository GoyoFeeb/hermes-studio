// Check horizontal overflow at mobile widths.
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
  for (const w of [320, 375, 600]) {
    const page = await browser.newPage({ viewport: { width: w, height: 800 } });
    await page.goto('file://' + path.resolve('asics-gel-kayano-33-newsletter.html'), { waitUntil: 'networkidle' });
    const r = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      viewport: window.innerWidth,
      wrapWidths: Array.from(document.querySelectorAll('table.wrap')).map((t) => Math.round(t.getBoundingClientRect().width))
    }));
    console.log(JSON.stringify(r));
    await page.close();
  }
  await browser.close();
})().catch((e) => { console.error(e); process.exit(1); });
