// Autoauditoría programática — viajes-el-corte-ingles-newsletter.html
const fs = require('fs');
const html = fs.readFileSync('viajes-el-corte-ingles-newsletter.html', 'utf8');

console.log('=== ESTRUCTURA ===');
for (const tag of ['table', 'td', 'tr']) {
  const open = (html.match(new RegExp('<' + tag + '[ >]', 'g')) || []).length;
  const close = (html.match(new RegExp('</' + tag + '>', 'g')) || []).length;
  console.log(`  <${tag}>: ${open} open / ${close} close -> ${open === close ? 'OK' : 'DESBALANCEADO'}`);
}

console.log('=== NOMBRE DE MARCA (max 3) ===');
const brand = 'El Corte Inglés';
const count = (html.match(/El Corte Inglés/g) || []).length;
console.log(`  "El Corte Inglés" total: ${count}`);
console.log('  En alt:', (html.match(/alt="[^"]*El Corte Inglés[^"]*"/g) || []));
console.log('  En title:', /<title>[^<]*El Corte Inglés/.test(html));

console.log('=== CTAs únicos ===');
for (const c of ['Explorar los destinos de última hora', 'Ver el viaje del Nilo', 'Reservar mis vacaciones']) {
  console.log(`  "${c}": ${(html.match(new RegExp(c.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length}x`);
}

console.log('=== BLOQUES DE TEXTO > 40 palabras ===');
const ps = [...html.matchAll(/<p[^>]*>(.*?)<\/p>/gs)].map(m => m[1]);
let over = 0;
ps.forEach((t, i) => {
  const clean = t.replace(/<[^>]+>/g, '').trim();
  if (!clean || clean.startsWith('&nbsp;')) return;
  const words = clean.split(/\s+/).length;
  if (words > 40) { over++; console.log(`  Bloque ${i + 1}: ${words} palabras **OVER 40**`); }
  else console.log(`  Bloque ${i + 1}: ${words} palabras`);
});
console.log('  RESULTADO:', over === 0 ? 'PASS' : 'FIX');

console.log('=== DUPLICADOS ===');
const seen = new Map();
ps.forEach((t) => {
  const clean = t.replace(/<[^>]+>/g, '').trim();
  if (clean.length > 20) seen.set(clean, (seen.get(clean) || 0) + 1);
});
const dupes = [...seen.entries()].filter(([, c]) => c > 1);
console.log('  Duplicados:', dupes.length ? JSON.stringify(dupes) : '(limpio)');

console.log('=== PLACEHOLDERS ===');
const ph = [...html.matchAll(/\[(?!if mso|endif\])(.*?)\]/g)].map(m => m[1]);
console.log('  Corchetes:', ph.length ? ph : '(limpio)');
console.log('  Lorem:', /lorem/i.test(html) ? 'FIX' : '(limpio)');
console.log('  PENDING/PLACEHOLDER:', /PENDING|PLACEHOLDER|XXXX/.test(html) ? 'FIX' : '(limpio)');

console.log('=== LOGO como imagen real ===');
console.log('  <img> logo base64:', /data:image\/png;base64,[A-Za-z0-9+/=]+/.test(html));
console.log('  Texto CSS simulando logo:', /font-family[^>]*letter-spacing[^>]*>El Corte Inglés/.test(html));

console.log('=== ESCENAS ===');
const scenes = [...new Set([...html.matchAll(/ESCENA \d/g)].map(m => m[0]))];
console.log('  ', scenes.length, 'escenas:', scenes);

console.log('=== IMÁGENES: width/height/alt ===');
for (const img of html.match(/<img[^>]*>/g) || []) {
  console.log(`  ${/width=/.test(img) && /height=/.test(img) && /alt="/.test(img) ? 'OK' : 'FALTA ALGO'} -> ${img.slice(0, 90)}...`);
}

console.log('=== URLs ===');
for (const u of [...new Set([...html.matchAll(/href="(https:\/\/[^"]+)"/g)].map(m => m[1]))]) console.log('  ', u.slice(0, 110));
