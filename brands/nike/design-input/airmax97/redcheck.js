// redcheck.js — localiza píxeles rojos saturados en el hero y su bounding box
const sharp = require('sharp');
const path = '/Users/javifeebbo/Desktop/newsletter-system-reutilizable/sistema-final/brands/nike/design-input/airmax97/hero-email.jpg';

(async () => {
  const { data, info } = await sharp(path).raw().toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info;
  const px = (x, y) => {
    const i = (y * width + x) * channels;
    return [data[i], data[i + 1], data[i + 2]];
  };
  let hits = 0, minX = width, maxX = 0, minY = height, maxY = 0;
  for (let y = 0; y < height; y += 2) {
    for (let x = 0; x < width; x += 2) {
      const [r, g, b] = px(x, y);
      if (r > 140 && g < 100 && b < 100 && (r - g) > 60) {
        hits++;
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  console.log(JSON.stringify({ width, height, hits, bbox: { minX, minY, maxX, maxY } }));
  // Muestra el píxel medio en la zona del talón (parte derecha baja de la zapatilla) y en el reflejo del agua
  const samples = {
    talonAlto: px(850, 420), talonMedio: px(900, 500), talonBajo: px(880, 560),
    aguaDer: px(950, 700), aguaIzq: px(300, 700), centroSuela: px(700, 540),
  };
  console.log(JSON.stringify(samples));
})().catch(e => { console.error(e.message); process.exit(1); });
