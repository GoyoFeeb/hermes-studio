// Verifica que TODAS las secciones midan 600px centradas (norma del usuario).
// Uso: node verify-600px.js
const { chromium } = require('/Users/javifeebbo/Desktop/newsletter-system-reutilizable/sistema-final/node_modules/playwright');

const FILE = 'file:///Users/javifeebbo/Downloads/Solo%20te%20pedimos%20un%20minuto.html';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 2200 } });
  await page.goto(FILE, { waitUntil: 'networkidle' });

  const results = await page.evaluate(() => {
    const out = [];
    // Tablas de nivel superior (las que cuelgan directamente del body)
    const tables = Array.from(document.body.querySelectorAll('body > table'));
    tables.forEach((t, i) => {
      const r = t.getBoundingClientRect();
      out.push({ n: i, width: Math.round(r.width), x: Math.round(r.x), bg: t.getAttribute('bgcolor') });
    });
    return {
      scrollWidth: document.documentElement.scrollWidth,
      viewport: window.innerWidth,
      tables: out
    };
  });

  console.log('Viewport:', results.viewport, '| scrollWidth:', results.scrollWidth, '| overflow:', results.scrollWidth > results.viewport ? 'SI (bug)' : 'NO');
  let ok = true;
  for (const t of results.tables) {
    const pass = t.width === 600 && t.x === 340;
    if (!pass) ok = false;
    console.log(`sección ${t.n}: width=${t.width}px x=${t.x}px bg=${t.bg} -> ${pass ? 'OK 600px centrada' : 'FALLO'}`);
  }
  console.log('RESULTADO:', ok && results.scrollWidth === 1280 ? 'TODAS LAS SECCIONES MIDEN 600px CENTRADAS' : 'HAY FALLOS');
  await page.screenshot({ path: '/Users/javifeebbo/Desktop/newsletter-system-reutilizable/sistema-final/brands/tarifalo/design-input/preview-luzgas-2026-08-1280.png', fullPage: true });
  console.log('Screenshot 1280 guardado');
  await browser.close();
})();
