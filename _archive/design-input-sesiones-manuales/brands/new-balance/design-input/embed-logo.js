// Embed official NB logo as base64 data URI in the newsletter HTML
const fs = require('fs');
const htmlPath = '/Users/javifeebbo/Desktop/newsletter-system-reutilizable/sistema-final/new-balance-740n-stoneware.html';
const logoPath = '/Users/javifeebbo/Desktop/newsletter-system-reutilizable/sistema-final/brands/new-balance/design-input/logo-nb-oficial-email.png';

const b64 = Buffer.from(fs.readFileSync(logoPath)).toString('base64');
console.log('b64 length:', b64.length, '| header ok:', b64.startsWith('iVBORw0KGgo'));

let html = fs.readFileSync(htmlPath, 'utf8');
const fake = 'https://raw.githubusercontent.com/javifeebbo/newbalance-assets/main/logo-nb-oficial-email.png';
if (!html.includes(fake)) { console.error('FAKE URL NOT FOUND — abort'); process.exit(1); }
html = html.replace(fake, 'data:image/png;base64,' + b64);
fs.writeFileSync(htmlPath, html);
console.log('embedded. data URI present:', html.includes('data:image/png;base64,'));
