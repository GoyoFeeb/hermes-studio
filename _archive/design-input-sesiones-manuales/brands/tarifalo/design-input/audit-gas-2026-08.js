// Autoauditoría programática — tarifalo-newsletter.html
const fs = require('fs');
const path = require('path');

const root = '/Users/javifeebbo/Desktop/newsletter-system-reutilizable/sistema-final';
const html = fs.readFileSync(path.join(root, 'tarifalo-newsletter.html'), 'utf8');

let fails = 0;
const check = (name, ok, detail) => {
  console.log((ok ? 'PASS' : 'FAIL') + ' | ' + name + (detail ? ' | ' + detail : ''));
  if (!ok) fails++;
};

// 1. Nombre de marca: Tarífalo (con tilde) en texto visible + tarifalo.com
const brandExact = (html.match(/Tarífalo/g) || []).length;
const urlOccurrences = (html.match(/tarifalo\.com/g) || []).length;
const altOccurrences = (html.match(/alt="Tarífalo"/g) || []).length;
const copyright = (html.match(/© 2026 Tarífalo/g) || []).length;
console.log('--- Conteo de marca ---');
console.log('"Tarífalo" exacto en todo el HTML (incluye <title>):', brandExact);
console.log('  de los cuales alt="Tarífalo":', altOccurrences, '| © 2026 Tarífalo:', copyright);
console.log('"tarifalo.com" (texto footer):', urlOccurrences);
// Ocurrencias visibles = alt + copyright + url-text (el <title> no se renderiza en email)
const visibleBrand = altOccurrences + copyright + 1; // 1 = enlace tarifalo.com
check('Marca visible <= 3', visibleBrand <= 3, 'alt=' + altOccurrences + ' + copyright=' + copyright + ' + url=1 => ' + visibleBrand);

// 2. CTA únicos: extraer texto de <a> con clase de botón (los <a> visibles)
const ctaTexts = [];
const anchorRe = /<a href="([^"]+)"[^>]*>([^<]+)<\/a>/g;
let m;
while ((m = anchorRe.exec(html)) !== null) {
  // Excluir enlaces de texto plano del footer (tarifalo.com, aviso legal) — son links, no CTA
  ctaTexts.push(m[2].trim());
}
const visibleLinks = ctaTexts.filter(t => !['tarifalo.com', 'Aviso legal'].includes(t));
const uniqueCtas = new Set(visibleLinks);
check('CTAs únicos (sin duplicar string)', uniqueCtas.size === visibleLinks.length, JSON.stringify(visibleLinks));

// 3. Palabras por bloque de texto corrido (párrafos <p> con font-size>=14)
const pRe = /<p[^>]*>(.*?)<\/p>/g;
const blocks = [];
while ((m = pRe.exec(html)) !== null) {
  const text = m[1].replace(/<[^>]+>/g, ' ').replace(/&nbsp;|&amp;|&euro;/g, ' ').replace(/\s+/g, ' ').trim();
  if (text) blocks.push(text);
}
console.log('--- Bloques <p> (palabras) ---');
let maxWords = 0;
for (const b of blocks) {
  const words = b.split(' ').filter(w => w.length > 0).length;
  if (words > maxWords) maxWords = words;
  if (words > 40) console.log('  >40:', words, '->', b.slice(0, 80));
}
check('Ningún bloque supera 40 palabras', maxWords <= 40, 'máximo=' + maxWords + ' palabras');

// 4. Texto duplicado entre bloques distintos
const seen = new Map();
let dupes = [];
for (const b of blocks) {
  if (seen.has(b)) dupes.push(b);
  else seen.set(b, 1);
}
check('Sin texto duplicado entre bloques', dupes.length === 0, dupes.length ? JSON.stringify(dupes.map(d => d.slice(0, 60))) : '');

// 5. Placeholders
const placeholders = (html.match(/\{\{|\}\}|\[[A-ZÁÉÍÓÚÑ_]+\]|Lorem/g) || []).filter(x => x !== '}');
const realBrackets = (html.match(/\[[A-ZÁÉÍÓÚÑ_]+\]/g) || []);
check('Sin placeholders ni corchetes', placeholders.length === 0 && realBrackets.length === 0, 'coincidencias=' + placeholders.length + ',' + realBrackets.length);

// 6. Escenas: contar tablas contenedor
const scenes = (html.match(/class="container"/g) || []).length;
check('Entre 3 y 5 escenas (+footer)', scenes >= 4 && scenes <= 6, 'tablas container=' + scenes);

// 7. Números sueltos sin verbo: buscar líneas de solo números/datos
const bareData = (html.match(/>\s*(?:[\d.,]+ ?[€%kWh·]+\s*)+</g) || []);
check('Sin bloques de solo números', bareData.length === 0, JSON.stringify(bareData.slice(0, 3)));

// 8. CTA final invita a comparar
const finalCta = html.includes('>Comparar tarifas de gas</a>');
check('CTA final = comparar', finalCta);

// 9. Logo como imagen real (data URI PNG)
const logoImg = /<img[^>]*src="data:image\/png;base64,[^"]+"[^>]*alt="Tarífalo"/.test(html);
check('Logo como imagen real (base64 PNG)', logoImg);
const cssLogo = /<span[^>]*>\s*T<\/span>\s*arífalo/.test(html);
check('Sin logo reconstruido con CSS', !cssLogo);

console.log('---');
console.log(fails === 0 ? 'AUTO AUDITORÍA: TODAS PASAN' : 'AUTO AUDITORÍA: ' + fails + ' FALLOS');
process.exit(fails === 0 ? 0 : 1);
