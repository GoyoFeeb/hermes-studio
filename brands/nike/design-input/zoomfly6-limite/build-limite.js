// Build newsletter Nike Zoom Fly 6 — "Justo en el límite" (standalone creative brief)
// Lee el fuente tokenizado y las imágenes locales, embele en base64 y
// escribe el HTML final autocontenido en la raíz del proyecto.
const fs = require('fs');
const path = require('path');

const ROOT = '/Users/javifeebbo/Desktop/newsletter-system-reutilizable/sistema-final';
const SRC = path.join(ROOT, 'brands/nike/design-input/zoomfly6-limite');

const logoPath = path.join(ROOT, 'brands/nike/design-input/logo-nike-email.png');
const heroPath = path.join(SRC, 'hero-email.jpg');
const detailPath = path.join(SRC, 'detail-email.jpg');
const pressPath = path.join(SRC, 'press-email.jpg');

const replace = {
  '{{LOGO_B64}}': 'data:image/png;base64,' + fs.readFileSync(logoPath).toString('base64'),
  '{{HERO_B64}}': 'data:image/jpeg;base64,' + fs.readFileSync(heroPath).toString('base64'),
  '{{DETAIL_B64}}': 'data:image/jpeg;base64,' + fs.readFileSync(detailPath).toString('base64'),
  '{{PRESS_B64}}': 'data:image/jpeg;base64,' + fs.readFileSync(pressPath).toString('base64'),
};

let html = fs.readFileSync(path.join(SRC, 'source-newsletter.html'), 'utf8');
let missing = [];
for (const [k, v] of Object.entries(replace)) {
  if (!html.includes(k)) { missing.push(k); continue; }
  html = html.split(k).join(v);
}

// Verificaciones
const leftover = html.match(/\{\{[A-Z_0-9]+\}\}/g) || [];
if (leftover.length > 0 || missing.length > 0) {
  console.error('ERROR: tokens sin resolver:', leftover, missing);
  process.exit(1);
}
if (!html.includes('data:image/png;base64,iVBORw0KGgo')) {
  console.error('ERROR: el base64 del logo no tiene cabecera PNG válida');
  process.exit(1);
}
const jpegCount = (html.match(/data:image\/jpeg;base64,\/9j\//g) || []).length;
if (jpegCount !== 3) {
  console.error('ERROR: se esperaban 3 JPEG embebidos (hero, detalle, prensa), hay', jpegCount);
  process.exit(1);
}

const out = path.join(ROOT, 'nike-zoomfly6-limite-newsletter.html');
fs.writeFileSync(out, html);
const kb = (fs.statSync(out).size / 1024).toFixed(1);
console.log('OK — escrito:', out);
console.log('Tamaño:', kb, 'KB');
console.log('JPEGs embebidos:', jpegCount, '| Logo PNG embebido: sí | Tokens restantes:', leftover.length);
