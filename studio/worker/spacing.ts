/**
 * spacing.ts — espaciados medidos al renderizar (2026-10-15, la de Epika: el botón a 8 px de la banda negra de
 * encima, 97 px de hueco vacío debajo y los textos de servicios a 2 px de su línea amarilla). layoutFindings ya
 * miraba textos pegados a fotos y márgenes laterales anchos en móvil; esto mira el resto:
 *  - bordes: cada texto y botón frente a lo que tiene alrededor (otra banda de color, una foto, el borde de la pieza),
 *    leyendo con elementFromPoint qué hay a cada lado;
 *  - líneas: textos pegados a un borde decorativo (border-left de una cita o lista);
 *  - huecos: franjas vacías de un solo color, sin cambio de banda, mucho más altas que el resto;
 *  - solapes: dos textos uno encima del otro.
 */
import type { Browser } from 'playwright';

/** Menos que esto entre un texto o un botón y el borde de su banda, una foto o la pieza: pegado. */
export const EDGE_MIN = 12;
/** Menos que esto entre un texto y su línea decorativa. */
export const RULE_MIN = 8;
/** Un hueco vacío de un solo color es un error si pasa de esto y del doble de la separación habitual dentro de una
 *  banda en la misma pieza (entre bandas de color distinto es normal dejar 72-88 px: eso no cuenta). */
export const HOLE_MAX = 80;

export interface SpacingMetrics {
  width: number;
  overflow?: boolean;
  edges: { text: string; side: 'arriba' | 'abajo' | 'izquierda' | 'derecha'; gap: number; what: 'banda' | 'foto' | 'borde'; button: boolean }[];
  rules: { text: string; gap: number }[];
  holes: { after: string; before: string; gap: number }[];
  overlaps: { a: string; b: string }[];
}

/** Se ejecuta en Chromium con el viewport tan alto como la pieza, para que elementFromPoint vea toda la página. */
const SPACING_JS = `function (o) {
  // Si la pieza se desborda, los bordes no significan nada (y eso ya lo marca la comprobación de móvil).
  if (document.documentElement.scrollWidth > innerWidth + 1) return { width: innerWidth, overflow: true, edges: [], rules: [], holes: [], overlaps: [] };
  function parse(c) { var m = (c || '').match(/rgba?\\(([^)]+)\\)/); if (!m) return null; var p = m[1].split(',').map(parseFloat); return { r: p[0], g: p[1], b: p[2], a: p.length > 3 ? p[3] : 1 }; }
  function key(c) { return Math.round(c.r) + ',' + Math.round(c.g) + ',' + Math.round(c.b); }
  // Lo que se ve en un punto: 'img', un color de fondo o 'fuera' (fuera de la pieza).
  function look(x, y) {
    if (x < 0 || y < 0 || x >= innerWidth || y >= innerHeight) return 'fuera';
    for (var n = document.elementFromPoint(x, y); n && n.nodeType === 1; n = n.parentElement) {
      if (n.tagName === 'IMG') return 'img';
      var cs = getComputedStyle(n);
      if (cs.backgroundImage && cs.backgroundImage !== 'none') return 'img';
      var c = parse(cs.backgroundColor);
      if (c && c.a > 0.5) return n === document.body || n === document.documentElement ? 'fuera:' + key(c) : key(c);
      var a = n.getAttribute('bgcolor');
      if (a && /^#[0-9a-f]{6}$/i.test(a)) return n === document.body ? 'fuera' : key({ r: parseInt(a.substr(1, 2), 16), g: parseInt(a.substr(3, 2), 16), b: parseInt(a.substr(5, 2), 16) });
    }
    return 'fuera';
  }
  function own(el) { var t = ''; for (var i = 0; i < el.childNodes.length; i++) if (el.childNodes[i].nodeType === 3) t += el.childNodes[i].textContent; return t.replace(/\\s+/g, ' ').trim(); }
  function label(el) { return (el.textContent || '').replace(/\\s+/g, ' ').trim().slice(0, 45); }
  function hidden(el) {
    for (var n = el; n && n.nodeType === 1; n = n.parentElement) {
      var cs = getComputedStyle(n);
      if (cs.display === 'none' || cs.visibility === 'hidden' || parseFloat(cs.opacity) === 0 || (cs.maxHeight !== 'none' && parseFloat(cs.maxHeight) === 0)) return true;
    }
    return parseFloat(getComputedStyle(el).fontSize) < 6;
  }
  // Botones: un enlace con fondo propio o la celda con fondo que solo lleva un enlace.
  var buttons = [];
  document.querySelectorAll('a').forEach(function (a) {
    if (hidden(a) || label(a).length < 2) return;
    var box = null, c = parse(getComputedStyle(a).backgroundColor);
    if (c && c.a > 0.5) box = a;
    else {
      var td = a.closest('td');
      var tc = td && parse(getComputedStyle(td).backgroundColor);
      if (td && tc && tc.a > 0.5 && label(td) === label(a)) {
        var r = td.getBoundingClientRect();
        if (r.height < 90 && r.width < 460) box = td;
      }
    }
    if (box) buttons.push({ el: box, a: a });
  });
  function inButton(el) { return buttons.some(function (b) { return b.el.contains(el); }); }
  var texts = [];
  document.body.querySelectorAll('h1,h2,h3,h4,h5,h6,p,li,td,div,a,span').forEach(function (el) {
    if (own(el).length < 2 || hidden(el) || inButton(el)) return;
    var rg = document.createRange(); rg.selectNodeContents(el);
    var r = rg.getBoundingClientRect();
    if (r.width < 4 || r.height < 4) return;
    // Etiquetas en una píldora o un círculo («01», «NUEVO»): su fondo es suyo, no una banda.
    for (var n = el, up = 0; n && n !== document.body && up < 4; n = n.parentElement, up++) {
      var c = parse(getComputedStyle(n).backgroundColor);
      if (c && c.a > 0.5) { var nb = n.getBoundingClientRect(); if (nb.width < 220 && nb.height < 64) return; break; }
    }
    texts.push({ el: el, r: r, rects: Array.prototype.slice.call(rg.getClientRects()), text: label(el) });
  });
  var items = texts.map(function (t) { return { r: t.r, text: t.text, button: false, el: t.el }; })
    .concat(buttons.map(function (b) { return { r: b.el.getBoundingClientRect(), text: label(b.a), button: true, el: b.el }; }));

  // Bordes: a qué distancia cambia lo que hay alrededor (hasta EDGE_MIN px), en tres puntos de cada lado.
  var edges = [], seenE = {};
  items.forEach(function (it) {
    // Un texto se compara con su propio fondo; un botón, con lo que lo rodea (lo que hay justo fuera de su contorno).
    var r = it.r, inner = look(r.left + 1, r.top + r.height / 2);
    if (!it.button && (inner === 'img' || inner.indexOf('fuera') === 0)) return;
    var sides = [
      ['arriba', [r.left + 4, r.left + r.width / 2, r.right - 4], function (x, d) { return [x, r.top - d]; }],
      ['abajo', [r.left + 4, r.left + r.width / 2, r.right - 4], function (x, d) { return [x, r.bottom + d]; }],
      ['izquierda', [r.top + 3, r.top + r.height / 2, r.bottom - 3], function (y, d) { return [r.left - d, y]; }],
      ['derecha', [r.top + 3, r.top + r.height / 2, r.bottom - 3], function (y, d) { return [r.right + d, y]; }]
    ];
    sides.forEach(function (s) {
      // Un texto corto en una línea (el pie, un enlace) no se mide a los lados: su caja es el texto, no el bloque.
      if ((s[0] === 'izquierda' || s[0] === 'derecha') && !it.button && r.width < 120) return;
      var hit = null;
      for (var i = 0; i < 3 && !hit; i++) {
        var start = it.button ? 2 : 1;
        var self = it.button ? look.apply(null, s[2](s[1][i], 2)) : inner;
        if (self === 'img' || self.indexOf('fuera') === 0) continue;
        for (var d = start; d < o.edgeMin + start; d++) {
          var p = s[2](s[1][i], d), v = look(p[0], p[1]);
          if (v === self) continue;
          var what = v === 'img' ? 'foto' : v.indexOf('fuera') === 0 ? 'borde' : 'banda';
          // Arriba y abajo del todo (el «¿No ves bien este correo?», el pie) el borde es el de la página.
          if (what === 'borde' && (s[0] === 'arriba' || s[0] === 'abajo')) break;
          hit = { gap: d - start, what: what };
          break;
        }
      }
      if (!hit) return;
      var k = it.text + '|' + s[0];
      if (seenE[k]) return;
      seenE[k] = true;
      edges.push({ text: it.text, side: s[0], gap: hit.gap, what: hit.what, button: it.button });
    });
  });

  // Líneas decorativas: border-left o border-top de un antepasado cercano pegado al texto.
  var rules = [], seenR = {};
  texts.forEach(function (t) {
    for (var n = t.el, up = 0; n && n !== document.body && up < 5; n = n.parentElement, up++) {
      var cs = getComputedStyle(n), b = n.getBoundingClientRect();
      var bl = parseFloat(cs.borderLeftWidth) || 0;
      if (bl >= 1 && cs.borderLeftStyle !== 'none' && b.height < 900) {
        var gap = t.r.left - (b.left + bl);
        if (gap < o.ruleMin && !seenR[t.text]) { seenR[t.text] = true; rules.push({ text: t.text, gap: Math.max(0, Math.round(gap)) }); }
        return;
      }
    }
  });

  // Huecos: franjas sin ningún texto, botón ni foto, de un solo color en todo el ancho de la columna (600 px como
  // mucho: el marco exterior de color no cuenta).
  var canvas = null;
  document.querySelectorAll('table').forEach(function (t) { var r = t.getBoundingClientRect(); if (r.width <= 640 && r.width > 200 && (!canvas || r.width > canvas.width)) canvas = r; });
  var blocks = items.map(function (it) { return { top: it.r.top, bottom: it.r.bottom, text: it.text }; });
  document.querySelectorAll('img').forEach(function (img) { if (hidden(img)) return; var r = img.getBoundingClientRect(); if (r.width > 20 && r.height > 20) blocks.push({ top: r.top, bottom: r.bottom, text: '[foto] ' + (img.getAttribute('alt') || '').slice(0, 35) }); });
  blocks.sort(function (a, b) { return a.top - b.top; });
  var holes = [];
  if (canvas) {
    // Franjas vacías entre bloques; de un solo color si no cambia de banda en tres columnas, cada 8 px.
    var spans = [], reach = blocks.length ? blocks[0].bottom : 0, prev = blocks[0];
    for (var i = 1; i < blocks.length; i++) {
      var b = blocks[i];
      if (b.top - reach >= 24) {
        var colors = {};
        for (var y = reach + 2; y < b.top - 2; y += 8) for (var x = canvas.left + 10; x < canvas.right; x += (canvas.width - 20) / 2) colors[look(x, y)] = 1;
        var ks = Object.keys(colors);
        spans.push({ top: reach, gap: Math.round(b.top - reach), plain: ks.length === 1 && ks[0] !== 'img' && ks[0].indexOf('fuera') !== 0, after: prev.text, before: b.text });
      }
      if (b.bottom > reach) { reach = b.bottom; prev = b; }
    }
    // El ritmo de la propia pieza dentro de una banda (entre bandas de color es normal dejar más aire).
    var plain = spans.filter(function (x) { return x.plain; }).map(function (x) { return x.gap; }).sort(function (a, b) { return a - b; });
    var usual = plain.length ? plain[Math.floor(plain.length / 2)] : 0, limit = Math.max(o.holeMax, usual * 2);
    // Entre el último botón y el pie (baja, logo, datos legales) la plantilla deja ~80 px: es el cierre, no un hueco.
    var lastButton = 0;
    buttons.forEach(function (bt) { lastButton = Math.max(lastButton, bt.el.getBoundingClientRect().bottom); });
    spans.forEach(function (x) { if (x.plain && x.gap > limit && !(lastButton && x.top >= lastButton)) holes.push({ after: x.after, before: x.before, gap: x.gap }); });
  }

  // Solapes: dos textos que se pisan (más de un tercio del más bajo).
  var overlaps = [];
  for (var i = 0; i < texts.length && overlaps.length < 4; i++) for (var j = i + 1; j < texts.length; j++) {
    var a = texts[i], c = texts[j];
    if (a.el.contains(c.el) || c.el.contains(a.el)) continue;
    // Línea a línea: la caja de un enlace que salta de línea ocupa todo el ancho sin pisar nada.
    var hitO = a.rects.some(function (x) { return c.rects.some(function (y) {
      var w = Math.min(x.right, y.right) - Math.max(x.left, y.left), h = Math.min(x.bottom, y.bottom) - Math.max(x.top, y.top);
      return w > 10 && h > Math.min(x.height, y.height) / 3;
    }); });
    if (hitO) { overlaps.push({ a: a.text, b: c.text }); break; }
  }
  return { width: innerWidth, edges: edges, rules: rules, holes: holes, overlaps: overlaps };
}`;

/** Mide una anchura. El viewport crece hasta el alto de la pieza para que elementFromPoint la vea entera. */
export async function measureSpacing(browser: Browser, htmlPath: string, width: number): Promise<SpacingMetrics> {
  const page = await browser.newPage({ viewport: { width, height: 900 } });
  try {
    await page.goto(`file://${htmlPath}`, { waitUntil: 'load', timeout: 30000 });
    await page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => undefined);
    const h = (await page.evaluate('document.documentElement.scrollHeight')) as number;
    await page.setViewportSize({ width, height: Math.min(Math.max(900, h), 16000) });
    return (await page.evaluate(`(${SPACING_JS})(${JSON.stringify({ edgeMin: EDGE_MIN, ruleMin: RULE_MIN, holeMax: HOLE_MAX })})`)) as SpacingMetrics;
  } finally {
    await page.close();
  }
}

const SIDE_FIX: Record<string, string> = {
  arriba: 'padding-top',
  abajo: 'padding-bottom',
  izquierda: 'padding-left',
  derecha: 'padding-right',
};

/** Medidas → errores para Hermes. `at`: «a 600 px» / «a 375 px». */
export function spacingFindings(m: SpacingMetrics, at: string): string[] {
  const out: string[] = [];
  // Texto encima o debajo de una foto: ya lo mide layoutFindings («Texto pegado a una imagen»).
  const edges = m.edges.filter((e) => !(e.what === 'foto' && !e.button && (e.side === 'arriba' || e.side === 'abajo')));
  for (const e of edges.slice(0, 5)) {
    const what = e.what === 'foto' ? 'la foto' : e.what === 'borde' ? 'el borde de la pieza' : 'la banda de otro color';
    const side = e.side === 'arriba' ? 'por arriba' : e.side === 'abajo' ? 'por abajo' : `por la ${e.side}`;
    out.push(`${e.button ? 'Botón' : 'Texto'} «${e.text}» pegado ${side} a ${what} (${e.gap} px, ${at}): dale al menos 24 px con el ${SIDE_FIX[e.side]} de su celda.`);
  }
  if (edges.length > 5) out.push(`… y ${edges.length - 5} texto(s) o botón(es) más pegados al borde de su banda o de una foto (${at}).`);
  for (const r of m.rules.slice(0, 3)) {
    out.push(`Texto «${r.text}» a ${r.gap} px de su línea decorativa (${at}): sepáralo al menos 12 px con padding-left.`);
  }
  for (const h of m.holes.slice(0, 3)) {
    out.push(`Hueco vacío de ${h.gap} px entre «${h.after}» y «${h.before}» (${at}), del mismo color y mucho mayor que el resto de separaciones: bájalo a 32-48 px.`);
  }
  for (const o of m.overlaps) out.push(`Textos que se pisan (${at}): «${o.a}» y «${o.b}».`);
  return out;
}

/** Las dos anchuras, con el Chromium de renderChecks. Lo que sale igual a 600 y a 375 px se dice una vez. */
export async function spacingFindingsWith(browser: Browser, htmlPath: string, desktopWidth: number, mobileWidth: number): Promise<string[]> {
  const desktop = spacingFindings(await measureSpacing(browser, htmlPath, desktopWidth), 'a 600 px');
  const mobile = spacingFindings(await measureSpacing(browser, htmlPath, mobileWidth), 'a 375 px');
  const plain = (t: string) => t.replace(/ \(?(\d+ px, )?a (600|375) px\)?/, '');
  const both = new Set(desktop.map(plain).filter((t) => mobile.some((m) => plain(m) === t)));
  return [
    ...desktop.map((t) => (both.has(plain(t)) ? t.replace('a 600 px', 'en escritorio y móvil') : t)),
    ...mobile.filter((t) => !both.has(plain(t))),
  ];
}
