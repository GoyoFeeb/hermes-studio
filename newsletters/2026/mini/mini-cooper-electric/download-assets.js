// Download mini.es official campaign images via headed Playwright in-page fetch
// (mini.es CDN blocks curl; in-page fetch inherits real browser session).
const { chromium } = require('/Users/javifeebbo/Desktop/newsletter-system-reutilizable/sistema-final/node_modules/playwright');
const fs = require('fs');
const path = require('path');

const OUT = '/Users/javifeebbo/Desktop/newsletter-system-reutilizable/sistema-final/newsletters/2026/mini/mini-cooper-electric/design-input';
const SEED = 'https://www.mini.es/es_ES/home/range/all-electric-mini-cooper.html';
const IMAGES = {
  'hero-stage': 'https://www.mini.es/content/dam/MINI/common/Range/new-generation/cooper/all-electric/bodytype-hub/mini-J01-BEV-stage-wide.webp.asset.1753867531038.webp',
  'gallery-overview': 'https://www.mini.es/content/dam/MINI/common/Range/new-generation/cooper/all-electric/bodytype-hub/mini-J01-BEV-gallery-overview-wide.webp',
  'gallery-interior': 'https://www.mini.es/content/dam/MINI/common/Range/new-generation/cooper/all-electric/bodytype-hub/mini-J01-BEV-gallery-interior-wide.webp',
  'gallery-front': 'https://www.mini.es/content/dam/MINI/common/Range/new-generation/cooper/all-electric/bodytype-hub/mini-J01-BEV-gallery-front-wide.webp',
  'gallery-charging': 'https://www.mini.es/content/dam/MINI/common/Range/new-generation/cooper/all-electric/bodytype-hub/mini-J01-BEV-gallery-charging-wide.webp',
  'gallery-driving': 'https://www.mini.es/content/dam/MINI/common/Range/new-generation/cooper/all-electric/bodytype-hub/mini-J01-BEV-gallery-driving-wide.webp',
};

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch({ headless: false });
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await ctx.newPage();
  console.log('Seeding page...');
  try { await page.goto(SEED, { waitUntil: 'domcontentloaded', timeout: 90000 }); } catch (e) { console.log('seed warn:', e.message); }
  await page.waitForTimeout(6000);
  for (const [name, url] of Object.entries(IMAGES)) {
    try {
      const result = await page.evaluate(async (u) => {
        const resp = await fetch(u, { credentials: 'include' });
        if (!resp.ok) return { ok: false, status: resp.status, type: resp.headers.get('content-type') };
        const blob = await resp.blob();
        return new Promise((resolve) => {
          const fr = new FileReader();
          fr.onload = () => resolve({ ok: true, status: resp.status, type: blob.type, size: blob.size, data: fr.result });
          fr.onerror = () => resolve({ ok: false, error: 'filereader' });
          fr.readAsDataURL(blob);
        });
      }, url);
      if (result.ok) {
        const ext = (result.type || '').includes('png') ? 'png' : 'webp';
        const b64 = result.data.split(',')[1];
        const file = path.join(OUT, `${name}.${ext}`);
        fs.writeFileSync(file, Buffer.from(b64, 'base64'));
        console.log(`OK  ${name} ${result.size} bytes -> ${file}`);
      } else {
        console.log(`FAIL ${name} status=${result.status} type=${result.type} err=${result.error || ''}`);
      }
    } catch (e) {
      console.log(`ERR  ${name}: ${e.message}`);
    }
  }
  await browser.close();
})();
