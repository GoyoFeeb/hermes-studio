const test = require('node:test');
const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..', '..');
const TSX_BIN = path.join(ROOT, 'node_modules', '.bin', 'tsx');

// Ficha de marca (2026-10-01): se prueba contra los brand packs reales del repo.
function run(code) {
  const wrapped = `
    const m = await import(${JSON.stringify(path.join(__dirname, 'brandCard.ts'))});
    const { buildBrandCard, cardHash } = m.default ?? m;
    const fs = await import('node:fs');
    ${code}
  `;
  return JSON.parse(execFileSync(TSX_BIN, ['--input-type=module', '-e', wrapped], { encoding: 'utf8', maxBuffer: 50 * 1024 * 1024 }).trim());
}

test('todas las marcas del repo tienen ficha sin errores, con o sin brand pack', () => {
  const out = run(`
    const root = ${JSON.stringify(ROOT)};
    const slugs = fs.readdirSync(root + '/brands', { withFileTypes: true }).filter((e) => e.isDirectory()).map((e) => e.name);
    const cards = slugs.map((s) => buildBrandCard(root, s));
    console.log(JSON.stringify({
      total: cards.length,
      withPack: cards.filter((c) => c.hasPack).length,
      bigLogo: cards.filter((c) => c.logo && c.logo.length > 210000).length,
      badColor: cards.flatMap((c) => c.colors).filter((c) => !/^(#[0-9a-f]{3,8}|rgba?\\(.+\\))$/i.test(c.value)).length,
      nike: cards.find((c) => c.slug === 'nike'),
      eci: cards.find((c) => c.slug === 'el-corte-ingles'),
      stable: cardHash(buildBrandCard(root, 'nike')) === cardHash(buildBrandCard(root, 'nike')),
    }));
  `);
  assert.ok(out.total >= 30);
  assert.ok(out.withPack >= 15);
  assert.equal(out.bigLogo, 0);
  assert.equal(out.badColor, 0);
  assert.equal(out.nike.hasPack, true);
  assert.ok(out.nike.colors.some((c) => c.labels.includes('Principal')));
  assert.equal(out.nike.cta.label, 'Comprar el Pegasus 42');
  assert.match(out.nike.logo || '', /^data:image\//);
  assert.ok(out.nike.voice.examples.length > 0);
  assert.equal(out.eci.hasPack, false);
  assert.equal(out.eci.typography, null);
  assert.equal(out.stable, true);
});

test('los archivos que no son imágenes no se ofrecen como logos y el logo elegido es una imagen de verdad', () => {
  const out = run(`
    const root = ${JSON.stringify(ROOT)};
    const m2 = await import(${JSON.stringify(path.join(__dirname, 'brandCard.ts'))});
    const { brandAssets } = m2.default ?? m2;
    const prozis = brandAssets(root, 'prozis');
    const eci = buildBrandCard(root, 'el-corte-ingles');
    const toyota = buildBrandCard(root, 'toyota');
    console.log(JSON.stringify({
      prozisBroken: prozis.broken, prozisLogos: prozis.logos,
      eciBroken: eci.assets.broken, eciLogoHead: Buffer.from((eci.logo || ',').split(',')[1], 'base64').subarray(0, 4).toString('latin1'),
      toyotaMismatched: toyota.assets.mismatched.length, toyotaLogoMime: (toyota.logo || '').slice(0, 15),
    }));
  `);
  assert.ok(out.prozisBroken.includes('prozis-logo.svg'));
  assert.ok(!out.prozisLogos.includes('prozis-logo.svg'));
  assert.ok(out.eciBroken.includes('logo-veci-claim.svg'));
  assert.equal(out.eciLogoHead, '\u0089PNG');
  assert.ok(out.toyotaMismatched >= 1);
  assert.ok(!out.toyotaLogoMime || out.toyotaLogoMime.startsWith('data:image/'));
});
