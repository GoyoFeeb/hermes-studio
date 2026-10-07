const fs = require('fs');
const path = require('path');

const DIR = '/Users/javifeebbo/Desktop/newsletter-system-reutilizable/sistema-final/brands/myprotein/design-input';
const ROOT = '/Users/javifeebbo/Desktop/newsletter-system-reutilizable/sistema-final';

const b64 = (f) => {
  const buf = fs.readFileSync(path.join(DIR, f));
  const b = buf.toString('base64');
  const ext = f.endsWith('.jpg') ? 'jpeg' : 'png';
  return `data:image/${ext};base64,${b}`;
};

const tokens = {
  '{{LOGO_B64}}': b64('logo-black.png'),
  '{{WHEY_B64}}': b64('product-whey.jpg'),
  '{{CREA_B64}}': b64('product-creatina.jpg'),
};

let html = fs.readFileSync(path.join(DIR, 'myprotein-source.html'), 'utf8');
for (const [tok, val] of Object.entries(tokens)) {
  const before = (html.match(new RegExp(tok.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length;
  html = html.split(tok).join(val);
  console.log('replaced', tok, 'x' + before);
}
if (html.includes('{{')) {
  console.error('ABORT: unresolved tokens remain');
  process.exit(1);
}
const out = path.join(ROOT, 'myprotein-newsletter.html');
fs.writeFileSync(out, html);
console.log('WROTE', out, Math.round(html.length / 1024) + 'KB');
