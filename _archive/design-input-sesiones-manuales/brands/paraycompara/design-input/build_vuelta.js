// Build final: embeds logo base64 into the source and writes the deliverable
// to the project root. Run: node build_vuelta.js
const fs = require('fs');
const path = require('path');

const DIR = __dirname; // brands/paraycompara/design-input
const ROOT = path.resolve(DIR, '..', '..', '..'); // sistema-final

const src = fs.readFileSync(path.join(DIR, 'vuelta-al-cole-source.html'), 'utf8');
const logo = fs.readFileSync(path.join(DIR, 'logo-paraycompara-clear.png'));
const b64 = logo.toString('base64');
const out = src.split('{{LOGO_B64}}').join('data:image/png;base64,' + b64);

if (out.includes('{{')) throw new Error('Quedan placeholders sin resolver');
if (!out.includes('data:image/png;base64,iVBOR')) throw new Error('Logo base64 no embebido (magic bytes PNG ausentes)');

const finalPath = path.join(ROOT, 'paraycompara-newsletter.html');
fs.writeFileSync(finalPath, out);
console.log('OK -> ' + finalPath);
console.log('Bytes finales:', out.length);
