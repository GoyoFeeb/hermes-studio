// List image dimensions in design-input
const sharp = require('sharp');
const fs = require('fs');
const dir = '/Users/javifeebbo/Desktop/newsletter-system-reutilizable/sistema-final/brands/fitness-park/design-input';
(async () => {
  for (const f of fs.readdirSync(dir).filter(f => /\.(png|jpg)$/i.test(f))) {
    try {
      const m = await sharp(dir + '/' + f).metadata();
      console.log(f, m.width + 'x' + m.height, Math.round(fs.statSync(dir + '/' + f).size / 1024) + 'KB');
    } catch (e) { console.log(f, 'ERR', e.message); }
  }
})();
