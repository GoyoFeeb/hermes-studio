const test = require('node:test');
const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..', '..');
const TSX_BIN = path.join(ROOT, 'node_modules', '.bin', 'tsx');

// requestCoverage.ts vía tsx -e, como rateLimit.test.js. El caso base es el de Paredes (2026-10-05): la petición
// pedía pre-Black Friday y público joven, y ni el brief ni la pieza lo recogieron.
function run(code) {
  const wrapped = `
    const c = require(${JSON.stringify(path.join(__dirname, 'requestCoverage.ts'))});
    console.log(JSON.stringify((() => { ${code} })()));
  `;
  return JSON.parse(execFileSync(TSX_BIN, ['-e', wrapped], { cwd: ROOT, encoding: 'utf-8' }));
}

const PAREDES = 'Necesito una newsletter de las zapatillas de la marca paredes, que sea de npre-black frisay y esté destinada a un público joven';

test('detecta Black Friday con erratas y el público joven (petición real de Paredes)', () => {
  assert.deepEqual(run(`return c.requestTerms(${JSON.stringify(PAREDES)}).map((t) => t.id);`), ['black-friday', 'joven']);
});

test('el brief de Paredes no los nombraba: faltan los dos', () => {
  const brief = '## 1. Concepto\n«El negro de Paredes te saca a la calle.» Colección Otoño 26. Tono directo y urbano.';
  assert.deepEqual(run(`return c.missingInBrief(${JSON.stringify(PAREDES)}, ${JSON.stringify(brief)}).map((t) => t.label);`), ['Black Friday', 'público joven']);
});

test('un brief que los recoge no da nada', () => {
  const brief = 'Concepto: la cuenta atrás del Black Friday, para un público joven (18-25).';
  assert.deepEqual(run(`return c.missingInBrief(${JSON.stringify(PAREDES)}, ${JSON.stringify(brief)});`), []);
});

test('en la pieza solo cuentan la ocasión y la oferta, no el público', () => {
  assert.deepEqual(run(`return c.missingInPiece(${JSON.stringify(PAREDES)}, 'El negro también da luz.').map((t) => t.id);`), ['black-friday']);
  assert.deepEqual(run(`return c.missingInPiece(${JSON.stringify(PAREDES)}, 'Antes del BLACK FRIDAY, la Eden.');`), []);
});

test('oferta: un precio o un porcentaje en la pieza la cubre', () => {
  const req = 'newsletter con un descuento del 20% para socios';
  assert.deepEqual(run(`return c.missingInPiece(${JSON.stringify(req)}, 'Solo esta semana, -20 % en todo.');`), []);
  assert.deepEqual(run(`return c.missingInPiece(${JSON.stringify(req)}, 'La colección nueva ya está aquí.').map((t) => t.id);`), ['oferta']);
});

test('sin ocasión, oferta ni público no se exige nada; palabras cortas no se confunden', () => {
  assert.deepEqual(run(`return c.requestTerms('Lanzamiento de la nueva Eden negro de Paredes');`), []);
  assert.deepEqual(run(`return c.requestTerms('newsletter de la marca Black & Decker, taladro nuevo');`), []);
  assert.deepEqual(run(`return c.requestTerms('ofertas de navidad');`).map((t) => t.id), ['navidad', 'oferta']);
});

test('joinLabels', () => {
  assert.equal(run(`return c.joinLabels([{ label: 'Black Friday' }, { label: 'una oferta' }, { label: 'público joven' }]);`), 'Black Friday, una oferta y público joven');
});
