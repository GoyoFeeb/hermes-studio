const test = require('node:test');
const assert = require('node:assert/strict');
const { checkInstruction } = require('./formcheck.js');

const ids = (text, brand, kind = 'instruction') => checkInstruction(text, kind, brand).map((i) => i.id);

test('pasan las instrucciones reales del equipo y los ejemplos del formulario', () => {
  assert.deepEqual(ids('newsletter de Prozis con la oferta de creatina', 'Prozis'), []);
  assert.deepEqual(ids('quiero una newsletter de Inglesina para la vuelta al cole', 'Inglesina'), []);
  assert.deepEqual(ids('newsletter de El Corte Inglés con las novedades de moda', 'El Corte Inglés'), []);
  assert.deepEqual(ids('quiero una newsletter de Adeslas para presentar su seguro dental a familias con niños', 'Adeslas'), []);
  assert.deepEqual(ids('newsletter de Nike para el lanzamiento de sus nuevas zapatillas de running', 'Nike'), []);
  assert.deepEqual(ids('newsletter de Apple presentando su último iPhone a clientes de España', 'Apple'), []);
});

test('se avisa de las que no dicen nada (también reales: «de prueba», «segunda»)', () => {
  assert.deepEqual(ids('newsletter de Nike de prueba', 'Nike'), ['topic', 'goal']);
  assert.deepEqual(ids('newsletter de Inglesina segunda', 'Inglesina'), ['topic', 'goal']);
  assert.deepEqual(ids('hazme una newsletter de El Corte Inglés', 'El Corte Inglés'), ['topic', 'goal']);
});

test('con tema pero sin objetivo ni público, solo ese aviso', () => {
  assert.deepEqual(ids('newsletter de Nike sobre zapatillas', 'Nike'), ['goal']);
  assert.deepEqual(ids('newsletter de Nike: Pegasus 42 con -20 %', 'Nike'), []);
});

test('prompt completo demasiado corto: probablemente era una instrucción', () => {
  assert.deepEqual(ids('newsletter de Nike del Pegasus 42 para corredores', 'Nike', 'brief'), ['short-brief']);
  assert.deepEqual(ids('x'.repeat(500), 'Nike', 'brief'), []);
  assert.deepEqual(ids('', 'Nike'), []);
});

test('petición de cambios: avisa de los huecos de las peticiones frecuentes sin rellenar', () => {
  const { checkChangeRequest } = require('./formcheck.js');
  const chips = ['Cambia el titular por «…».', 'Usa otra foto oficial del producto en ', 'Acorta los textos de la pieza sin perder los datos clave.'];
  const ids = (text) => checkChangeRequest(text, chips).map((i) => i.id);
  assert.deepEqual(ids('Cambia el titular por «…».'), ['placeholder']);
  assert.deepEqual(ids('Acorta los textos.\nUsa otra foto oficial del producto en'), ['unfinished']);
  // Completadas: a mano o con «Señalar en la vista previa», que inserta la referencia en el cursor.
  assert.deepEqual(ids('Cambia el titular por «Corre más lejos».'), []);
  assert.deepEqual(ids('Usa otra foto oficial del producto en [imagen 2: hero]'), []);
  assert.deepEqual(ids('Acorta los textos de la pieza sin perder los datos clave.'), []);
  assert.deepEqual(ids(''), []);
});

test('Cambio solo de texto (2026-10-05): se propone «Editar texto»; con fotos, diseño o datos, no', () => {
  const { isSimpleTextChange } = require('./formcheck.js');
  assert.equal(isSimpleTextChange('Cambia el titular por «Hecho para correr»'), true);
  assert.equal(isSimpleTextChange('Hay una errata en el segundo párrafo: «tecnologia» va con tilde'), true);
  assert.equal(isSimpleTextChange('Cambia el asunto y el preheader'), true);
  assert.equal(isSimpleTextChange('Cambia el titular y usa otra foto del producto'), false);
  assert.equal(isSimpleTextChange('Haz el botón más grande'), false);
  assert.equal(isSimpleTextChange('Cambia el texto del botón y añade el precio'), false);
  assert.equal(isSimpleTextChange('Más aire entre bloques'), false);
});

test('pistas en vivo: marcan lo que la instrucción ya dice (formulario guiado, 2026-10-07)', () => {
  const { coachInstruction } = require('./formcheck.js');
  const done = (text, brand) => coachInstruction(text, brand).filter((i) => i.done).map((i) => i.id);
  assert.deepEqual(done('', 'Nike'), []);
  assert.deepEqual(done('newsletter de Nike', 'Nike'), []);
  assert.deepEqual(done('newsletter de Nike de zapatillas', 'Nike'), ['topic']);
  assert.deepEqual(done('newsletter de Nike para el lanzamiento de sus zapatillas de running', 'Nike'), ['topic', 'goal']);
  assert.deepEqual(done('Prozis con un 20% en creatina para corredores', 'Prozis'), ['topic', 'goal', 'offer', 'audience']);
  assert.deepEqual(done('Adeslas: seguro dental para familias con niños', 'Adeslas'), ['topic', 'goal', 'audience']);
});
