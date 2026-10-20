const test = require('node:test');
const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', '..');
const TSX_BIN = path.join(ROOT, 'node_modules', '.bin', 'tsx');

function run(code) {
  const wrapped = `
    const { standaloneInputFromBody } = require(${JSON.stringify(path.join(__dirname, 'standaloneCreate.ts'))});
    ${code}
  `;
  return JSON.parse(execFileSync(TSX_BIN, ['-e', wrapped], { cwd: ROOT, encoding: 'utf8' }).trim());
}

test('crear un trabajo por API: mismos rechazos que el formulario', () => {
  const out = run(`
    const miss = standaloneInputFromBody({ mode: 'standalone', clientName: 'Casa Lumen' });
    const other = standaloneInputFromBody({ mode: 'pipeline' });
    const brand = standaloneInputFromBody({
      mode: 'standalone',
      clientName: 'Casa Lumen',
      promptText: 'una newsletter de otra marca',
      imageMode: 'official',
      inputKind: 'instruction',
    });
    const ok = standaloneInputFromBody({
      mode: 'standalone',
      clientName: 'Casa Lumen',
      promptText: 'Newsletter de Casa Lumen para el fin de semana',
      imageMode: 'official',
      inputKind: 'instruction',
      confirmNoBrandUrl: true,
      requesterName: 'no se usa',
    }, 'ClickUp');
    console.log(JSON.stringify({
      miss: [miss.ok, miss.status, miss.error],
      other: [other.ok, other.status],
      brand: [brand.ok, brand.status, brand.code],
      ok: ok.ok && ok.input.clientSlug && ok.input.instruction.includes('Casa Lumen') && ok.input.requesterName === 'ClickUp' && ok.input.briefText === '' && ok.input.mode === 'standalone',
    }));
  `);
  assert.equal(out.miss[0], false);
  assert.equal(out.miss[1], 400);
  assert.match(out.miss[2], /marca y prompt/);
  assert.equal(out.other[0], false);
  assert.equal(out.other[1], 400);
  assert.equal(out.brand[0], false);
  assert.equal(out.brand[1], 409);
  assert.equal(out.brand[2], 'brand_mismatch');
  assert.equal(out.ok, true);
});
