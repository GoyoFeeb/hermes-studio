// embed-archivo.js — sustituye {{LOGO_B64}} por el PNG oficial del monograma NB y
// escribe el final en la raíz del proyecto (el fuente tokenizado vive en design-input/).
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', '..', '..');
const SRC = path.join(__dirname, 'nb-740n-archivo-source.html');
const LOGO = path.join(__dirname, 'logo-nb-oficial-email.png');
const OUT = path.join(ROOT, 'new-balance-740n-archivo.html');

const html = fs.readFileSync(SRC, 'utf8');
const b64 = Buffer.from(fs.readFileSync(LOGO)).toString('base64');
const out = html.split('{{LOGO_B64}}').join('data:image/png;base64,' + b64);

if (out.includes('{{')) {
  console.error('ERROR: quedan tokens sin resolver');
  process.exit(1);
}
fs.writeFileSync(OUT, out);
console.log('OK ->', OUT, (fs.statSync(OUT).size / 1024).toFixed(1) + ' KB');
