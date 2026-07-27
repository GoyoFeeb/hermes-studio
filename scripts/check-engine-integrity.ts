#!/usr/bin/env npx tsx
/**
 * check-engine-integrity.ts — Verifica que el motor no ha sido alterado sin registro.
 *
 * Creado tras el incidente 2026-07-21 (ver engine/CHANGELOG.md, entrada "INCIDENTE"): una
 * sesión externa re-derivó la biblioteca de componentes desde cero y sobrescribió el motor
 * sin que nada lo detectara hasta que el build de campañas existentes falló. Este script
 * compara el sha256 de cada archivo vigilado contra engine/components.lock.json.
 *
 * Uso:
 *   npx tsx scripts/check-engine-integrity.ts             # verificar (exit 1 si difiere)
 *   npx tsx scripts/check-engine-integrity.ts --update    # regenerar el lock (cambio LEGÍTIMO
 *                                                           documentado en engine/CHANGELOG.md)
 */

import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

const ROOT = path.resolve(import.meta.dirname, '..');
const LOCK_PATH = path.join(ROOT, 'engine', 'components.lock.json');

// Qué se vigila: componentes + las 4 libs + el entry point + el schema. Todo lo que define
// el comportamiento del motor.
function watchedFiles(): string[] {
  const files: string[] = [];
  const compDir = path.join(ROOT, 'engine', 'components');
  for (const f of fs.readdirSync(compDir).sort()) {
    if (f.endsWith('.html')) files.push(path.join('engine', 'components', f));
  }
  for (const f of ['tokens.js', 'pattern.js', 'assemble.js', 'verify.js']) {
    files.push(path.join('engine', 'lib', f));
  }
  files.push(path.join('engine', 'build-newsletter.js'));
  files.push(path.join('engine', 'schema', 'campaign-data.schema.json'));
  return files;
}

function sha256File(rel: string): string {
  return crypto.createHash('sha256').update(fs.readFileSync(path.join(ROOT, rel))).digest('hex');
}

function main(): void {
  const update = process.argv.includes('--update');
  const files = watchedFiles();

  if (update) {
    const lock: Record<string, string> = {};
    for (const f of files) lock[f.replace(/\\/g, '/')] = sha256File(f);
    fs.writeFileSync(LOCK_PATH, JSON.stringify({
      _comment: 'Lockfile de integridad del motor. Regenerar SOLO tras un cambio legítimo documentado en engine/CHANGELOG.md, con: npm run check-engine -- --update',
      generatedAt: new Date().toISOString(),
      files: lock
    }, null, 2) + '\n');
    console.log(`\n✅ Lock regenerado: ${files.length} archivos en engine/components.lock.json\n`);
    return;
  }

  if (!fs.existsSync(LOCK_PATH)) {
    console.error('\n❌ No existe engine/components.lock.json — generar con: npm run check-engine -- --update\n');
    process.exit(1);
  }
  const lock = JSON.parse(fs.readFileSync(LOCK_PATH, 'utf8'));
  const errors: string[] = [];

  for (const [rel, expected] of Object.entries<string>(lock.files)) {
    if (!fs.existsSync(path.join(ROOT, rel))) {
      errors.push(`FALTA: ${rel}`);
    } else if (sha256File(rel) !== expected) {
      errors.push(`ALTERADO: ${rel}`);
    }
  }
  for (const f of files) {
    const key = f.replace(/\\/g, '/');
    if (!(key in lock.files)) errors.push(`NUEVO (no registrado en el lock): ${key}`);
  }

  if (errors.length === 0) {
    console.log(`\n✅ Motor íntegro: ${Object.keys(lock.files).length} archivos coinciden con el lock (${lock.generatedAt}).\n`);
    process.exit(0);
  }

  console.error('\n❌ EL MOTOR DIFIERE DEL LOCK — posible alteración no registrada:\n');
  for (const e of errors) console.error(`   ❌ ${e}`);
  console.error(
    '\n   Si el cambio es legítimo (componente nuevo/modificación documentada en\n' +
    '   engine/CHANGELOG.md): npm run check-engine -- --update\n' +
    '   Si NO lo es: restaurar — ver el procedimiento del incidente 2026-07-21 en el CHANGELOG.\n'
  );
  process.exit(1);
}

main();
