// embed-class5.js — resuelve {{LOGO_B64}}, {{HERO_B64}}, {{EDITORIAL_B64}} en el source
// tokenizado y escribe el entregable final en la raíz del proyecto.
// Uso: node embed-class5.js
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', '..', '..'); // design-input -> brands -> feebbo -> sistema-final
const SRC = path.join(__dirname, 'feebbo-class5-source.html');
const OUT = path.join(ROOT, 'feebbo-class5-newsletter.html');
const DESIGN = __dirname;

const b64 = (f) => {
  const buf = fs.readFileSync(path.join(DESIGN, f));
  return buf.toString('base64');
};

let html = fs.readFileSync(SRC, 'utf8');
const tokens = {
  '{{LOGO_B64}}': 'data:image/png;base64,' + b64('feebbo-logo-white.png'),
  '{{HERO_B64}}': 'data:image/jpeg;base64,' + b64('class5-hero-email.jpg'),
  '{{EDITORIAL_B64}}': 'data:image/jpeg;base64,' + b64('class5-editorial-email.jpg'),
};

for (const [tok, val] of Object.entries(tokens)) {
  html = html.split(tok).join(val); // global replace (logo aparece 2x: masthead + footer)
}

if (html.includes('{{')) {
  console.error('ABORT: unresolved tokens remain');
  process.exit(1);
}

// magic-byte guard
const magic = (m, prefix) => {
  const re = new RegExp('data:image/' + m + ';base64,([A-Za-z0-9+/=]+)');
  const mm = html.match(re);
  if (!mm) return false;
  const buf = Buffer.from(mm[1], 'base64');
  return prefix.every((b, i) => buf[i] === b);
};
if (!magic('png', [0x89, 0x50, 0x4e, 0x47])) { console.error('ABORT: PNG magic bytes'); process.exit(1); }
if (!magic('jpeg', [0xff, 0xd8, 0xff])) { console.error('ABORT: JPEG magic bytes'); process.exit(1); }

fs.writeFileSync(OUT, html);
console.log('OK -> ' + OUT + ' (' + (fs.statSync(OUT).size / 1024).toFixed(1) + ' KB)');
