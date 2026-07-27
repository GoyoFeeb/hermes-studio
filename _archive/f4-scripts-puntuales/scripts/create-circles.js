// Create numbered steps as circles with transparent background
const path = require('path');
const { chromium } = require('playwright');

const ASSETS_DIR = path.join(__dirname, '..', 'newsletters', '2026', 'paraycompara', '2026-jul-ahorra-fibra-movil', '09-exports', 'assets');
require('fs').mkdirSync(ASSETS_DIR, { recursive: true });

const S = 60; // size

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  for (const num of ['01', '02', '03']) {
    // Circle ON transparent background: body has no bg, inner div has morado bg + border-radius
    await page.setContent(`<html><body style="margin:0;width:${S}px;height:${S}px;background:transparent;">
      <div style="width:${S}px;height:${S}px;background:#792771;border-radius:50%;display:flex;align-items:center;justify-content:center;font-family:Arial,Helvetica,sans-serif;font-weight:700;font-size:${S*0.38}px;color:#FFFFFF;">${num}</div>
    </body></html>`);
    await page.setViewportSize({ width: S, height: S });
    const out = path.join(ASSETS_DIR, `paso-${num}.png`);
    await page.screenshot({ path: out, clip: { x: 0, y: 0, width: S, height: S } });
    const bytes = require('fs').statSync(out).size;
    console.log(`✅ paso-${num}.png (${bytes}b, transparent circle)`);
  }
  
  await browser.close();
})();