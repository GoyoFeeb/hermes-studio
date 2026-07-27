const test = require('node:test');
const assert = require('node:assert/strict');

const { MODULE_ADAPTERS, escapeHtml } = require('./assemble.js');

test('hero-asimetrico adapter duplicates cta at root scope for shared CTA include', () => {
  const cta = { href: 'https://example.com', label: 'Ver más' };
  const scope = MODULE_ADAPTERS['hero-asimetrico']({
    h1: 'Título',
    stat: { number: '1', label: 'dato' },
    subtitle: 'Subtítulo',
    cta
  });

  assert.deepEqual(scope.hero.cta, cta);
  assert.deepEqual(scope.cta, cta);
});

test('card-tarifa adapter maps uniform items into the component card scope', () => {
  const items = [
    { icon: 'https://example.com/1.png', title: 'Uno', body: 'A', href: 'https://example.com/1', linkLabel: 'Ver' },
    { icon: 'https://example.com/2.png', title: 'Dos', body: 'B', href: 'https://example.com/2', linkLabel: 'Ver' },
    { icon: 'https://example.com/3.png', title: 'Tres', body: 'C', href: 'https://example.com/3', linkLabel: 'Ver' },
    { icon: 'https://example.com/4.png', title: 'Cuatro', body: 'D', href: 'https://example.com/4', linkLabel: 'Ver' }
  ];

  const scope = MODULE_ADAPTERS['card-tarifa']({
    eyebrow: 'Eyebrow',
    title: 'Título',
    subtitle: 'Subtítulo',
    items
  });

  assert.deepEqual(scope.cardsSection, { eyebrow: 'Eyebrow', title: 'Título', subtitle: 'Subtítulo' });
  assert.deepEqual(scope.cards, items);
});

test('card-tarifa-3 adapter preserves the three-card variant shape', () => {
  const items = [
    { title: 'Uno' },
    { title: 'Dos' },
    { title: 'Tres' }
  ];

  const scope = MODULE_ADAPTERS['card-tarifa-3']({
    eyebrow: 'Eyebrow',
    title: 'Título',
    subtitle: 'Subtítulo',
    items
  });

  assert.equal(scope.cards.length, 3);
  assert.deepEqual(scope.cardsSection, { eyebrow: 'Eyebrow', title: 'Título', subtitle: 'Subtítulo' });
});

test('escapeHtml escapes campaign copy inserted through data placeholders', () => {
  assert.equal(escapeHtml('Tom & Jerry <script>'), 'Tom &amp; Jerry &lt;script&gt;');
});
