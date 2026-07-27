#!/usr/bin/env node
'use strict';

/**
 * engine/build-newsletter.js — el ensamblador del motor (prompt 13).
 *
 *   node engine/build-newsletter.js \
 *     --data newsletters/{year}/{client}/{campaign}/06-data/campaign-data.json \
 *     --out  newsletters/{year}/{client}/{campaign}/09-exports/
 *
 * Ver engine/README.md para el contrato completo (flags, convención de placeholders, cómo
 * añadir un componente o un género nuevo).
 *
 * Pipeline (orden estricto, ver engine/CHANGELOG.md prompt 13 para el razonamiento de cada
 * decisión de diseño):
 *   1. Validar campaign-data.json contra engine/schema/campaign-data.schema.json (ajv)
 *   2. Cargar brand-tokens.json (versión >= 2.2.0)
 *   3. Resolver y validar el patrón de género (patterns/{pattern}.md)
 *   4. Ensamblar el HTML fuente (en memoria)
 *   5. Generar el inline con juice (en memoria)
 *   6. Auto-verificar fuente + inline
 *   7. Solo si todo lo anterior pasó: escribir final.html, final-inline.html y
 *      build-manifest.json en --out. Nada se escribe en disco antes de este punto — así que
 *      nunca puede quedar un archivo parcial/inválido en 09-exports/ (mecanismo más fuerte que
 *      "escribir y borrar si falla": simplemente no se escribe hasta que todo es válido).
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const Ajv = require('ajv');
let juice = require('juice');
juice = juice.default || juice;

const { loadBrandTokens } = require('./lib/tokens');
const { loadPattern, validateModulesAgainstPattern } = require('./lib/pattern');
const { assembleNewsletter } = require('./lib/assemble');
const { verifyBuild } = require('./lib/verify');

const SYSTEM_ROOT = path.resolve(__dirname, '..');
const COMPONENTS_DIR = path.join(__dirname, 'components');
const SCHEMA_PATH = path.join(__dirname, 'schema', 'campaign-data.schema.json');

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--data') args.data = argv[++i];
    else if (argv[i] === '--out') args.out = argv[++i];
  }
  return args;
}

function fail(message) {
  process.stderr.write(`\n✗ BUILD FALLIDO\n${message}\n\n`);
  process.exit(1);
}

function sha256(str) {
  return crypto.createHash('sha256').update(str, 'utf8').digest('hex');
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (!args.data || !args.out) {
    fail('Uso: node engine/build-newsletter.js --data <campaign-data.json> --out <dir/>');
    return;
  }

  const dataPath = path.resolve(args.data);
  const outDir = path.resolve(args.out);

  // --- Paso 0: leer campaign-data.json ---
  if (!fs.existsSync(dataPath)) {
    fail(`No existe el archivo de datos: ${dataPath}`);
    return;
  }
  let campaignData;
  try {
    campaignData = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
  } catch (err) {
    fail(`campaign-data.json no es JSON válido: ${err.message}`);
    return;
  }

  // --- Paso 1: validar contra el schema (ajv) ---
  let schema;
  try {
    schema = JSON.parse(fs.readFileSync(SCHEMA_PATH, 'utf8'));
  } catch (err) {
    fail(`No se pudo leer/parsear el schema en ${SCHEMA_PATH}: ${err.message}`);
    return;
  }
  const ajv = new Ajv({ allErrors: true, strict: false });
  const validate = ajv.compile(schema);
  const valid = validate(campaignData);
  if (!valid) {
    const msgs = validate.errors.map((e) => `  - ${e.instancePath || '(raíz)'} ${e.message}`).join('\n');
    fail(`campaign-data.json no valida contra el schema:\n${msgs}`);
    return;
  }

  // --- Paso 2: cargar brand tokens ---
  let tokensResult;
  try {
    tokensResult = loadBrandTokens(campaignData.brand, SYSTEM_ROOT);
  } catch (err) {
    fail(err.message);
    return;
  }
  const { tokens, resolvedPath: brandPath } = tokensResult;

  // --- Paso 3: resolver y validar el patrón ---
  let patternResult;
  try {
    patternResult = loadPattern(campaignData.pattern, SYSTEM_ROOT);
  } catch (err) {
    fail(err.message);
    return;
  }
  const patternCheck = validateModulesAgainstPattern(patternResult.sequence, campaignData.modules);
  if (!patternCheck.ok) {
    fail(`campaign-data.json viola el patrón "${campaignData.pattern}":\n` + patternCheck.errors.map((e) => `  - ${e}`).join('\n'));
    return;
  }

  // --- Paso 4: ensamblar (en memoria) ---
  let source;
  try {
    source = assembleNewsletter(campaignData, tokens, COMPONENTS_DIR);
  } catch (err) {
    fail(`Error ensamblando el HTML: ${err.message}`);
    return;
  }

  // --- Paso 5: inline con juice (en memoria) ---
  let inline;
  try {
    inline = juice(source, { preserveMediaQueries: true });
  } catch (err) {
    fail(`Error generando el inline con juice: ${err.message}`);
    return;
  }

  // --- Paso 6: auto-verificación ---
  const verification = verifyBuild(source, inline);
  if (!verification.ok) {
    fail(
      `Auto-verificación falló — NO se ha escrito nada en ${outDir}:\n` +
      verification.errors.map((e) => `  - ${e}`).join('\n')
    );
    return;
  }
  for (const w of verification.warnings) {
    process.stderr.write(`⚠ ${w}\n`);
  }

  // --- Paso 7: escribir outputs (solo si todo pasó) ---
  fs.mkdirSync(outDir, { recursive: true });
  const sourcePath = path.join(outDir, 'final.html');
  const inlinePath = path.join(outDir, 'final-inline.html');
  const manifestPath = path.join(outDir, 'build-manifest.json');

  fs.writeFileSync(sourcePath, source, 'utf8');
  fs.writeFileSync(inlinePath, inline, 'utf8');

  const manifest = {
    generatedAt: new Date().toISOString(),
    campaignDataPath: dataPath,
    campaignDataSha256: sha256(fs.readFileSync(dataPath, 'utf8')),
    sourceSha256: sha256(source),
    inlineSha256: sha256(inline),
    brandPack: brandPath,
    brandVersion: tokens.version,
    pattern: campaignData.pattern,
    modules: campaignData.modules.map((m) => m.component),
    counts: verification.counts,
    inlineBytes: verification.counts.inlineBytes,
    warnings: verification.warnings
  };
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), 'utf8');

  process.stdout.write(
    `\n✓ BUILD OK\n` +
    `  fuente:   ${sourcePath}\n` +
    `  inline:   ${inlinePath} (${(verification.counts.inlineBytes / 1024).toFixed(1)} KB)\n` +
    `  manifest: ${manifestPath}\n\n`
  );
}

main();
