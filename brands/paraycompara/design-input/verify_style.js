// Ground-truth style verification: getComputedStyle of CTAs + images loaded.
// Run: node verify_style.js <html-path>
const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const browser = await chromium.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1280, height: 2400 });
  await page.goto('file://' + path.resolve(process.argv[2]), { waitUntil: 'networkidle' });
  const res = await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('a.btn')).map(a => {
      const s = getComputedStyle(a);
      return { text: a.textContent.trim(), color: s.color, bg: s.backgroundColor, radius: s.borderRadius, pad: s.padding };
    });
    const imgs = Array.from(document.querySelectorAll('img')).map(i => ({
      src: (i.src || '').slice(0, 60),
      natural: i.naturalWidth + 'x' + i.naturalHeight,
      loaded: i.complete && i.naturalWidth > 0
    }));
    const h1 = document.querySelector('h1');
    const hs = h1 ? getComputedStyle(h1) : null;
    return { btns, imgs, h1Color: hs ? hs.color : null, h1Font: hs ? hs.fontFamily : null };
  });
  console.log(JSON.stringify(res, null, 2));
  await browser.close();
})().catch(e => { console.error(e); process.exit(1); });
