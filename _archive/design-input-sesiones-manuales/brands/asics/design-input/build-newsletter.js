// Build final ASICS GEL-KAYANO 33 newsletter: embed logo base64 into source.html -> project root.
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', '..', '..');
const DIR = __dirname;

const logoB64 = fs.readFileSync(path.join(DIR, 'logo.png')).toString('base64');
let html = fs.readFileSync(path.join(DIR, 'source.html'), 'utf8');

html = html.split('{{LOGO_B64}}').join('data:image/png;base64,' + logoB64);

if (/\{\{/.test(html)) {
  console.error('ERROR: placeholders still present in HTML');
  process.exit(1);
}

const out = path.join(ROOT, 'asics-gel-kayano-33-newsletter.html');
fs.writeFileSync(out, html);
console.log('Wrote:', out, '|', Buffer.byteLength(html), 'bytes');
console.log('Logo b64 length:', logoB64.length);
// sanity: magic bytes of embedded data URI
console.log('Embedded logo starts with:', html.match(/data:image\/png;base64,([A-Za-z0-9+/=]{12})/)[1]);
