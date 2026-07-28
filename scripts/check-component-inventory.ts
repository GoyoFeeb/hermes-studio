#!/usr/bin/env npx tsx
/**
 * check-component-inventory.ts — Detecta deriva entre engine/components/*.html,
 * MODULE_ADAPTERS (engine/lib/assemble.js), campaign-data.schema.json y
 * engine/components/INVENTORY.md.
 *
 * Motivo (auditoría técnica 2026-07-28): INVENTORY.md se autodenomina "catálogo oficial,
 * verificado" pero se desincronizó 3 veces (editorial-foto-texto, editorial-foto-texto-inverso,
 * metric-strip-premium existían en assemble.js/schema/patrones desde su creación pero no se
 * documentaron aquí hasta esta auditoría). components.lock.json ya se verifica automáticamente
 * (check-engine-integrity.ts) — este script hace lo mismo para la documentación.
 *
 * AVISO, no bloqueante: un componente sin entrada en INVENTORY.md no rompe el motor (el build
 * solo depende de MODULE_ADAPTERS + schema), así que este check nunca aborta el gate maestro —
 * solo avisa, para que la deriva se note en vez de acumularse en silencio otras 3 veces.
 *
 * Uso:
 *   npx tsx scripts/check-component-inventory.ts
 */

import * as fs from 'fs';
import * as path from 'path';

const ROOT = path.resolve(import.meta.dirname, '..');
const COMPONENTS_DIR = path.join(ROOT, 'engine', 'components');
const ASSEMBLE_PATH = path.join(ROOT, 'engine', 'lib', 'assemble.js');
const INVENTORY_PATH = path.join(ROOT, 'engine', 'components', 'INVENTORY.md');
const SCHEMA_PATH = path.join(ROOT, 'engine', 'schema', 'campaign-data.schema.json');

// Partials incluidos vía {{include:...}} — nunca aparecen como módulo en campaign-data.json ni
// en un PATTERN_SEQUENCE, así que no se espera que tengan adaptador propio en MODULE_ADAPTERS
// ni un oneOf de schema. Sí deberían documentarse en INVENTORY.md (y lo están).
const PARTIALS = new Set([
  '_shell.html',
  'cta-bulletproof.html',
  'cta-secondary-bulletproof.html',
  'cta-text-link-bulletproof.html',
  'cta-block-bulletproof.html',
]);

// Componentes resueltos por comodín regex (ver `hero-marca-*` en assemble.js/pattern.js/schema)
// en vez de por nombre literal — no tienen ('name': ...) exacto, es esperado.
const WILDCARD_RE = /^hero-marca-[a-z0-9-]+$/;

function componentNames(): string[] {
  return fs
    .readdirSync(COMPONENTS_DIR)
    .filter((f) => f.endsWith('.html'))
    .map((f) => f.replace(/\.html$/, ''))
    .filter((name) => !PARTIALS.has(`${name}.html`))
    .sort();
}

function main(): void {
  const components = componentNames();
  const assembleSrc = fs.readFileSync(ASSEMBLE_PATH, 'utf8');
  const inventorySrc = fs.readFileSync(INVENTORY_PATH, 'utf8');
  const schemaSrc = fs.readFileSync(SCHEMA_PATH, 'utf8');

  const warnings: string[] = [];

  for (const name of components) {
    const resolvedByWildcard = WILDCARD_RE.test(name);

    if (!resolvedByWildcard) {
      // ¿Tiene entrada en MODULE_ADAPTERS? (asignación directa 'name': (data) => ... o alias
      // MODULE_ADAPTERS['name'] = MODULE_ADAPTERS['otro']).
      const hasAdapter =
        assembleSrc.includes(`'${name}':`) || assembleSrc.includes(`MODULE_ADAPTERS['${name}']`);
      if (!hasAdapter) {
        warnings.push(`${name}: sin entrada en MODULE_ADAPTERS (engine/lib/assemble.js)`);
      }

      // ¿Tiene rama en el schema? (busca el nombre del componente como valor de "component").
      const hasSchema = schemaSrc.includes(`"const": "${name}"`) || schemaSrc.includes(`"${name}"`);
      if (!hasSchema) {
        warnings.push(`${name}: sin referencia en engine/schema/campaign-data.schema.json`);
      }
    }

    // ¿Está documentado en INVENTORY.md? (aplica también a los resueltos por comodín).
    const hasInventory = inventorySrc.includes(`${name}.html`);
    if (!hasInventory) {
      warnings.push(`${name}: sin entrada en engine/components/INVENTORY.md`);
    }
  }

  console.log('\n═══════════════════════════════════════════════════');
  console.log('   check-component-inventory');
  console.log('═══════════════════════════════════════════════════\n');
  console.log(`   ${components.length} componentes revisados (excluidos ${PARTIALS.size} partials).\n`);

  if (warnings.length === 0) {
    console.log('   ✅ Sin deriva: cada componente tiene adaptador, schema e INVENTORY.md.\n');
    process.exit(0);
  }

  console.log(`   ⚠️  ${warnings.length} aviso(s) de deriva documental (no bloquea el build):\n`);
  for (const w of warnings) console.log(`     ⚠️  ${w}`);
  console.log('');
  // Aviso, no error — exit 0 a propósito. Ver cabecera del archivo.
  process.exit(0);
}

main();
