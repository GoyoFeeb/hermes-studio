// check-bg.js — verifica que el fondo de las imágenes coincide con el de su escena
const sharp = require('sharp');

async function check(path, label) {
  const img = sharp(path);
  const { width, height } = await img.metadata();
  const buf = await img.raw().toBuffer();
  const px = (x, y) => { const i = (y * width + x) * 3; return [buf[i], buf[i + 1], buf[i + 2]]; };
  console.log(`${label} [${path}] ${width}x${height}`);
  console.log('  TL', px(8, 8), ' TR', px(width - 8, 8), ' BL', px(8, height - 8), ' BR', px(width - 8, height - 8), ' mid-R', px(width - 40, Math.floor(height / 2)));
}

(async () => {
  await check('nb-740n-05-f2f2f3.jpg', 'scene2 3/4 (esperado ~f2f2f3)');
  await check('jjjjound-740n-editorial.jpg', 'flat-lay (esperado blanco)');
  await check('nb-740n-02-white.jpg', 'hero (esperado blanco)');
})().catch(e => { console.error('ERROR', e.message); process.exit(1); });
