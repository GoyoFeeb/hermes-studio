// Build del HTML final de MSF: embebe logo + hero en base64 y sustituye placeholders.
// Uso: node build-msf.js
const fs = require('fs');
const path = require('path');

const dir = '/Users/javifeebbo/Desktop/newsletter-system-reutilizable/sistema-final/brands/msf/design-input';
const out = '/Users/javifeebbo/Desktop/newsletter-system-reutilizable/sistema-final/msf-newsletter.html';

let html = fs.readFileSync(path.join(dir, 'msf-source.html'), 'utf8');

const logo = fs.readFileSync(path.join(dir, 'msf-logo-email.png'));
const hero = fs.readFileSync(path.join(dir, 'hero-banner-email.jpg'));
console.log('logo PNG:', Math.round(logo.length / 1024) + ' KB');
console.log('hero JPG:', Math.round(hero.length / 1024) + ' KB');

const logoB64 = logo.toString('base64');
const heroB64 = hero.toString('base64');

html = html.split('{{LOGO_B64}}').join('data:image/png;base64,' + logoB64);
html = html.split('{{HERO_B64}}').join('data:image/jpeg;base64,' + heroB64);

// Placeholders de ESP -> enlaces reales para el standalone (en producción serían merge tags del ESP)
html = html.split('[UNSUBSCRIBE_LINK]').join('https://www.msf.es/tus-datos-personales');
html = html.split('[PREFERENCES_LINK]').join('https://www.msf.es/tus-datos-personales');

// Verificaciones
const tokensLeft = html.match(/\{\{/g);
const bracketsLeft = html.match(/\[(UNSUBSCRIBE_LINK|PREFERENCES_LINK|DIRECCIÓN)/g);
if (tokensLeft) { console.error('ERROR: quedan tokens {{ sin resolver:', tokensLeft.length); process.exit(1); }
if (bracketsLeft) { console.error('ERROR: quedan corchetes:', bracketsLeft); process.exit(1); }

// Magic bytes del base64 embebido
const jpegOk = html.includes('data:image/jpeg;base64,/9j/');
const pngOk = html.includes('data:image/png;base64,iVBOR');
console.log('JPEG header ok:', jpegOk, '| PNG header ok:', pngOk);
if (!jpegOk || !pngOk) { console.error('ERROR: cabeceras base64 incorrectas'); process.exit(1); }

fs.writeFileSync(out, html);
console.log('FINAL:', out, Math.round(fs.statSync(out).size / 1024) + ' KB');
