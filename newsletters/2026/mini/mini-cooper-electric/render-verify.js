// Deterministic render verification + full-page previews (Playwright chromium)
// - 600px norm at 1280: every top-level table width=600, x=340; scrollWidth==1280
// - image load status (naturalWidth) for every <img>
// - full-page screenshots at 1280 and 375
const { chromium } = require('/Users/javifeebbo/Desktop/newsletter-system-reutilizable/sistema-final/node_modules/playwright');
const path = require('path');

const HTML = '/Users/javifeebbo/Desktop/newsletter-system-reutilizable/sistema-final/newsletters/2026/mini/mini-cooper-electric/mini-cooper-electric-newsletter.html';
const OUT = '/Users/javifeebbo/Desktop/newsletter-system-reutilizable/sistema-final/newsletters/2026/mini/mini-cooper-electric';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  await page.goto('file://' + HTML, { waitUntil: 'networkidle', timeout: 90000 });

  const report = await page.evaluate(() => {
    const out = { scrollWidth: document.documentElement.scrollWidth, viewport: window.innerWidth, tables: [], imgs: [] };
    document.querySelectorAll('table').forEach((t, i) => {
      if (t.getBoundingClientRect().width > 500) { // top-level scene tables only
        const r = t.getBoundingClientRect();
        out.tables.push({ i, w: Math.round(r.width), x: Math.round(r.x), right: Math.round(r.right) });
      }
    });
    document.querySelectorAll('img').forEach((img) => {
      out.imgs.push({ src: img.getAttribute('src').slice(0, 80), naturalWidth: img.naturalWidth, wAttr: img.getAttribute('width') });
    });
    return out;
  });
  console.log('[1280] scrollWidth=' + report.scrollWidth + ' viewport=' + report.viewport + (report.scrollWidth === report.viewport ? ' -> OK' : ' -> OVERFLOW'));
  report.tables.forEach(t => console.log(`table#${t.i} width=${t.w} x=${t.x} right=${t.right} ${(t.w === 600 && t.x === 340) ? '-> OK' : '-> CHECK'}`));
  let imgFail = 0;
  report.imgs.forEach(im => { if (!im.naturalWidth) imgFail++; console.log(`img ${im.naturalWidth ? 'OK ' : 'FAIL'} (${im.wAttr}px) ${im.src}`); });
  console.log(imgFail === 0 ? 'TODAS LAS IMÁGENES CARGAN' : imgFail + ' IMÁGENES NO CARGARON');

  await page.screenshot({ path: path.join(OUT, 'preview-1280.png'), fullPage: true });
  await page.setViewportSize({ width: 375, height: 800 });
  await page.waitForTimeout(400);
  const m = await page.evaluate(() => ({ scrollWidth: document.documentElement.scrollWidth, viewport: window.innerWidth }));
  console.log('[375] scrollWidth=' + m.scrollWidth + ' viewport=' + m.viewport + (m.scrollWidth <= m.viewport ? ' -> OK' : ' -> OVERFLOW'));
  await page.screenshot({ path: path.join(OUT, 'preview-375.png'), fullPage: true });
  console.log('previews saved');
  await browser.close();
})().catch(e => { console.error('ERR', e.message); process.exit(1); });
