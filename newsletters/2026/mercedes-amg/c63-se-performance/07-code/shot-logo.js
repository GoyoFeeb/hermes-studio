const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 600, height: 900 } });
  await page.goto('file://' + process.argv[2], { waitUntil: 'networkidle' });
  const logo = await page.evaluate(() => {
    const img = [...document.querySelectorAll('img')].find(i => i.alt === 'Mercedes-AMG');
    if (!img) return null;
    const r = img.getBoundingClientRect();
    return { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) };
  });
  if (!logo) { console.log('logo no encontrado'); await browser.close(); return; }
  const clip = { x: logo.x - 10, y: logo.y - 10, width: logo.w + 20, height: logo.h + 20 };
  await page.screenshot({ path: process.argv[3], clip });
  console.log('Logo rect:', JSON.stringify(logo), '-> screenshot guardada');
  await browser.close();
})().catch(e => { console.error('ERR', e.message); process.exit(1); });
