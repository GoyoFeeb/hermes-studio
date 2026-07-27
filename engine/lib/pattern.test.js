const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

const { loadPattern, validateModulesAgainstPattern } = require('./pattern.js');

const root = path.resolve(__dirname, '..', '..');
const mods = (...components) => components.map((component) => ({ component }));

test('saving pattern accepts a minimal valid motor sequence', () => {
  const { sequence } = loadPattern('saving', root);
  const result = validateModulesAgainstPattern(
    sequence,
    mods('hero-asimetrico', 'card-tarifa', 'pasos', 'banda-cierre', 'footer')
  );

  assert.equal(result.ok, true, result.errors && result.errors.join('\n'));
});

test('saving pattern rejects modules outside anchor order', () => {
  const { sequence } = loadPattern('saving', root);
  const result = validateModulesAgainstPattern(
    sequence,
    mods('card-tarifa', 'hero-asimetrico', 'pasos', 'banda-cierre', 'footer')
  );

  assert.equal(result.ok, false);
  assert.match(result.errors.join('\n'), /obligatorio|fuera de orden|posición/i);
});

test('saving pattern rejects a missing required body module', () => {
  const { sequence } = loadPattern('saving', root);
  const result = validateModulesAgainstPattern(
    sequence,
    mods('hero-asimetrico', 'card-tarifa', 'banda-cierre', 'footer')
  );

  assert.equal(result.ok, false);
  assert.match(result.errors.join('\n'), /pasos|obligatorio/i);
});
