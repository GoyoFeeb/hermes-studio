const fs = require('fs');
const sharp = require('sharp');
const src = fs.readFileSync('brands/mercedes-amg/design-input/logo-mercedes-amg-official.svg', 'utf8');
const black = src.replace(/fill:\s*#fff/g, 'fill: #000');
const out = 'brands/mercedes-amg/design-input/logo-mercedes-amg-black.svg';
fs.writeFileSync(out, black);
(async () => {
  const png = 'brands/mercedes-amg/design-input/logo-mercedes-amg-black-588.png';
  await sharp(Buffer.from(black)).resize(588, 138).png().toFile(png);
  const { data, info } = await sharp(png).raw().toBuffer({ resolveWithObject: true });
  const px = (x, y) => { const i = (y * info.width + x) * info.channels; return [data[i], data[i + 1], data[i + 2], data[i + 3]]; };
  console.log('PNG', info.width + 'x' + info.height, 'tl:', px(2, 2), 'center:', px(info.width >> 1, info.height >> 1));
})().catch(e => { console.error('ERR', e.message); process.exit(1); });
