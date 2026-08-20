const sharp = require('/Users/javifeebbo/Desktop/newsletter-system-reutilizable/sistema-final/node_modules/sharp');
const fs = require('fs');

(async () => {
  const svg = fs.readFileSync('byd-logo.svg');
  await sharp(svg).resize(320, 80).png().toFile('byd-logo.png');
  console.log('logo ok');

  // info de las imagenes del press pack
  for (const f of ['sealion08-hero.png', 'sealion08-angle2.jpg', 'sealion08-wiki.jpg']) {
    const meta = await sharp(f).metadata();
    console.log(f, meta.width + 'x' + meta.height, meta.format);
  }
})();
