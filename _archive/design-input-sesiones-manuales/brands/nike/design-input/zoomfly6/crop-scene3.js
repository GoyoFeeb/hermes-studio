// Recorta bandas del preview para inspección visual (sharp)
const sharp = require('/Users/javifeebbo/Desktop/newsletter-system-reutilizable/sistema-final/node_modules/sharp');
const path = '/Users/javifeebbo/Desktop/newsletter-system-reutilizable/sistema-final/brands/nike/design-input/zoomfly6/preview-600.png';
const outDir = '/Users/javifeebbo/Desktop/newsletter-system-reutilizable/sistema-final/brands/nike/design-input/zoomfly6/';

(async () => {
  const meta = await sharp(path).metadata();
  console.log('preview size:', meta.width, 'x', meta.height);
  const W = meta.width, H = meta.height;
  // Bandas: [inicio, fin] fracciones de altura
  const bands = {
    'scene3a': [0.45, 0.62],
    'scene3b': [0.62, 0.80],
  };
  for (const [name, [f0, f1]] of Object.entries(bands)) {
    const top = Math.round(H * f0);
    const height = Math.round(H * (f1 - f0));
    await sharp(path)
      .extract({ left: 0, top, width: W, height })
      .resize({ width: W * 2 })
      .png()
      .toFile(outDir + 'crop-' + name + '.png');
    console.log('escrito crop-' + name + '.png  (y=' + top + '..' + (top + height) + ')');
  }
})();
