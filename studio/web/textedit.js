/**
 * textedit.js — "Editar texto" sobre la vista previa, sin Hermes (2026-09-28).
 *
 * Se hace una foto del texto de la pieza antes de editar y otra al guardar; al servidor solo va lo que
 * cambió, con su sitio (ruta de elementos desde <body> y "hueco" entre hijos) y el texto de antes y de
 * después. El servidor lo aplica sobre el HTML publicado sin tocar nada más (studio/server/textEdit.ts,
 * mismo modelo de ruta y hueco). Si al editar se ha roto la estructura (un bloque borrado entero, un
 * formato partido), no se guarda y se dice dónde: eso es un cambio para "Pedir cambios".
 *
 * Funciona sobre cualquier árbol con la forma del DOM (nodeType, childNodes, tagName, data): en la página,
 * el documento de la vista previa; en los tests, el árbol de parse5 adaptado (studio/web/textedit.test.js).
 * Script clásico en la página (window.HermesTextEdit) y módulo en los tests.
 */
(function (root) {
  'use strict';

  /** Marcador del texto vaciado mientras se edita (ver replaceInTextNode en app.js): no cuenta como texto. */
  var PLACEHOLDER = '\u2060';
  var RAW_TEXT = /^(style|script|title|textarea|noscript|xmp|iframe|noembed|noframes|template)$/i;
  var INVISIBLE_TAIL = /[\s\u00a0\u200b-\u200d\u034f\u00ad\ufeff]+$/;

  function norm(text) {
    return String(text || '')
      .replace(/\u00a0/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Foto del texto: `sig` (la estructura: cada elemento y comentario con su ruta) y `gaps` (cada hueco de
   * texto con su ruta, índice y contenido). `body`: el elemento <body>.
   */
  function snapshot(body) {
    var sig = [];
    var gaps = [];
    (function visit(el, path) {
      var tag = String(el.tagName || '').toLowerCase();
      sig.push(path.join('.') + ':' + tag);
      var raw = RAW_TEXT.test(tag);
      var gap = 0;
      var text = '';
      var elementIndex = 0;
      var nodes = el.childNodes || [];
      for (var i = 0; i < nodes.length; i++) {
        var n = nodes[i];
        if (n.nodeType === 3) {
          text += n.data.split(PLACEHOLDER).join('');
          continue;
        }
        if (n.nodeType !== 1 && n.nodeType !== 8) continue;
        if (!raw) gaps.push({ path: path, gap: gap, text: text });
        gap++;
        text = '';
        if (n.nodeType === 8) sig.push(path.join('.') + '#' + gap);
        else visit(n, path.concat(elementIndex++));
      }
      if (!raw) gaps.push({ path: path, gap: gap, text: text });
    })(body, []);
    return { sig: sig, gaps: gaps };
  }

  /**
   * Compara dos fotos. Devuelve { edits } o { brokenAt } (la ruta del primer elemento cuya estructura
   * cambió, para decir dónde). El nbsp que mete el navegador al escribir se pasa a espacio normal, salvo
   * donde la pieza ya los usaba (p. ej. el relleno del preheader).
   */
  function diff(before, after) {
    var n = Math.max(before.sig.length, after.sig.length);
    for (var i = 0; i < n; i++) {
      if (before.sig[i] !== after.sig[i]) {
        var at = String(before.sig[i] || after.sig[i] || '');
        return { brokenAt: at.split(/[:#]/)[0] };
      }
    }
    var edits = [];
    for (var j = 0; j < before.gaps.length; j++) {
      var b = before.gaps[j];
      var a = after.gaps[j];
      if (!a || a.text === b.text) continue;
      var text = b.text.indexOf('\u00a0') >= 0 ? a.text : a.text.replace(/\u00a0/g, ' ');
      if (norm(text) === norm(b.text)) continue;
      edits.push({ path: b.path, gap: b.gap, before: b.text, after: text });
    }
    return { edits: edits };
  }

  /** Preheader: se cambia el texto visible y se conserva el relleno invisible del final (&nbsp;&zwnj;…). */
  function replaceVisible(gapText, visible) {
    var lead = (gapText.match(/^\s*/) || [''])[0];
    var tail = (gapText.match(INVISIBLE_TAIL) || [''])[0];
    return lead + visible.replace(/\s+/g, ' ').trim() + tail;
  }

  /** Texto visible de un hueco del preheader, sin el relleno. */
  function visiblePart(gapText) {
    return norm(String(gapText).replace(INVISIBLE_TAIL, '').replace(/[\u200b-\u200d\u034f\u00ad\ufeff]/g, ''));
  }

  var api = { PLACEHOLDER: PLACEHOLDER, snapshot: snapshot, diff: diff, replaceVisible: replaceVisible, visiblePart: visiblePart, norm: norm };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.HermesTextEdit = api;
})(this);
