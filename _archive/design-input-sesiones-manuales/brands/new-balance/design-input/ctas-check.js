// ctas-check.js — estilos computados reales de los 3 CTAs + estado de imágenes (markup gana).
const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const fileUrl = 'file:///Users/javifeebbo/Desktop/newsletter-system-reutilizable/sistema-final/new-balance-740n-archivo.html';
  await page.goto(fileUrl, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  const ctas = await page.evaluate(() => {
    return [...document.querySelectorAll('a.btn')].map(a => {
      const s = getComputedStyle(a);
      return {
        text: a.textContent.trim(),
        href: a.getAttribute('href'),
        color: s.color,
        bg: s.backgroundColor,
        radius: s.borderRadius,
        padding: s.padding,
        fontSize: s.fontSize,
        fontWeight: s.fontWeight
      };
    });
  });
  console.log('CTAs:');
  ctas.forEach(c => console.log('  -', JSON.stringify(c)));

  const imgs = await page.evaluate(() => {
    return [...document.querySelectorAll('img')].map(i => ({
      src: (i.getAttribute('src') || '').slice(0, 70),
      naturalW: i.naturalWidth,
      naturalH: i.naturalHeight,
      ok: i.naturalWidth > 0
    }));
  });
  console.log('Imágenes:');
  imgs.forEach(i => console.log('  -', i.ok ? 'OK' : '❌', i.naturalW + 'x' + i.naturalH, i.src));

  const scenes = await page.evaluate(() => {
    return [...document.querySelectorAll('td[bgcolor]')].map(td => ({
      bg: td.getAttribute('bgcolor'),
      w: Math.round(td.getBoundingClientRect().width)
    })).filter(s => s.w >= 590);
  });
  console.log('Escenas (bgcolor + ancho):');
  scenes.forEach(s => console.log('  -', s.bg, s.w + 'px'));
  await browser.close();
})().catch(e => { console.error('ERROR', e.message); process.exit(1); });
