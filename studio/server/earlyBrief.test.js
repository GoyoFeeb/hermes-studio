const test = require('node:test');
const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..', '..');
const TSX_BIN = path.join(ROOT, 'node_modules', '.bin', 'tsx');

// earlyBrief.ts vía tsx -e, como requestCoverage.test.js. Brief temprano (auditoría de UX 2026-10-14, H-17).
function run(code) {
  const wrapped = `
    const b = require(${JSON.stringify(path.join(__dirname, 'earlyBrief.ts'))});
    console.log(JSON.stringify((() => { ${code} })()));
  `;
  return JSON.parse(execFileSync(TSX_BIN, ['-e', wrapped], { cwd: ROOT, encoding: 'utf-8' }));
}

const BRIEF = '## 1. Concepto\n' + 'Zapatillas de running para quien empieza. '.repeat(4);
const JOB = { status: 'running', input: { instruction: 'newsletter de Nike', briefText: BRIEF }, briefEditable: true };
const NOW = 'new Date("2026-10-14T10:00:00Z")';

test('el brief se abre al llegar; solo es corregible si el worker sabe reiniciar la pieza', () => {
  assert.deepEqual(run(`return b.openBrief(true, ${NOW});`), { briefShownAt: '2026-10-14T10:00:00.000Z', briefEditable: true });
  assert.equal(run(`return b.openBrief(false, ${NOW}).briefEditable;`), false);
});

test('una corrección cambia el brief y queda pendiente de entregar', () => {
  const r = run(`return b.acceptCorrection(${JSON.stringify(JOB)}, ${JSON.stringify(BRIEF + '\nPara corredores de más de 40.')}, 'Javi', ${NOW});`);
  assert.equal(r.changed, true);
  assert.match(r.patch.input.briefText, /más de 40/);
  assert.equal(r.patch.input.instruction, 'newsletter de Nike');
  assert.deepEqual(r.patch.briefCorrection, { at: '2026-10-14T10:00:00.000Z', by: 'Javi', count: 1 });
});

test('no se acepta: brief cerrado, sin cambios, demasiado corto o trabajo terminado', () => {
  const closed = { ...JOB, briefEditable: false };
  assert.equal(run(`return b.acceptCorrection(${JSON.stringify(closed)}, ${JSON.stringify(BRIEF + ' x')}, '');`).status, 409);
  assert.equal(run(`return b.acceptCorrection(${JSON.stringify({ ...JOB, status: 'completed' })}, ${JSON.stringify(BRIEF + ' x')}, '');`).status, 409);
  assert.equal(run(`return b.acceptCorrection(${JSON.stringify(JOB)}, ${JSON.stringify('  ' + BRIEF + '  ')}, '');`).status, 400);
  assert.equal(run(`return b.acceptCorrection(${JSON.stringify(JOB)}, 'corto', '');`).status, 400);
});

test('el latido entrega la corrección una sola vez', () => {
  const pending = { ...JOB, briefCorrection: { at: '2026-10-14T09:59:00.000Z', count: 1 } };
  const first = run(`return b.onWorkerBeat(${JSON.stringify(pending)}, false, ${NOW});`);
  assert.equal(first.restart, true);
  assert.equal(first.patch.briefCorrection.sentAt, '2026-10-14T10:00:00.000Z');
  const sent = { ...pending, briefCorrection: first.patch.briefCorrection };
  assert.deepEqual(run(`return b.onWorkerBeat(${JSON.stringify(sent)}, false, ${NOW});`), { patch: null, restart: false });
});

test('al terminar la primera versión se cierra el brief, salvo que haya una corrección pendiente', () => {
  assert.deepEqual(run(`return b.onWorkerBeat(${JSON.stringify(JOB)}, true, ${NOW});`), { patch: { briefEditable: false }, restart: false });
  const pending = { ...JOB, briefCorrection: { at: '2026-10-14T09:59:00.000Z', count: 1 } };
  const r = run(`return b.onWorkerBeat(${JSON.stringify(pending)}, true, ${NOW});`);
  assert.equal(r.restart, true);
  assert.equal(r.patch.briefEditable, undefined);
});

test('segundos hasta el brief', () => {
  assert.equal(run(`return b.secondsToBrief('2026-10-14T10:00:00Z', '2026-10-14T10:04:30Z');`), 270);
  assert.equal(run(`return b.secondsToBrief(undefined, '2026-10-14T10:04:30Z');`), null);
});
