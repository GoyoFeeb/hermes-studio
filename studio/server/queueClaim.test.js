const test = require('node:test');
const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', '..');
const TSX_BIN = path.join(ROOT, 'node_modules', '.bin', 'tsx');

function run(code) {
  const out = execFileSync(TSX_BIN, ['-e', `(async () => { ${code} })().catch((e) => { console.error(e); process.exit(1); });`], {
    cwd: ROOT,
    encoding: 'utf8',
    env: { ...process.env, HERMES_WORKER_ENV_DIR: '/nonexistent' },
  });
  return JSON.parse(out);
}

const server = (name) => JSON.stringify(path.join(__dirname, name));

test('reclamar es atómico: dos huecos no cogen el mismo trabajo', async () => {
  const r = run(`
    const fs = require('fs');
    const os = require('os');
    const path = require('path');
    const { selectClaim, withStoreLock, workerConcurrency, freeSlots } = require(${server('claimQueue.ts')});
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'hermes-claim-'));
    const jobs = [
      { id: 'newer', status: 'queued', createdAt: '2026-10-20T13:00:00.000Z', ready: true, mode: 'standalone' },
      { id: 'older', status: 'queued', createdAt: '2026-10-20T12:00:00.000Z', ready: true, mode: 'standalone' },
      { id: 'busy', status: 'running', createdAt: '2026-10-20T11:00:00.000Z', ready: true, mode: 'standalone' },
      { id: 'wait', status: 'queued', createdAt: '2026-10-20T10:00:00.000Z', ready: false, mode: 'standalone' },
    ];
    const claim = () => withStoreLock(dir, () => {
      const next = selectClaim(jobs);
      if (!next) return null;
      next.status = 'running';
      return next.id;
    });
    const ids = await Promise.all([claim(), claim(), claim()]);
    process.stdout.write(JSON.stringify({
      ids,
      concurrency: workerConcurrency({}),
      clamped: workerConcurrency({ WORKER_CONCURRENCY: '99' }),
      bad: workerConcurrency({ WORKER_CONCURRENCY: 'no' }),
      one: workerConcurrency({ WORKER_CONCURRENCY: '1' }),
      free: freeSlots(2, [0]),
      full: freeSlots(2, [0, 1]),
    }));
  `);
  assert.deepEqual(r.ids.filter(Boolean).sort(), ['newer', 'older']);
  assert.equal(r.ids.filter(Boolean).length, 2);
  assert.equal(new Set(r.ids.filter(Boolean)).size, 2);
  assert.equal(r.concurrency, 2);
  assert.equal(r.clamped, 8);
  assert.equal(r.bad, 2);
  assert.equal(r.one, 1);
  assert.deepEqual(r.free, [1]);
  assert.deepEqual(r.full, []);
});

test('el arrendamiento no lo renueva otro worker y caduca', async () => {
  const r = run(`
    const { leaseExpired, nextLease, leaseUntil, DEFAULT_LEASE_MS } = require(${server('claimQueue.ts')});
    const now = Date.parse('2026-10-20T14:00:00.000Z');
    const current = { workerId: 'a', slot: 0, until: leaseUntil(now, DEFAULT_LEASE_MS) };
    const half = nextLease(current, 'a', now + 60_000);
    const late = nextLease(current, 'a', now + DEFAULT_LEASE_MS - 30_000);
    const other = nextLease(current, 'b', now + DEFAULT_LEASE_MS);
    process.stdout.write(JSON.stringify({
      fresh: leaseExpired(current.until, now),
      dead: leaseExpired(current.until, now + DEFAULT_LEASE_MS),
      missing: leaseExpired(undefined, now),
      same: half === current,
      renewed: late && late.until !== current.until && late.workerId === 'a',
      other: other,
    }));
  `);
  assert.equal(r.fresh, false);
  assert.equal(r.dead, true);
  assert.equal(r.missing, false);
  assert.equal(r.same, true);
  assert.equal(r.renewed, true);
  assert.equal(r.other, null);
});

test('la cola y la ETA usan los huecos y no anuncian 2 min cuando el trabajo ya se pasó', async () => {
  const r = run(`
    const { forecastStart, runningRemainingSec, queueCommentLine, queueMessage } = require(${server('queueEta.ts')});
    const overrun = runningRemainingSec(20 * 60, 34 * 60, null);
    const running = { id: 'porsche', status: 'running', createdAt: '2026-10-20T13:49:21.000Z', sec: overrun };
    const queued = { id: 'next', status: 'queued', createdAt: '2026-10-20T14:10:00.000Z', sec: 7 * 60 };
    const one = forecastStart([running, queued], 'next', 1);
    const two = forecastStart([running, queued], 'next', 2);
    const ahead = { id: 'mid', status: 'queued', createdAt: '2026-10-20T14:00:00.000Z', sec: 10 * 60 };
    const behind = forecastStart([running, ahead, queued], 'next', 1);
    const parallel = forecastStart([running, ahead, queued], 'next', 2);
    process.stdout.write(JSON.stringify({
      overrun,
      one,
      two,
      behind: behind.startsInSec,
      parallel: parallel.startsInSec,
      line: queueCommentLine({ ahead: 1, startsInSec: overrun }),
      soon: queueCommentLine({ ahead: 1, startsInSec: 10 }),
      empty: queueCommentLine(null),
      msg: queueMessage(one),
    }));
  `);
  assert.equal(r.overrun, 420);
  assert.notEqual(r.overrun, 120);
  assert.equal(r.one.startsInSec, 420);
  assert.equal(r.one.runningAhead, 1);
  assert.equal(r.one.ahead, 1);
  assert.equal(r.one.message, 'Hay 1 trabajo en curso delante; el tuyo empezará en ~7 min');
  assert.equal(r.two.startsInSec, 0);
  assert.match(r.two.message, /hay hueco/);
  assert.equal(r.behind, 420 + 10 * 60);
  assert.equal(r.parallel, 420);
  assert.equal(r.line, 'En cola: 1 trabajo delante, empezará en ~7 min');
  assert.equal(r.soon, null);
  assert.equal(r.empty, null);
  assert.equal(r.msg, r.one.message);
});

test('la capacidad suma réplicas frescas y, si no hay, usa el defecto', async () => {
  const r = run(`
    const { noteWorker, workerCapacity, resetWorkerPool } = require(${server('workerPool.ts')});
    resetWorkerPool();
    const now = 1_000_000;
    noteWorker('replica-a', 2, now);
    noteWorker('replica-b', 2, now);
    const live = workerCapacity(now, { STUDIO_WORKER_SLOTS: '1' });
    const stale = workerCapacity(now + 120_000, {});
    const fallback = workerCapacity(now + 120_000, { STUDIO_WORKER_SLOTS: '3' });
    process.stdout.write(JSON.stringify({ live, stale, fallback }));
  `);
  assert.equal(r.live, 4);
  assert.equal(r.stale, 2);
  assert.equal(r.fallback, 3);
});

test('el comentario de ClickUp lleva la cola y, al empezar, una línea corta', async () => {
  const r = run(`
    const { clickupJobComment, clickupStartedComment } = require(${server('clickup.ts')});
    const base = clickupJobComment('https://hermes-studio-beta.vercel.app', 'job-1');
    const queued = clickupJobComment('https://hermes-studio-beta.vercel.app', 'job-1', { ahead: 1, startsInSec: 420 });
    process.stdout.write(JSON.stringify({ base, queued, started: clickupStartedComment() }));
  `);
  assert.match(r.base, /^Hermes Studio ha creado un trabajo para esta tarea:\nhttps:\/\/hermes-studio-beta\.vercel\.app\/\?job=job-1$/);
  assert.match(r.queued, /En cola: 1 trabajo delante, empezará en ~7 min$/);
  assert.equal(r.started, 'Hermes ha empezado este trabajo.');
});
