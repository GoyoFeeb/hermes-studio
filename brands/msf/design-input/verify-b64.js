// Verificación byte a byte del HTML final: extrae los data URIs y comprueba sus magic bytes.
// Uso: node verify-b64.js
const fs = require('fs');

const files = [
  '/Users/javifeebbo/Desktop/newsletter-system-reutilizable/sistema-final/msf-newsletter.html',
  '/Users/javifeebbo/Downloads/msf-newsletter.html',
];

for (const f of files) {
  const html = fs.readFileSync(f, 'utf8');
  const uris = [...html.matchAll(/data:(image\/[a-z]+);base64,([A-Za-z0-9+/=]+)/g)];
  console.log('===', f, '===');
  console.log('tamaño:', Math.round(fs.statSync(f).size / 1024) + ' KB');
  console.log('data URIs encontrados:', uris.length);
  uris.forEach((m, i) => {
    const buf = Buffer.from(m[2], 'base64');
    const magic = [buf[0], buf[1], buf[2], buf[3]];
    const png = magic[0] === 0x89 && magic[1] === 0x50 && magic[2] === 0x4e && magic[3] === 0x47;
    const jpg = magic[0] === 0xff && magic[1] === 0xd8 && magic[2] === 0xff;
    console.log(`  URI ${i + 1}: ${m[1]} | bytes: ${buf.length} (${Math.round(buf.length / 1024)} KB) | magic: ${magic.map(b => b.toString(16)).join(' ')} | ${png ? 'PNG OK' : jpg ? 'JPEG OK' : 'ERROR'}`);
  });
  if (uris.length === 0) console.log('  ⚠️ SIN data URIs');
}
