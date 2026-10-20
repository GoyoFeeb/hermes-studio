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

test('el libro suma el incremento de cada sesión y el coste de cada fase', () => {
  const body = run(`
    const { UsageLedger, usageFromMessage, sessionUsage } = require(${JSON.stringify(path.join(__dirname, 'usage.ts'))});
    const cache = usageFromMessage({ usage: { input_tokens: 10, output_tokens: 2, cache_read_input_tokens: 4, cache_creation_input_tokens: 3 } });
    const direct = usageFromMessage({ token_usage: { prompt_tokens: 8, completion_tokens: 1, cache_tokens: 5 } });
    const delta = new UsageLedger({ model: 'claude-sonnet-5-5', provider: 'anthropic' });
    delta.note('s', [{ usage: { input_tokens: 100, output_tokens: 10, cache_tokens: 0 } }], 'brief', 'claude-sonnet-5-5', 'anthropic');
    delta.note('s', [
      { usage: { input_tokens: 100, output_tokens: 10, cache_tokens: 0 } },
      { usage: { input_tokens: 50, output_tokens: 30, cache_tokens: 5 } },
    ], 'brief', 'claude-sonnet-5-5', 'anthropic');
    const priced = new UsageLedger({ model: 'claude-sonnet-5-5', provider: 'anthropic' });
    priced.note('s1', [{ usage: { input_tokens: 1_000_000, output_tokens: 0, cache_tokens: 0 } }], 'brief', 'claude-sonnet-5-5', 'anthropic');
    priced.note('s2', [{ usage: { input_tokens: 1_000_000, output_tokens: 0, cache_tokens: 0 } }], 'art', 'claude-haiku-5-5', 'anthropic');
    const seeded = new UsageLedger({ model: 'claude-sonnet-5-5', provider: 'anthropic' });
    seeded.seed({ input: 1000, output: 0, cache: 0, model: 'claude-sonnet-5-5', provider: 'anthropic' });
    seeded.note('s', [{ usage: { input_tokens: 500, output_tokens: 10, cache_tokens: 0 } }], 'draft', 'claude-sonnet-5-5', 'anthropic');
    process.stdout.write(JSON.stringify({
      cache, direct,
      delta: delta.report({ USD_EUR: '1' }),
      priced: priced.report({ USD_EUR: '0.86' }),
      seeded: seeded.report({ USD_EUR: '1' }),
    }));
  `);
  assert.deepEqual(body.cache, { input: 10, output: 2, cache: 7 });
  assert.deepEqual(body.direct, { input: 8, output: 1, cache: 5 });
  assert.equal(body.delta.inputTokens, 150);
  assert.equal(body.delta.outputTokens, 40);
  assert.equal(body.delta.cacheTokens, 5);
  assert.equal(body.priced.inputTokens, 2_000_000);
  assert.equal(body.priced.costUsd, 2.1);
  assert.equal(body.priced.costEur, 1.806);
  assert.equal(body.priced.model, 'claude-sonnet-5-5');
  assert.equal(body.priced.provider, 'anthropic');
  assert.equal(body.priced.phases.length, 2);
  assert.equal(body.seeded.inputTokens, 1500);
  assert.equal(body.seeded.outputTokens, 10);
  assert.equal(body.seeded.phases.some((p) => p.id === 'previo'), true);
});
