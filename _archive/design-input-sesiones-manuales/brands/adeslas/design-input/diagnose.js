// Diagnóstico: ¿qué archivo hay en la raíz, tiene tokens sin resolver, magic bytes de data URIs?
const fs = require('fs');
const path = require('path');

const root = '/Users/javifeebbo/Desktop/newsletter-system-reutilizable/sistema-final';
const candidates = [
  path.join(root, 'adeslas-newsletter.html'),
  path.join(root, 'brands', 'adeslas', 'design-input', 'source-p1.html'),
  path.join(root, 'brands', 'adeslas', 'design-input', 'source-p2.html'),
];

candidates.forEach(f => {
  if (!fs.existsSync(f)) { console.log('NO EXISTE:', f); return; }
  const html = fs.readFileSync(f, 'utf8');
  const tokens = (html.match(/\{\{/g) || []).length;
  const dataUris = (html.match(/data:image\//g) || []).length;
  console.log('---');
  console.log('FILE:', f);
  console.log('  size:', fs.statSync(f).size, 'bytes');
  console.log('  tokens "{{":', tokens, tokens > 0 ? ' <- FUENTE TOKENIZADA' : '');
  console.log('  data:image URIs:', dataUris);
});

// magic bytes de los data URIs del archivo final
const final = path.join(root, 'adeslas-newsletter.html');
if (fs.existsSync(final)) {
  const html = fs.readFileSync(final, 'utf8');
  const uris = [...html.matchAll(/data:(image\/[a-z]+);base64,([A-Za-z0-9+/=]+)/g)];
  console.log('\n=== Magic bytes de data URIs en el final ===');
  uris.forEach((m, i) => {
    const buf = Buffer.from(m[2], 'base64');
    const sig = (buf[0] === 0xff && buf[1] === 0xd8) ? 'JPEG' : (buf[0] === 0x89 && buf[1] === 0x50) ? 'PNG' : 'INVALIDO:' + buf[0].toString(16) + buf[1].toString(16);
    console.log('  #' + i, m[1], sig, buf.length + ' bytes');
  });
  // tamaño total y peso de las imágenes
  const totalImg = uris.reduce((a, m) => a + Buffer.from(m[2], 'base64').length, 0);
  console.log('  peso total imágenes:', Math.round(totalImg / 1024), 'KB');
}
