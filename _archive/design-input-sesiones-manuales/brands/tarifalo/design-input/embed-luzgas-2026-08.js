// Embed base64 del logo oficial en la fuente tokenizada y escribe el entregable en la raíz.
// Uso: node embed-luzgas-2026-08.js
const fs = require('fs');
const path = require('path');

const ROOT = '/Users/javifeebbo/Desktop/newsletter-system-reutilizable/sistema-final';
const DI = path.join(ROOT, 'brands/tarifalo/design-input');

const source = fs.readFileSync(path.join(DI, 'tarifalo-luz-gas-source.html'), 'utf8');
const logo = fs.readFileSync(path.join(DI, 'logo-tarifalo-email.png'));
const hero = fs.readFileSync(path.join(DI, 'hero-minuto-email.jpg'));

const logoB64 = logo.toString('base64');
const heroB64 = hero.toString('base64');

// Verificación de cabeceras mágicas antes de escribir
const pngMagic = logo[0] === 0x89 && logo[1] === 0x50 && logo[2] === 0x4e && logo[3] === 0x47;
const jpegMagic = hero[0] === 0xff && hero[1] === 0xd8 && hero[2] === 0xff;
console.log('PNG magic OK:', pngMagic, '| JPEG magic OK:', jpegMagic);
if (!pngMagic || !jpegMagic) process.exit(1);

let html = source
  .split('{{LOGO_B64}}').join('data:image/png;base64,' + logoB64)
  .split('{{HERO_B64}}').join('data:image/jpeg;base64,' + heroB64);

if (html.includes('{{')) {
  console.error('ERROR: quedan tokens sin resolver');
  process.exit(1);
}

const out = path.join(ROOT, 'tarifalo-luz-gas-newsletter.html');
fs.writeFileSync(out, html);
console.log('Escrito:', out, '| bytes:', Buffer.byteLength(html));
console.log('Tokens restantes {{ :', (html.match(/\{\{/g) || []).length);
console.log('Logo b64 bytes:', logoB64.length);
