const fs = require('fs');
const html = fs.readFileSync('newsletters/2026/mercedes-amg/c63-se-performance/09-exports/final.html', 'utf8');
let i = 0, n = 0;
while ((i = html.indexOf('color:#B21E23', i)) !== -1 && n < 6) {
  console.log('ctx:', JSON.stringify(html.slice(Math.max(0, i - 140), i + 120)));
  console.log('---');
  i += 12; n++;
}
