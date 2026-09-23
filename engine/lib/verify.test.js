const test = require('node:test');
const assert = require('node:assert/strict');

const { verifyBuild, tagBalance, countOccurrences } = require('./verify.js');

// verifyBuild() decide si build-newsletter.js escribe final.html/final-inline.html a disco o
// no (ver cabecera de verify.js: "nunca dejar un final.html/final-inline.html inválido en
// 09-exports/ — es el error histórico N1"). Hasta esta auditoría (2026-09-23, BUG-H03) no tenía
// ningún test dedicado — engine/smoke.test.js la ejercita solo por el camino feliz (un build de
// ejemplo que no falla), nunca comprobando que un caso realmente inválido SÍ se detecta.

const CHARSET = '<meta charset="UTF-8">';

// Cada métrica se genera de forma independiente (sin acoplar <img> a utm_source) para que un
// test pueda desequilibrar UNA sola métrica sin arrastrar las demás por accidente.
function minimalDoc({ charset = true, unresolved = false, imgCount = 1, utmCount = 1, vmlCount = 1, tablesOpen = 1, tablesClose = 1, extraBytes = 0 } = {}) {
  const imgs = Array.from({ length: imgCount }, () => '<img src="https://x.com/a.png">').join('');
  const utms = Array.from({ length: utmCount }, () => '<a href="https://x.com/?utm_source=hermes">').join('');
  const vmls = Array.from({ length: vmlCount }, () => '<v:roundrect></v:roundrect>').join('');
  const tablesOpenTags = Array.from({ length: tablesOpen }, () => '<table role="presentation">').join('');
  const tablesCloseTags = Array.from({ length: tablesClose }, () => '</table>').join('');
  const padding = extraBytes > 0 ? `<!--${'x'.repeat(extraBytes)}-->` : '';
  return (
    `<html><head>${charset ? CHARSET : ''}</head><body>` +
    `${unresolved ? '{{data:sin-resolver}}' : ''}` +
    `${tablesOpenTags}${imgs}${utms}${vmls}${tablesCloseTags}${padding}` +
    `</body></html>`
  );
}

test('verifyBuild: documento válido (charset, sin placeholders, conteos y tablas balanceadas, tamaño normal) pasa sin errores ni avisos', () => {
  const doc = minimalDoc();
  const result = verifyBuild(doc, doc);
  assert.equal(result.ok, true);
  assert.deepEqual(result.errors, []);
  assert.deepEqual(result.warnings, []);
});

test('verifyBuild: falla si falta <meta charset="UTF-8"> en la fuente', () => {
  const source = minimalDoc({ charset: false });
  const inline = minimalDoc();
  const result = verifyBuild(source, inline);
  assert.equal(result.ok, false);
  assert.ok(result.errors.some((e) => e.includes('final.html no declara')));
});

test('verifyBuild: falla si falta <meta charset="UTF-8"> en el inline', () => {
  const source = minimalDoc();
  const inline = minimalDoc({ charset: false });
  const result = verifyBuild(source, inline);
  assert.equal(result.ok, false);
  assert.ok(result.errors.some((e) => e.includes('final-inline.html no declara')));
});

test('verifyBuild: falla si queda un placeholder "{{" sin resolver en la fuente', () => {
  const source = minimalDoc({ unresolved: true });
  const inline = minimalDoc();
  const result = verifyBuild(source, inline);
  assert.equal(result.ok, false);
  assert.ok(result.errors.some((e) => e.includes('final.html contiene restos de "{{"')));
});

test('verifyBuild: falla si queda un placeholder "{{" sin resolver en el inline', () => {
  const source = minimalDoc();
  const inline = minimalDoc({ unresolved: true });
  const result = verifyBuild(source, inline);
  assert.equal(result.ok, false);
  assert.ok(result.errors.some((e) => e.includes('final-inline.html contiene restos de "{{"')));
});

test('verifyBuild: falla si el conteo de <img entre fuente e inline no coincide (paridad rota)', () => {
  const source = minimalDoc({ imgCount: 2 });
  const inline = minimalDoc({ imgCount: 1 });
  const result = verifyBuild(source, inline);
  assert.equal(result.ok, false);
  assert.ok(result.errors.some((e) => e.includes('Conteo de "<img" no coincide')));
  assert.equal(result.counts['<img'].source, 2);
  assert.equal(result.counts['<img'].inline, 1);
  // Aislado: ninguna otra métrica debería fallar solo porque <img> se desequilibró.
  assert.ok(!result.errors.some((e) => e.includes('utm_source')));
  assert.ok(!result.errors.some((e) => e.includes('v:roundrect')));
});

test('verifyBuild: falla si el conteo de v:roundrect no coincide (juice alteró estructura VML)', () => {
  const source = minimalDoc({ vmlCount: 2 });
  const inline = minimalDoc({ vmlCount: 1 });
  const result = verifyBuild(source, inline);
  assert.equal(result.ok, false);
  assert.ok(result.errors.some((e) => e.includes('Conteo de "v:roundrect" no coincide')));
});

test('verifyBuild: falla si las <table> no están balanceadas en la fuente', () => {
  const source = minimalDoc({ tablesOpen: 2, tablesClose: 1 });
  const inline = minimalDoc();
  const result = verifyBuild(source, inline);
  assert.equal(result.ok, false);
  assert.ok(result.errors.some((e) => e.includes('final.html: <table> desbalanceadas')));
});

test('verifyBuild: falla si las <table> no están balanceadas en el inline', () => {
  const source = minimalDoc();
  const inline = minimalDoc({ tablesOpen: 1, tablesClose: 2 });
  const result = verifyBuild(source, inline);
  assert.equal(result.ok, false);
  assert.ok(result.errors.some((e) => e.includes('final-inline.html: <table> desbalanceadas')));
});

test('verifyBuild: falla si el inline supera el límite de 90 KB', () => {
  const source = minimalDoc();
  const inline = minimalDoc({ extraBytes: 91 * 1024 });
  const result = verifyBuild(source, inline);
  assert.equal(result.ok, false);
  assert.ok(result.errors.some((e) => e.includes('supera el límite de 90 KB')));
});

test('verifyBuild: avisa (sin fallar) si el inline supera 80 KB pero no llega a 90 KB', () => {
  const source = minimalDoc();
  const inline = minimalDoc({ extraBytes: 81 * 1024 });
  const result = verifyBuild(source, inline);
  assert.equal(result.ok, true);
  assert.deepEqual(result.errors, []);
  assert.ok(result.warnings.some((w) => w.includes('por encima del aviso de 80 KB')));
});

test('verifyBuild: acumula varios errores independientes en la misma pasada (no se detiene en el primero)', () => {
  const source = minimalDoc({ charset: false, unresolved: true, tablesOpen: 2, tablesClose: 1 });
  const inline = minimalDoc();
  const result = verifyBuild(source, inline);
  assert.equal(result.ok, false);
  assert.ok(result.errors.length >= 3, `esperaba varios errores acumulados, hubo ${result.errors.length}`);
});

// ── tagBalance() / countOccurrences(): helpers exportados, usados también fuera de verify.js ──

test('tagBalance: cuenta aperturas y cierres de <table> por separado', () => {
  const html = '<table role="presentation"><table><tr></tr></table></table>';
  assert.deepEqual(tagBalance(html), { open: 2, close: 2 });
});

test('tagBalance: no confunde <table> con otras etiquetas que empiezan igual', () => {
  const html = '<tablet>no es una tabla</tablet>';
  assert.deepEqual(tagBalance(html), { open: 0, close: 0 });
});

test('countOccurrences: cuenta coincidencias repetidas de un patrón regex global', () => {
  assert.equal(countOccurrences('a-a-a', /a/g), 3);
});

test('countOccurrences: devuelve 0 (no null) cuando no hay coincidencias', () => {
  assert.equal(countOccurrences('sin nada', /xyz/g), 0);
});
