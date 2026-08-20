const { chromium } = require('/Users/javifeebbo/Desktop/newsletter-system-reutilizable/sistema-final/node_modules/playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await page.goto('file:///Users/javifeebbo/Desktop/newsletter-system-reutilizable/sistema-final/accion-contra-el-hambre-newsletter.html', { waitUntil: 'networkidle' });
  const res = await page.evaluate(() => {
    const tables = Array.from(document.querySelectorAll('table.wrap')).map(t => {
      const r = t.getBoundingClientRect();
      return { w: Math.round(r.width), x: Math.round(r.x) };
    });
    return {
      scrollWidth: document.documentElement.scrollWidth,
      viewport: window.innerWidth,
      tables
    };
  });
  console.log(JSON.stringify(res, null, 1));
  const imgs = await page.evaluate(() => Array.from(document.images).map(i => ({ alt: i.alt, w: i.naturalWidth, ok: i.naturalWidth > 0 })));
  console.log('IMAGENES:', JSON.stringify(imgs, null, 1));
  await browser.close();
})().catch(e => { console.error(e.message); process.exit(1); });
