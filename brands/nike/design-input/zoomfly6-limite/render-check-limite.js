#!/usr/bin/env node
// Deterministic render + style verification for standalone newsletter HTML.
// Run: node standalone-render-check.js <final.html>
// Requires: playwright (chromium) in the project where you run it.
//
// What it proves (ground truth — use when a vision model's color/button report
// contradicts the markup; markup + computed style win):
//   1. No horizontal overflow: document.scrollWidth === viewport at 1280/375/320
//   2. Desktop: the 600px container is centered (x≈340, right≈940 at 1280px)
//   3. Every CTA (a.btn) getComputedStyle: color/backgroundColor/borderRadius/padding
//      — confirms single button style and dark-on-orange contrast decisions
//   4. Every <img> loaded (naturalWidth > 0) — catches broken CDN URLs and
//      unembedded base64 logos
//   5. Full-page screenshots saved next to the HTML as <name>-1280.png / -375.png / -320.png
//
// Verified pattern (Para y Compara vuelta al cole, 2026-08): vision claimed the
// orange CTA text was "white"; getComputedStyle showed rgb(42,18,32) (#2A1220) —
// the markup was correct. Also caught a family photo at 1116x800 rendering fine.
const { chromium } = require('playwright');
const path = require('path');

const htmlPath = process.argv[2];
if (!htmlPath) { console.error('Uso: node standalone-render-check.js <html>'); process.exit(1); }
const fileUrl = 'file://' + path.resolve(htmlPath);
const outBase = path.join(path.dirname(path.resolve(htmlPath)), path.basename(htmlPath, path.extname(htmlPath)));

(async () => {
  const browser = await chromium.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  let pass = true;

  async function check(viewport, name) {
    await page.setViewportSize({ width: viewport, height: 2400 });
    await page.goto(fileUrl, { waitUntil: 'networkidle' });
    const res = await page.evaluate(() => {
      const doc = document.documentElement;
      const c = document.querySelector('table.container');
      const rect = c ? c.getBoundingClientRect() : null;
      const scenes = Array.from(document.querySelectorAll('table[width="600"]'))
        .map(t => Math.round(t.getBoundingClientRect().width));
      return {
        scrollWidth: doc.scrollWidth,
        viewport: window.innerWidth,
        container: rect ? { x: Math.round(rect.x), width: Math.round(rect.width) } : null,
        scenes
      };
    });
    const ok = res.scrollWidth === viewport;
    pass = pass && ok;
    console.log(`[${name}] viewport=${res.viewport} scrollWidth=${res.scrollWidth} -> ${ok ? 'OK' : '*** OVERFLOW ***'}`);
    console.log(`[${name}] container x=${res.container ? res.container.x : 'N/A'} width=${res.container ? res.container.width : 'N/A'}`);
    console.log(`[${name}] escenas width=600: ${JSON.stringify(res.scenes)}`);
    await page.screenshot({ path: `${outBase}-${name}.png`, fullPage: true });
  }

  await check(1280, '1280');
  await check(375, '375');
  await check(320, '320');

  // Desktop centering + CTA styles + image load status
  await page.setViewportSize({ width: 1280, height: 2400 });
  await page.goto(fileUrl, { waitUntil: 'networkidle' });
  const detail = await page.evaluate(() => {
    const c = document.querySelector('table.container').getBoundingClientRect();
    const btns = Array.from(document.querySelectorAll('a.btn')).map(a => {
      const s = getComputedStyle(a);
      return { text: a.textContent.trim(), color: s.color, bg: s.backgroundColor, radius: s.borderRadius, pad: s.padding };
    });
    const imgs = Array.from(document.querySelectorAll('img')).map(i => ({
      src: (i.src || '').slice(0, 60),
      loaded: i.complete && i.naturalWidth > 0
    }));
    return { centered: { x: Math.round(c.x), right: Math.round(c.right) }, btns, imgs };
  });
  console.log('[1280] columna centrada:', JSON.stringify(detail.centered), '(esperado x≈340, right≈940)');
  console.log('[CTAs]', JSON.stringify(detail.btns, null, 1));
  console.log('[imgs]', JSON.stringify(detail.imgs, null, 1));

  await browser.close();
  console.log(pass ? '== LAYOUT OK ==' : '== LAYOUT CON OVERFLOW ==');
  process.exit(pass ? 0 : 1);
})().catch(e => { console.error(e); process.exit(1); });
