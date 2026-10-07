// Desktop render at 1280px to verify the centered 600px column + no overflow.
const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const filePath = path.resolve(__dirname, '..', '..', '..', 'asics-gel-kayano-33-newsletter.html');
  const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const errors = [];
  page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
  page.on('console', (m) => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
  await page.goto('file://' + filePath, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);
  await page.screenshot({ path: path.join(__dirname, 'preview-1280.png'), fullPage: true });

  const metrics = await page.evaluate(() => {
    const imgs = Array.from(document.images).map((i) => ({
      src: (i.src || '').slice(0, 90),
      w: i.naturalWidth, h: i.naturalHeight,
      loaded: i.complete && i.naturalWidth > 0
    }));
    const tables = Array.from(document.querySelectorAll('table.wrap')).map((t) => t.getBoundingClientRect().width);
    return {
      scrollWidth: document.documentElement.scrollWidth,
      viewport: window.innerWidth,
      bodyBg: getComputedStyle(document.body).backgroundColor,
      images: imgs,
      wrapWidths: tables
    };
  });
  console.log(JSON.stringify(metrics, null, 2));
  console.log('JS errors:', errors.length ? errors : 'none');
  await browser.close();
})().catch((e) => { console.error(e); process.exit(1); });
