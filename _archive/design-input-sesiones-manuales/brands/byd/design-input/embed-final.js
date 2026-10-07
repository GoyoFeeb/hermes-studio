const fs = require('fs');
const path = require('path');

const DIR = __dirname; // brands/byd/design-input
const ROOT = path.resolve(DIR, '..', '..', '..'); // raíz del proyecto

const src = fs.readFileSync(path.join(DIR, 'byd-newsletter-source.html'), 'utf8');

function b64(file, mime) {
  const buf = fs.readFileSync(path.join(DIR, file));
  return 'data:' + mime + ';base64,' + buf.toString('base64');
}

// Verificar magic bytes de cada fuente
function magic(file, expected) {
  const buf = fs.readFileSync(path.join(DIR, file));
  const ok = expected.every((b, i) => buf[i] === b);
  console.log(file, ok ? 'magic OK' : 'MAGIC FAIL');
  return ok;
}

const allOk = [
  magic('sealion08-hero.png', [0x89, 0x50, 0x4e, 0x47]),
  magic('sealion08-angle2.jpg', [0xff, 0xd8, 0xff]),
  magic('byd-logo.png', [0x89, 0x50, 0x4e, 0x47]),
].every(Boolean);

if (!allOk) {
  console.error('ABORT: magic byte failure');
  process.exit(1);
}

let html = src;
html = html.replace(/\{\{HERO_B64\}\}/g, b64('sealion08-hero.png', 'image/png'));
html = html.replace(/\{\{EDITORIAL_B64\}\}/g, b64('sealion08-angle2.jpg', 'image/jpeg'));
html = html.replace(/\{\{LOGO_B64\}\}/g, b64('byd-logo.png', 'image/png'));

if (html.includes('{{')) {
  console.error('ABORT: unresolved tokens remain');
  process.exit(1);
}

const out = path.join(ROOT, 'byd-newsletter.html');
fs.writeFileSync(out, html);
console.log('Escrito:', out);
console.log('Tamaño:', (fs.statSync(out).size / 1024).toFixed(1), 'KB');
console.log('Logo ocurrencias en data URIs:', (html.match(/data:image\/png;base64/g) || []).length);
