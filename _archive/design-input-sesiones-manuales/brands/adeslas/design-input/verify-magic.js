// Verifica magic bytes reales de las imágenes embed
const fs = require('fs');
const path = require('path');
const html = fs.readFileSync('/Users/javifeebbo/Desktop/newsletter-system-reutilizable/sistema-final/adeslas-newsletter.html', 'utf8');

const uris = [...html.matchAll(/data:(image\/[a-z]+);base64,([A-Za-z0-9+/=]+)/g)];
uris.forEach((m, i) => {
  const buf = Buffer.from(m[2], 'base64');
  const hex = [...buf.slice(0, 12)].map(b => b.toString(16).padStart(2, '0')).join(' ');
  const sig = (buf[0] === 0xff && buf[1] === 0xd8) ? 'JPEG' : (buf[0] === 0x89 && buf[1] === 0x50) ? 'PNG' : 'OTHER';
  console.log(i, m[1], sig, 'bytes=' + buf.length, 'magic=' + hex);
});
