const test = require('node:test');
const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..', '..');
const TSX_BIN = path.join(ROOT, 'node_modules', '.bin', 'tsx');

test('HERMES_ART_REVISE_PASSES vale 0 por defecto y 1 restaura la pasada de gusto', () => {
  const out = execFileSync(
    TSX_BIN,
    ['-e', `const w = require(${JSON.stringify(path.join(__dirname, 'hermes-worker.ts'))});
      const all = (n) => Object.fromEntries(Object.keys(w.ART_CRITERIA).map((k) => [k, n]));
      const review = (n) => ({ notas: all(n), pruebas: {}, problemas: [], mejoras: [], defectos: [] });
      const low = review(5);
      low.notas[Object.keys(w.ART_CRITERIA)[0]] = 3;
      const perfect = review(5);
      process.stdout.write(JSON.stringify({
        def: w.artRevisePasses({}),
        blank: w.artRevisePasses({ HERMES_ART_REVISE_PASSES: '' }),
        zero: w.artRevisePasses({ HERMES_ART_REVISE_PASSES: '0' }),
        junk: w.artRevisePasses({ HERMES_ART_REVISE_PASSES: 'no' }),
        one: w.artRevisePasses({ HERMES_ART_REVISE_PASSES: '1' }),
        three: w.artRevisePasses({ HERMES_ART_REVISE_PASSES: '3' }),
        big: w.artRevisePasses({ HERMES_ART_REVISE_PASSES: '99' }),
        taste0: w.shouldRunTasteRound(low, 0),
        taste1: w.shouldRunTasteRound(low, 1),
        perfect: w.shouldRunTasteRound(perfect, 1),
        models: w.MODELS,
      }));`],
    {
      cwd: ROOT,
      encoding: 'utf8',
      env: {
        ...process.env,
        HERMES_WORKER_ENV_DIR: '/nonexistent',
        HERMES_MODEL_BRIEF: 'claude-haiku-5-5',
        HERMES_MODEL_DRAFT: 'claude-sonnet-5-5',
        HERMES_MODEL_FIX: 'claude-haiku-5-5',
        HERMES_MODEL_ART: 'claude-haiku-5-5',
      },
    }
  );
  const body = JSON.parse(out);
  assert.equal(body.def, 0);
  assert.equal(body.blank, 0);
  assert.equal(body.zero, 0);
  assert.equal(body.junk, 0);
  assert.equal(body.one, 1);
  assert.equal(body.three, 3);
  assert.equal(body.big, 20);
  assert.equal(body.taste0, false);
  assert.equal(body.taste1, true);
  assert.equal(body.perfect, false);
  assert.deepEqual(body.models, {
    brief: 'claude-haiku-5-5',
    draft: 'claude-sonnet-5-5',
    fix: 'claude-haiku-5-5',
    art: 'claude-haiku-5-5',
  });
  const src = fs.readFileSync(path.join(__dirname, 'hermes-worker.ts'), 'utf8');
  assert.match(src, /shouldRunTasteRound\(review, budget\.artRevisePasses\)/);
  assert.match(src, /recordTurnUsage/);
  assert.match(src, /\.\.\.usageBody\(\)/);
});
