const sharp = require('sharp');
const https = require('https');

function get(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
      if (res.statusCode !== 200) return reject(new Error('HTTP ' + res.statusCode));
      const chunks = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', () => resolve(Buffer.concat(chunks)));
    }).on('error', reject);
  });
}

async function sample(url, points, label) {
  try {
    const buf = await get(url);
    const img = sharp(buf);
    const meta = await img.metadata();
    const { data, info } = await img.raw().toBuffer({ resolveWithObject: true });
    const ch = info.channels;
    function px(x, y) {
      const i = (y * info.width + x) * ch;
      return { r: data[i], g: data[i + 1], b: data[i + 2], a: ch > 3 ? data[i + 3] : 255 };
    }
    const hex = (p) => '#' + [p.r, p.g, p.b].map((v) => v.toString(16).padStart(2, '0')).join('').toUpperCase() + (p.a < 255 ? ' (a=' + p.a + ')' : '');
    console.log(`\n=== ${label} ===`);
    console.log('size:', meta.width + 'x' + meta.height, 'channels:', ch, 'hasAlpha:', meta.hasAlpha);
    for (const [name, x, y] of points) {
      console.log(name.padEnd(28), hex(px(x, y)));
    }
  } catch (e) {
    console.log(`\n=== ${label} === ERROR:`, e.message);
  }
}

(async () => {
  const B = 'https://static.thcdn.com/widgets/83-es/36/original-ES_-_Site_Impact_Week_2__%2816%29-130936.png';
  const W = 'https://static.thcdn.com/productimg/original/10530943-3905330627160231.png'; // Impact Whey Protein
  const C = 'https://static.thcdn.com/productimg/original/10530050-7665350770386190.jpg'; // Creatina
  // Banner 1920x586: left panel dark, center cream, right orange
  await sample(B, [['left-top', 100, 60], ['left-mid', 300, 250], ['center-mid', 960, 300], ['right-mid', 1750, 250], ['orange-btn', 350, 420], ['orange-bright', 1500, 400]], 'BANNER');
  await sample(W, [['tl', 5, 5], ['tr', W.width - 6, 5], ['bl', 5, W.height - 6], ['br', W.width - 6, W.height - 6], ['center', Math.floor(W.width / 2), Math.floor(W.height / 2)]], 'WHEY-PNG');
  await sample(C, [['tl', 5, 5], ['tr', C.width - 6, 5], ['bl', 5, C.height - 6], ['br', C.width - 6, C.height - 6], ['center', Math.floor(C.width / 2), Math.floor(C.height / 2)]], 'CREATINA-JPG');
})().catch((e) => { console.error(e); process.exit(1); });
