const fs = require('fs');
const html = fs.readFileSync('newsletters/2026/mercedes-amg/c63-se-performance/09-exports/final.html', 'utf8');
for (const label of ['LA RESPUESTA', 'HERENCIA DE F1']) {
  const i = html.indexOf(label);
  if (i === -1) { console.log(label, 'NO ENCONTRADO'); continue; }
  console.log(label, '->', JSON.stringify(html.slice(Math.max(0, i - 260), i + 30)));
  console.log('---');
}
