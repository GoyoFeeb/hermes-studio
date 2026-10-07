// embed-feebbo-b2b.js — resuelve {{LOGO_B64}}, {{SCATTER_B64}}, {{RAID_B64}}, {{EQUIPO_B64}}
// en el source tokenizado y escribe el entregable final en la raíz del proyecto.
// Uso: node embed-feebbo-b2b.js
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', '..', '..'); // design-input -> brands -> feebbo -> sistema-final
const SRC = path.join(__dirname, 'feebbo-b2b-source.html');
const OUT = path.join(ROOT, 'feebbo-b2b-newsletter.html');
const DESIGN = __dirname;

const b64 = (f, mime) => {
  const buf = fs.readFileSync(path.join(DESIGN, f));
  return 'data:' + mime + ';base64,' + buf.toString('base64');
};

let html = fs.readFileSync(SRC, 'utf8');
const tokens = {
  '{{LOGO_B64}}': b64('feebbo-logo-white.png', 'image/png'),
  '{{SCATTER_B64}}': b64('class5-editorial-email.jpg', 'image/jpeg'),
  '{{RAID_B64}}': b64('feebbo-raid-navy.jpg', 'image/jpeg'),
  '{{EQUIPO_B64}}': b64('feebbo-equipo-bridge.jpg', 'image/jpeg'),
};

for (const [tok, val] of Object.entries(tokens)) {
  html = html.split(tok).join(val); // global replace (logo aparece 2x)
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
