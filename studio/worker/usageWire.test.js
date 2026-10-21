const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('path');

const src = fs.readFileSync(path.join(__dirname, 'hermes-worker.ts'), 'utf8');

test('cada llamada del worker queda en un paso con su duración', () => {
  assert.match(src, /usageSteps: report\.phases/);
  assert.match(src, /withUsageStep\('nota'/);
  assert.match(src, /withUsageStep\(`mejora-\$\{pass\}`/);
  assert.match(src, /withUsageStep\(`nota-mejora-\$\{scorePass\}`/);
  assert.match(src, /withUsageStep\('defectos'/);
  assert.match(src, /withUsageStep\('gusto'/);
  assert.match(src, /withUsageStep\('comparacion'/);
  assert.match(src, /usagePrefix = 'b-'/);
  assert.match(src, /recordTurnUsage\(slot, seen\?\.\[1\] \|\| resumeId, model, \(Date\.now\(\) - started\) \/ 1000\)/);
});
