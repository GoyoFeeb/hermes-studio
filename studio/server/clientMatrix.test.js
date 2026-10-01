const test = require('node:test');
const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..', '..');
const TSX_BIN = path.join(ROOT, 'node_modules', '.bin', 'tsx');

// Revisión por programa de correo (2026-10-01). Mismo patrón tsx que rateLimit.test.js.
function run(code) {
  const wrapped = `
    const m = await import(${JSON.stringify(path.join(__dirname, 'clientMatrix.ts'))});
    const { clientMatrix } = m.default ?? m;
    ${code}
  `;
  return JSON.parse(execFileSync(TSX_BIN, ['--input-type=module', '-e', wrapped], { encoding: 'utf8' }).trim());
}

const REPORT = {
  checkedAt: '2026-10-01T10:00:00Z',
  errors: 2,
  warnings: 1,
  checks: [
    { id: 'links', label: 'Enlaces', status: 'error', details: ['https://x.com/a → HTTP 404'], errorCount: 1 },
    { id: 'size', label: 'Peso para Gmail', status: 'ok', details: ['40 KB'], errorCount: 0 },
    { id: 'dark-mode', label: 'Modo oscuro', status: 'warning', details: ['light only'], errorCount: 0 },
    { id: 'outlook', label: 'Outlook', status: 'error', details: ['Sin <!--[if mso]>', 'Falta 96 ppp'], errorCount: 1 },
    { id: 'nuevo-check', label: 'Algo nuevo', status: 'ok', details: [], errorCount: 0 },
  ],
};

test('cada comprobación va al programa al que afecta, y lo nuevo a "Todos"', () => {
  const rows = run(`console.log(JSON.stringify(clientMatrix(${JSON.stringify(REPORT)})))`);
  const by = Object.fromEntries(rows.map((r) => [r.id, r]));
  assert.deepEqual(rows.map((r) => r.id), ['outlook', 'gmail', 'apple', 'mobile', 'all']);
  assert.equal(by.outlook.status, 'error');
  assert.deepEqual(by.outlook.items.map((i) => i.level), ['error', 'warning']);
  assert.equal(by.gmail.status, 'ok');
  assert.equal(by.apple.status, 'warning');
  assert.equal(by.mobile.status, 'unknown');
  assert.match(by.mobile.notes.join(' '), /No se midió/);
  assert.equal(by.all.status, 'error');
  assert.deepEqual(by.all.items.map((i) => i.checkId), ['links', 'nuevo-check']);
  assert.equal(by.all.items[0].detailIndex, 0);
});
