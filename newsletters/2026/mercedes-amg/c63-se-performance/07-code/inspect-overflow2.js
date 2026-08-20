const fs = require('fs');
const html = fs.readFileSync('newsletters/2026/mercedes-amg/c63-se-performance/09-exports/final.html', 'utf8');
const mq = html.match(/@media[^{]*\{[\s\S]*?\}\s*\}/g);
console.log('MQ COMPLETOS:');
(mq || []).forEach(m => console.log(m));
console.log('\nMIN-WIDTH:', [...new Set([...html.matchAll(/min-width:(\d+px)/g)].map(x => x[1]))]);
console.log('CLASES:', [...new Set([...html.matchAll(/class="([^"]+)"/g)].map(x => x[1]))].join(' | '));
console.log('IMG width attrs:', [...new Set([...html.matchAll(/<img[^>]*width="(\d+)"/g)].map(x => x[1]))]);
// contexto del img hero
const i = html.indexOf('Sedán deportivo híbrido');
console.log('\nIMG HERO:', JSON.stringify(html.slice(i - 120, i + 260)));
