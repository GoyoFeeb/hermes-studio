const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const { loadBrandTokens, resolveTokenPath, compareVersions, MIN_VERSION } = require('./tokens.js');

test('loadBrandTokens loads a real root brand pack and resolves nested tokens', () => {
  const root = path.resolve(__dirname, '..', '..');
  const { tokens, resolvedPath } = loadBrandTokens('brands/tarifalo/tokens/brand-tokens.json', root);

  assert.equal(path.basename(resolvedPath), 'brand-tokens.json');
  assert.equal(resolveTokenPath(tokens, 'version'), tokens.version);
  assert.ok(compareVersions(tokens.version, MIN_VERSION) >= 0);
});

test('loadBrandTokens fails clearly when the brand pack does not exist', () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'brand-missing-'));
  try {
    assert.throws(
      () => loadBrandTokens('brands/missing/tokens/brand-tokens.json', tmp),
      /Brand pack no encontrado/
    );
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});

test('loadBrandTokens rejects brand packs below the required version', () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'brand-version-'));
  try {
    const pack = path.join(tmp, 'brands', 'demo', 'tokens');
    fs.mkdirSync(pack, { recursive: true });
    fs.writeFileSync(path.join(pack, 'brand-tokens.json'), JSON.stringify({ version: '2.1.0' }), 'utf8');

    assert.throws(
      () => loadBrandTokens('brands/demo/tokens/brand-tokens.json', tmp),
      /se requiere >= v2\.2\.0/
    );
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});
