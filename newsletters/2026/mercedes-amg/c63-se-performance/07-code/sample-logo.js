const sharp = require('sharp');
(async () => {
  // 1) sample del raster del pack (logo blanco)
  const p = 'brands/mercedes-amg/design-input/logo-mercedes-amg-white-588.png';
  const meta = await sharp(p).metadata();
  const { data, info } = await sharp(p).raw().toBuffer({ resolveWithObject: true });
  const px = (x, y) => {
    const i = (y * info.width + x) * info.channels;
    return [data[i], data[i + 1], data[i + 2], info.channels > 3 ? data[i + 3] : 255];
  };
  const w = info.width, h = info.height;
  const corners = { tl: px(2, 2), tr: px(w - 3, 2), bl: px(2, h - 3), br: px(w - 3, h - 3), center: px(w >> 1, h >> 1) };
  console.log('raster', w + 'x' + h, JSON.stringify(corners));
  // 2) el SVG oficial: qué fill usa
  const svg = require('fs').readFileSync('brands/mercedes-amg/design-input/logo-mercedes-amg-official.svg', 'utf8');
  const fills = [...new Set([...svg.matchAll(/fill="([^"]*)"/g)].map(m => m[1]))];
  console.log('SVG fills:', JSON.stringify(fills));
})().catch(e => { console.error('ERR', e.message); process.exit(1); });
