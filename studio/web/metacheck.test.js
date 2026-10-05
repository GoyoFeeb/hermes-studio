const test = require('node:test');
const assert = require('node:assert');
const { checkMeta } = require('./metacheck.js');

test('avisa si el preheader repite el asunto (caso real de Nike)', () => {
  const w = checkMeta('Crece con cada zancada', 'Crece con cada zancada: la supertrainer que convierte el esfuerzo en impulso.');
  assert.equal(w.length, 1);
  assert.match(w[0].text, /repitiendo el asunto/);
});

test('repetición sin importar mayúsculas, tildes ni puntuación', () => {
  assert.match(checkMeta('¡Ya está aquí!', 'YA ESTA AQUI. Descúbrelo antes que nadie en la tienda')[0].text, /repitiendo/);
  assert.match(checkMeta('El polo de siempre', 'Desde 1933, el polo de siempre vuelve con colores nuevos')[0].text, /contiene el asunto/);
});

test('sin preheader, preheader corto y sin asunto', () => {
  assert.match(checkMeta('Asunto', '')[0].text, /Sin preheader/);
  assert.match(checkMeta('Un asunto cualquiera', 'Muy corto')[0].text, /Preheader corto \(9 caracteres\)/);
  assert.match(checkMeta('', 'Un preheader suficientemente largo para la bandeja')[0].text, /Sin asunto/);
});

test('el asunto cortado en móvil dice dónde se corta', () => {
  const w = checkMeta('Un asunto larguísimo que no cabe en la pantalla del móvil', 'Un preheader suficientemente largo que añade algo nuevo', { mobileSubjectChars: 20 });
  assert.equal(w.length, 1);
  assert.match(w[0].text, /se corta tras «Un asunto larguísimo…»/);
});

test('asunto y preheader bien: sin avisos', () => {
  assert.deepEqual(checkMeta('Crece con cada zancada', 'La supertrainer que convierte el esfuerzo en impulso.', { mobileSubjectChars: 22 }), []);
});
