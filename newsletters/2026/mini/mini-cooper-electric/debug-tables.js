const { chromium } = require('/Users/javifeebbo/Desktop/newsletter-system-reutilizable/sistema-final/node_modules/playwright');
const HTML = '/Users/javifeebbo/Desktop/newsletter-system-reutilizable/sistema-final/newsletters/2026/mini/mini-cooper-electric/mini-cooper-electric-newsletter.html';
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  await page.goto('file://' + HTML, { waitUntil: 'networkidle', timeout: 90000 });
  const info = await page.evaluate(() => {
    const rows = [];
    document.querySelectorAll('table').forEach((t, i) => {
      const r = t.getBoundingClientRect();
      const cls = t.getAttribute('class') || '(no class)';
      const bg = t.getAttribute('bgcolor') || '';
      const wattr = t.getAttribute('width') || '';
      rows.push(`#${i} ${cls} bg=${bg} widthAttr=${wattr} rectW=${Math.round(r.width)} x=${Math.round(r.x)}`);
    });
    return rows.join('\n');
  });
  console.log(info);
  await browser.close();
})().catch(e => { console.error('ERR', e.message); process.exit(1); });
