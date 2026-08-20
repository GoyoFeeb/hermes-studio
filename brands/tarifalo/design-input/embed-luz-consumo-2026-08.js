// Embed base64 (logo PNG + hero JPG) en la fuente tokenizada -> final en la raíz del sistema.
// Uso: node embed-luz-consumo-2026-08.js
const fs = require('fs');
const path = require('path');

const SYS = '/Users/javifeebbo/Desktop/newsletter-system-reutilizable/sistema-final';
const SRC = path.join(SYS, 'brands/tarifalo/design-input/tarifalo-luz-consumo-source.html');
const LOGO = path.join(SYS, 'brands/tarifalo/design-input/logo-tarifalo-email.png');
const HERO = path.join(SYS, 'brands/tarifalo/design-input/hero-balance-email.jpg');
const OUT = path.join(SYS, 'tarifalo-luz-consumo-newsletter.html');

const b64 = (p) => Buffer.from(fs.readFileSync(p)).toString('base64');
const magic = (buf) => [buf[0], buf[1], buf[2], buf[3]];

const logoBuf = fs.readFileSync(LOGO);
const heroBuf = fs.readFileSync(HERO);
// PNG: 89 50 4E 47 ; JPEG: FF D8 FF E0
const logoOK = magic(logoBuf).join(',') === '137,80,78,71';
const heroOK = (heroBuf[0] === 0xFF && heroBuf[1] === 0xD8 && heroBuf[2] === 0xFF);
console.log('logo magic:', magic(logoBuf), logoOK ? 'OK PNG' : 'FALLO');
console.log('hero magic:', [heroBuf[0], heroBuf[1], heroBuf[2], heroBuf[3]].join(','), heroOK ? 'OK JPEG' : 'FALLO');
if (!logoOK || !heroOK) { console.error('ABORT: magic bytes incorrectos'); process.exit(1); }

let html = fs.readFileSync(SRC, 'utf8');
html = html.replace('{{LOGO_B64}}', 'data:image/png;base64,' + b64(LOGO));
html = html.replace('{{HERO_B64}}', 'data:image/jpeg;base64,' + b64(HERO));

if (html.includes('{{')) {
  console.error('ABORT: quedan tokens sin resolver:', html.match(/\{\{[^}]+\}\}/g));
  process.exit(1);
}
fs.writeFileSync(OUT, html);
console.log('OK ->', OUT, (fs.statSync(OUT).size / 1024).toFixed(1) + ' KB');
