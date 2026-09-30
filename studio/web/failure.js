/**
 * failure.js — por qué falló un trabajo, dicho para el equipo (2026-09-30).
 *
 * El error que guardan el servidor y el worker es técnico: rutas del Mac («newsletter.html», «brief.md»),
 * códigos de salida y la última respuesta de Hermes. La página lo enseñaba tal cual, en rojo y en letra
 * de código. Aquí se resume en una frase y se dice qué hacer; el texto original sigue disponible como
 * «Detalle técnico». Los patrones salen de los mensajes reales de studio/server y studio/worker.
 * Script clásico en la página (window.HermesFailure) y módulo en los tests (studio/web/failure.test.js).
 */
(function (root) {
  'use strict';

  /** `retry`: si reintentar tal cual tiene sentido (el fallo no dependía de lo pedido). */
  var RULES = [
    {
      test: /se quedó en bucle/i,
      summary: 'Hermes se quedó dando vueltas sin avanzar y se paró para no gastar más tiempo.',
      advice: 'Suele salir bien al reintentar. Si se repite, concreta más lo que pides.',
      retry: true,
    },
    {
      test: /se agotó el tiempo/i,
      summary: 'Hermes tardó más de lo permitido y se paró.',
      advice: 'Reinténtalo. Si se repite, pide una pieza más acotada (menos bloques o un solo mensaje).',
      retry: true,
    },
    {
      test: /dejó de responder|se detuvo a mitad|se reinició a mitad|reinicio del servicio/i,
      summary: 'Se cortó la conexión con Hermes a mitad del trabajo: el Mac que lo ejecuta se apagó, se durmió o se reinició.',
      advice: 'No tiene que ver con lo que pediste: vuelve a lanzarlo tal cual.',
      retry: true,
    },
    {
      test: /no se pudo subir a Studio/i,
      summary: 'La newsletter se terminó, pero no se pudo subir a Studio.',
      advice: 'Reinténtalo. Si se repite, avisa a quien mantiene Studio: la pieza está guardada en el Mac.',
      retry: true,
    },
    {
      test: /no llegó a escribir el brief|no aceptó el brief/i,
      summary: 'Hermes no llegó a preparar el brief creativo a partir de tu instrucción.',
      advice: 'Reinténtalo. Si se repite, pega un prompt creativo completo en lugar de una instrucción.',
      retry: true,
    },
    {
      test: /sin dejar el HTML|no entregó/i,
      summary: 'Hermes terminó sin entregar la newsletter.',
      advice: 'Suele salir bien al reintentar. Si se repite, revisa y concreta lo que pediste.',
      retry: true,
    },
    {
      test: /newsletter original/i,
      summary: 'No se encontró la newsletter de partida para hacer los cambios.',
      advice: 'Pide los cambios de nuevo desde la versión que quieras retocar.',
      retry: false,
    },
  ];

  var FALLBACK = {
    summary: 'Hermes no pudo terminar la newsletter.',
    advice: 'Reinténtalo. Si se repite, mira el detalle técnico o el registro de Hermes.',
    retry: true,
  };

  /** Resumen de un fallo: { summary, advice, retry, detail }. `detail` es el error original, sin tocar. */
  function explainFailure(error) {
    var text = String(error || '').trim();
    for (var i = 0; i < RULES.length; i++) {
      if (RULES[i].test.test(text)) {
        return { summary: RULES[i].summary, advice: RULES[i].advice, retry: RULES[i].retry, detail: text };
      }
    }
    return { summary: FALLBACK.summary, advice: FALLBACK.advice, retry: FALLBACK.retry, detail: text };
  }

  var api = { explainFailure: explainFailure };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.HermesFailure = api;
})(this);
