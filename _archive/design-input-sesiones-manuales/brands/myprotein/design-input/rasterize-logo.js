const sharp = require('sharp');
const path = require('path');

const DIR = '/Users/javifeebbo/Desktop/newsletter-system-reutilizable/sistema-final/brands/myprotein/design-input';

(async () => {
  // Rasterize official wordmark SVG -> transparent PNG, 320px wide, +8% symmetric padding
  for (const [color, out] of [['black', 'logo-black.png']]) {
    const svg = path.join(DIR, 'logo-' + color + '.svg');
    const meta = await sharp(svg).metadata();
    const ratio = meta.width / meta.height; // 433/55
    const W = 320;
    const H = Math.round(W / ratio);
    const img = sharp(svg)
      .resize(W, H)
      .png()
      .toBuffer();
    const buf = await img;
    const padded = await sharp(buf)
      .extend({ top: Math.round(H * 0.08), bottom: Math.round(H * 0.08), left: Math.round(W * 0.08), right: Math.round(W * 0.08), background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toBuffer();
    const outPath = path.join(DIR, out);
    await sharp(padded).toFile(outPath);
    const m2 = await sharp(outPath).metadata();
    console.log('OK', out, m2.width + 'x' + m2.height, 'hasAlpha:', m2.hasAlpha);
  }
})().catch((e) => { console.error(e); process.exit(1); });
