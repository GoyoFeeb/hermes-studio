// Verifica norma 600px (cada sección = 600px centrada, sin overflow) + imágenes + CTAs.
// Uso: node verify-veci-japon.js
const { chromium } = require('/Users/javifeebbo/Desktop/newsletter-system-reutilizable/sistema-final/node_modules/playwright');

const FILE = 'file:///Users/javifeebbo/Desktop/newsletter-system-reutilizable/sistema-final/viajes-el-corte-ingles-japon-newsletter.html';
const SHOT = '/Users/javifeebbo/Desktop/newsletter-system-reutilizable/sistema-final/brands/el-corte-ingles/design-input/veci-japon/';

(async () => {
  const browser = await chromium.launch();

  // ---- 1280 desktop ----
  let page = await browser.newPage({ viewport: { width: 1280, height: 2600 } });
  await page.goto(FILE, { waitUntil: 'networkidle' });
  const r1280 = await page.evaluate(() => {
    const out = [];
    document.querySelectorAll('body > table').forEach((t, i) => {
      const r = t.getBoundingClientRect();
      out.push({ n: i, width: Math.round(r.width), x: Math.round(r.x), bg: t.getAttribute('bgcolor') });
    });
    const imgs = Array.from(document.images).map(im => ({ alt: im.alt.slice(0, 30), ok: im.naturalWidth > 0 }));
    const btns = Array.from(document.querySelectorAll('a[href*="bookings.viajeselcorteingles"]')).map(a => {
      const r = a.getBoundingClientRect();
      return { text: a.textContent, h: Math.round(r.height), w: Math.round(r.width), right: Math.round(r.right) };
    });
    return { scrollWidth: document.documentElement.scrollWidth, vw: window.innerWidth, tables: out, imgs, btns };
  });
  console.log('[1280] viewport', r1280.vw, '| scrollWidth', r1280.scrollWidth, '| overflow:', r1280.scrollWidth > r1280.vw ? 'SI' : 'NO');
  let ok = true;
  for (const t of r1280.tables) { const pass = t.width === 600 && t.x === 340; if (!pass) ok = false; console.log('  sección', t.n, 'width=' + t.width, 'x=' + t.x, 'bg=' + t.bg, pass ? 'OK' : 'FALLO'); }
  console.log('  imágenes:', r1280.imgs.map(i => (i.ok ? 'OK' : 'ROTA') + ' ' + i.alt).join(' | '));
  console.log('  CTAs:', r1280.btns.map(b => b.text + ' ' + b.w + 'x' + b.h + ' right=' + b.right).join(' | '));
  console.log('  RESULTADO 1280:', ok && r1280.scrollWidth === 1280 ? 'TODAS LAS SECCIONES MIDEN 600px CENTRADAS' : 'HAY FALLOS');
  await page.screenshot({ path: SHOT + 'preview-japon-1280.png', fullPage: true });

  // ---- 375 mobile ----
  page = await browser.newPage({ viewport: { width: 375, height: 2400 } });
  await page.goto(FILE, { waitUntil: 'networkidle' });
  const r375 = await page.evaluate(() => ({ scrollWidth: document.documentElement.scrollWidth, vw: window.innerWidth }));
  console.log('[375] viewport', r375.vw, '| scrollWidth', r375.scrollWidth, '| overflow:', r375.scrollWidth > r375.vw ? 'SI' : 'NO');
  await page.screenshot({ path: SHOT + 'preview-japon-375.png', fullPage: true });

  // ---- 320 mobile ----
  page = await browser.newPage({ viewport: { width: 320, height: 2400 } });
  await page.goto(FILE, { waitUntil: 'networkidle' });
  const r320 = await page.evaluate(() => ({ scrollWidth: document.documentElement.scrollWidth, vw: window.innerWidth }));
  console.log('[320] viewport', r320.vw, '| scrollWidth', r320.scrollWidth, '| overflow:', r320.scrollWidth > r320.vw ? 'SI' : 'NO');
  await page.screenshot({ path: SHOT + 'preview-japon-320.png', fullPage: true });

  await browser.close();
})();
