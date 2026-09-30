/**
 * formcheck.js — aviso antes de enviar una instrucción poco concreta (2026-09-28).
 *
 * Un trabajo de Hermes tarda 10-25 minutos. Con «newsletter de Inglesina segunda» o «newsletter de Nike de
 * prueba» Hermes tiene que inventarse de qué va la pieza. Aquí se detecta, sin bloquear el envío: el
 * formulario enseña lo que falta y deja "Enviar igualmente". Calibrado con las instrucciones reales del
 * equipo: «newsletter de Prozis con la oferta de creatina» o «… de Inglesina para la vuelta al cole» pasan.
 * Script clásico en la página (window.HermesFormCheck) y módulo en los tests (studio/web/formcheck.test.js).
 */
(function (root) {
  'use strict';

  /** Palabras que no dicen de qué va la pieza: verbos de encargo, artículos, "newsletter", "prueba"… */
  var FILLER = new RegExp(
    '^(newsletter|newsletters|news|mail|email|e-mail|correo|campaña|boletin|boletín|quiero|queremos|haz|hazme|haga|crea|creame|créame|' +
      'prepara|preparame|prepárame|necesito|necesitamos|escribe|genera|diseña|una|uno|un|unas|unos|de|del|la|el|los|las|lo|para|con|sobre|' +
      'y|e|o|a|al|en|por|que|su|sus|mi|mis|nuestra|nuestro|tu|tus|otra|otro|nueva|nuevo|prueba|pruebas|test|testing|ejemplo|demo|' +
      'primera|primero|segunda|segundo|tercera|tercero|version|versión|v1|v2|v3|marca|cliente|algo|cosa|cualquier|general|generica|genérica|' +
      'bonita|chula|guay|buena|nombre|hola|porfa|por|favor|gracias|\\d+)$',
    'i'
  );

  /** Pistas de objetivo o público: para quién, qué oferta, qué momento. */
  var GOAL =
    /\bpara\b|dirigid|\bclientes?\b|familias|p[úu]blico|audiencia|usuari|socios|lanz|present|promo|descuento|oferta|rebaja|black\s*friday|cyber|novedad|captar|fideliz|reactiv|recuper|venta|vend|anunci|temporada|evento|navidad|verano|invierno|primavera|oto[ñn]o|vuelta al cole|san valent[ií]n|d[ií]a de|aniversario|colecci[óo]n|estreno|inscrip|reserva|%|€/i;

  function words(text) {
    return String(text || '')
      .toLowerCase()
      .split(/[^a-z0-9áéíóúüñ%€]+/i)
      .filter(Boolean);
  }

  /** Palabras que dicen de qué va: todo menos el relleno y el nombre de la marca. */
  function contentWords(text, brand) {
    var brandWords = words(brand);
    return words(text).filter(function (w) {
      return !FILLER.test(w) && brandWords.indexOf(w) < 0;
    });
  }

  /**
   * Devuelve la lista de cosas que faltan (vacía si la instrucción es concreta).
   * kind: 'instruction' | 'brief'.
   */
  function checkInstruction(text, kind, brand) {
    var t = String(text || '').trim();
    if (!t) return [];
    if (kind === 'brief') {
      // Un prompt creativo de la skill ocupa varias pantallas; unas líneas son una instrucción.
      return t.length < 400
        ? [{ id: 'short-brief', message: 'Parece corto para un prompt completo. Si es una frase, elige «Instrucción rápida» y Hermes escribirá antes el brief.' }]
        : [];
    }
    var issues = [];
    var content = contentWords(t, brand);
    if (!content.length) {
      issues.push({
        id: 'topic',
        message: 'No dice de qué va: el producto, servicio u oferta concreta (p. ej. «el lanzamiento del Pegasus 42» o «la oferta de creatina»).',
      });
    }
    if (!GOAL.test(t)) {
      issues.push({
        id: 'goal',
        message: 'No dice el objetivo ni a quién va (p. ej. «para corredores que empiezan», «-20 % hasta el domingo» o «para la vuelta al cole»).',
      });
    }
    return issues;
  }

  /** Petición de cambios con huecos de las peticiones frecuentes sin rellenar (2026-09-30): el «…» de
   *  «Cambia el titular por «…».» o una que acaba en espacio («…del producto en ») sin decir dónde. Hermes
   *  tarda minutos y tendría que adivinar. `templates`: el texto de los chips (data-quick). */
  function checkChangeRequest(text, templates) {
    var issues = [];
    var value = String(text || '');
    if (value.indexOf('…') >= 0) issues.push({ id: 'placeholder', text: 'Queda un «…» sin rellenar: escribe lo que va en su lugar.' });
    var lines = value.split('\n').map(function (l) {
      return l.trim();
    });
    (templates || []).forEach(function (t) {
      if (!/\s$/.test(t) || lines.indexOf(t.trim()) < 0) return;
      issues.push({
        id: 'unfinished',
        text: '«' + t.trim() + '…» está sin terminar: di dónde, o señálalo en la vista previa.',
      });
    });
    return issues;
  }

  var api = { checkInstruction: checkInstruction, contentWords: contentWords, checkChangeRequest: checkChangeRequest };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.HermesFormCheck = api;
})(this);
