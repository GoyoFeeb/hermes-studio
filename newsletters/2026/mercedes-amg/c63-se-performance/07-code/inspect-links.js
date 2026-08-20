const fs = require('fs');
const html = fs.readFileSync('newsletters/2026/mercedes-amg/c63-se-performance/09-exports/final.html', 'utf8');
const urls = [...new Set([...html.matchAll(/href="(https:[^"]+)"/g)].map(m => m[1]))];
console.log('URLS:', urls.length);
for (const u of urls) console.log(u);
// presupuesto de marca
const c63 = (html.match(/C 63/g) || []).length;
const amg = (html.match(/Mercedes-AMG|MERCEDES-AMG/g) || []).length;
console.log('C 63 count:', c63, '| Mercedes-AMG count:', amg);
