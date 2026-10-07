// Mide el logo y su celda en móvil (375) — ¿se corta o no?
const { chromium } = require('/Users/javifeebbo/Desktop/newsletter-system-reutilizable/sistema-final/node_modules/playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 375, height: 900 } });
  await page.goto('file:///Users/javifeebbo/Desktop/newsletter-system-reutilizable/sistema-final/viajes-el-corte-ingles-japon-newsletter-PREVIEW.html', { waitUntil: 'networkidle' });
  const m = await page.evaluate(() => {
    const img = document.images[0];
    const r = img.getBoundingClientRect();
    const cell = img.parentElement.getBoundingClientRect();
    const table = img.parentElement.parentElement.parentElement.getBoundingClientRect();
    return { img: { x: Math.round(r.x), right: Math.round(r.right), w: Math.round(r.width) }, cell: { x: Math.round(cell.x), right: Math.round(cell.right) }, table: { x: Math.round(table.x), right: Math.round(table.right) }, viewport: window.innerWidth };
  });
  console.log(JSON.stringify(m, null, 2));
  console.log('Logo cortado?', m.img.right > m.viewport ? 'SI' : 'NO — margen derecho libre: ' + (m.viewport - m.img.right) + 'px');
  await page.screenshot({ path: '/Users/javifeebbo/Desktop/newsletter-system-reutilizable/sistema-final/brands/el-corte-ingles/design-input/veci-japon/logo-375.png' });
  await browser.close();
})();
