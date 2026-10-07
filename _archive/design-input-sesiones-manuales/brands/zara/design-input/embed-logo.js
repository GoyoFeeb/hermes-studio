// Inyecta el logo oficial (PNG base64) en el HTML fuente y escribe el entregable final en la raíz del proyecto.
const fs = require('fs');
const path = require('path');

const root = '/Users/javifeebbo/Desktop/newsletter-system-reutilizable/sistema-final';
const src = path.join(root, 'brands/zara/design-input/zara-studio-source.html');
const logo = path.join(root, 'brands/zara/design-input/zara-logo-email-2x.png');
const out = path.join(root, 'zara-studio-newsletter.html');

const html = fs.readFileSync(src, 'utf8');
const b64 = Buffer.from(fs.readFileSync(logo)).toString('base64');

if (!html.includes('{{LOGO_B64}}')) {
  console.error('ERROR: placeholder {{LOGO_B64}} no encontrado');
  process.exit(1);
}

const final = html.replace('{{LOGO_B64}}', 'data:image/png;base64,' + b64);

// Verificación: ningún token sin resolver y magic bytes correctos del PNG
if (final.includes('{{')) {
  console.error('ERROR: quedan tokens sin resolver');
  process.exit(1);
}
const buf = Buffer.from(b64, 'base64');
const ok = buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47;
console.log('PNG magic bytes OK:', ok, '| tamaño base64:', (b64.length / 1024).toFixed(1) + 'KB');

fs.writeFileSync(out, final);
console.log('OK escrito:', out, '(', (final.length / 1024).toFixed(1) + 'KB )');
