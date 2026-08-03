// Embebe las imágenes locales de Feebbo como data URIs en feebbo-newsletter.html (preview sin CDN).
// En producción: subir las imágenes a CDN y sustituir los data URIs por URLs HTTPS.
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const src = path.join(root, 'brands/feebbo/design-input/feebbo-newsletter-source.html');
const out = path.join(root, 'feebbo-newsletter.html');
const assets = path.join(root, 'brands/feebbo/design-input');

function b64(file) {
  return 'data:' + (file.endsWith('.png') ? 'image/png' : 'image/jpeg') + ';base64,' +
    Buffer.from(fs.readFileSync(path.join(assets, file))).toString('base64');
}

let html = fs.readFileSync(src, 'utf8');

const logo = b64('feebbo-logo-white.png');
const raid = b64('feebbo-raid-white.jpg');
const equipo = b64('feebbo-equipo-navy.jpg');

html = html.split('{{LOGO_DATA}}').join(logo);
html = html.split('{{IMG_RAID}}').join(raid);
html = html.split('{{IMG_EQUIPO}}').join(equipo);

if (html.includes('{{')) {
  console.error('ERROR: quedan tokens sin resolver');
  process.exit(1);
}

// Verificación de cabeceras base64
if (!logo.startsWith('data:image/png;base64,iVBORw0KGgo')) { console.error('ERROR: logo PNG corrupto'); process.exit(1); }
if (!raid.startsWith('data:image/jpeg;base64,/9j/')) { console.error('ERROR: raid JPG corrupto'); process.exit(1); }
if (!equipo.startsWith('data:image/jpeg;base64,/9j/')) { console.error('ERROR: equipo JPG corrupto'); process.exit(1); }

fs.writeFileSync(out, html);
console.log('OK →', out, (fs.statSync(out).size / 1024).toFixed(0) + ' KB');
