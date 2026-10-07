// Muestreo de color parametrizado: node sample-color.js <imagen> [label]
const sharp = require('/Users/javifeebbo/Desktop/newsletter-system-reutilizable/sistema-final/node_modules/sharp');
const file = process.argv[2];
const label = process.argv[3] || file;

(async () => {
  const meta = await sharp(file).metadata();
  const { data, info } = await sharp(file).raw().toBuffer({ resolveWithObject: true });
  const W = meta.width, H = meta.height;
  const px = (x, y) => {
    const i = (y * W + x) * info.channels;
    return [data[i], data[i + 1], data[i + 2]];
  };
  const hex = (rgb) => '#' + rgb.map(v => v.toString(16).padStart(2, '0')).join('').toUpperCase();
  console.log('===', label, `(${W}x${H}) ===`);
  for (const [k, x, y] of [['sup-izq', 0.02, 0.02], ['sup-der', 0.98, 0.02], ['inf-izq', 0.02, 0.98], ['inf-der', 0.98, 0.98], ['centro', 0.5, 0.5]]) {
    console.log(k, '=>', hex(px(Math.round(W * x), Math.round(H * y))));
  }
  const freq = new Map();
  for (let i = 0; i < data.length; i += info.channels) {
    const key = `${data[i] >> 4},${data[i + 1] >> 4},${data[i + 2] >> 4}`;
    freq.set(key, (freq.get(key) || 0) + 1);
  }
  const top = [...freq.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6);
  console.log('Dominantes:');
  for (const [key, count] of top) {
    const [r, g, b] = key.split(',').map(v => parseInt(v) * 16 + 8);
    console.log(' ', hex([r, g, b]), Math.round(count / (data.length / info.channels) * 100) + '%');
  }
})();
