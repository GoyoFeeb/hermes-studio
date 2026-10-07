// Build: inyecta las imágenes oficiales (base64) en el template y escribe el HTML final.
const fs = require('fs');
const path = require('path');

const DIR = __dirname;
const OPT = '/tmp/mp/opt';

function b64(file) {
  const buf = fs.readFileSync(path.join(OPT, file));
  const ext = path.extname(file).toLowerCase();
  const mime = ext === '.png' ? 'image/png' : 'image/jpeg';
  return `data:${mime};base64,${buf.toString('base64')}`;
}

let html = fs.readFileSync(path.join(DIR, 'template.html'), 'utf8');

html = html.replace('{{LOGO}}', b64('logo.png'));
html = html.replace('{{CRISPS}}', b64('crisps.jpg'));
html = html.replace('{{WHEY}}', b64('whey.jpg'));

// Detectar placeholders sin resolver
const left = html.match(/\{\{[A-Z_]+\}\}/g) || [];
if (left.length) {
  console.error('ERROR placeholders sin resolver:', left);
  process.exit(1);
}

const out = path.join(DIR, 'myprotein-haz-acopio.html');
fs.writeFileSync(out, html);
console.log('OK ->', out, (fs.statSync(out).size / 1024).toFixed(0) + 'KB');