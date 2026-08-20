// Verifica que TODAS las secciones midan 600px centradas (norma del usuario) en la pieza de luz.
// Uso: node verify-600px-luz.js
const { chromium } = require('/Users/javifeebbo/Desktop/newsletter-system-reutilizable/sistema-final/node_modules/playwright');

const FILE = 'file:///Users/javifeebbo/Desktop/newsletter-system-reutilizable/sistema-final/tarifalo-luz-consumo-newsletter.html';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 2400 } });
  await page.goto(FILE, { waitUntil: 'networkidle' });

  const results = await page.evaluate(() => {
    const out = [];
    const tables = Array.from(document.body.querySelectorAll('body > table'));
    tables.forEach((t, i) => {
      const r = t.getBoundingClientRect();
      out.push({ n: i, width: Math.round(r.width), x: Math.round(r.x), bg: t.getAttribute('bgcolor') });
    });
    return {
      scrollWidth: document.documentElement.scrollWidth,
      viewport: window.innerWidth,
      tables: out,
      imgs: Array.from(document.images).map(i => ({ alt: i.alt, natural: i.naturalWidth > 0 }))
    };
  });

  console.log('Viewport:', results.viewport, '| scrollWidth:', results.scrollWidth, '| overflow:', results.scrollWidth > results.viewport ? 'SI (bug)' : 'NO');
  let ok = true;
  for (const t of results.tables) {
    const pass = t.width === 600 && t.x === 340;
    if (!pass) ok = false;
    console.log(`sección ${t.n}: width=${t.width}px x=${t.x}px bg=${t.bg} -> ${pass ? 'OK 600px centrada' : 'FALLO'}`);
  }
  console.log('Imágenes:', results.imgs.map(i => `${i.alt.slice(0, 30)}... natural=${i.natural}`).join(' | '));
  console.log('RESULTADO:', ok && results.scrollWidth === 1280 ? 'TODAS LAS SECCIONES MIDEN 600px CENTRADAS' : 'HAY FALLOS');
  await page.screenshot({ path: '/Users/javifeebbo/Desktop/newsletter-system-reutilizable/sistema-final/brands/tarifalo/design-input/preview-luz-consumo-2026-08-1280.png', fullPage: true });

  // Comprobación móvil 375 (sin overflow horizontal)
  await page.setViewportSize({ width: 375, height: 2400 });
  await page.goto(FILE, { waitUntil: 'networkidle' });
  const mob = await page.evaluate(() => ({ scrollWidth: document.documentElement.scrollWidth, viewport: window.innerWidth }));
  console.log(`Móvil 375: scrollWidth=${mob.scrollWidth} viewport=${mob.viewport} -> ${mob.scrollWidth <= mob.viewport ? 'OK sin overflow' : 'FALLO overflow'}`);
  await page.screenshot({ path: '/Users/javifeebbo/Desktop/newsletter-system-reutilizable/sistema-final/brands/tarifalo/design-input/preview-luz-consumo-2026-08-375.png', fullPage: true });

  await browser.close();
})();
