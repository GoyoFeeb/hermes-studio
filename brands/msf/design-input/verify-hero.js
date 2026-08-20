// Verificación final del hero comprimido: esquinas + rojo dominante
const sharp = require('/Users/javifeebbo/Desktop/newsletter-system-reutilizable/sistema-final/node_modules/sharp');

const file = '/Users/javifeebbo/Desktop/newsletter-system-reutilizable/sistema-final/brands/msf/design-input/hero-banner-email.jpg';

async function main() {
  const { data, info } = await sharp(file).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width: w, height: h } = info;
  const at = (x, y) => {
    const i = (y * w + x) * 3;
    return [data[i], data[i + 1], data[i + 2]];
  };
  const hex = (p) => '#' + p.map(v => v.toString(16).padStart(2, '0')).join('').toUpperCase();
  console.log('size:', w + 'x' + h);
  for (const [x, y] of [[0, 0], [w - 1, 0], [0, h - 1], [w - 1, h - 1]]) {
    console.log(`  corner (${x},${y}): ${hex(at(x, y))}`);
  }
  const hist = new Map();
  let redSum = [0, 0, 0], redN = 0;
  for (let i = 0; i < data.length; i += 3) {
    const r = data[i], g = data[i + 1], b = data[i + 2];
    if (r > 190 && g < 90 && b < 90) {
      redSum[0] += r; redSum[1] += g; redSum[2] += b; redN++;
      const key = `${Math.round(r / 4) * 4},${Math.round(g / 4) * 4},${Math.round(b / 4) * 4}`;
      hist.set(key, (hist.get(key) || 0) + 1);
    }
  }
  const top = [...hist.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3);
  console.log('tonos rojos (' + redN + ' px):');
  for (const [key, count] of top) {
    const [r, g, b] = key.split(',').map(Number);
    console.log(`  ${hex([r, g, b])} (${r},${g},${b}) ${(count / redN * 100).toFixed(1)}%`);
  }
  if (redN) {
    const avg = redSum.map(v => Math.round(v / redN));
    console.log('media roja:', hex(avg), `(${avg.join(',')})`);
  }
}
main().catch(e => { console.error(e); process.exit(1); });
