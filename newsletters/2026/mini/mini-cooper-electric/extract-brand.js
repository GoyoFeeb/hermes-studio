// Extract MINI's REAL font system + header logo from mini.es (real browser, in-page)
const { chromium } = require('/Users/javifeebbo/Desktop/newsletter-system-reutilizable/sistema-final/node_modules/playwright');

const SEED = 'https://www.mini.es/es_ES/home/range/all-electric-mini-cooper.html';

(async () => {
  const browser = await chromium.launch({ headless: false });
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await ctx.newPage();
  try { await page.goto(SEED, { waitUntil: 'domcontentloaded', timeout: 90000 }); } catch (e) { console.log('warn:', e.message); }
  await page.waitForTimeout(7000);

  const info = await page.evaluate(() => {
    const out = { fontFaces: [], computed: {}, logos: [] };
    // @font-face rules
    try {
      for (const sheet of document.styleSheets) {
        let rules;
        try { rules = sheet.cssRules; } catch (e) { continue; }
        if (!rules) continue;
        for (const r of rules) {
          if (r.cssText && r.cssText.includes('@font-face')) {
            out.fontFaces.push(r.cssText.slice(0, 400));
          }
        }
      }
    } catch (e) { out.fontFaces.push('ERR ' + e.message); }
    // computed styles
    const probe = (sel) => {
      const el = document.querySelector(sel);
      if (!el) return null;
      const cs = getComputedStyle(el);
      return { fontFamily: cs.fontFamily, fontWeight: cs.fontWeight, fontSize: cs.fontSize, letterSpacing: cs.letterSpacing, textTransform: cs.textTransform };
    };
    out.computed.body = probe('body');
    out.computed.h1 = probe('h1');
    out.computed.h2 = probe('h2');
    out.computed.p = probe('p');
    out.computed.a = probe('a');
    out.computed.button = probe('button');
    out.computed.logoImg = probe('header img, .header img, [class*="logo"] img');
    // logo candidates
    document.querySelectorAll('header img, header svg, [class*="logo"] img, [class*="brand"] img').forEach((el) => {
      const src = el.getAttribute('src') || el.getAttribute('data-src') || '';
      if (src) out.logos.push(src.slice(0, 200));
    });
    return out;
  });

  console.log('=== @font-face ===');
  info.fontFaces.slice(0, 8).forEach(f => console.log(f.replace(/\s+/g, ' ').slice(0, 260)));
  console.log('=== computed ===');
  for (const [k, v] of Object.entries(info.computed)) {
    if (v) console.log(k, '->', JSON.stringify(v));
  }
  console.log('=== header logo candidates ===');
  [...new Set(info.logos)].forEach(l => console.log(l));

  await browser.close();
})().catch(e => { console.error('ERR', e.message); process.exit(1); });
