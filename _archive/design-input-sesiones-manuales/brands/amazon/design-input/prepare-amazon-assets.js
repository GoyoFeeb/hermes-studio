// Asset prep for Amazon PBDD newsletter: crops + white logo.
// Absolute paths only (execute_code/terminal cwd traps).
const sharp = require('/Users/javifeebbo/Desktop/newsletter-system-reutilizable/sistema-final/node_modules/sharp');
const fs = require('fs');
const path = require('path');

const OUT = '/Users/javifeebbo/Desktop/newsletter-system-reutilizable/sistema-final/brands/amazon/design-input';
fs.mkdirSync(OUT, { recursive: true });

async function main() {
  // 1) Giftbox band (scene 2): remove baked "Prime Big Deal Days / Sneak peek" text (top ~40%)
  //    Source 2000x1125. Box sits bottom-center. Crop top=420 -> 2000x705.
  await sharp('/Users/javifeebbo/amazon-pbdd/assets/hero-giftboxes.jpg')
    .extract({ left: 0, top: 420, width: 2000, height: 705 })
    .resize(1200, 423)
    .jpeg({ quality: 82 })
    .toFile(path.join(OUT, 'giftbox-band.jpg'));
  console.log('giftbox-band done');

  // 2) Box with smile (scene 3, side-by-side): source 2000x1125, text on left 2/3.
  //    Square crop around the box (right-center area).
  await sharp('/Users/javifeebbo/amazon-pbdd/assets/hero-date-reveal.jpg')
    .extract({ left: 1120, top: 300, width: 700, height: 700 })
    .resize(560, 560)
    .jpeg({ quality: 84 })
    .toFile(path.join(OUT, 'box-arriving.jpg'));
  console.log('box-arriving done');

  // 3) White logo for dark header: recolor wordmark #171d27 -> #ffffff, keep smile #ff6201.
  let svg = fs.readFileSync('/Users/javifeebbo/amazon-pbdd/assets/amazon-2024-logo.svg', 'utf8');
  svg = svg.replace(/#171d27/gi, '#ffffff');
  fs.writeFileSync(path.join(OUT, 'amazon-logo-white.svg'), svg);
  const meta = await sharp(path.join(OUT, 'amazon-logo-white.svg'))
    .resize(400, 134)
    .png()
    .toFile(path.join(OUT, 'amazon-logo-white.png'));
  console.log('logo white done:', meta.width + 'x' + meta.height, meta.size + ' bytes');
}

main().catch((e) => { console.error(e); process.exit(1); });
