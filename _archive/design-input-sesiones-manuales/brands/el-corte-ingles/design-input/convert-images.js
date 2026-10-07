// Conversión imágenes Egipto (CDN VECI) a JPG email-ready
const sharp = require('sharp');
const fs = require('fs');

(async () => {
  // WebP ancho (990x350) -> JPG
  await sharp('/tmp/asuan.jpg').jpeg({ quality: 82 }).toFile('brands/el-corte-ingles/design-input/egipto-nilo-wide.jpg');
  // Los crops cuadrados ya son JPEG; los re-comprimimos a email size
  await sharp('/tmp/asuan-sq.webp').resize(440, 440).jpeg({ quality: 82 }).toFile('brands/el-corte-ingles/design-input/egipto-asuan-square.jpg');
  await sharp('/tmp/luxor-sq.webp').resize(440, 440).jpeg({ quality: 82 }).toFile('brands/el-corte-ingles/design-input/egipto-luxor-square.jpg');
  for (const f of ['egipto-nilo-wide.jpg', 'egipto-asuan-square.jpg', 'egipto-luxor-square.jpg']) {
    const p = 'brands/el-corte-ingles/design-input/' + f;
    const m = await sharp(p).metadata();
    console.log(f, m.width + 'x' + m.height, Math.round(fs.statSync(p).size / 1024) + 'KB');
  }
})().catch((e) => { console.error('ERR', e.message); process.exit(1); });
