// Embebe los logos oficiales (PNG) como data URI en el HTML y verifica que no quedan tokens
const fs = require('fs');
const F = '/Users/javifeebbo/Desktop/newsletter-system-reutilizable/sistema-final/newsletters/2026/mini/mini-cooper-electric/mini-cooper-electric-newsletter.html';
const D = '/Users/javifeebbo/Desktop/newsletter-system-reutilizable/sistema-final/newsletters/2026/mini/mini-cooper-electric/design-input/';
let h = fs.readFileSync(F, 'utf8');
const b64 = (p, mime) => 'data:' + mime + ';base64,' + fs.readFileSync(D + p).toString('base64');
h = h.split('{{LOGO_BLACK}}').join(b64('logo-official-black.png', 'image/png'));
h = h.split('{{LOGO_WHITE}}').join(b64('logo-official-white.png', 'image/png'));
if (h.includes('{{')) { console.error('ABORT: quedan tokens sin resolver'); process.exit(1); }
fs.writeFileSync(F, h);
console.log('Logos embebidos OK. Tamaño HTML:', (fs.statSync(F).size / 1024).toFixed(1), 'KB');
console.log('data URI negro:', b64.length ? 'OK' : 'FAIL');
