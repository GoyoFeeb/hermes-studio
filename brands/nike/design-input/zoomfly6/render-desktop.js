// Render de la newsletter a ancho de escritorio (1280px) con medición de layout.
const { chromium } = require('/Users/javifeebbo/Desktop/newsletter-system-reutilizable/sistema-final/node_modules/playwright');
const path = require('path');

const ROOT = '/Users/javifeebbo/Desktop/newsletter-system-reutilizable/sistema-final';
const htmlPath = 'file://' + path.join(ROOT, 'nike-zoomfly6-newsletter.html');
const outPath = path.join(ROOT, 'brands/nike/design-input/zoomfly6/preview-desktop-1280.png');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 1200 } });
  await page.goto(htmlPath, { waitUntil: 'networkidle' });
  await page.waitForTimeout(800);

  // Medición determinista de la escena 3 (dos columnas)
  const m = await page.evaluate(() => {
    const imgs = [...document.querySelectorAll('img')];
    const editionImg = imgs.find(i => (i.getAttribute('alt') || '').includes('gráfico geométrico'));
    const dark = [...document.querySelectorAll('table')].find(t => (t.getAttribute('bgcolor') || '') === '#111111');
    const darkRect = dark ? dark.getBoundingClientRect() : null;
    const imgRect = editionImg ? editionImg.getBoundingClientRect() : null;
    // El texto de la escena 3: el <h2> dentro de la tabla oscura
    const h2 = [...document.querySelectorAll('h2')].find(h => h.textContent.includes('Eldoret'));
    const h2Rect = h2 ? h2.getBoundingClientRect() : null;
    return {
      dark: darkRect ? { x: darkRect.x, y: darkRect.y, w: darkRect.width, h: darkRect.height } : null,
      img: imgRect ? { x: imgRect.x, y: imgRect.y, w: imgRect.width, h: imgRect.height } : null,
      h2: h2Rect ? { x: h2Rect.x, y: h2Rect.y, w: h2Rect.width, h: h2Rect.height } : null,
      bodyScrollW: document.body.scrollWidth,
      docScrollW: document.documentElement.scrollWidth,
    };
  });
  console.log('MEDICIÓN DESKTOP 1280:');
  console.log(JSON.stringify(m, null, 2));
  const sideBySide = m.img && m.h2 && Math.abs(m.img.y - m.h2.y) < m.img.h * 0.6;
  console.log('¿Imagen y texto lado a lado?', sideBySide ? 'SÍ' : 'NO');

  await page.screenshot({ path: outPath, fullPage: true });
  console.log('Captura desktop guardada:', outPath);
  await browser.close();
})();
