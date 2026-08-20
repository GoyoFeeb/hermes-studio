const fs = require('fs');
const html = fs.readFileSync(process.argv[2] || 'newsletters/2026/mercedes-amg/c63-se-performance/09-exports/final.html', 'utf8');

const i = html.indexOf('border-radius:2px');
console.log('2px ctx:', JSON.stringify(html.slice(Math.max(0, i - 160), i + 60)));

console.log('\nTABLES:');
const re = /<table[^>]*>/g;
let m, n = 0;
while ((m = re.exec(html)) && n < 14) {
  const t = m[0];
  if (t.includes('width')) {
    n++;
    console.log(t.slice(0, 170));
  }
}
console.log('\nBGCOLORS:', [...new Set([...html.matchAll(/bgcolor="([^"]*)"/g)].map(x => x[1]))].join(' | '));
console.log('ARC:', [...new Set([...html.matchAll(/arcsize="([^"]*)"/g)].map(x => x[1]))].join(' | '));
console.log('CTAS:', [...html.matchAll(/<a href="https:[^"]*"[^>]*>([^<]*)<\/a>/g)].map(x => x[1].trim()).filter(t => t && t.length < 40).join(' | '));
