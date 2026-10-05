const test = require('node:test');
const assert = require('node:assert/strict');
const { explainFailure } = require('./failure.js');

// Mensajes reales de studio/server y studio/worker (con sus rutas y la cola de la respuesta de Hermes).
const REAL = {
  loop: 'Hermes se quedó en bucle (reescribiendo newsletter.html), también después de pedirle que escribiera la newsletter. Se ha parado para no gastar más tiempo: vuelve a lanzarlo con «Reintentar».',
  timeout: 'Hermes se agotó el tiempo (95 min).\n\nÚltima respuesta de Hermes:\n…',
  noHtml: 'Hermes terminó (código 1) sin dejar el HTML en newsletters/2026/nike/hermes/2026-09-28-at86sp/.\n\nÚltima respuesta de Hermes:\nError: rate limit',
  sweep: 'Hermes dejó de responder (¿Mac apagado, dormido o worker cerrado?). Vuelve a enviarlo.',
  stopped: 'El worker de Hermes se detuvo a mitad del trabajo. Vuelve a enviarlo.',
  restart: 'Interrumpido por un reinicio del servicio.',
  upload: 'La newsletter está terminada en el Mac del worker (newsletters/2026/nike/hermes/x/newsletter.html) pero no se pudo subir a Studio: HTTP 413',
  brief: 'Hermes no llegó a escribir el brief (newsletters/2026/nike/hermes/x/brief.md).\n\nÚltima respuesta de Hermes:\n…',
  original: 'No se encontró el HTML de la newsletter original.',
};

test('cada fallo real tiene un resumen sin rutas ni jerga técnica', () => {
  for (const [name, error] of Object.entries(REAL)) {
    const { summary, advice } = explainFailure(error);
    assert.ok(summary && advice, name);
    assert.doesNotMatch(summary + advice, /\.html|\.md|worker|código \d|newsletters\//i, name);
    assert.notEqual(summary, explainFailure('algo inesperado').summary, `${name} no debería caer en el genérico`);
  }
});

test('el detalle técnico se conserva tal cual', () => {
  assert.equal(explainFailure(REAL.noHtml).detail, REAL.noHtml);
});

test('los cortes del Mac no dependen de lo pedido; la falta de la newsletter original no se arregla reintentando', () => {
  assert.match(explainFailure(REAL.sweep).advice, /no tiene que ver con lo que pediste/i);
  assert.equal(explainFailure(REAL.stopped).retry, true);
  assert.equal(explainFailure(REAL.original).retry, false);
});

test('un error desconocido o vacío da el mensaje genérico', () => {
  assert.equal(explainFailure('').summary, 'Hermes no pudo terminar la newsletter.');
  assert.equal(explainFailure(undefined).detail, '');
});

test('cada fallo tiene una versión corta, de una línea, para el historial', () => {
  for (const error of [...Object.values(REAL), '']) {
    const { summary, short } = explainFailure(error);
    assert.ok(short && short.length <= 45, short);
    assert.ok(short.length < summary.length, short);
  }
});
