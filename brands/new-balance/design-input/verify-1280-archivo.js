// verify-1280-archivo.js — NORMA 600px: en viewport 1280, la columna mide 600 y está
// centrada (x=340, right=940); scrollWidth == 1280; ninguna tabla de escena se desborda.
const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const fileUrl = 'file:///Users/javifeebbo/Desktop/newsletter-system-reutilizable/sistema-final/new-balance-740n-archivo.html';
  await page.goto(fileUrl, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  const res = await page.evaluate(() => {
    const tables = [...document.querySelectorAll('table')]
      .map(t => {
        const r = t.getBoundingClientRect();
        return { w: Math.round(r.width), x: Math.round(r.x), cls: t.className || '', tag: t.outerHTML.slice(0, 90).replace(/\n/g, ' ') };
      })
      .filter(t => t.w >= 550); // solo las tablas de nivel columna
    return {
      scrollWidth: document.documentElement.scrollWidth,
      vw: window.innerWidth,
      tables
    };
  });

  console.log('scrollWidth:', res.scrollWidth, '/ viewport', res.vw, res.scrollWidth === res.vw ? 'OK' : '❌ OVERFLOW');
  res.tables.forEach(t => console.log(`  [${t.cls || '-'}] w=${t.w} x=${t.x}`, t.tag.slice(0, 80)));

  // cuerpo: comprobar que a x=100 y x=1180 (fuera de la columna) el color es el del body
  const px = await page.evaluate(() => {
    const el = document.elementFromPoint(100, 400);
    const el2 = document.elementFromPoint(1180, 400);
    const bg = (e) => e ? getComputedStyle(e).backgroundColor : 'null';
    return { left: bg(el), right: bg(el2) };
  });
  console.log('fuera de columna izq/der:', px.left, px.right);

  const full = await page.evaluate(() => document.documentElement.scrollHeight);
  await page.setViewportSize({ width: 1280, height: Math.min(full, 9000) });
  await page.waitForTimeout(400);
  await page.screenshot({ path: '/Users/javifeebbo/Desktop/newsletter-system-reutilizable/sistema-final/brands/new-balance/design-input/preview-archivo-1280.png', fullPage: true });
  console.log('screenshot 1280 guardado');
  await browser.close();
})().catch(e => { console.error('ERROR', e.message); process.exit(1); });
