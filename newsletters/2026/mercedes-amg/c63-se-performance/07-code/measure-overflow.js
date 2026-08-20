const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 375, height: 800 } });
  await page.goto('file://' + process.argv[2], { waitUntil: 'networkidle' });
  const bad = await page.evaluate(() => {
    const out = [];
    document.querySelectorAll('*').forEach(el => {
      const r = el.getBoundingClientRect();
      if (r.width > 375 + 0.5 && el.tagName !== 'HTML' && el.tagName !== 'BODY') {
        out.push({ tag: el.tagName, cls: el.className, w: Math.round(r.width), left: Math.round(r.left), html: el.outerHTML.slice(0, 120).replace(/\s+/g, ' ') });
      }
    });
    return { scrollWidth: document.documentElement.scrollWidth, els: out.slice(0, 12) };
  });
  console.log(JSON.stringify(bad, null, 1));
  await browser.close();
})().catch(e => { console.error('ERR', e.message); process.exit(1); });
