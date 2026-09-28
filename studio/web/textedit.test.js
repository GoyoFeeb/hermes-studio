const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const { parse } = require('parse5');
const { snapshot, diff, replaceVisible, visiblePart, norm } = require('./textedit.js');

const ROOT = path.resolve(__dirname, '..', '..');
const TSX_BIN = path.join(ROOT, 'node_modules', '.bin', 'tsx');
// Newsletter real (Nike Pegasus 42, versión 2 del 2026-09-28): preheader con relleno, <!--[if mso]>, VML.
const NIKE = fs.readFileSync(path.join(__dirname, '..', 'server', 'fixtures', 'nike-pegasus-42.html'), 'utf8');

/** El árbol de parse5 con la forma del DOM del navegador (lo que ve la vista previa). */
function domOf(html) {
  const adapt = (n) => ({
    nodeType: n.nodeName === '#text' ? 3 : n.nodeName === '#comment' ? 8 : n.tagName ? 1 : 9,
    tagName: n.tagName ? n.tagName.toUpperCase() : undefined,
    data: n.value,
    attrs: n.attrs,
    childNodes: (n.childNodes || []).map(adapt),
  });
  const doc = adapt(parse(html));
  const find = (n, tag) => (n.tagName === tag ? n : (n.childNodes || []).reduce((f, c) => f || find(c, tag), null));
  return { doc, body: find(doc, 'BODY') };
}

/** Primer nodo de texto que contiene `needle` (lo que haría quien escribe sobre la vista previa). */
function textNode(root, needle) {
  if (root.nodeType === 3 && root.data.includes(needle)) return root;
  for (const c of root.childNodes || []) {
    const hit = textNode(c, needle);
    if (hit) return hit;
  }
  return null;
}

function applyOnServer(html, edits, subject) {
  const code = `
    const t = require(${JSON.stringify(path.join(ROOT, 'studio', 'server', 'textEdit.ts'))});
    const input = JSON.parse(require('fs').readFileSync(0, 'utf8'));
    try { process.stdout.write(JSON.stringify(t.applyTextEdits(input.html, input.edits, input.subject))); }
    catch (e) { process.stdout.write(JSON.stringify({ error: e.message, textEditError: e instanceof t.TextEditError })); }
  `;
  return JSON.parse(execFileSync(TSX_BIN, ['-e', code], { cwd: ROOT, input: JSON.stringify({ html, edits, subject }), encoding: 'utf8' }));
}

test('ida y vuelta con la pieza real: titular, párrafo, botón y preheader; el resto, byte a byte igual', () => {
  const { body } = domOf(NIKE);
  const before = snapshot(body);

  textNode(body, 'El aire que te impulsa').data = 'Corre con aire propio.';
  const p = textNode(body, 'devuelve al menos un 15%');
  p.data = p.data.replace('al menos un 15% más', 'un 15\u00a0% más'); // el navegador mete nbsp al escribir
  const cta = textNode(body, 'Hacerla tuya');
  cta.data = cta.data.replace('Hacerla tuya', 'Pruébala & compárala');
  const pre = textNode(body, 'Air Zoom de largo completo convierte');
  pre.data = replaceVisible(pre.data, 'Nuevo Pegasus 42: más impulso en cada zancada.');

  const result = diff(before, snapshot(body));
  assert.equal(result.brokenAt, undefined);
  assert.equal(result.edits.length, 4);
  // El nbsp que no estaba en la pieza se pasa a espacio normal.
  assert.ok(result.edits.some((e) => e.after.includes('un 15 % más')));

  const out = applyOnServer(NIKE, result.edits, 'Pegasus 42: corre con aire propio');
  assert.equal(out.error, undefined, out.error);
  assert.match(out.html, /Corre con aire propio\./);
  assert.match(out.html, /Pruébala &amp; compárala/);
  assert.match(out.html, /<title>Pegasus 42: corre con aire propio<\/title>/);
  assert.doesNotMatch(out.html, /El aire que te impulsa/);

  // Preheader: texto nuevo y el relleno invisible intacto.
  const { body: outBody } = domOf(out.html);
  const outPre = textNode(outBody, 'Nuevo Pegasus 42');
  assert.equal(visiblePart(outPre.data), 'Nuevo Pegasus 42: más impulso en cada zancada.');
  assert.equal(outPre.data.match(/[\u00a0\u200c]+\s*$/)?.[0], pre.data.match(/[\u00a0\u200c]+\s*$/)?.[0]);

  // Lo que la persona ve en la pieza nueva es exactamente lo que dejó escrito.
  const expected = snapshot(body).gaps.map((g) => norm(g.text));
  const got = snapshot(outBody).gaps.map((g) => norm(g.text));
  assert.deepEqual(got, expected);

  // Nada más cambia: Outlook (condicionales, VML), estilos y atributos, idénticos.
  const strip = (h) => h.replace(/>[^<]*</g, '><').replace(/<title>[\s\S]*?<\/title>/, '').replace(/Pruébala &amp; compárala|Hacerla tuya/g, '');
  assert.equal(strip(out.html), strip(NIKE));
  assert.equal((out.html.match(/<!--\[if/g) || []).length, (NIKE.match(/<!--\[if/g) || []).length);
  // El botón de Outlook (VML dentro de <!--[if mso]>) lleva su propia copia del texto: también cambia.
  assert.equal(out.outlookCopies, 1);
  const vml = [...out.html.matchAll(/<!--\[if mso\]>([\s\S]*?)<!\[endif\]-->/g)].map((m) => m[1]).join('');
  assert.match(vml, /Pruébala &amp; compárala/);
  assert.doesNotMatch(vml, /Hacerla tuya/);
  assert.match(vml, /Descubre el impulso/); // el otro botón no se tocó
});

test('si al editar se rompe la estructura (un bloque borrado entero), no hay cambios y se dice dónde', () => {
  const { body } = domOf(NIKE);
  const before = snapshot(body);
  // Como seleccionar el titular entero y borrarlo: desaparece el <h1>.
  (function removeH1(n) {
    const i = (n.childNodes || []).findIndex((c) => c.tagName === 'H1');
    if (i >= 0) return n.childNodes.splice(i, 1), true;
    return (n.childNodes || []).some(removeH1);
  })(body);
  const result = diff(before, snapshot(body));
  assert.ok(result.brokenAt !== undefined);
  assert.equal(result.edits, undefined);
});

test('el servidor rechaza un texto de partida que no coincide (la pieza cambió mientras se editaba)', () => {
  const { body } = domOf(NIKE);
  const gap = snapshot(body).gaps.find((g) => g.text.includes('El aire que te impulsa'));
  const out = applyOnServer(NIKE, [{ path: gap.path, gap: gap.gap, before: 'Otro titular', after: 'X' }]);
  assert.equal(out.textEditError, true);
  assert.match(out.error, /no coincide/);
});

test('sin cambios de verdad (solo espacios) no hay nada que guardar; comentarios cuentan como estructura', () => {
  const { body } = domOf('<html><head><title>a</title></head><body><p>Hola  mundo</p><!-- x --><p>b</p></body></html>');
  const before = snapshot(body);
  body.childNodes[0].childNodes[0].data = 'Hola mundo ';
  assert.deepEqual(diff(before, snapshot(body)), { edits: [] });
  body.childNodes.splice(1, 1); // desaparece el comentario
  assert.ok(diff(before, snapshot(body)).brokenAt !== undefined);
});
