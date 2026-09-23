#!/usr/bin/env npx tsx
/**
 * ci-example-campaign-gate.ts — ejecuta production-gate-motor.ts contra
 * engine/schema/campaign-data.example.json (modo exploración) y falla si alguno de los gates de
 * CORRECCIÓN DE CÓDIGO (no de completitud de contenido de una marca concreta) deja de pasar.
 *
 * Por qué existe (auditoría 2026-09-23, hallazgo BUG-H12): hasta ahora CI (.github/workflows/
 * ci.yml) solo corría `npm test` + `check-engine-integrity` — nunca invocaba
 * production-gate-motor.ts de forma visible y con una aserción explícita de qué debe seguir
 * pasando. `npm test` SÍ ejercita production-gate-motor (ver scripts/gates.smoke.test.js,
 * "production-gate-motor: ..."), pero solo comprueba que ciertas cabeceras de gate aparecen en
 * la salida — no que los gates que deberían pasar limpio sigan pasando limpio. Este script cierra
 * ese hueco con una aserción positiva explícita.
 *
 * Por qué modo exploración y por qué NO exige el pass completo:
 * - `campaign-data.example.json` usa brands/paraycompara, cuyo brand pack real todavía no tiene
 *   `colors.source`/`typography.source` (Gate 8) ni traducción de estructura de marca completa
 *   (Gate 12) — deuda de CONTENIDO real y conocida (ver memory.md, actualización 2026-08-20),
 *   no un bug de código. Exigir que CI la resuelva bloquearía el pipeline de CI por un motivo que
 *   no tiene nada que ver con el código que se está integrando.
 * - El gate de assets hace peticiones HTTP reales a un CDN externo — no debe decidir si CI pasa
 *   o falla (dependencia de red ajena a este repo). El modo exploración lo difiere junto con
 *   parity/control-files/production-readiness/informe Nivel 5 (papeleo de traspaso entre fases,
 *   sin efecto en el HTML generado — ver agents/00-orchestrator.md §"Modo exploración").
 *
 * Gates que SÍ debe seguir pasando (y que si dejan de pasar, ES un bug de código): engine-
 * integrity, schema, build, claims, column-balance, contrast, hero-decision. Si algún día se
 * repuebla brands/paraycompara con procedencia completa, quitar brand-pack-completeness y
 * structural-differentiation de ALLOWED_TO_FAIL y este script empezará a exigirlos también.
 */
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { execFileSync } from 'child_process';

const ROOT = path.resolve(import.meta.dirname, '..');
const TSX_BIN = path.join(ROOT, 'node_modules', '.bin', 'tsx');

// Deuda de CONTENIDO conocida y documentada (memory.md 2026-08-20) — no gates de código.
const ALLOWED_TO_FAIL = new Set(['brand-pack-completeness', 'structural-differentiation']);

function main(): void {
  const example = JSON.parse(
    fs.readFileSync(path.join(ROOT, 'engine', 'schema', 'campaign-data.example.json'), 'utf8')
  );
  example.metadata = { ...example.metadata, explorationMode: true };

  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ci-example-gate-'));
  const dataPath = path.join(dir, '06-data', 'campaign-data.json');
  fs.mkdirSync(path.dirname(dataPath), { recursive: true });
  fs.writeFileSync(dataPath, JSON.stringify(example, null, 2));

  console.log('\n═══════════════════════════════════════════════════');
  console.log('   CI — gate de la campaña de ejemplo (modo exploración)');
  console.log('═══════════════════════════════════════════════════\n');

  let output = '';
  try {
    output = execFileSync(
      TSX_BIN,
      [path.join(ROOT, 'scripts', 'production-gate-motor.ts'), '--campaign', dir],
      { cwd: ROOT, encoding: 'utf-8', stdio: 'pipe' }
    );
  } catch (err: any) {
    output = (err.stdout || '') + (err.stderr || '');
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }

  console.log(output);

  const passedCleanly = /✅ Production gate \(motor\) passed\./.test(output);
  const failedMatch = output.match(/(\d+) gate\(s\) failed: (.+)/);

  if (!passedCleanly && !failedMatch) {
    // No se encontró NI el mensaje de éxito NI el resumen "N gate(s) failed: ..." — el run
    // abortó antes de llegar a ninguno de los dos (ej. Gate 0/engine-integrity corta en seco
    // antes del resumen final, como pasó durante el desarrollo de este mismo script). Fail-safe:
    // si no puedo demostrar que solo fallaron los gates tolerados, no asumo que está bien.
    console.error('\n   ❌ ci-example-campaign-gate: FAIL — el run no llegó a un resumen reconocible ' +
      '(ni "passed" ni "N gate(s) failed: ..."). Tratado como fallo por seguridad — revisa la salida completa arriba.\n');
    process.exit(1);
  }

  const failedGates = failedMatch ? failedMatch[2].split(',').map((s) => s.trim()) : [];
  const unexpectedFailures = failedGates.filter((g) => !ALLOWED_TO_FAIL.has(g));

  if (unexpectedFailures.length > 0) {
    console.error(`\n   ❌ ci-example-campaign-gate: FAIL — gate(s) de código rotos: ${unexpectedFailures.join(', ')}\n`);
    console.error('      Estos gates deberían pasar limpio contra campaign-data.example.json en modo');
    console.error('      exploración. Si el fallo es legítimo (deuda de contenido nueva y documentada),');
    console.error('      añadir el nombre del gate a ALLOWED_TO_FAIL en este script con el motivo.\n');
    process.exit(1);
  }

  console.log(`\n   ✅ ci-example-campaign-gate: OK — solo fallan los gates de contenido ya conocidos (${failedGates.join(', ') || 'ninguno'}).\n`);
}

main();
