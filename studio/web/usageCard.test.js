const test = require('node:test');
const assert = require('node:assert/strict');
const U = require('./usageCard.js');

test('el bloque dice tiempo, tokens y euros, y sin datos si no hay', () => {
  assert.equal(U.compactTokens(182000), '182k');
  assert.equal(U.compactTokens(1500), '1,5k');
  assert.equal(U.formatEur(0.94), '0,94 €');
  assert.equal(U.formatMSS(360), '6:00');
  const usage = U.usageFromJob({
    inputTokens: 100000,
    outputTokens: 80000,
    cacheTokens: 2000,
    costEur: 0.94,
    usageSteps: [
      { id: 'draft', label: 'Generación', inputTokens: 100000, outputTokens: 80000, cacheTokens: 2000, costEur: 0.8, durationSec: 300 },
      { id: 'mejora-1', label: 'Mejora 1', inputTokens: 0, outputTokens: 0, cacheTokens: 0, costEur: 0, durationSec: 12 },
    ],
  }, 360);
  assert.equal(U.headline(usage), '6:00 · 182k tokens · 0,94 €');
  const html = U.renderBlock(usage);
  assert.match(html, /Tiempo · Tokens · Coste/);
  assert.match(html, /6:00 · 182k tokens · 0,94 €/);
  assert.match(html, /Por paso/);
  assert.match(html, /Generación/);
  assert.match(html, /Mejora 1/);
  assert.match(html, /<details/);
  assert.equal(U.headline({ known: false }), 'sin datos');
  assert.match(U.renderBlock({ known: false }), /sin datos/);
  assert.doesNotMatch(U.renderBlock({ known: false }), /<details/);
});
