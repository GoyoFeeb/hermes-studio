// Convert official NB header logo SVG -> transparent PNG for email masthead
const sharp = require('sharp');
const fs = require('fs');
const dir = '/Users/javifeebbo/Desktop/newsletter-system-reutilizable/sistema-final/brands/new-balance/design-input/';

async function main() {
  const svg = fs.readFileSync(dir + 'nb-logo-oficial.svg');
  // Render high-res, then trim transparent padding, then scale to masthead width
  const { data, info } = await sharp(svg, { density: 300 })
    .resize(1200, null, { fit: 'inside' })
    .png()
    .trim({ threshold: 10 })
    .toBuffer({ resolveWithObject: true });
  console.log('trimmed:', info.width + 'x' + info.height);
  // Save at 3x masthead size (display ~120px wide -> 360px @2x; trim gave natural ratio)
  await sharp(data).resize(360, null, { fit: 'inside' }).png().toFile(dir + 'logo-nb-oficial-email.png');
  const fin = await sharp(dir + 'logo-nb-oficial-email.png').metadata();
  console.log('final:', fin.width + 'x' + fin.height, fin.format);
}
main().catch(e => { console.error(e); process.exit(1); });
