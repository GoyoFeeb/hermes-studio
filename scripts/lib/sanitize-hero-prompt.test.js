const test = require('node:test');
const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..', '..');
const TSX_BIN = path.join(ROOT, 'node_modules', '.bin', 'tsx');

// sanitize-hero-prompt.ts es TypeScript sin punto de entrada CLI propio (lo consumen
// generate-hero-image.ts y studio/server/phases/dataPhase.ts) — se prueba vía un one-liner con
// tsx, igual que gates.smoke.test.js prueba los scripts CLI vía execFileSync, para no añadir un
// registro/loader de TS nuevo a `node --test` (ver package.json: "test": "node --test").
function sanitize(desc, brandName) {
  const code =
    `const { sanitizeLandingPrompt } = require(${JSON.stringify(path.join(__dirname, 'sanitize-hero-prompt.ts'))});` +
    `process.stdout.write(sanitizeLandingPrompt(${JSON.stringify(desc)}, ${JSON.stringify(brandName)}));`;
  return execFileSync(TSX_BIN, ['-e', code], { cwd: ROOT, encoding: 'utf-8' });
}

// Extraído 2026-09-23 (auditoría, BUG-H08) de scripts/generate-hero-image.ts para que
// studio/server/phases/dataPhase.ts pueda aplicar el mismo saneado — este test fija el
// comportamiento del incidente original (BMW, 2026-07-27) para que sobreviva la extracción.

test('sanitizeLandingPrompt: elimina personajes con copyright y elementos de automoción identificables', () => {
  const out = sanitize('A superhero costumed figure flies past the BMW kidney grill', 'BMW');
  assert.doesNotMatch(out, /superhero/i);
  assert.doesNotMatch(out, /costumed figure/i);
  assert.doesNotMatch(out, /kidney grill/i);
  assert.doesNotMatch(out, /\bBMW\b/);
});

test('sanitizeLandingPrompt: elimina la mención de matrícula, la URL y el precio', () => {
  // "license plate" se camufla como frase (el código alfanumérico que la sigue, ej. ABC1234, no
  // se detecta como tal — la función no reconoce patrones de matrícula, solo la frase textual).
  const out = sanitize('Parked next to license plate ABC1234, see https://example.com, price 4,50€', 'Nike');
  assert.doesNotMatch(out, /license\s*plate/i);
  assert.doesNotMatch(out, /https?:\/\//);
  assert.doesNotMatch(out, /4,50€/);
});

test('sanitizeLandingPrompt: no toca una descripción ya genérica sin triggers', () => {
  const out = sanitize('Warm natural light, product centered, soft shadows, editorial composition', 'Aesop');
  assert.equal(out, 'Warm natural light, product centered, soft shadows, editorial composition');
});
