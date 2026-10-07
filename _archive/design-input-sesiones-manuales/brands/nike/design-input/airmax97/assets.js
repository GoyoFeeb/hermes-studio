// assets.js — prepara logo (swoosh) y crop del archivo histórico para la newsletter Air Max 97
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const DIR = '/Users/javifeebbo/Desktop/newsletter-system-reutilizable/sistema-final/brands/nike/design-input/airmax97';
const SWOOSH = '/Users/javifeebbo/Desktop/newsletter-system-reutilizable/sistema-final/brands/nike/design-input/nike-swoosh.svg';

(async () => {
  // 1) Logo: convertir el swoosh oficial (fill #111111) a PNG transparente a 2x (display 120px -> 240px ancho)
  await sharp(SWOOSH, { density: 300 })
    .resize({ width: 240 })
    .png()
    .toFile(path.join(DIR, 'swoosh-black.png'));
  const meta = await sharp(path.join(DIR, 'swoosh-black.png')).metadata();
  console.log('swoosh-black.png', meta.width + 'x' + meta.height);

  // 2) Crop del archivo histórico: eliminar watermark "dna Department of Nike Archives" (esquina sup-izq)
  //    Imagen 1809x1206; watermark ~y<220, x<420. Crop: y desde 225 hasta el final.
  await sharp(path.join(DIR, 'hist-1.jpg'))
    .extract({ left: 0, top: 225, width: 1809, height: 1206 - 225 })
    .resize({ width: 1200 })
    .jpeg({ quality: 82, mozjpeg: true })
    .toFile(path.join(DIR, 'hist-1-crop.jpg'));
  const m2 = await sharp(path.join(DIR, 'hist-1-crop.jpg')).metadata();
  console.log('hist-1-crop.jpg', m2.width + 'x' + m2.height);

  // 3) Comprobar alpha del logo (esquina sup-izquierda transparente?)
  const rgba = await sharp(path.join(DIR, 'swoosh-black.png')).raw().toBuffer({ resolveWithObject: true });
  const ch = rgba.info.channels;
  const alphaAt = (x, y) => rgba.data[(y * rgba.info.width + x) * ch + (ch - 1)];
  console.log('logo alpha esquinas:', alphaAt(0, 0), alphaAt(rgba.info.width - 1, 0), alphaAt(0, rgba.info.height - 1));
})().catch(e => { console.error('ERR', e.message); process.exit(1); });
