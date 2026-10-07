// Genera copia PREVIEW con imágenes en base64 (el CDN de VECI bloquea headless/bots).
// La FINAL conserva URLs CDN HTTPS (norma del usuario). Uso: node build-preview.js
const fs = require('fs');
const path = require('path');

const ROOT = '/Users/javifeebbo/Desktop/newsletter-system-reutilizable/sistema-final';
const FINAL = path.join(ROOT, 'viajes-el-corte-ingles-japon-newsletter.html');
const PREVIEW = path.join(ROOT, 'viajes-el-corte-ingles-japon-newsletter-PREVIEW.html');
const DIR = path.join(ROOT, 'brands/el-corte-ingles/design-input/veci-japon');

const swaps = [
  ['https://cdn.viajeselcorteingles.es/wsimgresize/resize/crop/1200/600/cdn.viajeselcorteingles.es/contenidos/fotos/CIUDADES_990_350/7864.jpg?jpegQuality=95', 'tokio.jpg'],
  ['https://cdn.viajeselcorteingles.es/wsimgresize/resize/crop/480/480/cdn.viajeselcorteingles.es/contenidos/fotos/CIUDADES_990_350/9759095.jpg?jpegQuality=95', 'osaka.jpg'],
  ['https://cdn.viajeselcorteingles.es/wsimgresize/resize/crop/600/400/cdn.viajeselcorteingles.es/contenidos/fotos/CIUDADES_990_350/4032.jpg?jpegQuality=95', 'kioto.jpg'],
  ['https://cdn.viajeselcorteingles.es/wsimgresize/resize/crop/1200/600/cdn.viajeselcorteingles.es/contenidos/fotos/CIUDADES_990_350/22138.jpg?jpegQuality=95', 'hakone.jpg']
];

let html = fs.readFileSync(FINAL, 'utf8');
for (const [url, file] of swaps) {
  const b64 = Buffer.from(fs.readFileSync(path.join(DIR, file))).toString('base64');
  html = html.split(url).join('data:image/jpeg;base64,' + b64);
}
if (html.includes('wsimgresize')) { console.error('ABORT: quedan URLs CDN sin reemplazar'); process.exit(1); }
fs.writeFileSync(PREVIEW, html);
console.log('PREVIEW escrito:', PREVIEW, fs.statSync(PREVIEW).size + ' bytes');
