// Muestreo de píxeles del hero generado: esquinas + histograma dominante cuantizado.
// Uso: node sample-hero.js
const sharp = require('/Users/javifeebbo/Desktop/newsletter-system-reutilizable/sistema-final/node_modules/sharp');

const file = '/Users/javifeebbo/Desktop/newsletter-system-reutilizable/sistema-final/brands/msf/design-input/hero-banner.png';

async function main() {
  const { data, info } = await sharp(file).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width: w, height: h } = info;
  console.log('size:', w + 'x' + h);
  const at = (x, y) => {
    const i = (y * w + x) * 3;
    return [data[i], data[i + 1], data[i + 2]];
  };
  const hex = (p) => '#' + p.map(v => v.toString(16).padStart(2, '0')).join('').toUpperCase();
  console.log('esquinas:');
  for (const [x, y] of [[0, 0], [w - 1, 0], [0, h - 1], [w - 1, h - 1], [Math.floor(w / 2), 0], [Math.floor(w / 2), h - 1]]) {
    const p = at(x, y);
    console.log(`  (${x},${y}): ${hex(p)} (${p.join(',')})`);
  }
  // histograma cuantizado (paso 12)
  const hist = new Map();
  for (let i = 0; i < data.length; i += 3) {
    const r = data[i], g = data[i + 1], b = data[i + 2];
    const key = (Math.round(r / 12) * 12) + ',' + (Math.round(g / 12) * 12) + ',' + (Math.round(b / 12) * 12);
    hist.set(key, (hist.get(key) || 0) + 1);
  }
  const top = [...hist.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8);
  const total = data.length / 3;
  console.log('colores dominantes:');
  for (const [key, count] of top) {
    const [r, g, b] = key.split(',').map(Number);
    console.log(`  ${hex([r, g, b])} (${r},${g},${b}) ${(count / total * 100).toFixed(1)}%`);
  }
  // ¿Hay rojo MSF? (r>200, g<60, b<60)
  let red = 0;
  for (let i = 0; i < data.length; i += 3) {
    if (data[i] > 200 && data[i + 1] < 60 && data[i + 2] < 60) red++;
  }
  console.log('píxeles rojos puros:', red, '(' + (red / total * 100).toFixed(1) + '%)');
}
main().catch(e => { console.error(e); process.exit(1); });
