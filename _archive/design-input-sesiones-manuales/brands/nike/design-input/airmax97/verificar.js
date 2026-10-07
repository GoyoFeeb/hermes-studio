// verificar.js — verifica magic bytes de todos los data URIs y que cada img decodifica correctamente
const fs = require('fs');
const path = require('path');

const FILE = '/Users/javifeebbo/Desktop/newsletter-system-reutilizable/sistema-final/nike-airmax97-newsletter.html';
const html = fs.readFileSync(FILE, 'utf8');

const uris = [...html.matchAll(/data:(image\/[a-z+]+);base64,([A-Za-z0-9+/=]+)/g)];
console.log('data URIs encontrados:', uris.length);

const expectations = {
  'image/png': [0x89, 0x50, 0x4e, 0x47],
  'image/jpeg': [0xff, 0xd8, 0xff, 0xe0],
};

uris.forEach((m, i) => {
  const mime = m[1];
  const buf = Buffer.from(m[2], 'base64');
  const magic = Array.from(buf.subarray(0, 4));
  const expected = expectations[mime] || [];
  const ok = expected.length && magic.every((b, j) => b === expected[j]);
  console.log(`#${i + 1} ${mime} bytes=${buf.length} magic=${magic.map(b => b.toString(16).padStart(2, '0')).join(' ')} ${ok ? 'OK' : 'FAIL'}`);
});

// Token sin resolver
const tokens = (html.match(/\{\{/g) || []).length;
console.log('tokens {{ sin resolver:', tokens);
