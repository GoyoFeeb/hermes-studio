const test = require('node:test');
const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..', '..');
const TSX_BIN = path.join(ROOT, 'node_modules', '.bin', 'tsx');

// Enlace de vista previa para el cliente (2026-10-01). Mismo patrón tsx que rateLimit.test.js.
function run(code) {
  const wrapped = `
    const m = await import(${JSON.stringify(path.join(__dirname, 'share.ts'))});
    const { isShareActive, findSharedJob, shareHeaders, SHARE_TOKEN_RE } = m.default ?? m;
    ${code}
  `;
  return JSON.parse(execFileSync(TSX_BIN, ['--input-type=module', '-e', wrapped], { encoding: 'utf8' }).trim());
}

test('enlace: caduca, rechaza tokens mal formados y la página no deja ejecutar scripts sin nonce', () => {
  const out = run(`
    const now = Date.now();
    const csp = shareHeaders('abc')['Content-Security-Policy'];
    console.log(JSON.stringify([
      isShareActive(undefined),
      isShareActive({ token: 'x', createdAt: '', expiresAt: new Date(now + 1000).toISOString() }, now),
      isShareActive({ token: 'x', createdAt: '', expiresAt: new Date(now - 1000).toISOString() }, now),
      findSharedJob('../../etc/passwd'),
      findSharedJob('corto'),
      SHARE_TOKEN_RE.test('ixNxZZkvu1PqxtkzE98rSMmqTI2SgCZk'),
      csp.includes("script-src 'nonce-abc'") && !csp.includes('unsafe-eval') && csp.includes("frame-ancestors 'none'"),
    ]));
  `);
  assert.deepEqual(out, [false, true, false, null, null, true, true]);
});

test('revisión del cliente: nombre y texto obligatorios, y "Pedir cambios" necesita saber qué', () => {
  const out = run(`
    const mm = await import(${JSON.stringify(path.join(__dirname, 'share.ts'))});
    const { addShareComment, setShareDecision } = mm.default ?? mm;
    const job = { id: 'x', share: { token: 't', createdAt: '', expiresAt: '2999-01-01T00:00:00Z', comments: [] } };
    const err = (fn) => { try { fn(); return 'ok'; } catch (e) { return e.constructor.name + ': ' + e.message; } };
    console.log(JSON.stringify([
      err(() => addShareComment(job, { text: 'hola' })),
      err(() => addShareComment(job, { author: 'Ana', text: '   ' })),
      err(() => setShareDecision(job, { kind: 'otro', author: 'Ana' })),
      err(() => setShareDecision(job, { kind: 'changes', author: 'Ana' })),
    ]));
  `);
  assert.match(out[0], /^ShareInputError: Escribe tu nombre/);
  assert.match(out[1], /^ShareInputError: El comentario está vacío/);
  assert.match(out[2], /^ShareInputError: Decisión no válida/);
  assert.match(out[3], /^ShareInputError: Cuenta qué hay que cambiar/);
});
