// Inline base64 de logo + foto editorial en la newsletter standalone de Tarífalo.
const fs = require('fs');
const path = require('path');

const ROOT = '/Users/javifeebbo/Desktop/newsletter-system-reutilizable/sistema-final';
const SRC = path.join(ROOT, 'brands/tarifalo/design-input/tarifalo-newsletter-source.html');
const OUT = path.join(ROOT, 'tarifalo-newsletter.html');
const LOGO = path.join(ROOT, 'brands/tarifalo/design-input/logo-tarifalo.png');
const HOME = path.join(ROOT, 'brands/tarifalo/design-input/editorial-hogar-email.jpg');

let html = fs.readFileSync(SRC, 'utf8');

const logoB64 = fs.readFileSync(LOGO).toString('base64');
const homeB64 = fs.readFileSync(HOME).toString('base64');

if (!logoB64.startsWith('iVBORw0KGgo')) throw new Error('logo: cabecera PNG inesperada');
if (!homeB64.startsWith('/9j/')) throw new Error('foto: cabecera JPG inesperada');

html = html.split('{{LOGO_B64}}').join('data:image/png;base64,' + logoB64);
html = html.split('{{HOME_B64}}').join('data:image/jpeg;base64,' + homeB64);

if (html.includes('{{')) {
  throw new Error('Quedan placeholders sin resolver: ' + html.match(/\{\{[^}]*\}\}/g).join(', '));
}

fs.writeFileSync(OUT, html, 'utf8');
console.log('OK → ' + OUT);
console.log('logo b64: ' + logoB64.length + ' chars | foto b64: ' + homeB64.length + ' chars | total: ' + html.length + ' chars');
