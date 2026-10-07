// sample-colors.js — muestreo determinista de colores del producto NB 740N
// (scene7 oficial con fondo blanco) para derivar tonos de escena verificados.
const sharp = require('sharp');

async function corners(path) {
  const img = sharp(path);
  const meta = await img.metadata();
  const { width, height } = meta;
  const buf = await img.raw().toBuffer();
  const px = (x, y) => { const i = (y * width + x) * 3; return [buf[i], buf[i + 1], buf[i + 2]]; };
  console.log(`\n[${path}] ${width}x${height}`);
  console.log('  corner(8,8)      =', px(8, 8));
  console.log('  corner(w-8,8)    =', px(width - 8, 8));
  console.log('  corner(8,h-8)    =', px(8, height - 8));
  console.log('  corner(w-8,h-8)  =', px(width - 8, height - 8));
  console.log('  mid-right bg     =', px(width - 40, Math.floor(height / 2)));
  return { width, height, buf };
}

async function dominantRegion(path, region) {
  const { width, height, buf } = await corners(path);
  const [x0, x1, y0, y1] = region; // fracciones 0..1
  const counts = {};
  for (let y = Math.floor(height * y0); y < height * y1; y += 5) {
    for (let x = Math.floor(width * x0); x < width * x1; x += 5) {
      const i = (y * width + x) * 3;
      const r = buf[i], g = buf[i + 1], b = buf[i + 2];
      if (r > 238 && g > 238 && b > 238) continue; // salta fondo blanco
      const key = `${Math.round(r / 12) * 12},${Math.round(g / 12) * 12},${Math.round(b / 12) * 12}`;
      counts[key] = (counts[key] || 0) + 1;
    }
  }
  const top = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 10);
  console.log(`  dominantes zona [x ${x0}-${x1}, y ${y0}-${y1}] (cuantizado 12):`);
  top.forEach(([k, v]) => console.log('   rgb(' + k + ') x' + v));
}

(async () => {
  await dominantRegion('nb-740n-02-white.jpg', [0.18, 0.82, 0.28, 0.80]);
  await dominantRegion('nb-740n-05-white.jpg', [0.15, 0.85, 0.25, 0.82]);
})().catch(e => { console.error('ERROR', e.message); process.exit(1); });
