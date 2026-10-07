// Verifica sobre HTTP local: imágenes cargan (naturalWidth>0) en el archivo FINAL de Downloads
const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const url = 'http://localhost:8931/adeslas-newsletter-FINAL.html';
  const resp = await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
  console.log('HTTP status:', resp && resp.status());
  await page.waitForTimeout(600);
  const imgs = await page.evaluate(() => {
    return Array.from(document.images).map(img => ({
      src: (img.src || '').slice(0, 40),
      naturalWidth: img.naturalWidth,
      naturalHeight: img.naturalHeight,
      loaded: img.complete && img.naturalWidth > 0
    }));
  });
  console.log('Imágenes (naturalWidth>0 = carga OK):');
  imgs.forEach((i, n) => console.log('  #' + n, 'loaded=' + i.loaded, i.naturalWidth + 'x' + i.naturalHeight, i.src + '...'));
  await page.screenshot({ path: '/Users/javifeebbo/Downloads/adeslas-preview-http.png', fullPage: true });
  console.log('scrollWidth:', await page.evaluate(() => document.documentElement.scrollWidth));
  await browser.close();
})();
