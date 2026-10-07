// Check logo PNG transparency + sample colors
const path = require('path');
const sharp = require('/Users/javifeebbo/Desktop/newsletter-system-reutilizable/sistema-final/node_modules/sharp');

const DIR = '/Users/javifeebbo/Desktop/newsletter-system-reutilizable/sistema-final/brands/fitness-park/design-input';

(async () => {
  for (const f of ['logo-white.png', 'logo-dark.png']) {
    const img = sharp(path.join(DIR, f));
    const { data, info } = await img.raw().toBuffer({ resolveWithObject: true });
    const px = (x, y) => {
      const i = (y * info.width + x) * info.channels;
      return { r: data[i], g: data[i + 1], b: data[i + 2], a: data[i + 3] };
    };
    const corners = [px(1, 1), px(info.width - 2, 1), px(1, info.height - 2), px(info.width - 2, info.height - 2)];
    // sample middle band to find strokes
    let midColors = new Set();
    for (let x = 0; x < info.width; x += 8) {
      const p = px(x, Math.floor(info.height / 2));
      if (p.a > 200) midColors.add(`rgb(${p.r},${p.g},${p.b})`);
    }
    console.log(f, info.width + 'x' + info.height, 'cornersAlpha:', corners.map(c => c.a).join(','), 'midColors:', [...midColors].slice(0, 4).join(' | '));
  }
})();
