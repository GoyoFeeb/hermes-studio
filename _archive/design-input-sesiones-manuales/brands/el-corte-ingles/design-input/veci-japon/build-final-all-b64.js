// FINAL (previsualización/entrega): TODAS las imágenes en base64 (logo + 4 fotos).
// El CDN de VECI (Akamai) devuelve 403 a clientes sin navegador reconocible,
// así que el archivo de entrega embebe todo para que cargue siempre.
// La variante de email (URLs CDN) la genera embed-veci-japon.js.
// Uso: node build-final-all-b64.js
const fs = require('fs');
const path = require('path');

const ROOT = '/Users/javifeebbo/Desktop/newsletter-system-reutilizable/sistema-final';
const SRC = path.join(ROOT, 'brands/el-corte-ingles/design-input/veci-japon/veci-japon-source.html');
const DIR = path.join(ROOT, 'brands/el-corte-ingles/design-input/veci-japon');
const LOGO = path.join(ROOT, 'brands/el-corte-ingles/design-input/logo-veci-hor.png');
const OUT = path.join(ROOT, 'viajes-el-corte-ingles-japon-newsletter.html');

const swaps = [
  ['{{LOGO_B64}}', LOGO, 'data:image/png;base64,'],
  ['https://cdn.viajeselcorteingles.es/wsimgresize/resize/crop/1200/600/cdn.viajeselcorteingles.es/contenidos/fotos/CIUDADES_990_350/7864.jpg?jpegQuality=95', path.join(DIR, 'tokio.jpg'), 'data:image/jpeg;base64,'],
  ['https://cdn.viajeselcorteingles.es/wsimgresize/resize/crop/480/480/cdn.viajeselcorteingles.es/contenidos/fotos/CIUDADES_990_350/9759095.jpg?jpegQuality=95', path.join(DIR, 'osaka.jpg'), 'data:image/jpeg;base64,'],
  ['https://cdn.viajeselcorteingles.es/wsimgresize/resize/crop/600/400/cdn.viajeselcorteingles.es/contenidos/fotos/CIUDADES_990_350/4032.jpg?jpegQuality=95', path.join(DIR, 'kioto.jpg'), 'data:image/jpeg;base64,'],
  ['https://cdn.viajeselcorteingles.es/wsimgresize/resize/crop/1200/600/cdn.viajeselcorteingles.es/contenidos/fotos/CIUDADES_990_350/22138.jpg?jpegQuality=95', path.join(DIR, 'hakone.jpg'), 'data:image/jpeg;base64,']
];

let html = fs.readFileSync(SRC, 'utf8');
for (const [token, file, prefix] of swaps) {
  const b64 = Buffer.from(fs.readFileSync(file)).toString('base64');
  html = html.split(token).join(prefix + b64);
}
if (html.includes('{{')) { console.error('ABORT: quedan tokens sin resolver'); process.exit(1); }
if (html.includes('cdn.viajeselcorteingles.es')) { console.error('ABORT: quedan URLs CDN sin reemplazar'); process.exit(1); }
fs.writeFileSync(OUT, html);
console.log('FINAL all-b64 escrito:', OUT, fs.statSync(OUT).size + ' bytes');
