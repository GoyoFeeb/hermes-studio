const test = require('node:test');
const assert = require('node:assert/strict');
const { chooseTarget, describe, insertReference } = require('./pick.js');

const node = (tag, text = '', extra = {}) => ({ tag, text, isImage: tag === 'img', hasBackground: false, ...extra });

test('chooseTarget: la imagen gana aunque esté dentro de un enlace', () => {
  const chain = [node('img'), node('a', ''), node('td', 'x'), node('body', 'mucho')];
  assert.equal(chooseTarget(chain), 0);
});

test('chooseTarget: un clic en el texto de un botón señala el botón, no la celda', () => {
  const chain = [node('span', 'Descubre'), node('a', 'Descubre'), node('td', 'Descubre'), node('table', 'Descubre')];
  assert.equal(chooseTarget(chain), 1);
});

test('chooseTarget: párrafo antes que la celda; celda enorme (toda la columna) no cuenta', () => {
  assert.equal(chooseTarget([node('strong', 'Nuevo'), node('p', 'Nuevo Pegasus 42'), node('td', 'Nuevo Pegasus 42')]), 1);
  const huge = 'x'.repeat(2000);
  assert.equal(chooseTarget([node('td', huge), node('table', huge), node('body', huge)]), -1);
  assert.equal(chooseTarget([node('td', 'Precio: 140 €'), node('table', huge)]), 0);
});

test('chooseTarget: celda con imagen de fondo y sin texto (hero VML/CSS)', () => {
  assert.equal(chooseTarget([node('td', '', { hasBackground: true }), node('body', 'x')]), 0);
  assert.equal(chooseTarget([node('td', ''), node('body', 'x')]), -1);
});

test('describe: imagen con número entre todas las <img> y su alt (caso real de Nike)', () => {
  assert.equal(
    describe({ kind: 'image', index: 3, total: 7, alt: 'Detalle de la amortiguación Air Zoom del Pegasus 42' }),
    '[Señalado: imagen nº 3 de 7 del HTML, alt «Detalle de la amortiguación Air Zoom del Pegasus 42»]'
  );
  assert.equal(describe({ kind: 'image', index: 1, total: 2, alt: '' }), '[Señalado: imagen nº 1 de 2 del HTML, sin alt]');
});

test('describe: botón con destino, titular y párrafo largo recortado por palabra', () => {
  assert.equal(
    describe({ kind: 'link', text: '  Descubre el Pegasus 42 ', href: 'https://www.nike.com/es/w/pegasus', isButton: true }),
    '[Señalado: botón «Descubre el Pegasus 42» → https://www.nike.com/es/w/pegasus]'
  );
  assert.equal(describe({ kind: 'text', tag: 'h1', text: 'Corre más lejos' }), '[Señalado: titular «Corre más lejos»]');
  const long = describe({ kind: 'text', tag: 'p', text: 'palabra '.repeat(30) });
  assert.match(long, /^\[Señalado: párrafo «(palabra ){10,}.*palabra…»\]$/);
});

test('insertReference: en línea propia y con el cursor detrás para seguir escribiendo', () => {
  assert.deepEqual(insertReference('', 0, '[A]'), { value: '[A] ', caret: 4 });
  const r = insertReference('Recorta el blanco de', 20, '[B]');
  assert.equal(r.value, 'Recorta el blanco de\n[B] ');
  assert.equal(r.caret, r.value.length);
  assert.equal(insertReference('uno\n', 4, '[C]').value, 'uno\n[C] ');
  // Atajo que deja la frase abierta: la referencia la completa.
  assert.equal(insertReference('Recorta el blanco de la imagen ', 31, '[D]').value, 'Recorta el blanco de la imagen [D] ');
  // Varias referencias seguidas: una por línea.
  assert.equal(insertReference('[D] ', 4, '[E]').value, '[D] \n[E] ');
});
