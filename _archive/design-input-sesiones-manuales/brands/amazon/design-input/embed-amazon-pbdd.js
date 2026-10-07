// Embed base64 images into amazon-pbdd source -> final at project root.
// Run: node <this-file>.js  (script file, no approval gate)
const fs = require('fs');
const path = require('path');

const ROOT = '/Users/javifeebbo/Desktop/newsletter-system-reutilizable/sistema-final';
const SRC = path.join(ROOT, 'brands/amazon/design-input/amazon-pbdd-source.html');
const OUT = path.join(ROOT, 'amazon-fiesta-ofertas-prime-newsletter.html');

const b64 = (p, mime) => 'data:' + mime + ';base64,' + fs.readFileSync(path.join(ROOT, 'brands/amazon/design-input', p)).toString('base64');

let html = fs.readFileSync(SRC, 'utf8');
html = html.split('{{LOGO_B64}}').join(b64('amazon-logo-white.png', 'image/png'));
html = html.split('{{GIFTBAND_B64}}').join(b64('giftbox-band.jpg', 'image/jpeg'));
html = html.split('{{BOXB64}}').join(b64('box-arriving.jpg', 'image/jpeg'));

if (html.includes('{{')) {
  console.error('ABORT: unresolved tokens remain');
  process.exit(1);
}
fs.writeFileSync(OUT, html);
console.log('final written:', OUT, html.length + ' bytes');

// sanity: magic bytes of each embedded uri
const uris = [...html.matchAll(/data:(image\/[a-z]+);base64,([A-Za-z0-9+/=]+)/g)];
for (const m of uris) {
  const buf = Buffer.from(m[2], 'base64');
  const hex = buf.slice(0, 4).toString('hex');
  console.log(m[1], buf.length + 'B', 'magic=' + hex, 'ok=' + (hex === '89504e47' || hex === 'ffd8ffe0' || hex === 'ffd8ffdb' || hex === 'ffd8ffee'));
}
