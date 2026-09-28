const test = require('node:test');
const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..', '..');
const TSX_BIN = path.join(ROOT, 'node_modules', '.bin', 'tsx');

// estimateProgress (hermes-worker.ts) vía tsx -e, como qualityCheck.test.js. Caso real: el primer
// "Pedir cambios" de Nike (2026-09-28) se quedó en "Preparando · 14 %" con 31 acciones y 10 min.
function progress(calls, elapsed, expected, isEdit) {
  const code = `
    const w = require(${JSON.stringify(path.join(__dirname, 'hermes-worker.ts'))});
    process.stdout.write(JSON.stringify(w.estimateProgress(${JSON.stringify(calls)}, ${elapsed}, ${expected}, ${isEdit})));
  `;
  return JSON.parse(execFileSync(TSX_BIN, ['-e', code], { cwd: ROOT, encoding: 'utf-8', env: { ...process.env, HERMES_WORKER_ENV_DIR: '/nonexistent' } }));
}

const NIKE_CAMBIOS = [
  { name: 'read_file', target: 'newsletters/2026/nike/hermes/x/_trabajo/original.html' },
  { name: 'write_file', target: 'newsletters/2026/nike/hermes/x/_trabajo/render.js' },
  { name: 'terminal', target: '' },
  { name: 'vision_analyze', target: '' },
  { name: 'write_file', target: 'newsletters/2026/nike/hermes/x/_trabajo/crop-detalle.js' },
  { name: 'terminal', target: '' },
];

test('Pedir cambios: recortar y renderizar ya es trabajar en el cambio, no "Preparando"', () => {
  const p = progress(NIKE_CAMBIOS, 600, 480, true);
  assert.equal(p.stage, 'investigando');
  assert.equal(p.stageLabel, 'Buscando lo que pide el cambio');
  assert.ok(p.pct > 14, `pct ${p.pct}`);
});

test('Pedir cambios: al guardar el HTML pasa a "Aplicando los cambios"', () => {
  const p = progress([...NIKE_CAMBIOS, { name: 'write_file', target: 'newsletters/2026/nike/hermes/x/newsletter.html' }], 700, 480, true);
  assert.equal(p.stage, 'escribiendo');
  assert.equal(p.stageLabel, 'Aplicando los cambios');
});

test('Newsletter nueva: los scripts de apoyo siguen siendo preparación; web y capturas, investigación', () => {
  const prep = progress([{ name: 'skill_view', target: '' }, { name: 'terminal', target: '' }], 60, 1200, false);
  assert.equal(prep.stage, 'preparando');
  assert.equal(prep.stageLabel, 'Preparando: skills y brand pack');
  const inv = progress([{ name: 'skill_view', target: '' }, { name: 'vision_analyze', target: '' }], 120, 1200, false);
  assert.equal(inv.stage, 'investigando');
});
