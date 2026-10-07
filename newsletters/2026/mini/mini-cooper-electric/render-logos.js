// Render MINI logo from official SVG (Commons, PD-textlogo) to transparent PNGs:
// black ink (light scenes) + white ink (dark scenes), 500px wide (2x of 250px display).
const fs = require('fs');
const sharp = require('/Users/javifeebbo/Desktop/newsletter-system-reutilizable/sistema-final/node_modules/sharp');

const svg = fs.readFileSync('/tmp/mini-logo.svg', 'utf8');
const svgWhite = svg.split('fill:#120a08').join('fill:#FFFFFF');

const OUT = '/Users/javifeebbo/Desktop/newsletter-system-reutilizable/sistema-final/newsletters/2026/mini/mini-cooper-electric/design-input/';

(async () => {
  for (const [name, data] of [['logo-black', svg], ['logo-white', svgWhite]]) {
    const png = await sharp(Buffer.from(data)).png().toBuffer();
    fs.writeFileSync(OUT + name + '.png', png);
    const meta = await sharp(png).metadata();
    console.log(name, meta.width + 'x' + meta.height, png.length + ' bytes', 'hasAlpha=' + meta.hasAlpha);
  }
})();
