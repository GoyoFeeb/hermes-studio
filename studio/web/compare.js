/**
 * compare.js — qué ha cambiado entre dos versiones de una newsletter (2026-09-28).
 *
 * Con "Pedir cambios" hay que poder confirmar que Hermes solo tocó lo pedido: se comparan el texto
 * visible (por bloques: párrafos, titulares, celdas, botones), los enlaces y las imágenes. Sin DOM, con
 * expresiones regulares, para que funcione igual en el navegador y en los tests de Node
 * (studio/web/compare.test.js). Se carga en la página como script clásico: expone window.HermesCompare.
 */
(function (root) {
  'use strict';

  var BLOCK_TAGS = /<(\/?)(p|h[1-6]|li|td|th|tr|div|table|br|a|button|center|blockquote)\b[^>]*>/gi;

  function decodeEntities(text) {
    return text
      .replace(/&nbsp;|&#160;/gi, ' ')
      .replace(/&amp;/gi, '&')
      .replace(/&quot;/gi, '"')
      .replace(/&#39;|&apos;/gi, "'")
      .replace(/&lt;/gi, '<')
      .replace(/&gt;/gi, '>')
      .replace(/&#(\d+);/g, function (_m, n) {
        return String.fromCodePoint(Number(n));
      })
      .replace(/&#x([0-9a-f]+);/gi, function (_m, n) {
        return String.fromCodePoint(parseInt(n, 16));
      });
  }

  function bodyOf(html) {
    var m = html.match(/<body\b[^>]*>([\s\S]*)<\/body>/i);
    return (m ? m[1] : html)
      .replace(/<!--[\s\S]*?-->/g, '')
      .replace(/<(style|script|head|title)\b[\s\S]*?<\/\1>/gi, '');
  }

  function attr(tag, name) {
    var m = tag.match(new RegExp('\\b' + name + '\\s*=\\s*("([^"]*)"|\'([^\']*)\')', 'i'));
    return m ? decodeEntities(m[2] != null ? m[2] : m[3] || '').trim() : null;
  }

  /** Bloques de texto visible, en orden (el preheader oculto incluido: también es contenido). */
  function textBlocks(html) {
    return decodeEntities(bodyOf(html).replace(BLOCK_TAGS, '\n').replace(/<[^>]+>/g, ' '))
      .split('\n')
      .map(function (line) {
        return line.replace(/[\s\u200b-\u200d\u034f\u00ad\ufeff]+/g, ' ').trim();
      })
      .filter(Boolean);
  }

  function links(html) {
    var out = [];
    (html.match(/<a\b[^>]*>/gi) || []).forEach(function (tag) {
      var href = attr(tag, 'href');
      if (href && out.indexOf(href) < 0) out.push(href);
    });
    return out;
  }

  function images(html) {
    var out = [];
    (html.match(/<img\b[^>]*>/gi) || []).forEach(function (tag) {
      var src = attr(tag, 'src');
      if (src && out.indexOf(src) < 0) out.push(src);
    });
    return out;
  }

  /** Diferencia por bloques (subsecuencia común más larga): solo lo que se quitó o se añadió. */
  function diffBlocks(before, after) {
    var n = before.length;
    var m = after.length;
    var lcs = [];
    for (var i = 0; i <= n; i++) lcs.push(new Array(m + 1).fill(0));
    for (i = n - 1; i >= 0; i--) {
      for (var j = m - 1; j >= 0; j--) {
        lcs[i][j] = before[i] === after[j] ? lcs[i + 1][j + 1] + 1 : Math.max(lcs[i + 1][j], lcs[i][j + 1]);
      }
    }
    var out = [];
    i = 0;
    j = 0;
    while (i < n && j < m) {
      if (before[i] === after[j]) {
        i++;
        j++;
      } else if (lcs[i + 1][j] >= lcs[i][j + 1]) {
        out.push({ type: 'removed', text: before[i++] });
      } else {
        out.push({ type: 'added', text: after[j++] });
      }
    }
    while (i < n) out.push({ type: 'removed', text: before[i++] });
    while (j < m) out.push({ type: 'added', text: after[j++] });
    return out;
  }

  function setDiff(before, after) {
    return {
      removed: before.filter(function (x) {
        return after.indexOf(x) < 0;
      }),
      added: after.filter(function (x) {
        return before.indexOf(x) < 0;
      }),
    };
  }

  /** Imágenes: Studio publica cada una como /assets/.../img-{hash}.ext, así que la misma imagen
   *  republicada en otra versión cambia de carpeta pero no de nombre. Se comparan por nombre de archivo. */
  function imageKey(src) {
    var clean = src.split(/[?#]/)[0];
    var m = clean.match(/\/(img-[0-9a-f]{12}\.[a-z]+)$/i);
    return m ? m[1] : clean;
  }

  function compareVersions(beforeHtml, afterHtml) {
    var text = diffBlocks(textBlocks(beforeHtml), textBlocks(afterHtml));
    var linkChanges = setDiff(links(beforeHtml), links(afterHtml));
    var beforeImgs = images(beforeHtml);
    var afterImgs = images(afterHtml);
    var imgChanges = setDiff(beforeImgs.map(imageKey), afterImgs.map(imageKey));
    var byKey = function (list) {
      var map = {};
      list.forEach(function (src) {
        map[imageKey(src)] = src;
      });
      return map;
    };
    var beforeByKey = byKey(beforeImgs);
    var afterByKey = byKey(afterImgs);
    return {
      text: text,
      links: linkChanges,
      images: {
        removed: imgChanges.removed.map(function (k) {
          return beforeByKey[k];
        }),
        added: imgChanges.added.map(function (k) {
          return afterByKey[k];
        }),
      },
      unchanged:
        !text.length &&
        !linkChanges.removed.length &&
        !linkChanges.added.length &&
        !imgChanges.removed.length &&
        !imgChanges.added.length,
    };
  }

  var api = { textBlocks: textBlocks, links: links, images: images, diffBlocks: diffBlocks, compareVersions: compareVersions };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.HermesCompare = api;
})(this);
