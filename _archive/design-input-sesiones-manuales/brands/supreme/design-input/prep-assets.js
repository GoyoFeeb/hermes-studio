const sharp = require('/Users/javifeebbo/Desktop/newsletter-system-reutilizable/sistema-final/node_modules/sharp');
const base = '/Users/javifeebbo/Desktop/newsletter-system-reutilizable/sistema-final/brands/supreme/design-input/';

(async () => {
  // 1) Logo: official SVG -> transparent PNG (masthead 150px display, render 450px; small 110px display)
  const svgBuf = require('fs').readFileSync(base + 'logo-supreme-official.svg');
  await sharp(svgBuf).resize(450, 136).png().toFile(base + 'logo-red-450.png');
  await sharp(svgBuf).resize(330, 100).png().toFile(base + 'logo-red-330.png');
  const meta = await sharp(base + 'logo-red-450.png').metadata();
  console.log('logo 450:', meta.width, meta.height, meta.format, 'hasAlpha:', meta.hasAlpha);

  // 2) Hero: black tee 1024 -> 600x600 email jpeg
  await sharp(base + 'tee-black-1024.jpg').resize(600, 600).jpeg({ quality: 82 }).toFile(base + 'hero-tee-600.jpg');

  // 3) Print zoom for scene 2: crop from black tee (print area), 276px display -> 552 wide
  await sharp(base + 'tee-black-1024.jpg')
    .extract({ left: 300, top: 330, width: 424, height: 480 })
    .resize(552, 625)
    .jpeg({ quality: 85 })
    .toFile(base + 'print-zoom-552.jpg');
  console.log('assets done');
})();
