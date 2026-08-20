const fs = require('fs');
const html = fs.readFileSync('newsletters/2026/mercedes-amg/c63-se-performance/09-exports/final.html', 'utf8');
const body = html.match(/<body[^>]*>/);
console.log('BODY:', body ? body[0] : 'sin body tag');
const i = html.indexOf('<body');
console.log('CTX BODY:', JSON.stringify(html.slice(i, i + 400)));
