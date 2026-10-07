// Download OFFICIAL mini.es brand assets: header logo SVG + MINI fonts (woff)
const { chromium } = require('/Users/javifeebbo/Desktop/newsletter-system-reutilizable/sistema-final/node_modules/playwright');
const fs = require('fs');
const path = require('path');

const SEED = 'https://www.mini.es/es_ES/home/range/all-electric-mini-cooper.html';
const OUT = '/Users/javifeebbo/Desktop/newsletter-system-reutilizable/sistema-final/newsletters/2026/mini/mini-cooper-electric/design-input/';

(async () => {
  const browser = await chromium.launch({ headless: false });
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await ctx.newPage();
  try { await page.goto(SEED, { waitUntil: 'domcontentloaded', timeout: 90000 }); } catch (e) { console.log('warn:', e.message); }
  await page.waitForTimeout(6000);

  // 1) Resolve absolute base for the @font-face stylesheet + collect font URLs
  const fontInfo = await page.evaluate(() => {
    const faces = [];
    for (const sheet of document.styleSheets) {
      let rules;
      try { rules = sheet.cssRules; } catch (e) { continue; }
      if (!rules) continue;
      for (const r of rules) {
        if (r.cssText && r.cssText.includes('MINISans') || (r.cssText && r.cssText.includes('MINISerif'))) {
          const m = r.cssText.match(/font-family:\s*([^;]+);[\s\S]*?url\("([^"]+)"\)/);
          if (m) faces.push({ family: m[1].trim(), url: new URL(m[2], sheet.href || 'https://www.mini.es/').href });
        }
      }
    }
    return faces;
  });
  console.log('FONT URLS:');
  [...new Map(fontInfo.map(f => [f.family, f.url])).entries()].forEach(([fam, u]) => console.log(fam, '->', u));

  // 2) Download logo SVG + fonts via in-page fetch
  const LOGO = 'https://www.mini.es/etc.clientlibs/settings/wcm/designs/minidigital-white/images/logo/resources/mini-logo.svg';
  const targets = { 'mini-logo-official.svg': LOGO };
  [...new Map(fontInfo.map(f => [f.family, f.url])).entries()].forEach(([fam, u]) => {
    const file = fam.replace(/[^a-zA-Z0-9]/g, '') + (u.endsWith('.woff2') ? '.woff2' : '.woff');
    targets[file] = u;
  });

  for (const [name, url] of Object.entries(targets)) {
    try {
      const res = await page.evaluate(async (u) => {
        const resp = await fetch(u, { credentials: 'include' });
        if (!resp.ok) return { ok: false, status: resp.status };
        const buf = await resp.arrayBuffer();
        const bytes = new Uint8Array(buf);
        let b64 = '';
        const CH = 0x8000;
        for (let i = 0; i < bytes.length; i += CH) b64 += String.fromCharCode.apply(null, bytes.subarray(i, i + CH));
        return { ok: true, status: resp.status, type: resp.headers.get('content-type'), size: bytes.length, b64: btoa(b64) };
      }, url);
      if (res.ok) {
        fs.writeFileSync(path.join(OUT, name), Buffer.from(res.b64, 'base64'));
        console.log(`OK  ${name} (${res.size} bytes, ${res.type})`);
      } else {
        console.log(`FAIL ${name} status=${res.status}`);
      }
    } catch (e) { console.log('ERR', name, e.message); }
  }

  await browser.close();
})().catch(e => { console.error('ERR', e.message); process.exit(1); });
