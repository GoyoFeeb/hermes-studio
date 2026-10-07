// Embed tokens -> base64 data URIs; write final HTML to project root
const fs = require('fs');
const path = require('path');

const ROOT = '/Users/javifeebbo/Desktop/newsletter-system-reutilizable/sistema-final';
const DIR = path.join(ROOT, 'brands/fitness-park/design-input');
const SRC = path.join(DIR, 'fitness-park-newsletter-source.html');
const OUT = path.join(ROOT, 'fitness-park-newsletter.html');

const tokens = {
  '{{HERO}}': 'hero.jpg',
  '{{LOGO_WHITE}}': 'logo-white.png',
  '{{APP}}': 'app.jpg',
  '{{CYCLE}}': 'cycle.jpg',
};

let html = fs.readFileSync(SRC, 'utf8');

for (const [token, file] of Object.entries(tokens)) {
  const imgPath = path.join(DIR, file);
  if (!fs.existsSync(imgPath)) { console.error('MISSING:', file); process.exit(1); }
  const buf = fs.readFileSync(imgPath);
  const ext = path.extname(file).toLowerCase();
  const mime = ext === '.png' ? 'image/png' : 'image/jpeg';
  const b64 = buf.toString('base64');
  const dataUri = `data:${mime};base64,${b64}`;
  if (!html.includes(token)) { console.error('TOKEN NOT FOUND IN SOURCE:', token); process.exit(1); }
  html = html.split(token).join(dataUri);
  console.log('OK', token, '->', file, Math.round(b64.length / 1024) + 'KB');
}

if (html.includes('{{')) { console.error('ABORT: unresolved tokens remain'); process.exit(1); }

fs.writeFileSync(OUT, html, 'utf8');
console.log('FINAL:', OUT, Math.round(html.length / 1024) + 'KB');
