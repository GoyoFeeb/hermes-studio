// Test: ¿pasa Akamai con Referer en page.request? ¿Y en navegador headed?
const { chromium } = require('/Users/javifeebbo/Desktop/newsletter-system-reutilizable/sistema-final/node_modules/playwright');
const URL = 'https://cdn.viajeselcorteingles.es/wsimgresize/resize/crop/1200/600/cdn.viajeselcorteingles.es/contenidos/fotos/CIUDADES_990_350/7864.jpg?jpegQuality=95';

(async () => {
  // 1) page.request con Referer (contexto nuevo, sin navegar antes)
  const browser = await chromium.launch({ headless: false });
  const ctx = await browser.newContext({ locale: 'es-ES' });
  const page = await ctx.newPage();
  const r1 = await page.request.get(URL, { headers: { Referer: 'https://www.viajeselcorteingles.es/' } });
  console.log('page.request + Referer (sin sesión):', r1.status(), (await r1.body()).length, 'bytes');

  // 2) Navegar primero a la web de VECI (establece sesión/cookies) y luego descargar
  try { await page.goto('https://www.viajeselcorteingles.es/', { waitUntil: 'domcontentloaded', timeout: 60000 }); } catch (e) { console.log('goto home err:', e.message.slice(0, 100)); }
  await page.waitForTimeout(4000);
  const r2 = await page.request.get(URL, { headers: { Referer: 'https://www.viajeselcorteingles.es/' } });
  console.log('page.request + Referer (con sesión):', r2.status(), (await r2.body()).length, 'bytes');

  // 3) La imagen dentro de la página real (headed): cargar la newsletter local y mirar naturalWidth
  await page.goto('file:///Users/javifeebbo/Desktop/newsletter-system-reutilizable/sistema-final/viajes-el-corte-ingles-japon-newsletter.html');
  await page.waitForTimeout(8000);
  const st = await page.evaluate(() => Array.from(document.images).map(im => ({ alt: im.alt.slice(0, 22), nw: im.naturalWidth })));
  console.log('Newsletter en navegador headed:', JSON.stringify(st));
  await browser.close();
})();
