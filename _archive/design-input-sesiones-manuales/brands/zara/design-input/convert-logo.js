// Convierte el logo oficial de Zara (SVG extraído de zara.com) a PNG transparente para email.
const sharp = require('sharp');
const path = require('path');

const dir = '/Users/javifeebbo/Desktop/newsletter-system-reutilizable/sistema-final/brands/zara/design-input';
const svg = path.join(dir, 'zara-logo.svg');

async function main() {
  const png = await sharp(svg).resize({ width: 240 }).png().toBuffer();
  await sharp(png).toFile(path.join(dir, 'zara-logo-email.png'));
  const pngRetina = await sharp(svg).resize({ width: 480 }).png().toBuffer();
  await sharp(pngRetina).toFile(path.join(dir, 'zara-logo-email-2x.png'));
  const meta = await sharp(png).metadata();
  console.log('OK logo png', meta.width + 'x' + meta.height, (png.length / 1024).toFixed(1) + 'KB');
}

main().catch(e => { console.error(e); process.exit(1); });
