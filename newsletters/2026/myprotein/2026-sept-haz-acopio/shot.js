const { chromium } = require('playwright-core');
const path = require('path');

(async () => {
  const file = path.join(__dirname, 'myprotein-haz-acopio.html');
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await page.goto('file://' + file);
  await page.waitForTimeout(600);
  await page.screenshot({ path: path.join(__dirname, 'preview-1280.png'), fullPage: true });
  // Verificación NORMA: anchos de sección
  const widths = await page.evaluate(() => {
    const tabs = Array.from(document.querySelectorAll('table[width="600"]'));
    return tabs.map(t => {
      const r = t.getBoundingClientRect();
      return Math.round(r.width) + 'x' + Math.round(r.height) + ' @left=' + Math.round(r.left);
    });
  });
  console.log('section widths:', widths.join(' | '));
  await browser.close();
  console.log('shot ok');
})();