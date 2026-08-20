const sharp = require('sharp');
const path = require('path');
const base = '/Users/javifeebbo/Desktop/newsletter-system-reutilizable/sistema-final/brands/accion-contra-el-hambre/design-input';
const files = ['hero-bebe.jpg', 'proceso-plumpynut.jpg', 'centro-lahj.jpg', 'ninos-recuperados.jpg'];
(async () => {
  for (const f of files) {
    const meta = await sharp(path.join(base, f)).metadata();
    console.log(f, meta.width + 'x' + meta.height, meta.format);
  }
})().catch(e => { console.error(e.message); process.exit(1); });
