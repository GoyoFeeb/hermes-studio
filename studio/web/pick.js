/**
 * pick.js — "Señalar en la vista previa" para "Pedir cambios" (2026-09-28).
 *
 * En la prueba real de Nike el cambio se pidió como «la tercera imagen»: Hermes tuvo que deducir cuál era.
 * Ahora se hace clic sobre la pieza y se escribe una referencia exacta en la petición. Aquí vive la parte
 * sin DOM (qué elemento se señala y cómo se describe), para probarla en Node (studio/web/pick.test.js);
 * app.js lee el elemento del marco de la vista previa y llama a estas funciones.
 * Script clásico en la página (window.HermesPick) y módulo en los tests.
 */
(function (root) {
  'use strict';

  var TEXT_BLOCK = /^(h[1-6]|p|li|blockquote)$/;
  var CONTAINER = /^(td|th|div|center|table|tr|tbody)$/;
  /** Un contenedor con más texto que esto es un trozo de maquetación (toda la columna), no un bloque. */
  var MAX_CONTAINER_TEXT = 400;

  function clean(text) {
    return String(text || '')
      .replace(/[\s\u00a0\u200b-\u200d\u034f\u00ad\ufeff]+/g, ' ')
      .trim();
  }

  function excerpt(text, max) {
    var t = clean(text);
    return t.length > max ? t.slice(0, max - 1).replace(/\s+\S*$/, '') + '…' : t;
  }

  /**
   * Elige qué se señala a partir de la cadena de antepasados del punto pulsado (del más interno al más
   * externo): [{ tag, text, isImage, hasBackground }]. Devuelve el índice en la cadena, o -1.
   * Prioridad: imagen → enlace o botón → titular/párrafo → celda o capa con poco texto o con fondo.
   */
  function chooseTarget(chain) {
    var i;
    for (i = 0; i < chain.length; i++) if (chain[i].isImage) return i;
    for (i = 0; i < chain.length; i++) if (chain[i].tag === 'a' || chain[i].tag === 'button') return i;
    for (i = 0; i < chain.length; i++) if (TEXT_BLOCK.test(chain[i].tag) && clean(chain[i].text)) return i;
    for (i = 0; i < chain.length; i++) {
      var c = chain[i];
      if (c.tag === 'body' || c.tag === 'html') break;
      if (!CONTAINER.test(c.tag)) continue;
      var len = clean(c.text).length;
      if (c.hasBackground || (len > 0 && len <= MAX_CONTAINER_TEXT)) return i;
    }
    return -1;
  }

  /**
   * Referencia que se escribe en la petición. `info`:
   *  imagen → { kind: 'image', index, total, alt }  (index: posición entre todas las <img>, desde 1)
   *  enlace → { kind: 'link', text, href, isButton }
   *  texto  → { kind: 'text', tag, text }
   *  fondo  → { kind: 'background', text }
   */
  function describe(info) {
    if (info.kind === 'image') {
      var alt = clean(info.alt);
      return '[Señalado: imagen nº ' + info.index + ' de ' + info.total + ' del HTML' + (alt ? ', alt «' + excerpt(alt, 80) + '»' : ', sin alt') + ']';
    }
    if (info.kind === 'link') {
      var label = excerpt(info.text, 60);
      var href = String(info.href || '').trim();
      var where = href && !/^#?$/.test(href) ? ' → ' + (href.length > 120 ? href.slice(0, 119) + '…' : href) : '';
      return '[Señalado: ' + (info.isButton ? 'botón' : 'enlace') + (label ? ' «' + label + '»' : ' sin texto') + where + ']';
    }
    if (info.kind === 'background') {
      var over = excerpt(info.text, 80);
      return '[Señalado: bloque con imagen de fondo' + (over ? ', con el texto «' + over + '»' : '') + ']';
    }
    var what = /^h[1-6]$/.test(info.tag) ? 'titular' : info.tag === 'li' ? 'punto de lista' : info.tag === 'p' ? 'párrafo' : 'bloque';
    return '[Señalado: ' + what + ' «' + excerpt(info.text, 90) + '»]';
  }

  /** Inserta la referencia en la petición, seguida de un espacio para escribir detrás. Si lo anterior
   *  acaba en espacio («Recorta el blanco de la imagen ␣», de un atajo) sigue la frase; si no, o si lo
   *  anterior es otra referencia, va en una línea propia. */
  function insertReference(value, caret, reference) {
    var before = value.slice(0, caret);
    var after = value.slice(caret);
    var continues = /\n$/.test(before) || (/ $/.test(before) && !/\]\s*$/.test(before));
    var lead = before && !continues ? '\n' : '';
    var inserted = lead + reference + ' ';
    return { value: before + inserted + after, caret: before.length + inserted.length };
  }

  var api = { chooseTarget: chooseTarget, describe: describe, insertReference: insertReference, excerpt: excerpt };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.HermesPick = api;
})(this);
