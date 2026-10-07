const fs = require('fs');
const path = require('path');

const ROOT = '/Users/javifeebbo/Desktop/newsletter-system-reutilizable/sistema-final';
const BASE = path.join(ROOT, 'brands/accion-contra-el-hambre/design-input');

const source = fs.readFileSync(path.join(BASE, 'source.html'), 'utf8');
const logo = fs.readFileSync(path.join(BASE, 'logo-header.png'));
const b64 = logo.toString('base64');
const dataUri = 'data:image/png;base64,' + b64;

let html = source.replace('{{LOGO_B64}}', dataUri);

// Verificación: no deben quedar tokens
const leftover = html.match(/\{\{/g);
if (leftover) {
  console.error('ERROR: quedan tokens sin resolver:', leftover.length);
  process.exit(1);
}
// El base64 debe empezar por la cabecera PNG correcta
if (!b64.startsWith('iVBORw0KGgo')) {
  console.error('ERROR: la cabecera base64 del PNG no es válida');
  process.exit(1);
}

const out = path.join(ROOT, 'accion-contra-el-hambre-newsletter.html');
fs.writeFileSync(out, html);
console.log('OK final escrito en', out);
console.log('Tamaño:', fs.statSync(out).size, 'bytes');
console.log('Tokens restantes:', (html.match(/\{\{/g) || []).length);
