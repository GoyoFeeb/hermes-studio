// Normaliza el rojo del hero al rojo MSF exacto #EE0000, crop 4:3 -> 16:9 (1200x675) y compresión JPEG q88.
// Uso: node process-hero.js
const sharp = require('/Users/javifeebbo/Desktop/newsletter-system-reutilizable/sistema-final/node_modules/sharp');

const dir = '/Users/javifeebbo/Desktop/newsletter-system-reutilizable/sistema-final/brands/msf/design-input';
const src = dir + '/hero-banner.png';
const out = dir + '/hero-banner-email.jpg';

async function main() {
  // 1) Recolor: píxeles rojos (r>190, g<90, b<90) -> #EE0000 exacto
  const { data, info } = await sharp(src).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  let n = 0;
  for (let i = 0; i < data.length; i += 3) {
    if (data[i] > 190 && data[i + 1] < 90 && data[i + 2] < 90) {
      data[i] = 238; data[i + 1] = 0; data[i + 2] = 0;
      n++;
    }
  }
  console.log('píxeles recoloreados a #EE0000:', n);
  const recolored = Buffer.from(data);
  const pngPath = dir + '/hero-banner-recolored.png';
  await sharp(recolored, { raw: { width: info.width, height: info.height, channels: 3 } }).png().toFile(pngPath);

  // 2) Crop 4:3 -> 16:9 + resize 1200x675 + JPEG q88
  await sharp(pngPath)
    .resize(1200, 675, { fit: 'cover', position: 'centre' })
    .jpeg({ quality: 88, mozjpeg: true })
    .toFile(out);

  const meta = await sharp(out).metadata();
  const fs = require('fs');
  console.log('salida:', out, meta.width + 'x' + meta.height, Math.round(fs.statSync(out).size / 1024) + ' KB');
}
main().catch(e => { console.error(e); process.exit(1); });
