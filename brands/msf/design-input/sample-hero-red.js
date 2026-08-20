// Extrae el tono rojo dominante del hero (r>180, g<90, b<90) + muestra 3 parches recortados para inspección visual
const sharp = require('/Users/javifeebbo/Desktop/newsletter-system-reutilizable/sistema-final/node_modules/sharp');
const fs = require('fs');

const file = '/Users/javifeebbo/Desktop/newsletter-system-reutilizable/sistema-final/brands/msf/design-input/hero-banner.png';
const dir = '/Users/javifeebbo/Desktop/newsletter-system-reutilizable/sistema-final/brands/msf/design-input';

async function main() {
  const { data, info } = await sharp(file).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width: w, height: h } = info;
  const hist = new Map();
  let sum = [0, 0, 0], n = 0;
  for (let i = 0; i < data.length; i += 3) {
    const r = data[i], g = data[i + 1], b = data[i + 2];
    if (r > 180 && g < 90 && b < 90) {
      sum[0] += r; sum[1] += g; sum[2] += b; n++;
      const key = `${Math.round(r / 8) * 8},${Math.round(g / 8) * 8},${Math.round(b / 8) * 8}`;
      hist.set(key, (hist.get(key) || 0) + 1);
    }
  }
  const top = [...hist.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
  console.log('tonos rojos del hero (' + n + ' px):');
  for (const [key, count] of top) {
    const [r, g, b] = key.split(',').map(Number);
    console.log(`  #${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')} (${r},${g},${b}) ${(count / n * 100).toFixed(1)}%`);
  }
  if (n > 0) {
    const avg = sum.map(v => Math.round(v / n));
    console.log('media roja:', `#${avg[0].toString(16).padStart(2, '0')}${avg[1].toString(16).padStart(2, '0')}${avg[2].toString(16).padStart(2, '0')}`, `(${avg.join(',')})`);
  }
}
main().catch(e => { console.error(e); process.exit(1); });
