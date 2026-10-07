// Verifica transparencia del PNG del logo y muestrea píxeles del emblema rojo.
// Uso: node sample-msf-logo.js
const sharp = require('/Users/javifeebbo/Desktop/newsletter-system-reutilizable/sistema-final/node_modules/sharp');

const file = '/Users/javifeebbo/Desktop/newsletter-system-reutilizable/sistema-final/brands/msf/design-input/msf-logo-email.png';

async function main() {
  const { data, info } = await sharp(file).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width: w, height: h } = info;
  const at = (x, y) => {
    const i = (y * w + x) * 4;
    return [data[i], data[i + 1], data[i + 2], data[i + 3]];
  };
  console.log('size:', w + 'x' + h);
  // Esquinas (transparencia)
  for (const [x, y] of [[0, 0], [w - 1, 0], [0, h - 1], [w - 1, h - 1]]) {
    console.log(`corner (${x},${y}): rgba(${at(x, y).join(',')})`);
  }
  // Buscar píxeles rojos puros (r > 200, g < 60, b < 60) y devolver el más frecuente
  const hist = new Map();
  let maxKey = null, maxCount = 0;
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i], g = data[i + 1], b = data[i + 2], a = data[i + 3];
    if (a > 200 && r > 180 && g < 90 && b < 90) {
      const key = `${r},${g},${b}`;
      const c = (hist.get(key) || 0) + 1;
      hist.set(key, c);
      if (c > maxCount) { maxCount = c; maxKey = key; }
    }
  }
  if (maxKey) {
    const [r, g, b] = maxKey.split(',').map(Number);
    console.log(`rojo dominante del emblema: #${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')} (${r},${g},${b}) — ${maxCount} px`);
  } else {
    console.log('no se encontraron píxeles rojos puros');
  }
}
main().catch(e => { console.error(e); process.exit(1); });
