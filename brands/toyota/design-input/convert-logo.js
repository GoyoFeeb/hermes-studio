// Convierte el SVG oficial del logotipo Toyota (Wikimedia, rojo #EB0A1E, transparente)
// a PNG con transparencia para email, usando sharp del sistema.
const path = require('path');
const sharp = require('/Users/javifeebbo/Desktop/newsletter-system-reutilizable/sistema-final/node_modules/sharp');

(async () => {
  const dir = '/Users/javifeebbo/Desktop/newsletter-system-reutilizable/sistema-final/brands/toyota/design-input';
  const svg = path.join(dir, 'toyota-carlogo.svg');
  const out = path.join(dir, 'toyota-logo-red.png');
  // SVG real: 950 x 157.02. Render a 1100px de ancho (retina para display ~360px).
  await sharp(svg, { density: 300 })
    .resize({ width: 1100 })
    .png()
    .toFile(out);
  const meta = await sharp(out).metadata();
  console.log('OK', out, meta.width + 'x' + meta.height, 'formato', meta.format);
})().catch((e) => { console.error('ERR', e.message); process.exit(1); });
