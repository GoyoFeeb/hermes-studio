// Conversión puntual logo VECI SVG -> PNG (email-ready, 2x retina)
const sharp = require('sharp');
const fs = require('fs');

(async () => {
  const svg = fs.readFileSync('brands/el-corte-ingles/design-input/logo-veci-hor.svg');
  await sharp(svg).resize(480, 105).png().toFile('brands/el-corte-ingles/design-input/logo-veci-hor.png');
  const meta = await sharp('brands/el-corte-ingles/design-input/logo-veci-hor.png').metadata();
  console.log('PNG:', meta.width + 'x' + meta.height, meta.format, Math.round(fs.statSync('brands/el-corte-ingles/design-input/logo-veci-hor.png').size / 1024) + 'KB');
})().catch((e) => { console.error('ERR', e.message); process.exit(1); });
