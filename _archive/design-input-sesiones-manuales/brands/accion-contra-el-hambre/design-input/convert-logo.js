const sharp = require('sharp');
const path = require('path');
const base = '/Users/javifeebbo/Desktop/newsletter-system-reutilizable/sistema-final/brands/accion-contra-el-hambre/design-input';
(async () => {
  await sharp(path.join(base, 'logo-ach.svg'))
    .resize(575, 350)
    .png()
    .toFile(path.join(base, 'logo-ach.png'));
  console.log('png ok');
  const meta = await sharp(path.join(base, 'logo-ach.png')).metadata();
  console.log(JSON.stringify(meta));
})().catch(e => { console.error(e.message); process.exit(1); });
