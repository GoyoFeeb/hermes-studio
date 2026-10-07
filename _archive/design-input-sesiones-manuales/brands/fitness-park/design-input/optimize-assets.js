// Re-crop: hero with more headroom, app vertical 3:4 for editorial column
const sharp = require('/Users/javifeebbo/Desktop/newsletter-system-reutilizable/sistema-final/node_modules/sharp');
const fs = require('fs');
const DIR = '/Users/javifeebbo/Desktop/newsletter-system-reutilizable/sistema-final/brands/fitness-park/design-input';

async function cropResize(src, out, { left = 0, top = 0, w, h, outW, outH, q = 82 }) {
  const meta = await sharp(src).metadata();
  const safeLeft = Math.min(Math.max(left, 0), meta.width - w);
  const safeTop = Math.min(Math.max(top, 0), meta.height - h);
  await sharp(src)
    .extract({ left: safeLeft, top: safeTop, width: w, height: h })
    .resize(outW, outH, { fit: 'fill' })
    .jpeg({ quality: q, mozjpeg: true })
    .toFile(out);
  const st = fs.statSync(out);
  console.log(out.split('/').pop(), outW + 'x' + outH, Math.round(st.size / 1024) + 'KB');
}

(async () => {
  // 1. HERO: keep athlete + headroom: crop 2500x790 -> take x=850..2675 (1825 wide), y=0..760, 2.4:1 -> 1200x500
  await cropResize(DIR + '/fphb3.png', DIR + '/hero.jpg', { left: 850, top: 0, w: 1825, h: 760, outW: 1200, outH: 500, q: 80 });

  // 2. APP vertical 3:4 around the phone (phone sits center-left of the 2880x1027 original)
  await cropResize(DIR + '/app-header.jpg', DIR + '/app.jpg', { left: 1150, top: 0, w: 770, h: 1027, outW: 300, outH: 400, q: 82 });
})();
