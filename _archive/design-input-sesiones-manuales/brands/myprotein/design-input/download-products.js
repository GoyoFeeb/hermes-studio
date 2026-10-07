const sharp = require('sharp');
const https = require('https');
const path = require('path');

const DIR = '/Users/javifeebbo/Desktop/newsletter-system-reutilizable/sistema-final/brands/myprotein/design-input';

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

(async () => {
  const jobs = [
    { url: 'https://static.thcdn.com/productimg/original/10530943-3905330627160231.png', out: 'product-whey.jpg' },
    { url: 'https://static.thcdn.com/productimg/original/10530050-7665350770386190.jpg', out: 'product-creatina.jpg' },
  ];
  for (const j of jobs) {
    const buf = await get(j.url);
    const outPath = path.join(DIR, j.out);
    await sharp(buf)
      .resize(576, 576, { fit: 'cover', position: 'centre' })
      .jpeg({ quality: 82 })
      .toFile(outPath);
    const m = await sharp(outPath).metadata();
    const stat = require('fs').statSync(outPath);
    console.log('OK', j.out, m.width + 'x' + m.height, Math.round(stat.size / 1024) + 'KB');
  }
})().catch((e) => { console.error(e); process.exit(1); });
