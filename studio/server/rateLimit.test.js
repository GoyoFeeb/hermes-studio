const test = require('node:test');
const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..', '..');
const TSX_BIN = path.join(ROOT, 'node_modules', '.bin', 'tsx');

// rateLimit.ts es TypeScript sin punto de entrada CLI — se prueba vía un one-liner con tsx,
// mismo patrón que scripts/lib/sanitize-hero-prompt.test.js (evita añadir un loader de TS nuevo
// a `node --test`, ver package.json). Cada test construye una request/response falsas mínimas.
function run(code) {
  const wrapped = `
    const { createRateLimiter } = require(${JSON.stringify(path.join(__dirname, 'rateLimit.ts'))});
    function fakeReq(ip) { return { ip, socket: { remoteAddress: ip } }; }
    function fakeRes() {
      const headers = {};
      return {
        statusCode: 200,
        body: undefined,
        headers,
        set(k, v) { headers[k] = v; return this; },
        status(c) { this.statusCode = c; return this; },
        json(b) { this.body = b; return this; }
      };
    }
    ${code}
  `;
  return execFileSync(TSX_BIN, ['-e', wrapped], { cwd: ROOT, encoding: 'utf-8' });
}

test('createRateLimiter.middleware: permite hasta max peticiones, bloquea la siguiente con 429', () => {
  const out = run(`
    const rl = createRateLimiter({ windowMs: 60000, max: 3, keyPrefix: 'x', message: 'nope' });
    const results = [];
    for (let i = 0; i < 4; i++) {
      const res = fakeRes();
      let calledNext = false;
      rl.middleware(fakeReq('1.2.3.4'), res, () => { calledNext = true; });
      results.push(calledNext ? 'next' : res.statusCode);
    }
    process.stdout.write(JSON.stringify(results));
  `);
  assert.deepEqual(JSON.parse(out), ['next', 'next', 'next', 429]);
});

test('createRateLimiter.middleware: IPs distintas tienen cupos independientes', () => {
  const out = run(`
    const rl = createRateLimiter({ windowMs: 60000, max: 1, keyPrefix: 'x', message: 'nope' });
    const a1 = fakeRes(); let a1Next = false;
    rl.middleware(fakeReq('1.1.1.1'), a1, () => { a1Next = true; });
    const b1 = fakeRes(); let b1Next = false;
    rl.middleware(fakeReq('2.2.2.2'), b1, () => { b1Next = true; });
    process.stdout.write(JSON.stringify({ a1Next, a1Status: a1.statusCode, b1Next, b1Status: b1.statusCode }));
  `);
  const r = JSON.parse(out);
  assert.equal(r.a1Next, true);
  assert.equal(r.b1Next, true);
});

test('createRateLimiter: recordFailure/isLimited permiten contar solo fallos (auth no penaliza aciertos)', () => {
  const out = run(`
    const rl = createRateLimiter({ windowMs: 60000, max: 2, keyPrefix: 'auth', message: 'nope' });
    const req = fakeReq('9.9.9.9');
    const beforeAny = rl.isLimited(req);
    rl.recordFailure(req);
    rl.recordFailure(req);
    const afterTwoFailures = rl.isLimited(req);
    process.stdout.write(JSON.stringify({ beforeAny, afterTwoFailures }));
  `);
  const r = JSON.parse(out);
  assert.equal(r.beforeAny, false);
  assert.equal(r.afterTwoFailures, true);
});

test('createRateLimiter: peticiones exitosas repetidas con .middleware SÍ consumen cupo (contrato explícito, no silencioso)', () => {
  // Documenta el motivo por el que index.ts NO usa .middleware para el auth check (usaría
  // isLimited/recordFailure en su lugar): .middleware consume cupo en cada llamada, éxito o no.
  const out = run(`
    const rl = createRateLimiter({ windowMs: 60000, max: 2, keyPrefix: 'x', message: 'nope' });
    const statuses = [];
    for (let i = 0; i < 3; i++) {
      const res = fakeRes();
      rl.middleware(fakeReq('5.5.5.5'), res, () => {});
      statuses.push(res.statusCode);
    }
    process.stdout.write(JSON.stringify(statuses));
  `);
  assert.deepEqual(JSON.parse(out), [200, 200, 429]);
});
