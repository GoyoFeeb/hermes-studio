const test = require('node:test');
const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..', '..');
const TSX_BIN = path.join(ROOT, 'node_modules', '.bin', 'tsx');

// Mismo patrón que supabase.test.js. storageTarget no toca disco ni red: solo decide bucket y ruta.
function targets(files) {
  const code = `
    const { storageTarget, contentTypeOf } = require(${JSON.stringify(path.join(__dirname, 'mirror.ts'))});
    const { ROOT } = require(${JSON.stringify(path.join(__dirname, 'paths.ts'))});
    const path = require('path');
    console.log(JSON.stringify(${JSON.stringify(files)}.map((f) => [storageTarget(path.join(ROOT, f)), contentTypeOf(f)])));
  `;
  return JSON.parse(execFileSync(TSX_BIN, ['-e', code], { cwd: ROOT, encoding: 'utf-8' }));
}

test('cada archivo va a su bucket con la ruta que ya usan los trabajos y /assets', () => {
  const out = targets([
    'newsletters/2026/nike/hermes/2026-10-09-abc123/newsletter.html',
    'newsletters/2026/nike/hermes/2026-10-09-abc123/thumb.jpg',
    'brands/nike/design-input/hermes/2026-10-06-jcpy0x/img-1.PNG',
    'brands/nike/brand-tokens.json',
  ]);
  assert.deepEqual(out, [
    [{ bucket: 'newsletters', key: 'newsletters/2026/nike/hermes/2026-10-09-abc123/newsletter.html' }, 'text/html; charset=utf-8'],
    [{ bucket: 'newsletters', key: 'newsletters/2026/nike/hermes/2026-10-09-abc123/thumb.jpg' }, 'image/jpeg'],
    [{ bucket: 'assets', key: 'nike/design-input/hermes/2026-10-06-jcpy0x/img-1.PNG' }, 'image/png'],
    [{ bucket: 'brand-packs', key: 'nike/brand-tokens.json' }, 'application/json'],
  ]);
});

test('no se copia lo que está fuera de newsletters/ y brands/, ni lo oculto', () => {
  const out = targets(['studio/data/jobs/abc.json', 'engine/build-newsletter.js', 'newsletters/2026/nike/.gitkeep', 'brands/.cache/logo.png', 'brands']);
  assert.deepEqual(out.map((o) => o[0]), [null, null, null, null, null]);
});
