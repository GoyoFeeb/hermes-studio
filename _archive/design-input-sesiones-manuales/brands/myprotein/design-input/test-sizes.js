const https = require('https');

function head(url) {
  return new Promise((resolve) => {
    const req = https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
      resolve({ code: res.statusCode, type: res.headers['content-type'], len: res.headers['content-length'] });
      res.resume();
    });
    req.on('error', (e) => resolve({ error: e.message }));
    req.setTimeout(20000, () => { req.destroy(); resolve({ error: 'timeout' }); });
  });
}

(async () => {
  const variants = [
    'https://static.thcdn.com/productimg/450/10530943-3905330627160231.png',
    'https://static.thcdn.com/productimg/300/10530943-3905330627160231.png',
    'https://static.thcdn.com/productimg/600x600/10530943-3905330627160231.png',
    'https://static.thcdn.com/productimg/thumbnail/10530943-3905330627160231.png',
    'https://static.thcdn.com/productimg/medium/10530050-7665350770386190.jpg',
    'https://static.thcdn.com/productimg/450/10530050-7665350770386190.jpg',
  ];
  for (const u of variants) {
    const r = await head(u);
    console.log((r.code || 'ERR') + ' ' + (r.type || '-') + ' ' + (r.len || '-') + '  ' + u.replace('https://static.thcdn.com/', ''));
  }
})().catch((e) => { console.error(e); process.exit(1); });
