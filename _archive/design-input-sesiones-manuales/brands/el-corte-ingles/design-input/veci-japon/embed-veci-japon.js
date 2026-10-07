// Embed del logo VECI (base64) en la source tokenizada -> final en la raíz del proyecto.
// Uso: node embed-veci-japon.js
const fs = require('fs');
const path = require('path');

const ROOT = '/Users/javifeebbo/Desktop/newsletter-system-reutilizable/sistema-final';
const SRC = path.join(ROOT, 'brands/el-corte-ingles/design-input/veci-japon/veci-japon-source.html');
const LOGO = path.join(ROOT, 'brands/el-corte-ingles/design-input/logo-veci-hor.png');
const OUT = path.join(ROOT, 'viajes-el-corte-ingles-japon-newsletter-email.html');

const html = fs.readFileSync(SRC, 'utf8');
const b64 = Buffer.from(fs.readFileSync(LOGO)).toString('base64');
console.log('Logo b64 length:', b64.length, '| png bytes:', fs.statSync(LOGO).size);

const out = html.replace(/\{\{LOGO_B64\}\}/g, 'data:image/png;base64,' + b64);
if (out.includes('{{')) { console.error('ABORT: quedan tokens sin resolver'); process.exit(1); }
fs.writeFileSync(OUT, out);
console.log('Final escrito:', OUT, fs.statSync(OUT).size + ' bytes');
