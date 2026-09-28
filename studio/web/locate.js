/**
 * locate.js — llevar de un aviso o un cambio al sitio de la pieza donde está (2026-09-28).
 *
 * La revisión automática y "Qué ha cambiado" hablan de la pieza con texto ("Imagen sin atributo alt: <img
 * src=…>", "https://… → HTTP 404", un párrafo añadido). Aquí se traduce cada detalle a una forma de
 * encontrarlo en el documento de la vista previa (`locatorsFor`, sin DOM: se prueba en Node, ver
 * studio/web/locate.test.js) y se busca en ese documento (`find`, con DOM: solo en la página).
 * Script clásico en la página (window.HermesLocate) y módulo en los tests.
 */
(function (root) {
  'use strict';

  function norm(text) {
    return String(text || '')
      .replace(/[\s\u00a0\u200b-\u200d\u034f\u00ad\ufeff]+/g, ' ')
      .trim();
  }

  /** URL de un detalle de enlaces o imágenes: "https://… → HTTP 404" o "No verificable: https://… → …". */
  function urlOf(detail) {
    var m = String(detail).match(/(https?:\/\/\S+?)\s+→/);
    return m ? m[1] : null;
  }

  /**
   * Un localizador por detalle de una comprobación (mismo orden que check.details), o null si ese detalle
   * no apunta a un sitio concreto de la pieza (falta el preheader, el peso, el modo oscuro…).
   */
  function locatorsFor(check) {
    var details = check.details || [];
    var nthWidth = 0;
    var nthAlt = 0;
    var nthEmpty = 0;
    return details.map(function (d) {
      d = String(d);
      switch (check.id) {
        case 'links': {
          var link = urlOf(d);
          return link ? { kind: 'href', url: link } : null;
        }
        case 'images': {
          var img = urlOf(d);
          return img ? { kind: 'src', url: img } : null;
        }
        case 'local-images': {
          var local = d.match(/^La imagen (.+) no existe en el Mac\.$/);
          return local ? { kind: 'src', url: local[1] } : null;
        }
        case 'alt':
          return /^Imagen sin atributo alt/.test(d) ? { kind: 'nth', selector: 'img:not([alt])', n: nthAlt++ } : null;
        case 'empty-links':
          return /^Enlace vacío/.test(d) ? { kind: 'empty-link', n: nthEmpty++ } : null;
        case 'outlook':
          if (/^Imagen sin atributo width/.test(d)) return { kind: 'nth', selector: 'img:not([width])', n: nthWidth++ };
          if (/display:flex\/grid/.test(d)) return { kind: 'flex' };
          return null;
        case 'claims': {
          // «garantizado» (alto): …contexto de 40 caracteres a cada lado… — recomendación
          var ctx = d.match(/: …([\s\S]+?)… — /);
          return ctx ? { kind: 'text', text: norm(ctx[1]) } : null;
        }
        case 'mobile':
          return /Se salen:/.test(d) ? { kind: 'overflow' } : null;
        default:
          return null;
      }
    });
  }

  /** Clave de imagen igual que compare.js: /assets/…/img-{hash}.ext cambia de carpeta entre versiones. */
  function imageKey(src) {
    var clean = String(src || '').split(/[?#]/)[0];
    var m = clean.match(/\/(img-[0-9a-f]{12}\.[a-z]+)$/i);
    return m ? m[1] : clean;
  }

  /** Localizadores de "Qué ha cambiado" (compareVersions de compare.js). `side`: 'after' | 'before'. */
  function changeLocators(diff, side) {
    var kind = side === 'before' ? 'removed' : 'added';
    var out = [];
    diff.text.forEach(function (d) {
      if (d.type === kind) out.push({ kind: 'text', text: norm(d.text) });
    });
    diff.links[kind].forEach(function (u) {
      out.push({ kind: 'href', url: u });
    });
    diff.images[kind].forEach(function (u) {
      out.push({ kind: 'src', url: u });
    });
    return out;
  }

  // ------------------------------------------------------------ búsqueda en el documento (solo navegador)

  function visible(el) {
    var r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0;
  }

  /** El elemento más interno cuyo texto contiene `text`. Si el texto cruza bloques, prueba con un trozo. */
  function findText(doc, text) {
    var target = norm(text);
    if (!target || !doc.body) return null;
    var tries = [target];
    if (target.length > 40) tries.push(target.slice(Math.floor(target.length / 2) - 15, Math.floor(target.length / 2) + 15).trim());
    for (var t = 0; t < tries.length; t++) {
      var needle = tries[t];
      var best = null;
      var all = doc.body.getElementsByTagName('*');
      for (var i = 0; i < all.length; i++) {
        var el = all[i];
        if (/^(style|script|head|title)$/i.test(el.tagName)) continue;
        if (norm(el.textContent).indexOf(needle) >= 0 && visible(el)) best = el; // en orden de documento: el último que contiene es el más interno
      }
      if (best) return best;
    }
    return null;
  }

  function findSrc(doc, url) {
    var key = imageKey(url);
    var imgs = doc.querySelectorAll('img');
    for (var i = 0; i < imgs.length; i++) {
      var src = imgs[i].getAttribute('src') || '';
      if (src === url || imageKey(src) === key || (key.length > 8 && src.slice(-key.length) === key)) return imgs[i];
    }
    var withBg = doc.querySelectorAll('[background], [style*="url("]');
    for (var j = 0; j < withBg.length; j++) {
      var attrs = (withBg[j].getAttribute('background') || '') + ' ' + (withBg[j].getAttribute('style') || '');
      if (attrs.indexOf(url) >= 0 || (key.length > 8 && attrs.indexOf(key) >= 0)) return withBg[j];
    }
    return null;
  }

  /** Lo que se sale del ancho: el primer elemento que se sale y cuyo contenedor cabe (el culpable, no sus hijos). */
  function findOverflow(doc) {
    var width = doc.documentElement.clientWidth + 1;
    var all = doc.body ? doc.body.getElementsByTagName('*') : [];
    for (var i = 0; i < all.length; i++) {
      var el = all[i];
      if (!visible(el) || el.getBoundingClientRect().right <= width) continue;
      var parent = el.parentElement;
      if (!parent || parent === doc.body || parent.getBoundingClientRect().right <= width) return el;
    }
    return null;
  }

  function find(doc, loc) {
    if (!doc || !loc) return null;
    var el = null;
    if (loc.kind === 'href') {
      var anchors = doc.querySelectorAll('a[href]');
      for (var i = 0; i < anchors.length && !el; i++) if (norm(anchors[i].getAttribute('href')) === norm(loc.url)) el = anchors[i];
    } else if (loc.kind === 'src') {
      el = findSrc(doc, loc.url);
    } else if (loc.kind === 'nth') {
      el = doc.querySelectorAll(loc.selector)[loc.n] || null;
    } else if (loc.kind === 'empty-link') {
      var empties = Array.prototype.filter.call(doc.querySelectorAll('a'), function (a) {
        var h = norm(a.getAttribute('href'));
        return !h || h === '#' || /^javascript:/i.test(h);
      });
      el = empties[loc.n] || null;
    } else if (loc.kind === 'flex') {
      el = Array.prototype.find.call(doc.querySelectorAll('[style]'), function (e) {
        return /display\s*:\s*(inline-)?(flex|grid)\b/i.test(e.getAttribute('style'));
      }) || null;
    } else if (loc.kind === 'text') {
      el = findText(doc, loc.text);
    } else if (loc.kind === 'overflow') {
      el = findOverflow(doc);
    }
    return el && visible(el) ? el : null;
  }

  var api = { locatorsFor: locatorsFor, changeLocators: changeLocators, find: find, urlOf: urlOf, imageKey: imageKey };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.HermesLocate = api;
})(this);
