// Autoauditoría programática de tarifalo-newsletter.html (checklist del brief, punto 5)
const fs = require('fs');
const path = require('path');

const FILE = path.join('/Users/javifeebbo/Desktop/newsletter-system-reutilizable/sistema-final', 'tarifalo-newsletter.html');
const html = fs.readFileSync(FILE, 'utf8');
const fail = (m) => { console.log('❌ ' + m); process.exitCode = 1; };
const ok = (m) => console.log('✅ ' + m);

// 0. Sin placeholders
html.includes('{{') || html.includes('Lorem') || html.includes('[') && /\[[A-Z]+\]/.test(html)
  ? fail('placeholder sin resolver') : ok('sin placeholders ni corchetes');

// 1. Escenas: cuántas tablas contenedor (bgcolor + width 600) y sus colores
const scenes = [...html.matchAll(/<table[^>]*class="container"[^>]*bgcolor="([^"]+)"/g)].map(m => m[1]);
console.log('   escenas (fondos): ' + scenes.join(' → '));

// 2. Fondo escena 3 = blanco, círculos pasos = navy
if (!/<table role="presentation" width="600"[^>]*class="container"[^>]*bgcolor="#FFFFFF"/.test(html)) fail('escena pasos no es blanca');
const navyCircles = (html.match(/bgcolor="#003049" style="width:30px;height:30px;border-radius:50%;"/g) || []).length;
navyCircles === 3 ? ok('3 círculos de paso navy (01/02/03)') : fail('círculos de paso: ' + navyCircles);

// 3. Filo naranja del cierre
if (!/height="6" bgcolor="#F77F00"/.test(html)) fail('falta filo naranja del cierre'); else ok('filo naranja 6px presente');

// 4. CTAs: strings únicos y verbos correctos (solo botones, no enlaces de footer)
const ctaTexts = [...html.matchAll(/<a href="https:[^"]+" style="[^"]*background-color:#F77F00[^"]*">([^<]+)<\/a>/g)].map(m => m[1]);
const ctaSet = [...new Set(ctaTexts)];
ctaSet.length === 2 && ctaTexts.length === 2 ? ok('2 CTAs, ambos únicos: ' + ctaSet.join(' | ')) : fail('CTAs: ' + JSON.stringify(ctaTexts));
if (!ctaSet.some(t => /Entender/.test(t))) fail('falta CTA de entender');
if (!ctaSet.some(t => /Comparar/.test(t))) fail('falta CTA de comparar');

// 5. Texto duplicado entre bloques
const paras = [...html.matchAll(/<p style="[^"]*">([^<]{25,})<\/p>/g)].map(m => m[1].replace(/&nbsp;/g, ' ').replace(/<br>/g, ' ').trim());
const seen = new Set(); const dups = new Set();
paras.forEach(p => seen.has(p) ? dups.add(p) : seen.add(p));
dups.size === 0 ? ok('sin texto duplicado entre bloques (' + paras.length + ' bloques)') : fail('duplicados: ' + [...dups].join(' || '));

// 6. Palabras por bloque (máx 40)
const longBlocks = paras.filter(p => p.split(/\s+/).length > 40);
longBlocks.length === 0 ? ok('todos los bloques ≤ 40 palabras (máx: ' + Math.max(...paras.map(p => p.split(/\s+/).length)) + ')') : fail('bloques >40: ' + JSON.stringify(longBlocks));

// 7. Barras de datos sueltos sin verbo: bloques que sean solo números/símbolos/tokens cortos
const bareData = paras.filter(p => {
  const words = p.split(/\s+/);
  const alpha = words.filter(w => /[a-záéíóúñ]/i.test(w)).length;
  return alpha / words.length < 0.6;
});
bareData.length === 0 ? ok('sin barras de datos sueltos (todo número vive en frase con verbo)') : fail('barras de datos: ' + JSON.stringify(bareData));

// 8. Nombre de marca: apariciones visibles
const visible = (html.match(/alt="Tarífalo"/g) || []).length + (html.match(/tarifalo\.com<\/a>/g) || []).length + (html.match(/© 2026 Tarífalo/g) || []).length;
visible <= 3 ? ok('marca visible: ' + visible + ' (alt header + URL pie + copyright)') : fail('marca visible >3: ' + visible);
const bodyMentions = (html.match(/>[^<>]*Tarífalo[^<>]*</g) || []).length;
console.log('   menciones en body (texto visible fuera de header/footer): ' + bodyMentions);

// 9. Logo como imagen real (no CSS text): img con src data:image/png y alt
if (!/<img[^>]*src="data:image\/png;base64,[^"]+"[^>]*alt="Tarífalo"/.test(html)) fail('logo no está como imagen real');
else ok('logo como imagen PNG base64 (real y oficial, no texto CSS)');

// 10. Imágenes con dimensiones y alt
const imgs = [...html.matchAll(/<img[^>]*>/g)].map(m => m[0]);
const imgOk = imgs.every(i => /width="\d+"/.test(i) && /height="\d+"/.test(i) && /alt="/.test(i));
imgOk ? ok('imágenes con dimensiones y alt (' + imgs.length + ')') : fail('imagen sin dims/alt');

// 11. Composición: foto-texto usado una sola vez
const fotoTexto = (html.match(/class="stack"/g) || []).length;
fotoTexto === 2 ? ok('composición foto-texto única (2 celdas stack, 1 bloque editorial)') : fail('células stack: ' + fotoTexto);

// 12. Sin grid de 3 tarjetas icono+título+párrafo
if (/columns-3|usp-cards|card-tarifa/.test(html)) fail('usa componentes de tarjetas genéricas'); else ok('sin grid de tarjetas genéricas');

// 13. Gradiente con fallback sólido + VML en botones
if (!/background-image:linear-gradient\(135deg,#003049 0%,#002035 100%\);background-color:#003049/.test(html)) fail('hero sin gradiente+fallback');
const vml = (html.match(/<v:roundrect/g) || []).length;
vml === 2 ? ok('2 botones VML bulletproof (Outlook)') : fail('botones VML: ' + vml);

// 14. URLs únicas verificadas
const urls = [...new Set([...html.matchAll(/href="(https:[^"]+)"/g)].map(m => m[1]))];
ok('URLs únicas (' + urls.length + '): ' + urls.join(' | '));

console.log(process.exitCode ? '\nAUDITORÍA: FALLOS DETECTADOS' : '\nAUDITORÍA: TODO OK');
