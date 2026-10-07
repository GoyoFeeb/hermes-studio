// Convierte el logo SVG oficial de Adeslas a PNG transparente (sharp) + verifica
const sharp = require('/Users/javifeebbo/Desktop/newsletter-system-reutilizable/sistema-final/node_modules/sharp');
const fs = require('fs');
const path = require('path');

const base = '/Users/javifeebbo/Desktop/newsletter-system-reutilizable/sistema-final/brands/adeslas/design-input';
const logo = path.join(base, 'adeslas-logo.svg');
const out = path.join(base, 'email', 'adeslas-logo.png');

(async () => {
  const svg = fs.readFileSync(logo);
  // tamaño email: 160px ancho, ratio 115:48 -> alto 66.8
  const w = 200, h = Math.round(200 * 48 / 115);
  const png = await sharp(svg).resize(w, h).png().toBuffer();
  fs.writeFileSync(out, png);
  const meta = await sharp(png).metadata();
  console.log('logo png:', meta.width + 'x' + meta.height, png.length, 'bytes ->', out);
  // comprobar transparencia de esquinas
  const { data, info } = await sharp(png).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const px = (x, y) => data[(y * info.width + x) * 4];
  console.log('alpha esquina sup-izq:', px(0,0), 'alpha centro:', px(Math.floor(info.width/2), Math.floor(info.height/2)));
})();
