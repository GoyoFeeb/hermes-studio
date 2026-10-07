// Higiene final de la newsletter: placeholders, rutas rotas, URLs, palabras por bloque
const fs = require('fs');
const html = fs.readFileSync('/Users/javifeebbo/Desktop/newsletter-system-reutilizable/sistema-final/adeslas-newsletter.html', 'utf8');

console.log('=== 1. Placeholders / rutas rotas ===');
['{{', '[corchete]', 'Lorem', 'PENDING', 'file:///Users', 'href="relative'].forEach(p => {
  const c = html.split(p).length - 1;
  if (c > 0) console.log('  ENCONTRADO:', p, 'x' + c); else console.log('  ok (0):', p);
});

console.log('=== 2. URLs de CTA (deben ser oficiales segurcaixaadeslas.es) ===');
const urls = [...new Set([...html.matchAll(/href="(https:\/\/[^"]+)"/g)].map(m => m[1]))];
urls.forEach(u => console.log('  -', u));

console.log('=== 3. Palabras por bloque (max 40) ===');
const blocks = [...html.matchAll(/<(p|h1|h2)[^>]*>([\s\S]*?)<\/\1>/g)];
let fail = 0;
blocks.forEach((m, i) => {
  const txt = m[2].replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
  const n = txt.split(' ').filter(Boolean).length;
  const tag = n > 40 ? 'OVER' : 'ok  ';
  if (n > 40) fail++;
  console.log('  ' + tag, String(n).padStart(2), '|', txt.slice(0, 70));
});
console.log('  bloques sobre 40:', fail);

console.log('=== 4. Apariciones visibles de marca y producto ===');
const visible = html
  .replace(/<[^>]+>/g, ' ')
  .replace(/data:image\/[a-z]+;base64,[A-Za-z0-9+/=]+/g, ' ')
  .replace(/\s+/g, ' ');
console.log('  "Adeslas" visible (aprox):', (visible.match(/Adeslas/g) || []).length);
console.log('  "GO" visible (aprox):', (visible.match(/\bGO\b/g) || []).length);
