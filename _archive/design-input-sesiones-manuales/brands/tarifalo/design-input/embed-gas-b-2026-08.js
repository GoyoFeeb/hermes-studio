// Embed base64 del logo oficial (PNG crema derivado del SVG de tarifalo.com) en la Variante B.
// Fuente con token -> final autocontenido en la raíz del sistema.
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '../../..'); // sistema-final
const SOURCE = path.join(__dirname, 'tarifalo-gas-variante-b-source.html');
const LOGO_PNG = path.join(__dirname, 'logo-tarifalo.png');
const OUT = path.join(ROOT, 'tarifalo-gas-variante-b.html');

const html = fs.readFileSync(SOURCE, 'utf8');
const logoB64 = fs.readFileSync(LOGO_PNG).toString('base64');

const final = html.replace('{{LOGO_B64}}', `data:image/png;base64,${logoB64}`);

if (final.includes('{{LOGO_B64}}')) {
  console.error('ERROR: el token {{LOGO_B64}} no se reemplazó.');
  process.exit(1);
}
if (final.includes('{{')) {
  console.error('ERROR: quedan tokens sin resolver.');
  process.exit(1);
}

fs.writeFileSync(OUT, final);
console.log(`OK: ${OUT} (${(final.length / 1024).toFixed(1)} KB, logo base64 embebido)`);
