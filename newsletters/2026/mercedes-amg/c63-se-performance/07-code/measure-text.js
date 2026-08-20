const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 375, height: 800 } });
  await page.goto('file://' + process.argv[2], { waitUntil: 'networkidle' });
  const data = await page.evaluate(() => {
    const out = [];
    ['Antes del ruido', 'Primero se mueve', 'Una batería', 'El impulso de la nueva', 'LA RESPUESTA', 'HERENCIA DE F1', 'El nuevo C 63'].forEach(t => {
      const el = [...document.querySelectorAll('p, h1, h2, div, td')].find(e => (e.innerText || '').trim().startsWith(t));
      if (!el) { out.push({ t, found: false }); return; }
      const r = el.getBoundingClientRect();
      out.push({ t, found: true, left: Math.round(r.left), right: Math.round(r.right), w: Math.round(r.width), scrollW: document.documentElement.scrollWidth });
    });
    return out;
  });
  console.log(JSON.stringify(data, null, 1));
  await browser.close();
})().catch(e => { console.error('ERR', e.message); process.exit(1); });
