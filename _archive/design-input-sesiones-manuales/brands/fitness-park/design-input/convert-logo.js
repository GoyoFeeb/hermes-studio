// Convert official Fitness Park logo SVG -> PNG (white + dark variants) for email
const fs = require('fs');
const path = require('path');

const DIR = '/Users/javifeebbo/Desktop/newsletter-system-reutilizable/sistema-final/brands/fitness-park/design-input';
const svgPath = path.join(DIR, 'logo-white.svg');

let sharp;
try {
  sharp = require('/Users/javifeebbo/Desktop/newsletter-system-reutilizable/sistema-final/node_modules/sharp');
} catch (e) {
  try {
    sharp = require('sharp');
  } catch (e2) {
    console.log('NO_SHARP');
    process.exit(1);
  }
}

const svg = fs.readFileSync(svgPath, 'utf8');

// Dark variant: white fill -> brand dark #24292D (yellow element stays)
const darkSvg = svg.replace(/fill:\s*#fff/gi, 'fill: #24292D');

const HEIGHT = 72; // render at 2x of ~36px display height

async function render(svgContent, outName) {
  let buf = await sharp(Buffer.from(svgContent)).resize({ height: HEIGHT, width: null, fit: 'inside' }).png().toBuffer();
  const meta = await sharp(buf).metadata();
  const padX = Math.round(meta.width * 0.08);
  const padY = Math.round(meta.height * 0.08);
  buf = await sharp(buf).extend({ top: padY, bottom: padY, left: padX, right: padX, background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toBuffer();
  const meta2 = await sharp(buf).metadata();
  fs.writeFileSync(path.join(DIR, outName), buf);
  console.log(outName, meta2.width + 'x' + meta2.height, buf.length + ' bytes');
}

(async () => {
  await render(svg, 'logo-white.png');
  await render(darkSvg, 'logo-dark.png');
  console.log('DONE');
})();
