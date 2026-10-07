// Descarga assets de segurcaixaadeslas.es: navega la página a cada URL y hace fetch in-page (hereda cookies/referer reales del navegador headed)
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const outDir = '/Users/javifeebbo/Desktop/newsletter-system-reutilizable/sistema-final/brands/adeslas/design-input';
fs.mkdirSync(outDir, { recursive: true });

const assets = [
  { name: 'adeslas-logo.svg', url: 'https://www.segurcaixaadeslas.es/themes/custom/adeslas_components/design-system/public/images/adeslas.svg', mode: 'svg' },
  { name: 'segurcaixa.svg', url: 'https://www.segurcaixaadeslas.es/themes/custom/adeslas_components/design-system/public/images/segurcaixa.svg', mode: 'svg' },
  { name: 'salud-esencial-go.jpg', url: 'https://www.segurcaixaadeslas.es/sites/default/files/styles/webp/public/2024-12/salud-esencial-adeslas-go2.jpg.webp?itok=QikhYX8E', mode: 'img' },
  { name: 'consulta-online.jpg', url: 'https://www.segurcaixaadeslas.es/sites/default/files/2024-11/servicios-dolor-google.jpg', mode: 'img' },
  { name: 'medico-paciente.jpg', url: 'https://www.segurcaixaadeslas.es/sites/default/files/2023-11/imagen-medico-paciente-adeslas.png', mode: 'img' },
  { name: 'plena-total.jpg', url: 'https://www.segurcaixaadeslas.es/sites/default/files/styles/webp/public/2024-12/plena-total.jpg.webp?itok=g3YHZQX0', mode: 'img' }
];

(async () => {
  const browser = await chromium.launch({ headless: false });
  const ctx = await browser.newContext({ userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36' });
  const page = await ctx.newPage();
  // Página semilla para superar el challenge de Cloudflare
  try {
    await page.goto('https://www.segurcaixaadeslas.es/particulares/seguros-medicos/adeslas-go', { waitUntil: 'domcontentloaded', timeout: 40000 });
    await page.waitForTimeout(8000);
  } catch (e) { console.log('seed page err:', e.message); }
  console.log('seed title:', await page.title().catch(()=> 'ERR'));

  for (const a of assets) {
    try {
      await page.goto(a.url, { waitUntil: 'domcontentloaded', timeout: 40000 });
      await page.waitForTimeout(3000);
      const title = await page.title().catch(() => '');
      if (/just a moment/i.test(title) || /cloudflare/i.test(title)) {
        // desafío aún activo: esperar más
        await page.waitForTimeout(7000);
      }
      if (a.mode === 'svg') {
        const svgXml = await page.evaluate(() => {
          const r = document.documentElement;
          if (r && r.tagName && r.tagName.toLowerCase() === 'svg') {
            return new XMLSerializer().serializeToString(r);
          }
          return null;
        });
        if (svgXml) {
          fs.writeFileSync(path.join(outDir, a.name), svgXml);
          console.log('OK svg', a.name, svgXml.length, 'bytes');
        } else {
          console.log('FAIL svg (no svg root)', a.name, 'title=', title);
        }
      } else {
        const dataUrl = await page.evaluate(() => {
          const img = document.querySelector('img') || (document.body && document.body.querySelector('img'));
          // Si el navegador renderizó la imagen como documento, usamos fetch in-page
          return fetch(location.href, { headers: { Accept: 'image/*' } })
            .then(r => r.blob())
            .then(b => new Promise((res, rej) => {
              const fr = new FileReader();
              fr.onload = () => res(fr.result);
              fr.onerror = rej;
              fr.readAsDataURL(b);
            }))
            .catch(e => 'ERR:' + e.message);
        });
        if (dataUrl && !dataUrl.startsWith('ERR:')) {
          const m = dataUrl.match(/^data:([^;,]+);base64,(.+)$/);
          if (m) {
            const buf = Buffer.from(m[2], 'base64');
            let outPath = path.join(outDir, a.name);
            // si es webp png etc lo dejamos
            fs.writeFileSync(outPath, buf);
            console.log('OK img', a.name, m[1], buf.length, 'bytes');
          } else {
            console.log('FAIL img dataurl parse', a.name);
          }
        } else {
          console.log('FAIL img fetch', a.name, dataUrl);
        }
      }
    } catch (e) {
      console.log('ERR', a.name, e.message);
    }
  }
  await browser.close();
})();
