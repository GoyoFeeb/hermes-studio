// Prepara imágenes email: redimensiona a 600px (3:2), calidad 72, + logo 160px
const sharp = require('/Users/javifeebbo/Desktop/newsletter-system-reutilizable/sistema-final/node_modules/sharp');
const fs = require('fs');
const path = require('path');

const base = '/Users/javifeebbo/Desktop/newsletter-system-reutilizable/sistema-final/brands/adeslas/design-input';
const email = path.join(base, 'email');
fs.mkdirSync(email, { recursive: true });

async function prep(src, out, w, quality) {
  const buf = await sharp(src).resize({ width: w }).jpeg({ quality, mozjpeg: true }).toBuffer();
  fs.writeFileSync(out, buf);
  const meta = await sharp(buf).metadata();
  return { out, w: meta.width, h: meta.height, bytes: buf.length };
}

(async () => {
  const consulta = await prep(path.join(base, 'consulta-online.jpg'), path.join(email, 'consulta-600.jpg'), 600, 72);
  const hero = await prep(path.join(base, 'medico-paciente.jpg'), path.join(email, 'hero-600.jpg'), 600, 72);
  // logo 160x67
  const logoW = 160, logoH = Math.round(160 * 48 / 115);
  const logoPng = await sharp(fs.readFileSync(path.join(base, 'adeslas-logo.svg'))).resize(logoW, logoH).png().toBuffer();
  fs.writeFileSync(path.join(email, 'adeslas-logo.png'), logoPng);
  const lmeta = await sharp(logoPng).metadata();
  console.log('consulta:', JSON.stringify(consulta));
  console.log('hero:', JSON.stringify(hero));
  console.log('logo:', logoW + 'x' + logoH, logoPng.length, 'bytes');
})();
