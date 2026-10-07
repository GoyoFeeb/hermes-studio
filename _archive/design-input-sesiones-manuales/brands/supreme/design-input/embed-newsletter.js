const fs = require('fs');
const path = require('path');

const ROOT = '/Users/javifeebbo/Desktop/newsletter-system-reutilizable/sistema-final';
const SRC = path.join(ROOT, 'brands/supreme/design-input/supreme-prayer-card-source.html');
const OUT = path.join(ROOT, 'supreme-newsletter.html');

function b64(p, mime) {
  const buf = fs.readFileSync(p);
  return 'data:' + mime + ';base64,' + buf.toString('base64');
}

let html = fs.readFileSync(SRC, 'utf-8');
const tokens = {
  '{{LOGO_MASTHEAD}}': b64(path.join(ROOT, 'brands/supreme/design-input/logo-red-450.png'), 'image/png'),
  '{{LOGO_SMALL}}': b64(path.join(ROOT, 'brands/supreme/design-input/logo-red-330.png'), 'image/png'),
  '{{HERO}}': b64(path.join(ROOT, 'brands/supreme/design-input/hero-tee-600.jpg'), 'image/jpeg'),
  '{{PRINT}}': b64(path.join(ROOT, 'brands/supreme/design-input/print-zoom-552.jpg'), 'image/jpeg'),
};
for (const [tok, val] of Object.entries(tokens)) {
  if (!html.includes(tok)) { console.error('ABORT: token missing in source:', tok); process.exit(1); }
  html = html.split(tok).join(val); // global replace
}
if (html.includes('{{')) { console.error('ABORT: unresolved tokens remain'); process.exit(1); }
fs.writeFileSync(OUT, html);
console.log('OK ->', OUT, (fs.statSync(OUT).size / 1024).toFixed(1) + ' KB');
// sanity: magic bytes
const check = (p, prefix) => {
  const b = fs.readFileSync(p);
  const s = b.toString('base64').slice(0, 12);
  console.log(p.split('/').pop(), 'b64 head:', s, s === prefix ? 'OK' : 'CHECK');
};
check(path.join(ROOT, 'brands/supreme/design-input/logo-red-450.png'), 'iVBORw0KGgo');
check(path.join(ROOT, 'brands/supreme/design-input/hero-tee-600.jpg'), '/9j/4AAQSkZJ');
