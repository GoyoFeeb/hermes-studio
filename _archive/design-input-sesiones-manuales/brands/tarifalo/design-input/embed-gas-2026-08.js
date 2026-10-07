// Embed logo base64 en tarifalo-gas-subida-source.html -> tarifalo-newsletter.html (root)
const fs = require('fs');
const path = require('path');

const root = '/Users/javifeebbo/Desktop/newsletter-system-reutilizable/sistema-final';
const srcPath = path.join(root, 'brands/tarifalo/design-input/tarifalo-gas-subida-source.html');
const pngPath = path.join(root, 'brands/tarifalo/design-input/logo-tarifalo.png');
const outPath = path.join(root, 'tarifalo-newsletter.html');

const src = fs.readFileSync(srcPath, 'utf8');
const b64 = fs.readFileSync(pngPath).toString('base64');
const html = src.replace('{{LOGO_B64}}', 'data:image/png;base64,' + b64);

const tokensLeft = (html.match(/\{\{/g) || []).length;
if (tokensLeft > 0) throw new Error('Quedan ' + tokensLeft + ' tokens sin resolver');

fs.writeFileSync(outPath, html);
console.log('OK ->', outPath);
console.log('bytes:', html.length);
console.log('tokens restantes:', tokensLeft);
console.log('base64 logo empieza con:', b64.slice(0, 12));
