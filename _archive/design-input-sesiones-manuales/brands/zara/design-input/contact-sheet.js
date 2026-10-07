// Contact sheet de las imágenes de campaña para selección visual
const sharp = require('sharp');
const path = require('path');

const dir = '/Users/javifeebbo/Desktop/newsletter-system-reutilizable/sistema-final/brands/zara/design-input/campania';
const files = [];
for (let i = 1; i <= 12; i++) files.push(path.join(dir, `camp-${String(i).padStart(2, '0')}.jpg`));

async function main() {
  const thumbs = [];
  for (const f of files) {
    const buf = await sharp(f).resize({ width: 360 }).jpeg({ quality: 70 }).toBuffer();
    thumbs.push(buf);
  }
  const sheet = await sharp({
    create: { width: 360 * 4 + 20, height: 200 * 3 + 20, channels: 3, background: '#222222' },
  })
    .composite(
      thumbs.map((b, i) => ({
        input: b,
        top: 10 + Math.floor(i / 4) * 200,
        left: 10 + (i % 4) * 360,
      }))
    )
    .jpeg({ quality: 80 })
    .toFile(path.join(dir, 'contact-sheet.jpg'));
  console.log('OK contact sheet', sheet.width + 'x' + sheet.height);
}

main().catch(e => { console.error(e); process.exit(1); });
