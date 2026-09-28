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
