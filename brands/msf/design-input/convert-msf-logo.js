// Convierte el logo oficial de MSF (SVG de msf.es) a PNG para email y muestrea sus colores exactos.
// Uso: node convert-msf-logo.js
const sharp = require('/Users/javifeebbo/Desktop/newsletter-system-reutilizable/sistema-final/node_modules/sharp');
const fs = require('fs');
const path = require('path');

const dir = '/Users/javifeebbo/Desktop/newsletter-system-reutilizable/sistema-final/brands/msf/design-input';
const svg = fs.readFileSync(path.join(dir, 'msf-logo.svg'));

async function main() {
  // Render a 2x del tamaño de visualización en email (~255x118 @1x -> 510x236 @2x; subimos a 600px de ancho para retina)
  const png = await sharp(svg, { density: 300 }).resize(600, null, { fit: 'inside' }).png().toBuffer();
  fs.writeFileSync(path.join(dir, 'msf-logo-email.png'), png);
  const meta = await sharp(png).metadata();
  console.log('PNG:', meta.width + 'x' + meta.height);

  // Muestreo de color dominante (cuantizado) para obtener el rojo exacto del logo
  const { data, info } = await sharp(png).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const hist = new Map();
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i], g = data[i + 1], b = data[i + 2];
    // cuantizar a pasos de 8
    const key = (Math.round(r / 8) * 8) + ',' + (Math.round(g / 8) * 8) + ',' + (Math.round(b / 8) * 8);
    hist.set(key, (hist.get(key) || 0) + 1);
  }
  const top = [...hist.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6);
  const total = data.length / 4;
  for (const [key, count] of top) {
    const [r, g, b] = key.split(',').map(Number);
    console.log(`#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')} (${r},${g},${b}) ${(count / total * 100).toFixed(1)}%`);
  }
}
main().catch(e => { console.error(e); process.exit(1); });
