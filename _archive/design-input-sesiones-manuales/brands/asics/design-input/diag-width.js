const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await page.goto('file://' + path.resolve('asics-gel-kayano-33-newsletter.html'), { waitUntil: 'networkidle' });
  const info = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('table.wrap')).map((t, i) => {
      const r = t.getBoundingClientRect();
      const bg = t.getAttribute('bgcolor');
      // find the widest child content
      let widest = null;
      t.querySelectorAll('img, td').forEach((el) => {
        const er = el.getBoundingClientRect();
        if (!widest || er.width > widest.width) widest = { tag: el.tagName, w: er.width, cls: el.className, attrs: el.getAttribute('width') };
      });
      return { i, bg, w: r.width, widest };
    });
  });
  console.log(JSON.stringify(info, null, 2));
  await browser.close();
})().catch((e) => { console.error(e); process.exit(1); });
