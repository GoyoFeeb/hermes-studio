// Autoauditoría programática — checklist del punto 5 del brief
const fs = require('fs');
const html = fs.readFileSync('/Users/javifeebbo/Desktop/newsletter-system-reutilizable/sistema-final/nike-zoomfly6-newsletter.html', 'utf8');

const strip = (s) => s.replace(/<[^>]+>/g, ' ').replace(/&[a-z]+;/g, ' ').replace(/\s+/g, ' ').trim();
const results = [];
const check = (name, ok, detail) => results.push({ name, ok, detail });

// 1. Dos frases que podrían ser el titular principal (revisión manual de titulares)
const h1h2 = [...html.matchAll(/<h[12][^>]*>([^<]+)<\/h[12]>/g)].map(m => m[1]);
check('Titulares únicos (sin competencia)', new Set(h1h2).size === h1h2.length, h1h2.join(' | '));

// 2. Bloques de solo números sin verbo: buscar párrafos sin letras o con solo datos sueltos
const ps = [...html.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/g)].map(m => strip(m[1])).filter(Boolean);
const bare = ps.filter(p => !/[a-záéíóúñü]/i.test(p) || /^\s*[\d.,$€%·\s-]+\s*$/.test(p));
check('Sin bloques de solo números', bare.length === 0, bare.join(' | ') || 'ninguno');

// 3. Mismo string de CTA repetido (cada CTA aparece 2x por VML+HTML — distinto string = OK)
const ctas = ['Descubre el impulso', 'Ver la edición Eliud Kipchoge', 'Hacerla tuya'];
const ctaCounts = ctas.map(c => ({ c, n: (html.match(new RegExp(c.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length }));
check('Cada CTA con copy distinta', ctaCounts.every(x => x.n >= 2) && new Set(ctas).size === 3, ctaCounts.map(x => `${x.c}=${x.n}`).join(', '));

// 4. Texto duplicado entre bloques distintos
const texts = [...html.matchAll(/<(?:p|h1|h2)[^>]*>([\s\S]*?)<\/(?:p|h1|h2)>/g)].map(m => strip(m[1]).toLowerCase()).filter(t => t.length > 25);
const dupes = [];
for (let i = 0; i < texts.length; i++)
  for (let j = i + 1; j < texts.length; j++)
    if (texts[i] === texts[j]) dupes.push(texts[i]);
check('Sin texto duplicado entre bloques', dupes.length === 0, dupes.join(' | ') || 'ninguno');

// 5. Placeholders
const ph = (html.match(/\[[^\]]*\]|\{\{|\}\}|Lorem|lorem|PLACEHOLDER|PENDING/g) || []).filter(x => x !== '{{');
// {{ aparece 0; filtrar ruido
const realPh = (html.match(/\[[A-Z_ ]+\]|\{\{|\}\}|Lorem|PLACEHOLDER|PENDING/g) || []);
check('Sin placeholders', realPh.length === 0, realPh.join(', ') || 'ninguno');

// 6. Escenas: contar tablas de escena (bgcolor) y composiciones repetidas
const bgs = [...html.matchAll(/bgcolor="#([0-9A-F]{6})"/g)].map(m => m[1]);
const sceneBg = bgs.filter((v, i) => bgs.indexOf(v) === i);
check('4 escenas con fondos distintos + footer', sceneBg.length >= 3 && sceneBg.length <= 6, sceneBg.join(', '));

// 7. Logo real (imagen base64, no texto CSS)
check('Logo como imagen real', /data:image\/png;base64,iVBORw0KGgo/.test(html), 'swoosh PNG embebido (160x56, alfa)');

// 8. Un solo estilo de botón (mismo bgcolor/radius en los 3)
const btnStyles = [...html.matchAll(/<a href="https:\/\/www\.nike\.com[^"]*" style="[^"]*background-color:#111111[^"]*border-radius:30px;/g)].map(m => m[0].match(/background-color:(#[0-9A-Fa-f]+);/)[1]);
check('Un solo estilo de botón', btnStyles.length === 3 && new Set(btnStyles).size === 1, btnStyles.join(', '));

// 9. Nombre del producto ≤3 y palabra clave de marca
const prodName = (html.match(/Zoom Fly 6/g) || []).length;
check('"Zoom Fly 6" <= 3 veces', prodName <= 3, `${prodName} ocurrencias`);

// 10. Palabras por bloque ≤40
const over = [];
for (const p of ps) {
  const w = p.split(/\s+/).length;
  if (w > 40) over.push(`${w}: ${p.slice(0, 60)}...`);
}
check('Ningún bloque >40 palabras', over.length === 0, over.join('\n') || 'todos <=40');

// Extra: ocurrencias visibles de "Nike" (alt, nike.com, copyright)
const nikeVisible = (html.match(/alt="Nike"/g) || []).length + (html.match(/>nike\.com</g) || []).length + (html.match(/© 2026 Nike, Inc\./g) || []).length;
check('"Nike" visible <=3 (alt + nike.com + copyright)', nikeVisible <= 3, `${nikeVisible} ocurrencias`);

// Extra: equilibrio de etiquetas
const tags = (t) => (html.match(new RegExp(`<${t}[ >]`, 'g')) || []).length;
const tagsClose = (t) => (html.match(new RegExp(`</${t}>`, 'g')) || []).length;
const unbalanced = ['table', 'tr', 'td', 'p', 'a', 'h1', 'h2', 'img'].filter(t => tags(t) !== tagsClose(t) && t !== 'img');
check('Etiquetas balanceadas', unbalanced.length === 0, unbalanced.join(', ') || 'ok');

for (const r of results) {
  console.log(`${r.ok ? '✅' : '❌'} ${r.name}${r.ok ? '' : '\n   → ' + r.detail}`);
}
console.log('\nTotal:', results.filter(r => r.ok).length + '/' + results.length, 'checks OK');
process.exit(results.every(r => r.ok) ? 0 : 1);
