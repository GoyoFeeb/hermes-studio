const https = require('https');

function head(url) {
  return new Promise((resolve) => {
    const req = https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
      resolve({ url, code: res.statusCode, type: res.headers['content-type'], len: res.headers['content-length'] });
      res.resume();
    });
    req.on('error', (e) => resolve({ url, error: e.message }));
    req.setTimeout(20000, () => { req.destroy(); resolve({ url, error: 'timeout' }); });
  });
}

(async () => {
  const base = 'https://www.myprotein.es/images?url=';
  const whey = encodeURIComponent('https://static.thcdn.com/productimg/original/10530943-3905330627160231.png');
  const crea = encodeURIComponent('https://static.thcdn.com/productimg/original/10530050-7665350770386190.jpg');
  const tests = [
    base + whey + '&format=jpg&width=600&fit=cover',
    base + whey + '&format=png&width=600&fit=cover',
    base + crea + '&format=jpg&width=600&fit=cover',
    'https://static.thcdn.com/productimg/original/10530050-7665350770386190.jpg',
    'https://static.thcdn.com/productimg/original/10530943-3905330627160231.png',
  ];
  for (const t of tests) {
    const r = await head(t);
    console.log((r.code || 'ERR') + ' ' + (r.type || '-') + ' ' + (r.len || '-') + '  ' + t.slice(0, 130));
  }
})().catch((e) => { console.error(e); process.exit(1); });
