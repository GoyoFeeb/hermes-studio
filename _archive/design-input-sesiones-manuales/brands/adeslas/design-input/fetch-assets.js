// Descarga assets oficiales de segurcaixaadeslas.es vía Playwright (Referer + sesión de navegador)
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const outDir = '/Users/javifeebbo/Desktop/newsletter-system-reutilizable/sistema-final/brands/adeslas/design-input';
fs.mkdirSync(outDir, { recursive: true });

const assets = [
  { name: 'adeslas-logo.svg', url: 'https://www.segurcaixaadeslas.es/themes/custom/adeslas_components/design-system/public/images/adeslas.svg' },
  { name: 'segurcaixa.svg', url: 'https://www.segurcaixaadeslas.es/themes/custom/adeslas_components/design-system/public/images/segurcaixa.svg' },
  { name: 'salud-esencial-go.jpg', url: 'https://www.segurcaixaadeslas.es/sites/default/files/styles/webp/public/2024-12/salud-esencial-adeslas-go2.jpg.webp?itok=QikhYX8E' },
  { name: 'consulta-online.jpg', url: 'https://www.segurcaixaadeslas.es/sites/default/files/2024-11/servicios-dolor-google.jpg' },
  { name: 'medico-paciente.png', url: 'https://www.segurcaixaadeslas.es/sites/default/files/2023-11/imagen-medico-paciente-adeslas.png' },
  { name: 'plena-total.jpg', url: 'https://www.segurcaixaadeslas.es/sites/default/files/styles/webp/public/2024-12/plena-total.jpg.webp?itok=g3YHZQX0' }
];

(async () => {
  const browser = await chromium.launch({ headless: false });
  const ctx = await browser.newContext({ userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36' });
  const page = await ctx.newPage();
  // Primero visitamos la home para tener cookies/CF clearance
  try { await page.goto('https://www.segurcaixaadeslas.es/', { waitUntil: 'domcontentloaded', timeout: 30000 }); } catch (e) { console.log('home:', e.message); }
  await page.waitForTimeout(3500);
  // RequestClient dedicado que hereda las cookies de la página
  const req = await ctx.newRequest({ baseURL: 'https://www.segurcaixaadeslas.es' });
  for (const a of assets) {
    try {
      const res = await req.get(a.url, { headers: { Referer: 'https://www.segurcaixaadeslas.es/', 'Accept': '*/*' }, timeout: 30000 });
      if (res.ok()) {
        const buf = await res.body();
        const outPath = path.join(outDir, a.name);
        fs.writeFileSync(outPath, buf);
        console.log('OK', a.name, buf.length, 'bytes ->', outPath);
      } else {
        console.log('FAIL', a.name, res.status());
      }
    } catch (e) {
      console.log('ERR', a.name, e.message);
    }
  }
  await browser.close();
})();
