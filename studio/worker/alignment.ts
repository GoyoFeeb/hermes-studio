/**
 * alignment.ts — alineaciones medidas al renderizar (2026-10-15, la de Feebbo: los textos de dos escenas empiezan a
 * 48 px del borde, los de la de en medio a 40 px y sus tarjetas a 46 px). Lo que casi coincide sin coincidir se ve
 * como un error de maquetación; lo que está claramente separado (una sangría, el margen interior de una tarjeta) es
 * una decisión. Mira:
 *  - bordes izquierdos: textos, cajas de color, fotos que no van a todo el ancho y botones, frente a los demás (no
 *    frente a la caja que los contiene: ahí la diferencia es su padding);
 *  - centrados: un texto o un botón centrado que queda más a un lado que al otro.
 */
import type { Browser } from 'playwright';

/** Dos bordes a esta distancia o más, y a ALIGN_MAX o menos, casi coinciden: descuadre. */
export const ALIGN_MIN = 3;
export const ALIGN_MAX = 12;
/** Un elemento centrado cuyo centro se desvía más que esto del de su celda está descentrado (diferencia entre el
 *  hueco de la izquierda y el de la derecha: el doble). */
export const CENTER_MAX = 6;

export interface AlignmentMetrics {
  width: number;
  overflow?: boolean;
  /** Grupos de bordes izquierdos casi iguales: cada valor (px desde el borde de la columna) con un ejemplo. */
  lefts: { x: number; text: string }[][];
  /** Centrados que no lo están: px a la izquierda y a la derecha dentro de su caja. */
  centers: { text: string; left: number; right: number }[];
}

const ALIGNMENT_JS = `function (o) {
  if (document.documentElement.scrollWidth > innerWidth + 1) return { width: innerWidth, overflow: true, lefts: [], centers: [] };
  function parse(c) { var m = (c || '').match(/rgba?\\(([^)]+)\\)/); if (!m) return null; var p = m[1].split(',').map(parseFloat); return { a: p.length > 3 ? p[3] : 1 }; }
  function own(el) { var t = ''; for (var i = 0; i < el.childNodes.length; i++) if (el.childNodes[i].nodeType === 3) t += el.childNodes[i].textContent; return t.replace(/\\s+/g, ' ').trim(); }
  function label(el) { return (el.textContent || el.getAttribute('alt') || '').replace(/\\s+/g, ' ').trim().slice(0, 40); }
  function hidden(el) {
    for (var n = el; n && n.nodeType === 1; n = n.parentElement) {
      var cs = getComputedStyle(n);
      if (cs.display === 'none' || cs.visibility === 'hidden' || parseFloat(cs.opacity) === 0 || (cs.maxHeight !== 'none' && parseFloat(cs.maxHeight) === 0)) return true;
    }
    return parseFloat(getComputedStyle(el).fontSize) < 6;
  }
  var canvas = null;
  document.querySelectorAll('table').forEach(function (t) { var r = t.getBoundingClientRect(); if (r.width <= 640 && r.width > 200 && (!canvas || r.width > canvas.width)) canvas = r; });
  if (!canvas) return { width: innerWidth, lefts: [], centers: [] };
  var docH = document.documentElement.scrollHeight;
  var items = [];
  // Cajas: fondos de color que no ocupan todo el ancho (tarjetas, recuadros) y botones.
  document.body.querySelectorAll('table,td,div,a').forEach(function (el) {
    if (hidden(el)) return;
    var c = parse(getComputedStyle(el).backgroundColor), r = el.getBoundingClientRect();
    if (!c || c.a < 0.5 || r.width < 40 || r.height < 24) return;
    if (r.left - canvas.left < 2 && canvas.right - r.right < 2) return;
    if (r.width > canvas.width - 4) return;
    var name = label(el);
    items.push({ el: el, x: r.left, r: r, text: !name ? 'una franja de color' : el.tagName === 'A' || r.height < 90 ? 'botón «' + name + '»' : 'la caja de «' + name + '»', box: true });
  });
  document.querySelectorAll('img').forEach(function (img) {
    if (hidden(img)) return;
    var r = img.getBoundingClientRect();
    if (r.width < 60 || r.height < 40 || r.width > canvas.width - 4) return;
    items.push({ el: img, x: r.left, r: r, text: 'la foto «' + label(img) + '»', box: true });
  });
  var centers = [];
  // Botones centrados (su celda los centra) frente a esa celda a todo el ancho.
  items.forEach(function (it) {
    if (!/^botón/.test(it.text)) return;
    // Solo la celda que lo contiene directamente: la tabla exterior de la pieza siempre va centrada.
    var n = it.el.parentElement && it.el.parentElement.closest('td');
    if (!n || !(n.getAttribute('align') === 'center' || /center/.test(getComputedStyle(n).textAlign))) return;
    var b = n.getBoundingClientRect();
    if (b.width < canvas.width * 0.8) return;
    var l = it.r.left - b.left, rt = b.right - it.r.right;
    if (Math.abs(l - rt) > o.centerMax * 2 && Math.abs(l - rt) < b.width / 2) centers.push({ text: it.text.replace(/^botón /, '').replace(/[«»]/g, ''), left: Math.round(l), right: Math.round(rt) });
  });
  document.body.querySelectorAll('h1,h2,h3,h4,h5,h6,p,li,td,div,a,span').forEach(function (el) {
    if (own(el).length < 2 || hidden(el)) return;
    var cs = getComputedStyle(el);
    var rg = document.createRange(); rg.selectNodeContents(el);
    var r = rg.getBoundingClientRect();
    if (r.width < 4) return;
    // El pie (datos legales, baja) no cuenta.
    if (r.top + scrollY > docH - 260) return;
    if (/center/.test(cs.textAlign)) {
      // Un enlace o un fragmento dentro de una frase no se centra por sí mismo.
      if (/^inline/.test(cs.display) && cs.display !== 'inline-block') return;
      // Centrado respecto a su celda a todo el ancho (con su padding: un padding desigual lo descentra). En una columna
      // estrecha no se mide: ahí el centro es el de la columna y su padding puede ser parte del diseño.
      var cell = el.closest('td');
      if (cell && rg.getClientRects().length === 1 && !items.some(function (it) { return it.box && /^botón/.test(it.text) && it.el.contains(el); })) {
        var b = cell.getBoundingClientRect();
        if (b.width >= canvas.width * 0.8) {
          var l = r.left - b.left, rt = b.right - r.right;
          if (Math.abs(l - rt) > o.centerMax * 2) centers.push({ text: label(el), left: Math.round(l), right: Math.round(rt) });
        }
      }
      return;
    }
    // El texto de un botón va con su botón (que ya cuenta como caja).
    if (items.some(function (it) { return it.box && /^botón/.test(it.text) && it.el.contains(el); })) return;
    items.push({ el: el, x: r.left, r: r, text: '«' + label(el) + '»', box: false });
  });
  // Lo centrado (un botón, el logo del pie) no marca una columna: su borde izquierdo no tiene que coincidir con nada.
  items = items.filter(function (it) { return Math.abs((it.r.left - canvas.left) - (canvas.right - it.r.right)) > 8; });
  // Cada elemento se compara con los de su mismo nivel: lo de dentro de una tarjeta, con lo de esa tarjeta; lo de
  // fuera, con lo de fuera (entre ellos, las propias tarjetas y fotos).
  function container(it) {
    var best = null;
    items.forEach(function (c) { if (c !== it && c.box && c.el !== it.el && c.el.contains(it.el) && (!best || best.el.contains(c.el))) best = c; });
    return best;
  }
  var groups = new Map();
  items.forEach(function (it) { var c = container(it); if (!groups.has(c)) groups.set(c, []); groups.get(c).push(it); });
  // Márgenes casi iguales: valores redondeados que se encadenan a menos de alignMax px; un grupo con más de un valor
  // (separados alignMin px o más) es un descuadre. Se da un ejemplo de cada valor, el primero de arriba abajo.
  var lefts = [];
  groups.forEach(function (list) {
    list.sort(function (a, b) { return a.x - b.x; });
    var run = [];
    function flush() {
      var xs = {};
      run.forEach(function (it) { var k = Math.round(it.x - canvas.left); if (!xs[k] || it.r.top < xs[k].r.top) xs[k] = it; });
      var keys = Object.keys(xs).map(Number).sort(function (a, b) { return a - b; });
      if (keys.length > 1 && keys[keys.length - 1] - keys[0] >= o.alignMin) lefts.push(keys.map(function (k) { return { x: k, text: xs[k].text }; }));
      run = [];
    }
    list.forEach(function (it) { if (run.length && it.x - run[run.length - 1].x > o.alignMax) flush(); run.push(it); });
    flush();
  });
  return { width: innerWidth, lefts: lefts, centers: centers.slice(0, 4) };
}`;

export async function measureAlignment(browser: Browser, htmlPath: string, width: number): Promise<AlignmentMetrics> {
  const page = await browser.newPage({ viewport: { width, height: 900 } });
  try {
    await page.goto(`file://${htmlPath}`, { waitUntil: 'load', timeout: 30000 });
    await page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => undefined);
    return (await page.evaluate(
      `(${ALIGNMENT_JS})(${JSON.stringify({ alignMin: ALIGN_MIN, alignMax: ALIGN_MAX, centerMax: CENTER_MAX })})`
    )) as AlignmentMetrics;
  } finally {
    await page.close();
  }
}

/** Medidas → errores para Hermes. `at`: «a 600 px» / «a 375 px». */
export function alignmentFindings(m: AlignmentMetrics, at: string): string[] {
  const out: string[] = [];
  for (const g of m.lefts.slice(0, 4)) {
    const where = g.map((v) => `${v.text} a ${v.x} px`).join(', ');
    out.push(`Descuadre a la izquierda (${at}): ${where} del borde. Casi coinciden sin coincidir: ponlos a la misma distancia (el mismo padding-left en todas las escenas) o sepáralos de verdad.`);
  }
  if (m.lefts.length > 4) out.push(`… y ${m.lefts.length - 4} descuadre(s) más a la izquierda (${at}).`);
  for (const c of m.centers) {
    out.push(`«${c.text}» está centrado pero queda descentrado (${c.left} px a la izquierda y ${c.right} px a la derecha, ${at}): iguala el padding de los dos lados.`);
  }
  return out;
}

/** Las dos anchuras. Lo que sale igual a 600 y a 375 px se dice una vez. */
export async function alignmentFindingsWith(browser: Browser, htmlPath: string, desktopWidth: number, mobileWidth: number): Promise<string[]> {
  const desktop = alignmentFindings(await measureAlignment(browser, htmlPath, desktopWidth), 'a 600 px');
  const mobile = alignmentFindings(await measureAlignment(browser, htmlPath, mobileWidth), 'a 375 px');
  const plain = (t: string) => t.replace(/ ?\(?a (600|375) px\)?/, '').replace(/, a (600|375) px/, '');
  const both = new Set(desktop.map(plain).filter((t) => mobile.some((m) => plain(m) === t)));
  return [
    ...desktop.map((t) => (both.has(plain(t)) ? t.replace('a 600 px', 'en escritorio y móvil') : t)),
    ...mobile.filter((t) => !both.has(plain(t))),
  ];
}
