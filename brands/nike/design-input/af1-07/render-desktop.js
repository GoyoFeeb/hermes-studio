// render-desktop.js — Captura de escritorio (1280px) de la newsletter AF1 '07 + verificación de layout.
const { chromium } = require('/Users/javifeebbo/Desktop/newsletter-system-reutilizable/sistema-final/node_modules/playwright');
const path = require('path');

const ROOT = '/Users/javifeebbo/Desktop/newsletter-system-reutilizable/sistema-final';
const htmlPath = 'file://' + path.join(ROOT, 'nike-air-force-1-07.html');
const outPath = path.join(ROOT, 'brands/nike/design-input/af1-07/preview-desktop-1280.png');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 1200 } });
  await page.goto(htmlPath, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1200);

  const m = await page.evaluate(() => {
    // ¿Columna centrada de 600px? (usuario: nunca full-bleed)
    const scenes = [...document.querySelectorAll('table[width="600"]')];
    const first = scenes[0] ? scenes[0].getBoundingClientRect() : null;
    // ¿Imagen y texto lado a lado en la escena 2?
    const img2 = [...document.querySelectorAll('img')].find(i => (i.getAttribute('alt') || '').includes('empeine'));
    const h2 = [...document.querySelectorAll('h2')].find(h => h.textContent.includes('Nada que rediseñar'));
    const a = img2 ? img2.getBoundingClientRect() : null;
    const b = h2 ? h2.getBoundingClientRect() : null;
    return {
      columna600: first ? { x: Math.round(first.x), w: Math.round(first.width), centered: Math.abs(first.x - (1280 - 600) / 2) < 2 } : null,
      ladoALado: a && b ? Math.abs(a.y - b.y) < a.height * 0.6 : null,
      bodyScrollW: document.body.scrollWidth,
      docScrollW: document.documentElement.scrollWidth,
      imgsCargadas: [...document.querySelectorAll('img')].filter(i => i.complete && i.naturalWidth > 0).length + '/' + document.querySelectorAll('img').length
    };
  });
  console.log('MEDICIÓN DESKTOP 1280:', JSON.stringify(m, null, 2));

  await page.screenshot({ path: outPath, fullPage: true });
  console.log('Captura desktop guardada:', outPath);
  await browser.close();
})();
