// build-airmax97.js — embebe logo, hero e imagen de archivo en base64 y escribe el HTML final
const fs = require('fs');
const path = require('path');

const DIR = '/Users/javifeebbo/Desktop/newsletter-system-reutilizable/sistema-final/brands/nike/design-input/airmax97';
const OUT = '/Users/javifeebbo/Desktop/newsletter-system-reutilizable/sistema-final/nike-airmax97-newsletter.html';

const b64 = (file, mime) => 'data:' + mime + ';base64,' + fs.readFileSync(path.join(DIR, file)).toString('base64');

let html = fs.readFileSync(path.join(DIR, 'source-newsletter.html'), 'utf8');

const tokens = {
  '{{LOGO_B64}}': b64('swoosh-black.png', 'image/png'),
  '{{HERO_B64}}': b64('hero-email.jpg', 'image/jpeg'),
  '{{HIST_B64}}': b64('hist-1-crop.jpg', 'image/jpeg'),
};

for (const [tok, val] of Object.entries(tokens)) {
  const re = new RegExp(tok.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
  html = html.replace(re, val);
}

if (html.includes('{{')) {
  console.error('ABORT: unresolved tokens remain');
  process.exit(1);
}

fs.writeFileSync(OUT, html);
console.log('OK ->', OUT, (fs.statSync(OUT).size / 1024).toFixed(0) + ' KB');

// Verificación de magic bytes de los data URIs
const magic = (prefix) => {
  const idx = html.indexOf(prefix);
  if (idx === -1) return 'not found';
  const start = html.indexOf('base64,', idx) + 7;
  const buf = Buffer.from(html.slice(start, start + 64), 'base64');
  return Array.from(buf.subarray(0, 4)).map(b => b.toString(16).padStart(2, '0')).join(' ');
};
console.log('png magic:', magic('data:image/png;base64,'));
console.log('jpg magic:', magic('data:image/jpeg;base64,'));
