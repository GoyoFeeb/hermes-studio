const test = require('node:test');
const assert = require('node:assert/strict');

const { MODULE_ADAPTERS, escapeHtml, balancedRows, withCellGeometry, withStackGeometry } = require('./assemble.js');

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

test('withCellGeometry gives a single full-width cell zero padding', () => {
  const [item] = withCellGeometry([{ title: 'Uno' }], 1, 10);
  assert.equal(item.colWidth, '100%');
  assert.equal(item.cellPad, '0');
  assert.equal(item.title, 'Uno');
});

test('withCellGeometry splits padding to only the inner-facing side for a 2-column row', () => {
  const [first, second] = withCellGeometry([{ title: 'A' }, { title: 'B' }], 2, 10);
  assert.equal(first.colWidth, '50%');
  assert.equal(first.cellPad, '0 10px 0 0');
  assert.equal(second.cellPad, '0 0 0 10px');
});

test('withCellGeometry gives middle cells symmetric half-gutter padding', () => {
  const [first, middle, last] = withCellGeometry(
    [{ title: 'A' }, { title: 'B' }, { title: 'C' }],
    3,
    10
  );
  assert.equal(first.colWidth, '33%');
  assert.equal(first.cellPad, '0 10px 0 0');
  assert.equal(middle.cellPad, '0 5px');
  assert.equal(last.cellPad, '0 0 0 10px');
});

test('balancedRows keeps items in a single row when they fit within maxPerRow', () => {
  const items = [{ title: 'A' }, { title: 'B' }, { title: 'C' }];
  const rows = balancedRows(items, 3, 10);
  assert.equal(rows.length, 1);
  assert.equal(rows[0].items.length, 3);
});

test('balancedRows avoids an orphaned single-item row (4 items, maxPerRow 3 -> [2,2])', () => {
  const items = [{ title: 'A' }, { title: 'B' }, { title: 'C' }, { title: 'D' }];
  const rows = balancedRows(items, 3, 10);
  assert.deepEqual(rows.map((r) => r.items.length), [2, 2]);
});

test('balancedRows avoids an orphaned single-item row (5 items, maxPerRow 3 -> [3,2])', () => {
  const items = Array.from({ length: 5 }, (_, i) => ({ title: `Item ${i}` }));
  const rows = balancedRows(items, 3, 10);
  assert.deepEqual(rows.map((r) => r.items.length), [3, 2]);
});

test('balancedRows fills full rows evenly when items divide exactly (6 items, maxPerRow 3 -> [3,3])', () => {
  const items = Array.from({ length: 6 }, (_, i) => ({ title: `Item ${i}` }));
  const rows = balancedRows(items, 3, 10);
  assert.deepEqual(rows.map((r) => r.items.length), [3, 3]);
});

test('withStackGeometry gives every item except the last a bottom gap, and the last item none', () => {
  const items = [{ title: 'A' }, { title: 'B' }, { title: 'C' }];
  const [first, middle, last] = withStackGeometry(items, 20);
  assert.equal(first.padIcon, '0 16px 20px 0');
  assert.equal(first.padText, '0 0 20px');
  assert.equal(middle.padIcon, '0 16px 20px 0');
  assert.equal(last.padIcon, '0 16px 0 0');
  assert.equal(last.padText, '0');
});

test('withStackGeometry defaults the gap to 20px when not specified', () => {
  const [first] = withStackGeometry([{ title: 'A' }, { title: 'B' }]);
  assert.equal(first.padText, '0 0 20px');
});

// ── Fase F3 Bloque 2: spacing.* real (gutter/gap desde tokens) ──

test('pasos adapter preserves the literal 10px gutter when tokens has no spacing.small (all real packs today)', () => {
  const items = [{ number: '01', title: 'A', body: '' }, { number: '02', title: 'B', body: '' }, { number: '03', title: 'C', body: '' }];
  const scope = MODULE_ADAPTERS['pasos']({ eyebrow: 'E', title: 'T', items }, { spacing: { medium: 16 } });
  assert.equal(scope.steps[0].cellPad, '0 10px 0 0');
});

test('pasos adapter uses tokens.spacing.small as gutter when declared', () => {
  const items = [{ number: '01', title: 'A', body: '' }, { number: '02', title: 'B', body: '' }, { number: '03', title: 'C', body: '' }];
  const scope = MODULE_ADAPTERS['pasos']({ eyebrow: 'E', title: 'T', items }, { spacing: { small: 8 } });
  assert.equal(scope.steps[0].cellPad, '0 8px 0 0');
});

test('pasos adapter falls back to 10px when tokens/spacing is entirely absent (undefined tokens)', () => {
  const items = [{ number: '01', title: 'A', body: '' }, { number: '02', title: 'B', body: '' }];
  const scope = MODULE_ADAPTERS['pasos']({ eyebrow: 'E', title: 'T', items });
  assert.equal(scope.steps[0].cellPad, '0 10px 0 0');
});

test('columns-3-beneficios adapter: beneficiosRows gutter from spacing.small, beneficios gap from spacing.medium (not small)', () => {
  const items = [{ icon: 'i', title: 'A', body: '' }, { icon: 'i', title: 'B', body: '' }, { icon: 'i', title: 'C', body: '' }];
  const scope = MODULE_ADAPTERS['columns-3-beneficios'](
    { title: 'T', highlight: 'H', highlightNote: 'N', items },
    { spacing: { small: 8, medium: 16 } }
  );
  assert.equal(scope.beneficiosRows[0].items[0].cellPad, '0 8px 0 0');
  assert.equal(scope.beneficios[0].padIcon, '0 16px 16px 0'); // gap = spacing.medium = 16, no spacing.small
});

test('columns-3-beneficios adapter keeps its original 10/20 defaults when spacing is absent', () => {
  const items = [{ icon: 'i', title: 'A', body: '' }, { icon: 'i', title: 'B', body: '' }, { icon: 'i', title: 'C', body: '' }];
  const scope = MODULE_ADAPTERS['columns-3-beneficios']({ title: 'T', highlight: 'H', highlightNote: 'N', items });
  assert.equal(scope.beneficiosRows[0].items[0].cellPad, '0 10px 0 0');
  assert.equal(scope.beneficios[0].padIcon, '0 16px 20px 0');
});

test('usp-cards adapter uses tokens.spacing.small in place of its own 6px default', () => {
  const items = [{ icon: 'i', title: 'A', body: '' }, { icon: 'i', title: 'B', body: '' }, { icon: 'i', title: 'C', body: '' }];
  const withTokens = MODULE_ADAPTERS['usp-cards']({ eyebrow: 'E', title: 'T', body: 'B', badge: 'G', items }, { spacing: { small: 8 } });
  const withoutTokens = MODULE_ADAPTERS['usp-cards']({ eyebrow: 'E', title: 'T', body: 'B', badge: 'G', items });
  assert.equal(withTokens.uspRows[0].items[0].cellPad, '0 8px 0 0');
  assert.equal(withoutTokens.uspRows[0].items[0].cellPad, '0 6px 0 0');
});

test('metric-strip-premium adapter uses tokens.spacing.small in place of its own 10px default', () => {
  const items = [{ value: '1', label: 'A' }, { value: '2', label: 'B' }];
  const withTokens = MODULE_ADAPTERS['metric-strip-premium']({ title: 'T', items }, { spacing: { small: 8 } });
  const withoutTokens = MODULE_ADAPTERS['metric-strip-premium']({ title: 'T', items });
  assert.equal(withTokens.metricItems[0].cellPad, '0 8px 0 0');
  assert.equal(withoutTokens.metricItems[0].cellPad, '0 10px 0 0');
});

// ── Fase F3 Bloque 3: pasos-vertical / lista-premium-2col / trust-bar-inline ──

test('pasos adapter computes stepsStacked with connectorHeight 0 only on the last item', () => {
  const items = [
    { number: '01', title: 'A', body: '' },
    { number: '02', title: 'B', body: '' },
    { number: '03', title: 'C', body: '' }
  ];
  const scope = MODULE_ADAPTERS['pasos']({ eyebrow: 'E', title: 'T', items });
  assert.equal(scope.stepsStacked.length, 3);
  assert.equal(scope.stepsStacked[0].connectorHeight, 24);
  assert.equal(scope.stepsStacked[1].connectorHeight, 24);
  assert.equal(scope.stepsStacked[2].connectorHeight, 0);
  // padIcon/padText siguen viniendo de withStackGeometry, sin cambio de contrato
  assert.equal(scope.stepsStacked[2].padIcon, '0 16px 0 0');
});

test('pasos-vertical is aliased to the exact same adapter function as pasos', () => {
  assert.equal(MODULE_ADAPTERS['pasos-vertical'], MODULE_ADAPTERS['pasos']);
});

test('lista-premium adapter computes listRows alongside listItems ([2,1] split for 3 items)', () => {
  const items = [
    { icon: 'i', title: 'A', body: '' },
    { icon: 'i', title: 'B', body: '' },
    { icon: 'i', title: 'C', body: '' }
  ];
  const scope = MODULE_ADAPTERS['lista-premium']({ eyebrow: 'E', title: 'T', items });
  assert.deepEqual(scope.listItems, items);
  assert.deepEqual(scope.listRows.map((r) => r.items.length), [2, 1]);
});

test('lista-premium-2col is aliased to the exact same adapter function as lista-premium', () => {
  assert.equal(MODULE_ADAPTERS['lista-premium-2col'], MODULE_ADAPTERS['lista-premium']);
});

test('trust-bar-inline is aliased to the exact same adapter function as trust-bar (no new data shape needed)', () => {
  assert.equal(MODULE_ADAPTERS['trust-bar-inline'], MODULE_ADAPTERS['trust-bar']);
});
