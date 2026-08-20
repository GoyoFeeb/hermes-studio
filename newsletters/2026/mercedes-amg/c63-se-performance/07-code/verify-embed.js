const fs = require('fs');
const path = 'newsletters/2026/mercedes-amg/c63-se-performance/09-exports/final.html';
const html = fs.readFileSync(path, 'utf8');
// data URIs
const uris = [...html.matchAll(/data:image\/([a-z]+);base64,([A-Za-z0-9+/=]+)/g)];
console.log('DATA URIs:', uris.length);
uris.forEach(u => {
  const buf = Buffer.from(u[2], 'base64');
  const magic = buf.slice(0, 8).toString('hex');
  const ok = buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47;
  console.log('  tipo:', u[1], '| bytes:', buf.length, '| PNG magic:', ok ? '✅' : '❌ (' + magic + ')');
});
console.log('{{ sin resolver:', html.includes('{{') ? 'SÍ ❌' : 'no ✅');
console.log('PENDING restantes:', (html.match(/PENDING/g) || []).length);
console.log('logo src ahora:', html.match(/<img[^>]*src="([^"]*logo[^"]*)"/)?.[1]?.slice(0, 60) || '(no img logo directo)');
