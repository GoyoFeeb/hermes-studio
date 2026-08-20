const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 375, height: 800 } });
  await page.goto('file://' + process.argv[2], { waitUntil: 'networkidle' });
  const data = await page.evaluate(() => {
    const out = [];
    ['Antes del ruido, el impulso', 'Primero se mueve', 'Una batería que aprendió', 'El impulso de la nueva era', 'LA RESPUESTA', 'HERENCIA DE F1', 'El nuevo C 63 S E PERFORMANCE reúne', 'El C 63 deja atrás'].forEach(t => {
      const els = [...document.querySelectorAll('p, h1, h2')].filter(e => (e.innerText || '').includes(t));
      if (!els.length) { out.push({ t, found: false }); return; }
      const el = els[0];
      const r = el.getBoundingClientRect();
      const cs = getComputedStyle(el);
      out.push({ t, found: true, left: Math.round(r.left), right: Math.round(r.right), w: Math.round(r.width), padL: cs.paddingLeft, fontSize: cs.fontSize });
    });
    return out;
  });
  console.log(JSON.stringify(data, null, 1));
  await browser.close();
})().catch(e => { console.error('ERR', e.message); process.exit(1); });
