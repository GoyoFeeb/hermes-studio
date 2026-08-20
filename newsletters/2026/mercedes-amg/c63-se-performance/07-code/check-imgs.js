const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 600, height: 900 } });
  await page.goto('file://' + process.argv[2], { waitUntil: 'networkidle' });
  const data = await page.evaluate(() => {
    const imgs = [...document.querySelectorAll('img')];
    return imgs.map(img => ({
      src: (img.src || '').slice(0, 50),
      w: img.naturalWidth, h: img.naturalHeight,
      loaded: img.complete && img.naturalWidth > 0,
      alt: img.alt
    }));
  });
  console.log(JSON.stringify(data, null, 1));
  await browser.close();
})().catch(e => { console.error('ERR', e.message); process.exit(1); });
