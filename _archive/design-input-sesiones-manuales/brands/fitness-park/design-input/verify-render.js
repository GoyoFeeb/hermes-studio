// Verify 600px centering (x=340) at 1280 + generate full-page screenshot
const { chromium } = require('/Users/javifeebbo/Desktop/newsletter-system-reutilizable/sistema-final/node_modules/playwright');
const path = require('path');

(async () => {
  const file = 'file:///Users/javifeebbo/Desktop/newsletter-system-reutilizable/sistema-final/fitness-park-newsletter.html';
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await page.goto(file, { waitUntil: 'networkidle' });

  const tables = await page.evaluate(() => {
    return [...document.querySelectorAll('table.wrap')].map((t, i) => {
      const r = t.getBoundingClientRect();
      return { i: i + 1, x: Math.round(r.x), w: Math.round(r.width) };
    });
  });
  console.log('scenes:', JSON.stringify(tables));

  const imgs = await page.evaluate(() => {
    return [...document.querySelectorAll('img')].map(img => ({
      alt: (img.alt || '').slice(0, 40),
      loaded: img.naturalWidth > 0,
      w: img.width, h: img.height
    }));
  });
  console.log('imgs:', JSON.stringify(imgs, null, 1));

  await page.screenshot({ path: '/Users/javifeebbo/Desktop/newsletter-system-reutilizable/sistema-final/fitness-park-preview-1280.png', fullPage: true });

  // mobile 375
  await page.setViewportSize({ width: 375, height: 800 });
  await page.reload({ waitUntil: 'networkidle' });
  const sw375 = await page.evaluate(() => document.documentElement.scrollWidth);
  console.log('375 scrollWidth:', sw375);
  await page.screenshot({ path: '/Users/javifeebbo/Desktop/newsletter-system-reutilizable/sistema-final/fitness-park-preview-375.png', fullPage: true });

  await browser.close();
  console.log('DONE');
})();
