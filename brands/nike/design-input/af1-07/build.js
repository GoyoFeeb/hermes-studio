// build.js — Inyecta el logo Nike (PNG oficial) en base64 y escribe el HTML final.
// Uso: node build.js
const fs = require('fs');
const path = require('path');

const ROOT = '/Users/javifeebbo/Desktop/newsletter-system-reutilizable/sistema-final';
const SRC = path.join(ROOT, 'brands/nike/design-input/af1-07/source-newsletter.html');
const LOGO = path.join(ROOT, 'brands/nike/design-input/logo-nike-email.png');
const OUT = path.join(ROOT, 'nike-air-force-1-07.html');

const html = fs.readFileSync(SRC, 'utf8');
const logoB64 = fs.readFileSync(LOGO).toString('base64');

if (!logoB64.startsWith('iVBORw0KGgo')) {
  console.error('ERROR: el logo no es un PNG válido (cabecera inesperada).');
  process.exit(1);
}

const final = html.replace('{{LOGO_B64}}', 'data:image/png;base64,' + logoB64);

if (final.includes('{{LOGO_B64}}')) {
  console.error('ERROR: el placeholder del logo sigue sin resolver.');
  process.exit(1);
}

fs.writeFileSync(OUT, final);
console.log('OK ->', OUT);
console.log('Logo base64 embebido:', logoB64.length, 'chars');
