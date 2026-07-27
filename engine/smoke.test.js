const test = require('node:test');
const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

test('build-newsletter generates source, inline and manifest from the example campaign data', () => {
  const root = path.resolve(__dirname, '..');
  const out = fs.mkdtempSync(path.join(os.tmpdir(), 'engine-smoke-'));
  try {
    execFileSync(
      process.execPath,
      [
        path.join(root, 'engine', 'build-newsletter.js'),
        '--data',
        path.join(root, 'engine', 'schema', 'campaign-data.example.json'),
        '--out',
        out
      ],
      { cwd: root, stdio: 'pipe' }
    );

    const sourcePath = path.join(out, 'final.html');
    const inlinePath = path.join(out, 'final-inline.html');
    const manifestPath = path.join(out, 'build-manifest.json');
    assert.equal(fs.existsSync(sourcePath), true);
    assert.equal(fs.existsSync(inlinePath), true);
    assert.equal(fs.existsSync(manifestPath), true);

    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    assert.equal(manifest.pattern, 'saving');
    assert.ok(manifest.counts.inlineBytes > 0);
    assert.deepEqual(manifest.warnings, []);
  } finally {
    fs.rmSync(out, { recursive: true, force: true });
  }
});
