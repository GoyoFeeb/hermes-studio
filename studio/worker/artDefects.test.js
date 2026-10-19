const test = require('node:test');
const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..', '..');
const TSX_BIN = path.join(ROOT, 'node_modules', '.bin', 'tsx');

// Revisión de arte (2026-10-19): los defectos claros se arreglan aparte de las mejoras de gusto y no se pierden al
// descartarlas; al descartar vuelve también notas.md. Caso real: Cartier ppp83s (la «I» suelta junto a «La trama se
// vuelve movimiento»). Vía tsx -e, como agents.test.js.
function run(code) {
  const out = execFileSync(TSX_BIN, ['-e', `(async () => { ${code} })().catch((e) => { console.error(e); process.exit(1); });`], {
    cwd: ROOT,
    encoding: 'utf-8',
    env: { ...process.env, HERMES_WORKER_ENV_DIR: '/nonexistent' },
  });
  return JSON.parse(out);
}
const mod = (name) => JSON.stringify(path.join(__dirname, name));

const I_SUELTA = 'I aislada (numeración romana con una sola sección) junto a «La trama se vuelve movimiento»: quitarla';

test('Revisión de arte: lee los defectos aparte y bastan para abrir la pasada, sin ronda de gusto', () => {
  const r = run(`
    const w = require(${mod('hermes-worker.ts')});
    const all = (n) => Object.fromEntries(Object.keys(w.ART_CRITERIA).map((k) => [k, n]));
    const proofs = Object.fromEntries(Object.keys(w.ART_CRITERIA).map((k) => [k, 'se ve en las tres columnas']));
    const onlyDefect = w.parseArtReview(JSON.stringify({ notas: all(5), pruebas: proofs, defectos: [${JSON.stringify(I_SUELTA)}, 3, ' '], problemas: [], mejoras: [] }));
    const legacy = w.parseArtReview(JSON.stringify({ notas: all(4), problemas: [], mejoras: ['copy: titular concreto'] }));
    const q = w.artReviewQuery(undefined, '# Brief', '<p>Hola</p>', '/tmp/hoja.jpg');
    process.stdout.write(JSON.stringify({
      defectos: onlyDefect.defectos, legacyDefects: legacy.defectos,
      improve: [w.needsImprovement(onlyDefect), w.needsImprovement(legacy)],
      taste: [w.needsTasteRound(onlyDefect), w.needsTasteRound(legacy)],
      q,
    }));
  `);
  assert.deepEqual(r.defectos, [I_SUELTA]);
  assert.deepEqual(r.legacyDefects, []);
  assert.deepEqual(r.improve, [true, true]);
  assert.deepEqual(r.taste, [false, true]);
  assert.match(r.q, /"defectos": \[/);
  assert.match(r.q, /número romano/);
  assert.match(r.q, /no es un defecto: va en «mejoras»/);
});

test('Arreglo de defectos: solo los defectos, cambio mínimo y sin tocar el gusto', () => {
  const r = run(`
    const w = require(${mod('hermes-worker.ts')});
    process.stdout.write(JSON.stringify({ q: w.defectFixQuery('newsletters/2026/cartier/hermes/x', 'Cartier', 'newsletters/2026/cartier/hermes/x/_trabajo', [${JSON.stringify(I_SUELTA)}]) }));
  `);
  assert.match(r.q, /newsletters\/2026\/cartier\/hermes\/x\/newsletter\.html \(Cartier\)/);
  assert.match(r.q, /- I aislada/);
  assert.match(r.q, /no cambies titulares, textos, fotos/);
  assert.match(r.q, /check-newsletter/);
  assert.match(r.q, /ALCANCE: corrige SOLO/);
  assert.doesNotMatch(r.q, /render-newsletter/);
});

test('Descartar la mejora: vuelven la pieza con los defectos arreglados y su notas.md, con una línea que lo dice', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'art-defects-'));
  const html = path.join(dir, 'newsletter.html');
  const notes = path.join(dir, 'notas.md');
  fs.mkdirSync(path.join(dir, '_trabajo'));
  fs.writeFileSync(html, '<td>I</td><h2>La trama se vuelve movimiento</h2>');
  fs.writeFileSync(notes, '# Notas\n- Pieza Santos-Dumont');
  try {
    const r = run(`
      const fs = require('node:fs');
      const w = require(${mod('hermes-worker.ts')});
      const html = ${JSON.stringify(html)}, notes = ${JSON.stringify(notes)}, work = ${JSON.stringify(path.join(dir, '_trabajo'))};
      const original = w.snapshotWork(html, notes, work + '/antes-de-mejora.html');
      // Turno de defectos: quita la «I» y lo anota.
      fs.writeFileSync(html, '<h2>La trama se vuelve movimiento</h2>');
      fs.appendFileSync(notes, '\\n- Retirada la «I» suelta');
      const fixed = w.snapshotWork(html, notes, work + '/tras-defectos.html');
      // Turno de gusto: cambia titulares y lo cuenta en notas.md; las comparaciones no coinciden y se descarta.
      fs.writeFileSync(html, '<h2>La malla flexible acompaña cada movimiento</h2>');
      fs.appendFileSync(notes, '\\n- Titulares concretos: «La malla flexible acompaña cada movimiento»');
      w.restoreWork(fixed, html, notes, w.discardNote('se descarta: las dos comparaciones no coinciden (primera: +1/−4; segunda: +2/−0)', [${JSON.stringify(I_SUELTA)}]));
      const afterDiscard = { html: fs.readFileSync(html, 'utf8'), notes: fs.readFileSync(notes, 'utf8') };
      // Un arreglo de defectos que añade errores vuelve a la original, sin línea.
      w.restoreWork(original, html, notes);
      process.stdout.write(JSON.stringify({
        original, afterDiscard,
        back: { html: fs.readFileSync(html, 'utf8'), notes: fs.readFileSync(notes, 'utf8') },
        noNotes: w.snapshotWork(html, work + '/no-existe.md', work + '/otra.html'),
      }));
    `);
    assert.equal(r.original.notes, path.join(dir, '_trabajo', 'antes-de-mejora-notas.md'));
    assert.equal(r.afterDiscard.html, '<h2>La trama se vuelve movimiento</h2>');
    assert.match(r.afterDiscard.notes, /Retirada la «I» suelta/);
    assert.doesNotMatch(r.afterDiscard.notes, /La malla flexible/);
    assert.match(r.afterDiscard.notes, /Se probó una mejora y se descartó \(se descarta: las dos comparaciones no coinciden/);
    assert.match(r.afterDiscard.notes, /no lleva los cambios que la mejora describía/);
    assert.match(r.afterDiscard.notes, /Sí lleva los arreglos de defectos de la revisión:\n- I aislada/);
    assert.equal(r.back.html, '<td>I</td><h2>La trama se vuelve movimiento</h2>');
    assert.equal(r.back.notes, '# Notas\n- Pieza Santos-Dumont');
    assert.equal(r.noNotes.notes, null);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('Nota de descarte sin defectos arreglados: no menciona arreglos', () => {
  const r = run(`
    const w = require(${mod('hermes-worker.ts')});
    process.stdout.write(JSON.stringify({ n: w.discardNote('añadía errores: modo oscuro legible') }));
  `);
  assert.match(r.n, /^\n\n## Revisión de dirección de arte \(Studio\)\nSe probó una mejora y se descartó \(añadía errores: modo oscuro legible\)/);
  assert.doesNotMatch(r.n, /defectos/);
});
