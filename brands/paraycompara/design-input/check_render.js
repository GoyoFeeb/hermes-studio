// Render + deterministic layout verification for the standalone newsletter.
// Run: node check_render.js <html-path>
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const htmlPath = process.argv[2];
if (!htmlPath) { console.error('Uso: node check_render.js <html>'); process.exit(1); }
const fileUrl = 'file://' + path.resolve(htmlPath);
const DIR = __dirname;

(async () => {
  const browser = await chromium.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();

  async function check(viewport, name) {
    await page.setViewportSize({ width: viewport, height: 2400 });
    await page.goto(fileUrl, { waitUntil: 'networkidle' });
    const res = await page.evaluate(() => {
      const doc = document.documentElement;
      const container = document.querySelector('table.container');
      const rect = container ? container.getBoundingClientRect() : null;
      const sceneTables = Array.from(document.querySelectorAll('table[width="600"]'));
      const widths = sceneTables.map(t => Math.round(t.getBoundingClientRect().width));
      return {
        scrollWidth: doc.scrollWidth,
        viewport: window.innerWidth,
        container: rect ? { x: Math.round(rect.x), width: Math.round(rect.width) } : null,
        sceneWidths: widths
      };
    });
    const ok = res.scrollWidth === viewport;
    console.log(`[${name}] viewport=${res.viewport} scrollWidth=${res.scrollWidth} -> ${ok ? 'OK sin overflow' : '*** OVERFLOW ***'}`);
    console.log(`[${name}] container x=${res.container ? res.container.x : 'N/A'} width=${res.container ? res.container.width : 'N/A'}`);
    console.log(`[${name}] tablas internas width=600: ${JSON.stringify(res.sceneWidths)}`);
    await page.screenshot({ path: path.join(DIR, `vuelta-preview-${name}.png`), fullPage: true });
    return ok;
  }

  const r1280 = await check(1280, '1280');
  const r375 = await check(375, '375');
  const r320 = await check(320, '320');

  // Desktop: verify the 600px column is centered (x ≈ (1280-600)/2 = 340)
  await page.setViewportSize({ width: 1280, height: 2400 });
  await page.goto(fileUrl, { waitUntil: 'networkidle' });
  const centered = await page.evaluate(() => {
    const c = document.querySelector('table.container').getBoundingClientRect();
    return { x: Math.round(c.x), left: Math.round(c.left), right: Math.round(c.right) };
  });
  console.log('[1280] columna centrada:', JSON.stringify(centered), '(esperado x≈340, right≈940)');

  await browser.close();
  const pass = r1280 && r375 && r320;
  console.log(pass ? '== LAYOUT OK ==' : '== LAYOUT CON OVERFLOW ==');
  process.exit(pass ? 0 : 1);
})().catch(e => { console.error(e); process.exit(1); });
