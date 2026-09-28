const test = require('node:test');
const assert = require('node:assert/strict');
const { render } = require('./markdown.js');

// Autoauditoría y brief de Hermes (2026-09-28): texto escrito por un modelo que ha leído webs de
// terceros, así que lo primero es que no pase HTML.
test('render: escapa el HTML y no convierte enlaces que no sean http(s)', () => {
  const html = render('<script>alert(1)</script> [x](javascript:alert(1)) "><img src=x onerror=alert(1)>');
  assert.doesNotMatch(html, /<script|<img|href="javascript/i);
  assert.match(html, /&lt;script&gt;/);
});

test('render: fragmento real de notas.md (títulos, negrita, código, tabla de fuentes, separador)', () => {
  const md = [
    '# Notas — Newsletter Talaria Iberia · KOMODO L3e',
    '',
    'Fecha: 2026-09-25 · Campaña: `newsletters/2026/talaria-iberia/hermes/2026-09-25-1khbot/`',
    '',
    '---',
    '',
    '## 2. Datos, precios y cifras con su fuente',
    '',
    '**Concepto (una frase):** «No elijas entre montaña y calle.»',
    '',
    '| Dato en la pieza | Fuente (URL oficial) |',
    '|---|---|',
    '| Precio L3e: 7.890 € IVA incluido | https://talariaiberia.eu/products/komodo |',
  ].join('\n');
  const html = render(md);
  assert.match(html, /<h4>Notas — Newsletter Talaria Iberia · KOMODO L3e<\/h4>/);
  assert.match(html, /<h5>2\. Datos, precios y cifras con su fuente<\/h5>/);
  assert.match(html, /<code>newsletters\/2026\/talaria-iberia\/hermes\/2026-09-25-1khbot\/<\/code>/);
  assert.match(html, /<hr>/);
  assert.match(html, /<strong>Concepto \(una frase\):<\/strong>/);
  assert.match(html, /<th>Dato en la pieza<\/th>/);
  assert.match(
    html,
    /<td><a href="https:\/\/talariaiberia\.eu\/products\/komodo" target="_blank" rel="noopener noreferrer">https:\/\/talariaiberia\.eu\/products\/komodo<\/a><\/td>/
  );
});

test('render: las URLs con guiones bajos no se rompen con la cursiva; sin punto final en el enlace', () => {
  const html = render('Ver https://cdn.shopify.com/files/hero_komodo_v2.jpg. Y _esto_ en cursiva.');
  assert.match(html, /href="https:\/\/cdn\.shopify\.com\/files\/hero_komodo_v2\.jpg"/);
  assert.match(html, /<\/a>\. Y <em>esto<\/em> en cursiva\./);
});

test('render: listas numeradas con continuación y listas con guiones', () => {
  const html = render('1. Concepto y titular\n   que deriva del concepto.\n2. Fuentes\n\n- uno\n- dos');
  assert.match(html, /<ol><li>Concepto y titular que deriva del concepto\.<\/li><li>Fuentes<\/li><\/ol>/);
  assert.match(html, /<ul><li>uno<\/li><li>dos<\/li><\/ul>/);
});

test('render: las líneas seguidas forman un párrafo; una línea en blanco lo cierra', () => {
  assert.equal(render('uno\ndos\n\ntres'), '<p>uno dos</p>\n<p>tres</p>');
});
