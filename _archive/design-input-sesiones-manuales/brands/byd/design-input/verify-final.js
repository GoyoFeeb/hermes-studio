const fs = require('fs');
const path = require('path');

const file = '/Users/javifeebbo/Desktop/newsletter-system-reutilizable/sistema-final/byd-newsletter.html';
const html = fs.readFileSync(file, 'utf8');

console.log('Tamaño:', (fs.statSync(file).size / 1024).toFixed(1), 'KB');
console.log('Tokens sin resolver {{:', (html.match(/\{\{/g) || []).length);

// Extraer TODOS los data URIs y verificar magic bytes
const re = /data:(image\/[a-z+]+);base64,([A-Za-z0-9+/=]+)/g;
let m, n = 0;
const expected = {
  'image/png': [0x89, 0x50, 0x4e, 0x47],
  'image/jpeg': [0xff, 0xd8, 0xff],
};
while ((m = re.exec(html)) !== null) {
  n++;
  const type = m[1];
  const buf = Buffer.from(m[2], 'base64');
  const exp = expected[type];
  const ok = exp.every((b, i) => buf[i] === b);
  console.log('#' + n, type, (buf.length / 1024).toFixed(1) + 'KB', ok ? 'magic OK' : 'MAGIC FAIL');
}
console.log('Total data URIs:', n);
