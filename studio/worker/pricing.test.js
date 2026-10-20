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

test('tarifas de catálogo, cambio a euros y pisado por entorno', () => {
  const body = run(`
    const p = require(${JSON.stringify(path.join(__dirname, 'pricing.ts'))});
    const million = { input: 1_000_000, output: 1_000_000, cache: 1_000_000 };
    const sonnetIn = { input: 1_000_000, output: 0, cache: 0 };
    process.stdout.write(JSON.stringify({
      key: p.priceEnvKey('custom:nous-api', 'deepseek/deepseek-v4-flash'),
      sonnetKey: p.priceEnvKey('anthropic', 'claude-sonnet-5-5'),
      deepseek: p.costFor(million, 'custom:nous-api', 'deepseek/deepseek-v4-flash', {}),
      sonnet: p.costFor(sonnetIn, 'anthropic', 'claude-sonnet-5-5', { USD_EUR: '0.86' }),
      haiku: p.costFor(sonnetIn, 'anthropic', 'claude-haiku-5-5', { USD_EUR: '0.86' }),
      defaultRate: p.usdEurRate({}),
      zeroRate: p.usdEurRate({ USD_EUR: '0' }),
      junkRate: p.usdEurRate({ USD_EUR: 'no' }),
      customRate: p.usdEurRate({ USD_EUR: '0.9' }),
      override: p.costFor(sonnetIn, 'anthropic', 'claude-sonnet-5-5', { HERMES_PRICE_ANTHROPIC_CLAUDE_SONNET_5_5: '1,2,3', USD_EUR: '1' }),
      modelOnly: p.costFor(sonnetIn, 'anthropic', 'claude-sonnet-5-5', { HERMES_PRICE_CLAUDE_SONNET_5_5: '4,5,6', USD_EUR: '1' }),
      cross: p.ratesFor('nous', 'claude-sonnet-5-5', {}),
      unknown: p.costFor({ input: 10, output: 0, cache: 0 }, 'anthropic', 'modelo-raro', {}),
      empty: p.costFor({ input: 0, output: 0, cache: 0 }, 'anthropic', 'modelo-raro', {}),
    }));
  `);
  assert.equal(body.key, 'HERMES_PRICE_NOUS_DEEPSEEK_DEEPSEEK_V4_FLASH');
  assert.equal(body.sonnetKey, 'HERMES_PRICE_ANTHROPIC_CLAUDE_SONNET_5_5');
  assert.equal(body.deepseek.usd, 0.2912);
  assert.equal(body.sonnet.usd, 2);
  assert.equal(body.sonnet.eur, 1.72);
  assert.equal(body.haiku.usd, 0.1);
  assert.equal(body.haiku.eur, 0.086);
  assert.equal(body.defaultRate, 0.86);
  assert.equal(body.zeroRate, 0.86);
  assert.equal(body.junkRate, 0.86);
  assert.equal(body.customRate, 0.9);
  assert.equal(body.override.usd, 1);
  assert.equal(body.modelOnly.usd, 4);
  assert.equal(body.cross, null);
  assert.equal(body.unknown, null);
  assert.deepEqual(body.empty, { usd: 0, eur: 0 });
});
