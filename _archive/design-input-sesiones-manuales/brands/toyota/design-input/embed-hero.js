// Embebe logo + hero como base64 data URIs en el HTML final (standalone newsletter Toyota RAV4).
// El final vive en la raíz del sistema; la fuente tokenizada se queda en design-input/.
const fs = require('fs');
const path = require('path');

const ROOT = '/Users/javifeebbo/Desktop/newsletter-system-reutilizable/sistema-final';
const SRC = path.join(ROOT, 'brands/toyota/design-input/toyota-rav4-source.html');
const OUT = path.join(ROOT, 'toyota-rav4-newsletter.html');

const logo = fs.readFileSync(path.join(ROOT, 'brands/toyota/design-input/toyota-logo-red.png'));
const hero = fs.readFileSync(path.join(ROOT, 'brands/toyota/design-input/hero-email.jpg'));

const b64 = (buf) => buf.toString('base64');
let html = fs.readFileSync(SRC, 'utf8');

// Comprobar magic bytes antes de embeker
if (logo[0] !== 0x89 || logo[1] !== 0x50 || logo[2] !== 0x4e || logo[3] !== 0x47) { console.error('ABORT: logo no es PNG'); process.exit(1); }
if (hero[0] !== 0xff || hero[1] !== 0xd8) { console.error('ABORT: hero no es JPEG'); process.exit(1); }

html = html.replace(/\{\{LOGO_B64\}\}/g, 'data:image/png;base64,' + b64(logo));
html = html.replace(/\{\{HERO_B64\}\}/g, 'data:image/jpeg;base64,' + b64(hero));

if (html.includes('{{')) { console.error('ABORT: quedan tokens sin resolver'); process.exit(1); }

fs.writeFileSync(OUT, html);
console.log('OK final:', OUT, (fs.statSync(OUT).size / 1024).toFixed(0) + ' KB');
console.log('logo b64:', b64(logo).slice(0, 30) + '... (' + b64(logo).length + ' chars)');
console.log('hero b64:', b64(hero).slice(0, 30) + '... (' + b64(hero).length + ' chars)');
