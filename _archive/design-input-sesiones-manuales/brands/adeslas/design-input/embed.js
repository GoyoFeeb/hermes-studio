// Embed base64 de logo + fotos en la newsletter Adeslas
const fs = require('fs');
const path = require('path');

const base = '/Users/javifeebbo/Desktop/newsletter-system-reutilizable/sistema-final/brands/adeslas/design-input';
const p1 = fs.readFileSync(path.join(base, 'source-p1.html'), 'utf8');
const p2 = fs.readFileSync(path.join(base, 'source-p2.html'), 'utf8');
let html = p1 + p2;

const b64 = (p) => {
  const buf = fs.readFileSync(path.join(base, p));
  const mime = p.endsWith('.png') ? 'image/png' : 'image/jpeg';
  return 'data:' + mime + ';base64,' + buf.toString('base64');
};

html = html.replace(/\{\{LOGO\}\}/g, b64('email/adeslas-logo.png'));
html = html.replace(/\{\{CONSULTA_IMG\}\}/g, b64('email/consulta-600.jpg'));
html = html.replace(/\{\{HERO_IMG\}\}/g, b64('email/hero-600.jpg'));

if (html.includes('{{')) { console.error('ABORT: unresolved tokens remain'); process.exit(1); }

const out = '/Users/javifeebbo/Desktop/newsletter-system-reutilizable/sistema-final/adeslas-newsletter.html';
fs.writeFileSync(out, html);
console.log('OK ->', out, html.length, 'bytes');
// verificación magic bytes
const checks = {
  LOGO: html.indexOf('data:image/png;base64,iVBOR') !== -1,
  CONSULTA: html.indexOf('data:image/jpeg;base64,/9j/4AAQ') !== -1,
  HERO: (html.match(/data:image\/jpeg;base64,/g) || []).length >= 2
};
console.log('checks:', JSON.stringify(checks));
