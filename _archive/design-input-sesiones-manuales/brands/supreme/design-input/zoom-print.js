const sharp = require('/Users/javifeebbo/Desktop/newsletter-system-reutilizable/sistema-final/node_modules/sharp');
const base = '/Users/javifeebbo/Desktop/newsletter-system-reutilizable/sistema-final/brands/supreme/design-input/';

(async () => {
  // Check navy integrity
  try {
    const navy = sharp(base + 'tee-navy-720.jpg');
    const meta = await navy.metadata();
    console.log('navy meta:', meta.width, meta.height, meta.format);
  } catch (e) {
    console.log('navy broken:', e.message);
  }
  // Crop-zoom the front print of the black tee (chest area, center ~35-65% vertical, 30-70% horizontal)
  await sharp(base + 'tee-black-1024.jpg')
    .extract({ left: 300, top: 330, width: 424, height: 480 })
    .resize(848, 960)
    .jpeg({ quality: 85 })
    .toFile('/tmp/tee-print-zoom.jpg');
  console.log('zoom saved');
})();
