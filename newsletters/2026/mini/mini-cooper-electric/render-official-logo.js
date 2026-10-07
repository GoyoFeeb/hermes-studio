// Re-render logo oficial mini.es en BLANCO (el SVG oficial no lleva fill -> inyectar fill="#FFFFFF")
const fs = require('fs');
const sharp = require('/Users/javifeebbo/Desktop/newsletter-system-reutilizable/sistema-final/node_modules/sharp');
const D = '/Users/javifeebbo/Desktop/newsletter-system-reutilizable/sistema-final/newsletters/2026/mini/mini-cooper-electric/design-input/';

const svg = fs.readFileSync(D + 'mini-logo-official.svg', 'utf8');
const svgWhite = svg.replace('<svg width', '<svg fill="#FFFFFF" width');
const svgBlack = svg.replace('<svg width', '<svg fill="#000000" width');

(async () => {
  const w = await sharp(Buffer.from(svgWhite)).resize(1000).png().toBuffer();
  fs.writeFileSync(D + 'logo-official-white.png', w);
  const b = await sharp(Buffer.from(svgBlack)).resize(1000).png().toBuffer();
  fs.writeFileSync(D + 'logo-official-black.png', b);
  for (const f of ['logo-official-white.png', 'logo-official-black.png']) {
    const meta = await sharp(D + f).metadata();
    console.log(f, meta.width + 'x' + meta.height, 'alpha=' + meta.hasAlpha, fs.statSync(D + f).size + 'B');
  }
})();
