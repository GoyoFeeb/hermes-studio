const test = require('node:test');
const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
const TSX_BIN = path.join(ROOT, 'node_modules', '.bin', 'tsx');

/** Crea un directorio de campaña temporal mínimo: 06-data/campaign-data.json + los archivos
 * de 03-strategy/02-analysis que cada fixture necesite. Se borra al terminar el test. */
function makeCampaignFixture(files) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'gate-smoke-'));
  for (const [relPath, content] of Object.entries(files)) {
    const full = path.join(dir, relPath);
    fs.mkdirSync(path.dirname(full), { recursive: true });
    fs.writeFileSync(full, content, 'utf8');
  }
  return dir;
}

/** Ejecuta un script de scripts/ vía tsx contra --campaign <dir>, sin lanzar en exit≠0. */
function runGateScript(scriptName, campaignDir) {
  try {
    const stdout = execFileSync(TSX_BIN, [path.join(ROOT, 'scripts', scriptName), '--campaign', campaignDir], {
      cwd: ROOT,
      encoding: 'utf-8',
      stdio: 'pipe'
    });
    return { exitCode: 0, output: stdout };
  } catch (err) {
    return { exitCode: err.status ?? 1, output: (err.stdout || '') + (err.stderr || '') };
  }
}

// ── Gate 12: check-structural-differentiation.ts (prioridad explícita del roadmap Fase C) ──

test('check-structural-differentiation: omite campañas sin campaign-data.json (formato antiguo)', () => {
  const dir = makeCampaignFixture({});
  try {
    const { exitCode } = runGateScript('check-structural-differentiation.ts', dir);
    assert.equal(exitCode, 0);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('check-structural-differentiation: falla si productionReady y la secuencia comodín no tiene traducción documentada', () => {
  const campaignData = {
    pattern: 'institutional',
    metadata: { productionReady: true },
    modules: [
      { component: 'header-logo', data: {} },
      { component: 'hero-imagen', data: {} },
      { component: 'intro-cta', data: {} },
      { component: 'columns-3-beneficios', data: { items: [] } },
      { component: 'usp-cards', data: { items: [] } },
      { component: 'banda-cierre', data: {} },
      { component: 'footer', data: {} }
    ]
  };
  const dir = makeCampaignFixture({
    '06-data/campaign-data.json': JSON.stringify(campaignData)
  });
  try {
    const { exitCode, output } = runGateScript('check-structural-differentiation.ts', dir);
    assert.equal(exitCode, 1);
    assert.match(output, /brand-structure-translation\.md/);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('check-structural-differentiation: pasa (con avisos) cuando la secuencia no es la comodín y no es productionReady', () => {
  const campaignData = {
    pattern: 'saving',
    metadata: {},
    modules: [
      { component: 'header-logo', data: {} },
      { component: 'hero-asimetrico', data: {} },
      { component: 'card-tarifa', data: { items: [] } },
      { component: 'footer', data: {} }
    ]
  };
  const dir = makeCampaignFixture({
    '06-data/campaign-data.json': JSON.stringify(campaignData)
  });
  try {
    const { exitCode } = runGateScript('check-structural-differentiation.ts', dir);
    assert.equal(exitCode, 0);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('check-structural-differentiation: pasa cuando la traducción documenta la justificación de la secuencia comodín', () => {
  const campaignData = {
    pattern: 'institutional',
    metadata: { productionReady: true },
    modules: [
      { component: 'header-logo', data: {} },
      { component: 'hero-imagen', data: {} },
      { component: 'intro-cta', data: {} },
      { component: 'columns-3-beneficios', data: { items: [] } },
      { component: 'usp-cards', data: { items: [] } },
      { component: 'banda-cierre', data: {} },
      { component: 'footer', data: {} }
    ]
  };
  const dir = makeCampaignFixture({
    '06-data/campaign-data.json': JSON.stringify(campaignData),
    '03-strategy/brand-structure-translation.md':
      '# Traducción\n\nlayout.brandStructure ➡️ header-logo\ncontentRhythm ➡️ hero-imagen\n\n' +
      'Este orden es correcto e intencional para esta marca (justificación explícita).'
  });
  try {
    const { exitCode } = runGateScript('check-structural-differentiation.ts', dir);
    assert.equal(exitCode, 0);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

// ── Fase F2: comodín por patrón (antes solo fotografia-primero la tenía) ──

test('check-structural-differentiation: detecta la comodín también para el patrón "saving" (antes solo existía para fotografia-primero)', () => {
  const campaignData = {
    pattern: 'saving',
    metadata: {},
    modules: [
      { component: 'hero-asimetrico', data: {} },
      { component: 'trust-bar', data: { items: [] } },
      { component: 'card-tarifa', data: { items: [] } },
      { component: 'pasos', data: { items: [] } },
      { component: 'lista-premium', data: { items: [] } },
      { component: 'banda-cierre', data: {} },
      { component: 'footer', data: {} }
    ]
  };
  const dir = makeCampaignFixture({
    '06-data/campaign-data.json': JSON.stringify(campaignData)
  });
  try {
    const { exitCode, output } = runGateScript('check-structural-differentiation.ts', dir);
    // Check 5 bloquea un match exacto sin justificar independientemente de productionReady
    // (comportamiento heredado, no nuevo de esta fase — ver la rama sin "if (productionReady)").
    assert.equal(exitCode, 1);
    assert.match(output, /coincide exactamente con la secuencia comodín/);
    assert.match(output, /Sin justificar/);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('check-structural-differentiation: no aplica el check de comodín a un patrón sin comodín registrado', () => {
  const campaignData = {
    pattern: 'digest', // patrón hipotético de Fase F5, sin entrada en PATTERN_DEFAULT_SEQUENCES
    metadata: {},
    modules: [{ component: 'header-logo', data: {} }, { component: 'footer', data: {} }]
  };
  const dir = makeCampaignFixture({
    '06-data/campaign-data.json': JSON.stringify(campaignData)
  });
  try {
    const { exitCode, output } = runGateScript('check-structural-differentiation.ts', dir);
    assert.equal(exitCode, 0);
    assert.match(output, /No hay secuencia comodín definida/);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

// ── Fase F2: comparación cruzada real (Check 8) — contra datos reales del repo ──

test('check-structural-differentiation: detecta la colisión real Audi/BMW "brand-native" (2026-08-01) que motivó esta fase', () => {
  const bmwCampaign = path.join(ROOT, 'newsletters', '2026', 'bmw', '2026-ago-bmw-brand-native-restauracion-test');
  if (!fs.existsSync(path.join(bmwCampaign, '06-data', 'campaign-data.json'))) {
    return; // campaña de una sesión concurrente — si no existe en este checkout, se omite sin fallar
  }
  const { exitCode, output } = runGateScript('check-structural-differentiation.ts', bmwCampaign);
  assert.equal(exitCode, 0); // aviso, no bloqueante
  assert.match(output, /marcas distintas/);
  assert.match(output, /audi/);
});

// ── Gate 10: check-production-readiness.ts ──

test('check-production-readiness: falla si hay un placeholder PENDING- y la campaña NO es de test', () => {
  const campaignData = {
    metadata: {},
    modules: [
      { component: 'hero-imagen', data: { cta: { href: 'https://PENDING-CDN-UPLOAD/logo.png' } } }
    ]
  };
  const dir = makeCampaignFixture({
    '06-data/campaign-data.json': JSON.stringify(campaignData)
  });
  try {
    const { exitCode, output } = runGateScript('check-production-readiness.ts', dir);
    assert.equal(exitCode, 1);
    assert.match(output, /PENDING-CDN-UPLOAD/);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('check-production-readiness: solo avisa (no falla) del mismo placeholder si isTestCampaign:true', () => {
  const campaignData = {
    metadata: { isTestCampaign: true },
    modules: [
      { component: 'hero-imagen', data: { cta: { href: 'https://PENDING-CDN-UPLOAD/logo.png' } } }
    ]
  };
  const dir = makeCampaignFixture({
    '06-data/campaign-data.json': JSON.stringify(campaignData)
  });
  try {
    const { exitCode } = runGateScript('check-production-readiness.ts', dir);
    assert.equal(exitCode, 0);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('check-production-readiness: pasa limpio sin ningún placeholder', () => {
  const campaignData = {
    metadata: {},
    modules: [
      { component: 'hero-imagen', data: { cta: { href: 'https://example.com/real' } } }
    ]
  };
  const dir = makeCampaignFixture({
    '06-data/campaign-data.json': JSON.stringify(campaignData)
  });
  try {
    const { exitCode } = runGateScript('check-production-readiness.ts', dir);
    assert.equal(exitCode, 0);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

// ── Gate 11: check-hero-decision.ts ──

test('check-hero-decision: omite campañas sin módulo hero-*', () => {
  const campaignData = { modules: [{ component: 'footer', data: {} }] };
  const dir = makeCampaignFixture({
    '06-data/campaign-data.json': JSON.stringify(campaignData)
  });
  try {
    const { exitCode } = runGateScript('check-hero-decision.ts', dir);
    assert.equal(exitCode, 0);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('check-hero-decision: pasa directamente si ya usa hero-imagen', () => {
  const campaignData = { modules: [{ component: 'hero-imagen', data: { cta: {} } }] };
  const dir = makeCampaignFixture({
    '06-data/campaign-data.json': JSON.stringify(campaignData)
  });
  try {
    const { exitCode } = runGateScript('check-hero-decision.ts', dir);
    assert.equal(exitCode, 0);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('check-hero-decision: falla si se cumplen los criterios de hero-imagen y no se documentó la alternativa', () => {
  const campaignData = {
    brand: 'brands/aesop/tokens/brand-tokens.json',
    modules: [
      { component: 'hero-centrado', data: { cta: { href: 'https://example.com/landing-real' } } }
    ]
  };
  const dir = makeCampaignFixture({
    '06-data/campaign-data.json': JSON.stringify(campaignData)
  });
  try {
    const { exitCode, output } = runGateScript('check-hero-decision.ts', dir);
    assert.equal(exitCode, 1);
    assert.match(output, /no hay ningún motivo documentado/);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('check-hero-decision: pasa si el motivo para no usar hero-imagen está documentado', () => {
  const campaignData = {
    brand: 'brands/aesop/tokens/brand-tokens.json',
    modules: [
      { component: 'hero-centrado', data: { cta: { href: 'https://example.com/landing-real' } } }
    ]
  };
  const dir = makeCampaignFixture({
    '06-data/campaign-data.json': JSON.stringify(campaignData),
    '03-strategy/module-selection.md': 'Se evaluó hero-imagen y se descartó porque el arte generado no está listo aún.'
  });
  try {
    const { exitCode } = runGateScript('check-hero-decision.ts', dir);
    assert.equal(exitCode, 0);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

// ── Gate 13: check-brand-visual-report-completeness.ts ("Nivel 5", evolución del agente 02) ──

test('check-brand-visual-report-completeness: los 9 artefactos ausentes solo avisan, nunca fallan', () => {
  const campaignData = {
    brand: 'brands/paraycompara/tokens/brand-tokens.json',
    modules: []
  };
  const dir = makeCampaignFixture({
    '06-data/campaign-data.json': JSON.stringify(campaignData)
  });
  try {
    const { exitCode, output } = runGateScript('check-brand-visual-report-completeness.ts', dir);
    assert.equal(exitCode, 0);
    assert.match(output, /visual-identity-report\.md ausente/);
    assert.match(output, /styles\/reference\.css ausente/);
    assert.match(output, /Nivel 5, no bloqueante/);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('check-brand-visual-report-completeness: un artefacto presente con contenido placeholder falla', () => {
  const campaignData = { brand: 'brands/no-existe-esta-marca/tokens/brand-tokens.json', modules: [] };
  const dir = makeCampaignFixture({
    '06-data/campaign-data.json': JSON.stringify(campaignData),
    '02-analysis/visual-identity-report.md': '[PENDIENTE]'
  });
  try {
    const { exitCode, output } = runGateScript('check-brand-visual-report-completeness.ts', dir);
    assert.equal(exitCode, 1);
    assert.match(output, /contenido es un placeholder sin resolver/);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('check-brand-visual-report-completeness: pasa limpio (sin avisos) cuando los artefactos de campaña están poblados', () => {
  const campaignData = { brand: 'brands/no-existe-esta-marca/tokens/brand-tokens.json', modules: [] };
  const realContent = 'Contenido real observado en el sitio de la marca, con suficiente longitud para no contar como placeholder.';
  const dir = makeCampaignFixture({
    '06-data/campaign-data.json': JSON.stringify(campaignData),
    '02-analysis/visual-identity-report.md': realContent,
    '02-analysis/source-inventory.md': realContent,
    '02-analysis/open-questions.md': realContent
  });
  try {
    const { exitCode, output } = runGateScript('check-brand-visual-report-completeness.ts', dir);
    assert.equal(exitCode, 0);
    assert.doesNotMatch(output, /02-analysis\/(visual-identity-report|source-inventory|open-questions)\.md ausente/);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});
