const sharp = require('sharp');
const path = require('path');
const base = '/Users/javifeebbo/Desktop/newsletter-system-reutilizable/sistema-final/brands/accion-contra-el-hambre/design-input';
(async () => {
  // Site logo: render at header display size (180px wide, keep 1.64 ratio -> 110 tall)
  await sharp(path.join(base, 'logo-sitio.svg'))
    .resize(180, 110)
    .png()
    .toFile(path.join(base, 'logo-header.png'));
  const meta = await sharp(path.join(base, 'logo-header.png')).metadata();
  console.log('logo-header.png', meta.width + 'x' + meta.height, 'hasAlpha:', meta.hasAlpha);
})().catch(e => { console.error(e.message); process.exit(1); });
