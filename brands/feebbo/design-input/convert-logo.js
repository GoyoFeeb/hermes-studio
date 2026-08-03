// Convierte el logo SVG blanco de Feebbo a PNG transparente para email (los clientes no renderizan SVG).
const sharp = require('sharp');
const path = require('path');

const base = path.join(__dirname, '..', '..', '..'); // raíz del proyecto
const svg = path.join(base, 'brands/feebbo/design-input/feebbo-logo.svg');
const out = path.join(base, 'brands/feebbo/design-input/feebbo-logo-white.png');

async function main() {
  const meta = await sharp(svg).metadata();
  console.log('SVG metadata:', meta.width, 'x', meta.height);
  // 96x38 → 200px de ancho (~2.5:1)
  const w = 200;
  const h = Math.round((meta.height / meta.width) * w);
  await sharp(svg).resize(w, h).png().toFile(out);
  const info = await sharp(out).metadata();
  console.log('PNG out:', out, info.width, 'x', info.height);
}

main().catch(e => { console.error(e); process.exit(1); });
