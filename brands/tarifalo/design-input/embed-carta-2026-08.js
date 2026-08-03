// Embed base64 de cabecera + logo en la carta, y escribe el entregable final en la raíz.
// Uso: node embed-carta-2026-08.js
const fs = require('fs');
const path = require('path');

const ROOT = '/Users/javifeebbo/Desktop/newsletter-system-reutilizable/sistema-final';
const DI = path.join(ROOT, 'brands/tarifalo/design-input');

const source = fs.readFileSync(path.join(DI, 'tarifalo-carta-personal-source.html'), 'utf8');
const header = fs.readFileSync(path.join(DI, 'header-carta-verano-email.jpg'));
const logo = fs.readFileSync(path.join(DI, 'logo-tarifalo.png'));

const headerB64 = header.toString('base64');
const logoB64 = logo.toString('base64');

// Verificación de cabeceras mágicas antes de escribir
const jpegMagic = header[0] === 0xff && header[1] === 0xd8 && header[2] === 0xff;
const pngMagic = logo[0] === 0x89 && logo[1] === 0x50 && logo[2] === 0x4e && logo[3] === 0x47;
console.log('JPEG magic OK:', jpegMagic, '| PNG magic OK:', pngMagic);
if (!jpegMagic || !pngMagic) process.exit(1);

let html = source
  .split('{{HEADER_B64}}').join('data:image/jpeg;base64,' + headerB64)
  .split('{{LOGO_B64}}').join('data:image/png;base64,' + logoB64);

if (html.includes('{{')) {
  console.error('ERROR: quedan tokens sin resolver');
  process.exit(1);
}

const out = path.join(ROOT, 'tarifalo-carta-personal.html');
fs.writeFileSync(out, html);
console.log('Escrito:', out, '| bytes:', Buffer.byteLength(html));
console.log('Tokens restantes {{ :', (html.match(/\{\{/g) || []).length);
