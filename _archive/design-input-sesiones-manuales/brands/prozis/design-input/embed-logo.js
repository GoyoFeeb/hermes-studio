const fs = require('fs');
const path = require('path');

const dir = '/Users/javifeebbo/Desktop/newsletter-system-reutilizable/sistema-final/newsletters/2026/prozis/hermes/2026-09-24-n7361m';
const htmlPath = path.join(dir, 'newsletter.html');
const logoPath = path.join(dir, 'images/prozis-logo.png');

const b64 = fs.readFileSync(logoPath).toString('base64');
const dataUri = 'data:image/png;base64,' + b64;

let html = fs.readFileSync(htmlPath, 'utf8');
const before = html;
html = html.replace('src="images/prozis-logo.png"', 'src="' + dataUri + '"');

if (html === before) { console.error('ABORT: logo src not found'); process.exit(1); }
if (html.includes('{{')) { console.error('ABORT: unresolved tokens'); process.exit(1); }

fs.writeFileSync(htmlPath, html);
console.log('logo embedded as base64, new size:', (fs.statSync(htmlPath).size/1024).toFixed(1), 'KB');
