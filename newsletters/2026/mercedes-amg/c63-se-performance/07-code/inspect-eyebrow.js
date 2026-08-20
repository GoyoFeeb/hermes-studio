const fs = require('fs');
const html = fs.readFileSync('newsletters/2026/mercedes-amg/c63-se-performance/09-exports/final.html', 'utf8');
// eyebrow texts y su color
const re = /([A-ZÁÉÍÓÚÑ]{3,})\s*<\/[^>]+>\s*<\/[^>]+>\s*<[^>]*style="[^"]*color:([^;"']+)/g;
let m;
const found = [];
while ((m = re.exec(html))) found.push(m[1] + ' -> ' + m[2].trim());
console.log('EYEBROWS:', found.length ? found.join(' | ') : '(regex sin match)');
// color B21E23 occurrences with context
let i = 0, n = 0;
while ((i = html.indexOf('#B21E23', i)) !== -1 && n < 8) {
  console.log('B21E23 ctx:', JSON.stringify(html.slice(Math.max(0, i - 90), i + 20)));
  i += 7; n++;
}
