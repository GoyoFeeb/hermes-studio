const test = require('node:test');
const assert = require('node:assert/strict');
const { textBlocks, compareVersions } = require('./compare.js');

// Casos de "Pedir cambios" (2026-09-28): confirmar que Hermes solo tocó lo pedido.
const BEFORE = `<!doctype html><html><head><title>Asunto</title><style>p{color:red}</style></head><body>
<div style="display:none">El primer viaje también es un descanso</div>
<table><tr><td><h1>El viaje también es un descanso.</h1>
<p>El trayecto a casa, la vuelta del pediatra&nbsp;y cada escapada.</p>
<img src="https://studio.example/assets/brands/inglesina/design-input/hermes/2026-09-25-lb695d/img-0123456789ab.jpg" alt="Hero">
<a href="https://www.inglesina.com/es-es/products/base-darwin-360-isize">Descubre la base</a>
<!-- comentario que no cuenta -->
<a href="{{unsubscribe_url}}">Darse de baja</a></td></tr></table></body></html>`;

test('textBlocks: bloques visibles en orden, sin <head>, estilos ni comentarios', () => {
  assert.deepEqual(textBlocks(BEFORE), [
    'El primer viaje también es un descanso',
    'El viaje también es un descanso.',
    'El trayecto a casa, la vuelta del pediatra y cada escapada.',
    'Descubre la base',
    'Darse de baja',
  ]);
});

test('compareVersions: solo el titular cambiado y el enlace corregido', () => {
  const after = BEFORE.replace('El viaje también es un descanso.', 'Cada trayecto, un descanso.')
    .replace('/products/base-darwin-360-isize', '/');
  const r = compareVersions(BEFORE, after);
  assert.deepEqual(r.text, [
    { type: 'removed', text: 'El viaje también es un descanso.' },
    { type: 'added', text: 'Cada trayecto, un descanso.' },
  ]);
  assert.deepEqual(r.links.removed, ['https://www.inglesina.com/es-es/products/base-darwin-360-isize']);
  assert.deepEqual(r.links.added, ['https://www.inglesina.com/es-es/']);
  assert.equal(r.unchanged, false);
});

test('compareVersions: la misma imagen republicada en otra carpeta no cuenta como cambio', () => {
  const after = BEFORE.replace('2026-09-25-lb695d', '2026-09-28-qed5g7');
  const r = compareVersions(BEFORE, after);
  assert.equal(r.unchanged, true);
});

test('compareVersions: imagen nueva y bloque quitado', () => {
  const after = BEFORE.replace('img-0123456789ab.jpg', 'img-ffffffffffff.jpg')
    .replace('<p>El trayecto a casa, la vuelta del pediatra&nbsp;y cada escapada.</p>', '');
  const r = compareVersions(BEFORE, after);
  assert.deepEqual(r.text, [{ type: 'removed', text: 'El trayecto a casa, la vuelta del pediatra y cada escapada.' }]);
  assert.equal(r.images.removed.length, 1);
  assert.match(r.images.added[0], /img-ffffffffffff\.jpg$/);
});

test('compareVersions: versiones idénticas', () => {
  assert.equal(compareVersions(BEFORE, BEFORE).unchanged, true);
});
