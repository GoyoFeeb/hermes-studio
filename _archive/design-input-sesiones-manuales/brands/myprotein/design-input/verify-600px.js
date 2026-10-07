const { chromium } = require('playwright');
const path = require('path');

const FILE = '/Users/javifeebbo/Desktop/newsletter-system-reutilizable/sistema-final/myprotein-newsletter.html';
const OUT = '/Users/javifeebbo/Desktop/newsletter-system-reutilizable/sistema-final/brands/myprotein/design-input/preview-myprotein-1280.png';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await page.goto('file://' + FILE, { waitUntil: 'networkidle' });
  const res = await page.evaluate(() => {
    const tables = [...document.querySelectorAll('table.wrap')];
    const rows = tables.map((t, i) => {
      const r = t.getBoundingClientRect();
      return { i: i + 1, w: Math.round(r.width), x: Math.round(r.x), right: Math.round(r.right) };
    });
    const imgs = [...document.querySelectorAll('img')].map((im) => ({ src: im.src.slice(0, 40), nw: im.naturalWidth, alt: im.alt.slice(0, 30) }));
    return {
      scrollW: document.documentElement.scrollWidth,
      tables: rows,
      imgs,
      center: document.querySelector('center') ? document.querySelector('center').getBoundingClientRect().width : null,
    };
  });
  console.log('scrollWidth:', res.scrollW, '(1280 esperado)');
  for (const t of res.tables) console.log(`table ${t.i}: width=${t.w} x=${t.x} right=${t.right}  (esperado w=600 x=340 right=940)`);
  console.log('imgs:', JSON.stringify(res.imgs, null, 0));
  await page.screenshot({ path: OUT, fullPage: true });
  console.log('screenshot:', OUT);
  await browser.close();
})().catch((e) => { console.error(e); process.exit(1); });
