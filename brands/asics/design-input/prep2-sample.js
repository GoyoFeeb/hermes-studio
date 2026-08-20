// Sample press-hero bottom edge + PLATINUM glow green accent.
const sharp = require('sharp');
const path = require('path');
const DIR = __dirname;

(async () => {
  const heroPath = path.join(DIR, 'hero-press-1920.jpg');
  const meta = await sharp(heroPath).metadata();
  const pts = [
    ['bottom-left', 10, meta.height - 10],
    ['bottom-center', Math.floor(meta.width / 2), meta.height - 10],
    ['bottom-right', meta.width - 10, meta.height - 10],
    ['lower-left-quarter', 10, Math.floor(meta.height * 0.72)],
    ['lower-center', Math.floor(meta.width / 2), Math.floor(meta.height * 0.72)]
  ];
  for (const [label, x, y] of pts) {
    const px = await sharp(heroPath).extract({ left: x, top: y, width: 1, height: 1 }).raw().toBuffer();
    console.log('hero', label, `(${x},${y})`, 'rgb:', px[0], px[1], px[2]);
  }

  // Glow green: scan the whole PLATINUM image for lime-ish pixels (relaxed filter)
  const platPath = path.join(DIR, 'product-platinum.jpg');
  const pmeta = await sharp(platPath).metadata();
  const { data, info } = await sharp(platPath).raw().toBuffer({ resolveWithObject: true });
  const hist = {};
  for (let i = 0; i < data.length; i += info.channels) {
    const r = data[i], g = data[i + 1], b = data[i + 2];
    if (g > 140 && g > r + 15 && b < g - 25 && r > 100) {
      const key = `${Math.round(r / 6) * 6},${Math.round(g / 6) * 6},${Math.round(b / 6) * 6}`;
      hist[key] = (hist[key] || 0) + 1;
    }
  }
  const top = Object.entries(hist).sort((a, b) => b[1] - a[1]).slice(0, 8);
  console.log('glow candidates (r,g,b bucket -> count):', JSON.stringify(top));
  if (top.length) {
    const [r, g, b] = top[0][0].split(',').map(Number);
    const hex = '#' + [r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('').toUpperCase();
    console.log('GLOW_HEX approx:', hex);
  }
})().catch((e) => { console.error(e); process.exit(1); });
