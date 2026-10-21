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

test('un cuerpo a cero no borra el uso y un paso nuevo se suma', () => {
  const body = run(`
    const s = require(${JSON.stringify(path.join(__dirname, 'standalone.ts'))});
    const step = (id, label, input, output, cache, usd, eur, sec) => ({
      id, label, model: 'claude-sonnet-5-5', provider: 'anthropic',
      inputTokens: input, outputTokens: output, cacheReadTokens: 0, cacheWriteTokens: cache, cacheTokens: cache,
      costUsd: usd, costEur: eur, durationSec: sec,
    });
    const job = {
      id: 'abc',
      inputTokens: 1000,
      outputTokens: 100,
      cacheTokens: 10,
      costUsd: 1,
      costEur: 0.92,
      model: 'claude-sonnet-5-5',
      provider: 'anthropic',
      usageSteps: [step('draft', 'Generación', 1000, 100, 10, 1, 0.92, 30)],
      input: { clientName: 'Nike', clientSlug: 'nike', mode: 'standalone', brandMode: 'existing', briefText: '' },
    };
    const wiped = s.usagePatch(job, { inputTokens: 0, outputTokens: 0, cacheTokens: 0, costUsd: 0, costEur: 0 }, 'replace');
    const replaced = s.usagePatch(job, {
      inputTokens: 50, outputTokens: 5, cacheTokens: 0, costUsd: 0.1, costEur: 0.09,
      model: 'claude-sonnet-5-5', provider: 'anthropic',
      usageSteps: [step('brief', 'Brief', 50, 5, 0, 0.1, 0.09, 2)],
    }, 'replace');
    const merged = s.usagePatch(job, {
      inputTokens: 20, outputTokens: 4, cacheTokens: 0, costUsd: 0.05, costEur: 0.04,
      model: 'claude-sonnet-5-5', provider: 'anthropic',
      usageSteps: [step('b-nota', 'Nota visual (B)', 20, 4, 0, 0.05, 0.04, 8)],
    }, 'merge');
    const old = s.usagePatch({ ...job, usageSteps: undefined }, {
      inputTokens: 3, outputTokens: 1, cacheTokens: 3, cacheReadTokens: 2, cacheWriteTokens: 1,
      costUsd: 0.01, costEur: 0.01, model: 'claude-sonnet-5-5', provider: 'anthropic',
      usageSteps: [step('nota', 'Nota visual', 3, 1, 3, 0.01, 0.01, 5)],
    }, 'merge');
    process.stdout.write(JSON.stringify({
      wiped: wiped == null,
      replaced: replaced && replaced.inputTokens,
      replacedSteps: replaced && replaced.usageSteps.length,
      mergedIn: merged && merged.inputTokens,
      mergedIds: merged && merged.usageSteps.map((row) => row.id),
      mergedEur: merged && merged.costEur,
      oldIds: old && old.usageSteps.map((row) => row.id),
      oldIn: old && old.inputTokens,
    }));
  `);
  assert.equal(body.wiped, true);
  assert.equal(body.replaced, 50);
  assert.equal(body.replacedSteps, 1);
  assert.equal(body.mergedIn, 1020);
  assert.deepEqual(body.mergedIds, ['draft', 'b-nota']);
  assert.equal(body.mergedEur, 0.96);
  assert.deepEqual(body.oldIds, ['previo', 'nota']);
  assert.equal(body.oldIn, 1003);
});
