// Verifica el canal alfa del logo PNG y, si tiene caja blanca, lo reconvierte desde el SVG oficial.
// Uso: node check-logo.js
const sharp = require('sharp');
const path = require('path');

const BASE = '/Users/javifeebbo/Desktop/newsletter-system-reutilizable/sistema-final/brands/tarifalo/design-input';
const PNG = path.join(BASE, 'logo-tarifalo.png');
const SVG = path.join(BASE, 'logo-tarifalo.svg');
const OUT = path.join(BASE, 'logo-tarifalo-email.png');

(async () => {
  const meta = await sharp(PNG).metadata();
  console.log('PNG actual:', meta.width + 'x' + meta.height, 'hasAlpha:', meta.hasAlpha);

  // Muestrear 4 esquinas para comprobar transparencia real
  const { data, info } = await sharp(PNG).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const w = info.width, h = info.height;
  const corners = [
    [0, 0], [w - 1, 0], [0, h - 1], [w - 1, h - 1],
    [Math.floor(w / 2), 0], [0, Math.floor(h / 2)]
  ];
  for (const [x, y] of corners) {
    const idx = (y * w + x) * 4;
    console.log(`px(${x},${y}) rgba(${data[idx]},${data[idx + 1]},${data[idx + 2]},${data[idx + 3]})`);
  }

  // ¿Tiene transparencia real? Si no, reconvertir desde SVG oficial
  const hasTransparency = corners.some(([x, y]) => {
    const idx = (y * w + x) * 4;
    return data[idx + 3] < 250;
  });

  if (!hasTransparency) {
    console.log('Sin transparencia real -> reconvirtiendo desde SVG oficial (crema sobre transparente)');
    await sharp(SVG, { density: 300 }).resize(352, 78).png().toFile(OUT);
    const m2 = await sharp(OUT).metadata();
    const { data: d2 } = await sharp(OUT).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    const i2 = (0 * m2.width + 0) * 4;
    console.log('Nuevo PNG:', m2.width + 'x' + m2.height, 'esquina(0,0) alpha:', d2[i2 + 3]);
  } else {
    console.log('El PNG actual ya tiene transparencia -> se usa tal cual');
    require('fs').copyFileSync(PNG, OUT);
  }
})();
