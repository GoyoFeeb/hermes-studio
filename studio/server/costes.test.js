const test = require('node:test');
const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..', '..');
const TSX_BIN = path.join(ROOT, 'node_modules', '.bin', 'tsx');

function run(code) {
  const out = execFileSync(TSX_BIN, ['-e', code], {
    cwd: ROOT,
    encoding: 'utf8',
    env: { ...process.env, HERMES_WORKER_ENV_DIR: '/nonexistent' },
  });
  return JSON.parse(out);
}

test('el trabajo de costes se limpia, resume y recuerda el uso previo', () => {
  const body = run(`
    const s = require(${JSON.stringify(path.join(__dirname, 'standalone.ts'))});
    const job = {
      id: 'abc123-xy12',
      createdAt: '2026-10-20T10:00:00.000Z',
      updatedAt: '2026-10-20T10:16:00.000Z',
      status: 'completed',
      currentPhase: null,
      startedAt: '2026-10-20T10:01:00.000Z',
      finishedAt: '2026-10-20T10:16:00.000Z',
      inputTokens: 1000,
      outputTokens: 200,
      cacheTokens: 40,
      costUsd: 2.1,
      costEur: 1.806,
      model: 'claude-sonnet-5-5',
      provider: 'anthropic',
      input: { clientName: 'Nike', clientSlug: 'nike', requesterName: 'Ana', mode: 'standalone', brandMode: 'existing', briefText: '' },
    };
    process.stdout.write(JSON.stringify({
      empty: s.sanitizeJobCost({ html: '<html></html>' }) === undefined,
      none: s.sanitizeJobCost(null) === undefined,
      snake: s.sanitizeJobCost({ input_tokens: 3, cost_eur: 1.23456789, model: 'claude-sonnet-5-5', provider: 'anthropic' }),
      bad: s.sanitizeJobCost({ inputTokens: -1, costUsd: 'no', model: 'con espacio', provider: '' }),
      summary: s.costJobSummary(job),
      flags: [s.wantsCostFields('cost'), s.wantsCostFields(['cost', 'otro']), s.wantsCostFields('no'), s.wantsCostFields(undefined)],
      prior: s.priorUsageOf(job),
      fresh: s.priorUsageOf({ ...job, inputTokens: 0, outputTokens: 0, cacheTokens: 0 }) === undefined,
    }));
  `);
  assert.equal(body.empty, true);
  assert.equal(body.none, true);
  assert.equal(body.snake.inputTokens, 3);
  assert.equal(body.snake.outputTokens, null);
  assert.equal(body.snake.costEur, 1.234568);
  assert.equal(body.snake.model, 'claude-sonnet-5-5');
  assert.equal(body.snake.provider, 'anthropic');
  assert.equal(body.bad.inputTokens, null);
  assert.equal(body.bad.costUsd, null);
  assert.equal(body.bad.model, null);
  assert.equal(body.bad.provider, null);
  assert.equal(body.summary.id, 'abc123-xy12');
  assert.equal(body.summary.requester, 'Ana');
  assert.equal(body.summary.durationSec, 900);
  assert.equal(body.summary.costEur, 1.806);
  assert.deepEqual(body.flags, [true, true, false, false]);
  assert.equal(body.prior.inputTokens, 1000);
  assert.equal(body.prior.model, 'claude-sonnet-5-5');
  assert.equal(body.fresh, true);
});
