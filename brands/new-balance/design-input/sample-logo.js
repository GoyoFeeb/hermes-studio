// Sample dominant colors from NB favicon.ico (16x16) to determine the official logo color.
// Also render the Wikimedia NB logo SVG to PNG for visual check.
const sharp = require('sharp');
const fs = require('fs');
const path = '/Users/javifeebbo/Desktop/newsletter-system-reutilizable/sistema-final/brands/new-balance/design-input/';

async function main() {
  // 1) favicon -> png (converted by sips first), upscale, sample colors
  const png = await sharp('/tmp/nb-favicon.png').resize(64, 64).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const { data, info } = png;
  const counts = {};
  for (let i = 0; i < data.length; i += info.channels) {
    const r = data[i], g = data[i + 1], b = data[i + 2];
    const key = `${r},${g},${b}`;
    counts[key] = (counts[key] || 0) + 1;
  }
  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 6);
  console.log('FAVICON dominant colors (r,g,b : count):');
  sorted.forEach(([k, v]) => console.log(`  rgb(${k}) : ${v}`));

  // 2) Wikimedia SVG -> transparent PNG
  const svg = fs.readFileSync(path + 'nb-logo-wikimedia.svg');
  await sharp(svg).resize(480, 264).png().toFile(path + 'logo-nb-wikimedia.png');
  console.log('WIKIMEDIA SVG -> logo-nb-wikimedia.png (480x264)');
}
main().catch(e => { console.error(e); process.exit(1); });
