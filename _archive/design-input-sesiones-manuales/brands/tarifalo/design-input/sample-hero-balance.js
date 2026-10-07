// Muestreo de color de la imagen hero (The Open Ledger — verificar paleta)
// Uso: node sample-hero-balance.js
const sharp = require('/Users/javifeebbo/Desktop/newsletter-system-reutilizable/sistema-final/node_modules/sharp');
const path = '/Users/javifeebbo/Desktop/newsletter-system-reutilizable/sistema-final/brands/tarifalo/design-input/hero-balance-email.jpg';

(async () => {
  const img = sharp(path);
  const meta = await img.metadata();
  const { data, info } = await img.raw().toBuffer({ resolveWithObject: true });
  const W = meta.width, H = meta.height;
  const px = (x, y) => {
    const i = (y * W + x) * info.channels;
    return [data[i], data[i + 1], data[i + 2]];
  };
  const hex = (rgb) => '#' + rgb.map(v => v.toString(16).padStart(2, '0')).join('').toUpperCase();
  // Puntos conocidos: fondo esquinas, centro, tarjeta azul (zona donde el vision vio "azul claro")
  const samples = {
    'esquina-superior-izq (fondo)': px(Math.round(W * 0.02), Math.round(H * 0.02)),
    'esquina-superior-der (fondo)': px(Math.round(W * 0.98), Math.round(H * 0.02)),
    'esquina-inferior-izq (fondo)': px(Math.round(W * 0.02), Math.round(H * 0.98)),
    'centro (viga balanza)': px(Math.round(W * 0.5), Math.round(H * 0.5)),
    'zona-casa-40%x-65%y': px(Math.round(W * 0.40), Math.round(H * 0.65)),
    'zona-casa-42%x-60%y': px(Math.round(W * 0.42), Math.round(H * 0.60)),
    'zona-bombilla-38%x-58%y': px(Math.round(W * 0.38), Math.round(H * 0.58)),
  };
  for (const [k, v] of Object.entries(samples)) console.log(k, '=>', hex(v), JSON.stringify(v));
  // Histograma de colores dominantes (top 8 por frecuencia, excluyendo casi-negros/blancos extremos)
  const freq = new Map();
  for (let i = 0; i < data.length; i += info.channels) {
    const r = data[i], g = data[i + 1], b = data[i + 2];
    const key = `${r >> 4},${g >> 4},${b >> 4}`; // cuantizar a 16 niveles
    freq.set(key, (freq.get(key) || 0) + 1);
  }
  const top = [...freq.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8);
  console.log('\nColores dominantes (cuantizados 16 niveles):');
  for (const [key, count] of top) {
    const [r, g, b] = key.split(',').map(v => parseInt(v) * 16 + 8);
    console.log(hex([r, g, b]), `(${r},${g},${b})`, Math.round(count / (data.length / info.channels) * 100) + '%');
  }
})();
