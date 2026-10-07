// Prep ASICS GEL-KAYANO 33 assets: render official logo SVG -> transparent PNG, sample hero navy, report.
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const DIR = __dirname;

(async () => {
  // 1. Logo: official Wikimedia SVG (fill #000066) -> transparent PNG, 220px wide
  const svg = fs.readFileSync(path.join(DIR, 'logo.svg'));
  const logoPng = await sharp(svg, { density: 300 }).resize(220, 77).png().toBuffer();
  fs.writeFileSync(path.join(DIR, 'logo.png'), logoPng);
  console.log('logo.png written:', logoPng.length, 'bytes,', (await sharp(logoPng).metadata()).width, 'x', (await sharp(logoPng).metadata()).height);

  // 2. Sample hero press image: a few points (navy gradient area) with independent pipelines
  const heroPath = path.join(DIR, 'hero-press-1920.jpg');
  const meta = await sharp(heroPath).metadata();
  console.log('hero meta:', meta.width, 'x', meta.height);
  const samples = [
    [10, 10, 'top-left'],
    [meta.width - 10, 10, 'top-right'],
    [Math.floor(meta.width / 2), 8, 'top-center'],
    [10, Math.floor(meta.height / 2), 'mid-left'],
    [Math.floor(meta.width / 2), Math.floor(meta.height / 2), 'center']
  ];
  for (const [x, y, label] of samples) {
    try {
      const px = await sharp(heroPath).extract({ left: x, top: y, width: 1, height: 1 }).raw().toBuffer();
      console.log(label, `(${x},${y})`, 'rgb:', px[0], px[1], px[2]);
    } catch (e) {
      console.log(label, 'ERROR', e.message);
    }
  }

  // 3. Sample product-platinum (white bg) corner to confirm pure white
  const platPath = path.join(DIR, 'product-platinum.jpg');
  const pmeta = await sharp(platPath).metadata();
  console.log('platinum meta:', pmeta.width, 'x', pmeta.height);
  const pp = await sharp(platPath).extract({ left: 5, top: 5, width: 1, height: 1 }).raw().toBuffer();
  console.log('platinum corner rgb:', pp[0], pp[1], pp[2]);
})().catch((e) => { console.error(e); process.exit(1); });
