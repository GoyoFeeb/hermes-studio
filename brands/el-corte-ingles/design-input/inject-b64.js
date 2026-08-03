// Inyección de imágenes base64 en viajes-el-corte-ingles-newsletter.html
const fs = require('fs');

const htmlPath = 'viajes-el-corte-ingles-newsletter.html';
let html = fs.readFileSync(htmlPath, 'utf8');

const logo = fs.readFileSync('brands/el-corte-ingles/design-input/logo-veci-hor.png').toString('base64');
const asuan = fs.readFileSync('brands/el-corte-ingles/design-input/egipto-asuan-square.jpg').toString('base64');

console.log('LOGO b64:', logo.length, 'header:', logo.slice(0, 24));
console.log('ASUAN b64:', asuan.length, 'header:', asuan.slice(0, 24));

if (html.split('{{LOGO_B64}}').length !== 2) throw new Error('token LOGO no único');
if (html.split('{{ASUAN_B64}}').length !== 2) throw new Error('token ASUAN no único');
html = html.split('{{LOGO_B64}}').join(logo).split('{{ASUAN_B64}}').join(asuan);
if (html.includes('{{')) throw new Error('quedan tokens sin resolver');

fs.writeFileSync(htmlPath, html);
console.log('Inyectado OK. Tamaño final:', html.length, 'chars');
