const fs = require('fs');
const html = fs.readFileSync('newsletters/2026/mercedes-amg/c63-se-performance/09-exports/final.html', 'utf8');
const i = html.indexOf('MERCEDES-AMG · E PERFORMANCE');
console.log('brandName ctx:', i === -1 ? 'NO ENCONTRADO' : JSON.stringify(html.slice(Math.max(0, i - 200), i + 40)));
console.log('---');
// cualquier <p> con color rojo en texto
const re = /<p[^>]*style="[^"]*color:(#[0-9A-Fa-f]{6})[^"]*"[^>]*>([^<]{3,40})<\/p>/g;
let m;
while ((m = re.exec(html))) {
  if (m[1].toUpperCase() === '#B21E23' || m[1].toUpperCase() === '#8F1418') console.log('p rojo:', m[1], '->', m[2].trim());
}
console.log('--- fin p rojo ---');
