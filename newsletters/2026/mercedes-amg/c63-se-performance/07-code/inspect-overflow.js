const fs = require('fs');
const html = fs.readFileSync('newsletters/2026/mercedes-amg/c63-se-performance/09-exports/final.html', 'utf8');
// media query del motor
const mq = html.match(/@media[^{]+\{[^}]*\}/g);
console.log('MEDIA QUERIES:');
(mq || []).forEach(m => console.log(m.slice(0, 300)));
console.log('\n---');
// tablas con width numérico fijo > 320
const re = /<table[^>]*width="(\d+)"[^>]*>/g;
let m;
const fixed = [];
while ((m = re.exec(html))) {
  const w = parseInt(m[1]);
  if (w > 320) fixed.push({ w, tag: m[0].slice(0, 130) });
}
console.log('TABLAS width>320:', fixed.length);
fixed.forEach(f => console.log(f.w, '|', f.tag));
// elementos con width fijo en style (px)
const re2 = /style="[^"]*width:(\d+)px[^"]*"/g;
let m2; const fixedS = [];
while ((m2 = re2.exec(html))) {
  const w = parseInt(m2[1]);
  if (w > 300) fixedS.push({ w, ctx: html.slice(Math.max(0, m2.index - 60), m2.index + 40).replace(/\s+/g, ' ') });
}
console.log('\nSTYLE width>300px:', fixedS.length);
fixedS.forEach(f => console.log(f.w, '|', f.ctx));
