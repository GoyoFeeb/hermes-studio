const sharp = require('sharp');
const path = require('path');

const root = '/Users/javifeebbo/Desktop/newsletter-system-reutilizable/sistema-final';
const src = path.join(root, 'brands/prozis/design-input/prozis-logo-white.svg');
const out = path.join(root, 'newsletters/2026/prozis/hermes/2026-09-24-n7361m/images/prozis-logo.png');

async function main() {
  // Render at 2x for retina: logo is 132x18, render at 264x36
  const svg = require('fs').readFileSync(src);
  await sharp(svg, { density: 300 })
    .resize(264, 36)
    .png()
    .toFile(out);
  const meta = await sharp(out).metadata();
  console.log('logo png:', out, meta.width + 'x' + meta.height);
}
main().catch(e => { console.error(e); process.exit(1); });
