// Full-page screenshots of the final newsletter at 1280 and 375.
const { chromium } = require('/Users/javifeebbo/Desktop/newsletter-system-reutilizable/sistema-final/node_modules/playwright');
const path = require('path');

(async () => {
  const file = 'file://' + '/Users/javifeebbo/Desktop/newsletter-system-reutilizable/sistema-final/amazon-fiesta-ofertas-prime-newsletter.html';
  const browser = await chromium.launch();
  for (const vp of [{ w: 1280, h: 900 }, { w: 375, h: 800 }]) {
    const page = await browser.newPage({ viewport: { width: vp.w, height: vp.h } });
    await page.goto(file, { waitUntil: 'networkidle' });
    await page.waitForTimeout(600);
    const imgs = await page.$$eval('img', els => els.map(i => ({ src: i.src.slice(0, 40), nw: i.naturalWidth, w: i.width })));
    console.log(vp.w + 'px imgs:', JSON.stringify(imgs));
    await page.screenshot({ path: path.join('/Users/javifeebbo/Desktop/newsletter-system-reutilizable/sistema-final', 'preview-amazon-pbdd-' + vp.w + '.png'), fullPage: true });
    await page.close();
  }
  await browser.close();
  console.log('previews done');
})();
