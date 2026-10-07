const sharp = require('sharp');
const path = require('path');
const p = '/Users/javifeebbo/Desktop/newsletter-system-reutilizable/sistema-final/newsletters/2026/prozis/hermes/2026-09-24-n7361m/images/prozis-logo.png';

async function main() {
  const { data, info } = await sharp(p).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info;
  // count non-transparent pixels and their colors
  let opaque = 0, white = 0, colored = 0;
  const colorCount = {};
  for (let i = 0; i < data.length; i += channels) {
    const a = data[i + 3];
    if (a > 0) {
      opaque++;
      const r = data[i], g = data[i+1], b = data[i+2];
      if (r > 240 && g > 240 && b > 240) white++;
      else {
        colored++;
        const key = `${r},${g},${b}`;
        colorCount[key] = (colorCount[key]||0)+1;
      }
    }
  }
  console.log('size', width+'x'+height, 'channels', channels);
  console.log('opaque px', opaque, 'white px', white, 'colored px', colored);
  console.log('top colors', Object.entries(colorCount).sort((a,b)=>b[1]-a[1]).slice(0,5));
}
main().catch(e => { console.error(e); process.exit(1); });
