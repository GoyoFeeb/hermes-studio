const sharp = require('/Users/javifeebbo/Desktop/newsletter-system-reutilizable/sistema-final/node_modules/sharp');

(async () => {
  const img = sharp('byd-logo.png');
  const meta = await img.metadata();
  console.log('logo meta:', meta.width + 'x' + meta.height, 'channels:', meta.channels, 'hasAlpha:', meta.hasAlpha);
  const { data, info } = await img.raw().toBuffer({ resolveWithObject: true });
  const ch = info.channels;
  // esquina superior izquierda
  const px = (x, y) => {
    const i = (y * info.width + x) * ch;
    return [data[i], data[i+1], data[i+2], ch > 3 ? data[i+3] : 255];
  };
  console.log('esquina 0,0:', px(0, 0));
  console.log('esquina 319,79:', px(319, 79));
  console.log('centro 160,40:', px(160, 40));
})();
