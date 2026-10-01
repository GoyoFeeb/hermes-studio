const test = require('node:test');
const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..', '..');
const TSX_BIN = path.join(ROOT, 'node_modules', '.bin', 'tsx');

// "Reintentar" con el brief ya escrito (2026-10-01): no vuelve a pedir el brief a Hermes y se estima
// como uno de prompt completo. Mismo patrón tsx que rateLimit.test.js.
function run(code) {
  const wrapped = `
    const m = await import(${JSON.stringify(path.join(__dirname, 'standalone.ts'))});
    const { jobKind, needsBrief } = m.default ?? m;
    const job = (input) => ({ id: 'x', input: { mode: 'standalone', clientSlug: 'lacoste', clientName: 'Lacoste', brandMode: 'existing', briefText: '', ...input } });
    ${code}
  `;
  return JSON.parse(execFileSync(TSX_BIN, ['--input-type=module', '-e', wrapped], { encoding: 'utf8' }).trim());
}

test('reintento con brief reutilizado: sin paso de brief y duración de prompt completo', () => {
  const out = run(`
    const fresh = job({ instruction: 'newsletter de Lacoste' });
    const retried = job({ instruction: 'newsletter de Lacoste', briefText: '# Brief', retryOf: 'a', briefReused: true });
    const retriedNoBrief = job({ instruction: 'newsletter de Lacoste', retryOf: 'a' });
    console.log(JSON.stringify([needsBrief(fresh), jobKind(fresh), needsBrief(retried), jobKind(retried), needsBrief(retriedNoBrief), jobKind(retriedNoBrief)]));
  `);
  assert.deepEqual(out, [true, 'instruction', false, 'brief', true, 'instruction']);
});
