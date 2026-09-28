/**
 * markdown.js — Markdown mínimo y seguro para la autoauditoría (notas.md) y el brief de Hermes (2026-09-28).
 *
 * El texto lo escribe un modelo que ha leído webs de terceros: primero se escapa TODO el HTML y después
 * se añade solo el marcado que se reconoce (títulos, negrita, cursiva, código, listas, citas, tablas,
 * separadores y enlaces). Los enlaces solo pueden ser http(s) y se abren en otra pestaña. Cubre lo que
 * usan las notas reales (tablas de "dato → URL oficial", secciones numeradas, rutas en `código`).
 * Script clásico en la página (window.HermesMarkdown) y módulo en los tests (studio/web/markdown.test.js).
 */
(function (root) {
  'use strict';

  function escapeHtml(text) {
    return String(text)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function link(url, label) {
    return '<a href="' + url + '" target="_blank" rel="noopener noreferrer">' + label + '</a>';
  }

  /** Marcado en línea sobre texto YA escapado. El código y los enlaces se apartan primero (fichas
   *  \u0000n\u0000) para que lo de dentro — rutas y URLs con _ o * — no se convierta en cursiva. */
  function inline(escaped) {
    var saved = [];
    var keep = function (html) {
      saved.push(html);
      return '\u0000' + (saved.length - 1) + '\u0000';
    };
    var out = escaped.replace(/`([^`]+)`/g, function (_m, code) {
      return keep('<code>' + code + '</code>');
    });
    // [texto](https://…) — solo http(s)
    out = out.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, function (_m, label, url) {
      return keep(link(url, label));
    });
    // URLs sueltas. En el texto escapado no quedan comillas ni ángulos: la URL acaba en espacio,
    // paréntesis, barra de tabla o comillas españolas, y sin el punto o la coma final de la frase.
    out = out.replace(/https?:\/\/[^\s<>)|»]+[^\s<>)|».,;:!?]/g, function (url) {
      return keep(link(url, url));
    });
    out = out.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    out = out.replace(/(^|[^*\w])\*([^*\s][^*]*?)\*(?!\w)/g, '$1<em>$2</em>');
    out = out.replace(/(^|[^_\w])_([^_\s][^_]*?)_(?!\w)/g, '$1<em>$2</em>');
    return out.replace(/\u0000(\d+)\u0000/g, function (_m, n) {
      return saved[Number(n)];
    });
  }

  function isTableRow(line) {
    return /^\s*\|.*\|\s*$/.test(line);
  }

  function isTableSeparator(line) {
    return /^\s*\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)*\|?\s*$/.test(line);
  }

  function cells(line) {
    return line.trim().replace(/^\||\|$/g, '').split('|').map(function (c) {
      return inline(escapeHtml(c.trim()));
    });
  }

  function render(markdown) {
    var lines = String(markdown || '').replace(/\r\n?/g, '\n').split('\n');
    var html = [];
    var i = 0;
    var paragraph = [];

    function flushParagraph() {
      if (paragraph.length) html.push('<p>' + inline(escapeHtml(paragraph.join(' '))) + '</p>');
      paragraph = [];
    }

    while (i < lines.length) {
      var line = lines[i];
      var trimmed = line.trim();

      if (!trimmed) {
        flushParagraph();
        i++;
        continue;
      }

      // Bloque de código ```
      if (/^```/.test(trimmed)) {
        flushParagraph();
        var code = [];
        i++;
        while (i < lines.length && !/^```/.test(lines[i].trim())) code.push(lines[i++]);
        i++;
        html.push('<pre><code>' + escapeHtml(code.join('\n')) + '</code></pre>');
        continue;
      }

      var heading = trimmed.match(/^(#{1,6})\s+(.*)$/);
      if (heading) {
        flushParagraph();
        // Los títulos de las notas se muestran a partir de h4: la página ya tiene sus propios h2/h3.
        var level = Math.min(6, heading[1].length + 3);
        html.push('<h' + level + '>' + inline(escapeHtml(heading[2].replace(/\s+#+\s*$/, ''))) + '</h' + level + '>');
        i++;
        continue;
      }

      if (/^(-{3,}|\*{3,}|_{3,})$/.test(trimmed)) {
        flushParagraph();
        html.push('<hr>');
        i++;
        continue;
      }

      if (isTableRow(line) && i + 1 < lines.length && isTableSeparator(lines[i + 1])) {
        flushParagraph();
        var head = cells(line);
        i += 2;
        var rows = [];
        while (i < lines.length && isTableRow(lines[i])) rows.push(cells(lines[i++]));
        html.push(
          '<div class="md-table"><table><thead><tr>' +
            head.map(function (c) {
              return '<th>' + c + '</th>';
            }).join('') +
            '</tr></thead><tbody>' +
            rows.map(function (r) {
              return '<tr>' + r.map(function (c) {
                return '<td>' + c + '</td>';
              }).join('') + '</tr>';
            }).join('') +
            '</tbody></table></div>'
        );
        continue;
      }

      if (/^>\s?/.test(trimmed)) {
        flushParagraph();
        var quote = [];
        while (i < lines.length && /^>\s?/.test(lines[i].trim())) quote.push(lines[i++].trim().replace(/^>\s?/, ''));
        html.push('<blockquote>' + inline(escapeHtml(quote.join(' '))) + '</blockquote>');
        continue;
      }

      var bullet = /^\s*[-*+]\s+/;
      var ordered = /^\s*\d+[.)]\s+/;
      if (bullet.test(line) || ordered.test(line)) {
        flushParagraph();
        var isOrdered = ordered.test(line);
        var marker = isOrdered ? ordered : bullet;
        var items = [];
        while (i < lines.length && marker.test(lines[i])) {
          var text = lines[i++].replace(marker, '');
          // Continuación del mismo punto: líneas sangradas que no empiezan otro punto.
          while (i < lines.length && /^\s{2,}\S/.test(lines[i]) && !bullet.test(lines[i]) && !ordered.test(lines[i])) {
            text += ' ' + lines[i++].trim();
          }
          items.push('<li>' + inline(escapeHtml(text)) + '</li>');
        }
        var tag = isOrdered ? 'ol' : 'ul';
        html.push('<' + tag + '>' + items.join('') + '</' + tag + '>');
        continue;
      }

      paragraph.push(trimmed);
      i++;
    }
    flushParagraph();
    return html.join('\n');
  }

  var api = { render: render };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.HermesMarkdown = api;
})(this);
