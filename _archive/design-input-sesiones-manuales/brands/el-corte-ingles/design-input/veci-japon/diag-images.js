// Diagnóstico: ¿por qué las imágenes del CDN no cargan en Playwright?
const { chromium } = require('/Users/javifeebbo/Desktop/newsletter-system-reutilizable/sistema-final/node_modules/playwright');
const URL = 'https://cdn.viajeselcorteingles.es/wsimgresize/resize/crop/1200/600/cdn.viajeselcorteingles.es/contenidos/fotos/CIUDADES_990_350/7864.jpg?jpegQuality=95';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const resp = await page.request.get(URL);
  console.log('page.request.get status:', resp.status(), '| content-type:', resp.headers()['content-type'], '| bytes:', (await resp.body()).length);

  await page.goto(URL, { waitUntil: 'domcontentloaded' }).catch(e => console.log('goto err:', e.message.slice(0, 120)));
  await page.waitForTimeout(3000);
  const info = await page.evaluate(() => {
    const im = document.images[0];
    if (!im) return { noImg: true, title: document.title, bodyLen: document.body ? document.body.innerHTML.length : 0 };
    return { naturalWidth: im.naturalWidth, complete: im.complete, currentSrc: (im.currentSrc || '').slice(0, 80), bodyLen: document.body.innerHTML.length };
  });
  console.log('Directo en navegador:', JSON.stringify(info));

  // Ahora la página completa con espera extra
  await page.goto('file:///Users/javifeebbo/Desktop/newsletter-system-reutilizable/sistema-final/viajes-el-corte-ingles-japon-newsletter.html');
  await page.waitForTimeout(6000);
  const st = await page.evaluate(() => Array.from(document.images).map(im => ({ alt: im.alt.slice(0, 20), nw: im.naturalWidth, complete: im.complete })));
  console.log('Newsletter tras 6s:', JSON.stringify(st));
  await browser.close();
})();
