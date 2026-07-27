#!/usr/bin/env npx tsx
/**
 * validate-claims.ts — Busca claims prohibidos, técnicos no validados o expresiones
 * comerciales de riesgo en newsletter-data.json.
 *
 * Uso:
 *   npx tsx scripts/validate-claims.ts --campaign newsletters/{year}/{client}/{campaign}
 *   npx tsx scripts/validate-claims.ts --campaign /ruta/absoluta --production
 */

import * as fs from 'fs';
import * as path from 'path';
import { CLAIM_RULES, scanField as scanFieldShared, type MatchResult as SharedMatchResult } from './lib/claim-rules';

// ── Configuración ──────────────────────────────────────────────────────────

const ROOT = path.resolve(import.meta.dirname, '..');
const RESULTS: { type: 'error' | 'warning'; message: string }[] = [];
let productionMode = false;

function error(msg: string): void { RESULTS.push({ type: 'error', message: msg }); }
function warn(msg: string): void { RESULTS.push({ type: 'warning', message: msg }); }

// ── Reglas de claims ──────────────────────────────────────────────────────
//
// Las 29 reglas viven en lib/claim-rules.ts (prompt 21, F3) para poder reutilizarse desde
// production-gate-motor.ts sin duplicar la lista. Este archivo no cambia de comportamiento:
// mismas reglas, mismo escaneo, mismo output — solo cambia de dónde importa CLAIM_RULES.

// ── Argumentos ─────────────────────────────────────────────────────────────

function parseArgs(): Record<string, string> {
  const args = process.argv.slice(2);
  const parsed: Record<string, string> = {};
  for (let i = 0; i < args.length; i++) {
    const key = args[i].replace(/^--/, '');
    const next = args[i + 1];
    if (next && !next.startsWith('--')) {
      parsed[key] = next;
      i++;
    } else {
      parsed[key] = 'true';
    }
  }
  return parsed;
}

function resolveCampaignPath(raw: string): string {
  if (path.isAbsolute(raw)) return raw;
  return path.resolve(ROOT, raw);
}

// ── Escáner de campos de contenido ────────────────────────────────────────
//
// MatchResult y scanField vienen de lib/claim-rules.ts (mismo motivo que arriba).

type MatchResult = SharedMatchResult;
const scanField = scanFieldShared;

function scanContent(data: any): MatchResult[] {
  const matches: MatchResult[] = [];
  const meta = data.metadata;

  // Metadata
  if (meta) {
    scanField('metadata.subjectLine', meta.subjectLine, matches);
    scanField('metadata.preheader', meta.preheader, matches);
  }

  // Modules
  if (Array.isArray(data.modules)) {
    for (let i = 0; i < data.modules.length; i++) {
      const mod = data.modules[i];
      const base = `modules[${i}] (${mod.type || '?'})`;

      const content = mod.content || {};
      scanField(`${base}.content.title`, content.title, matches);
      scanField(`${base}.content.subtitle`, content.subtitle, matches);
      scanField(`${base}.content.body`, content.body, matches);

      // Bullets
      if (Array.isArray(content.bullets)) {
        for (let b = 0; b < content.bullets.length; b++) {
          scanField(`${base}.content.bullets[${b}]`, content.bullets[b], matches);
        }
      }

      // Items (benefits, etc.)
      if (Array.isArray(content.items)) {
        for (let j = 0; j < content.items.length; j++) {
          scanField(`${base}.content.items[${j}].title`, content.items[j].title, matches);
          scanField(`${base}.content.items[${j}].text`, content.items[j].text, matches);
        }
      }

      // CTA text
      if (mod.cta) {
        scanField(`${base}.cta.text`, mod.cta.text, matches);
      }

      // Footer link labels
      if (Array.isArray(mod.links)) {
        for (let k = 0; k < mod.links.length; k++) {
          scanField(`${base}.links[${k}].text`, mod.links[k].text, matches);
        }
      }
    }
  }

  return matches;
}

// ── Main ───────────────────────────────────────────────────────────────────

function main(): void {
  const args = parseArgs();
  productionMode = args.production === 'true';

  if (!args.campaign) {
    console.error('\n  ❌ Error: falta --campaign\n');
    console.error('  Uso: npx tsx scripts/validate-claims.ts --campaign newsletters/{year}/{client}/{campaign} [--production]\n');
    process.exit(1);
  }

  const campaignDir = resolveCampaignPath(args.campaign);

  const modeLabel = productionMode ? ' (production)' : '';
  console.log('\n═══════════════════════════════════════════════════');
  console.log(`   Hermes Newsletter System — Validar claims${modeLabel}`);
  console.log('═══════════════════════════════════════════════════\n');

  console.log(`   Campaña: ${campaignDir}\n`);

  // 1. Existe la carpeta
  if (!fs.existsSync(campaignDir)) {
    error(`La carpeta de campaña no existe: ${campaignDir}`);
    printResults();
    process.exit(1);
  }

  // 2. Existe el JSON
  const jsonPath = path.join(campaignDir, '06-data', 'newsletter-data.json');
  if (!fs.existsSync(jsonPath)) {
    error('No se encuentra 06-data/newsletter-data.json');
    printResults();
    process.exit(1);
  }

  // 3. Parsear JSON
  let data: any;
  try {
    data = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
  } catch (err) {
    error(`Error al parsear newsletter-data.json: ${(err as Error).message}`);
    printResults();
    process.exit(1);
  }

  // 4. Escanear contenido
  console.log('   Escaneando contenido activo...\n');
  const matches = scanContent(data);

  if (matches.length === 0) {
    console.log('     ✅ No se detectaron claims problemáticos.\n');
    console.log(`   Total reglas aplicadas: ${CLAIM_RULES.length}`);
    console.log(`   Campos escaneados: subjectLine, preheader, content.*, cta.text, link labels\n`);
    printResults();
    return;
  }

  // 5. Clasificar resultados
  const criticalMatches = matches.filter(m => m.rule.severity === 'critical');
  const highMatches = matches.filter(m => m.rule.severity === 'high');
  const mediumMatches = matches.filter(m => m.rule.severity === 'medium');

  console.log(`     🔴 Críticos: ${criticalMatches.length}`);
  console.log(`     🟠 Altos:    ${highMatches.length}`);
  console.log(`     🟡 Medios:   ${mediumMatches.length}\n`);

  // Mostrar cada match (se añade a RESULTS para printResults)
  for (const m of matches) {
    const sev = productionMode ? 'error' : (m.rule.severity === 'medium' ? 'warning' : 'error');
    const prefix = productionMode ? '[PRODUCTION] ' : '';
    const msg = `${prefix}"${m.rule.label}" detectado en ${m.fieldPath}
     Contexto: "${m.contextText}"
     Recomendación: ${m.rule.recommendation}`;

    if (sev === 'error') {
      error(msg);
    } else {
      warn(msg);
    }
  }

  printResults();
}

function printResults(): void {
  const errors = RESULTS.filter(r => r.type === 'error');
  const warnings = RESULTS.filter(r => r.type === 'warning');

  const modeStr = productionMode ? ' (production)' : '';
  console.log('═══════════════════════════════════════════════════');
  console.log(`   Resultados de validación de claims${modeStr}`);
  console.log('═══════════════════════════════════════════════════\n');

  if (errors.length > 0) {
    console.log(`   ❌ Errores (${errors.length}):\n`);
    for (const e of errors) {
      console.log(`     ❌ ${e.message}`);
    }
    console.log('');
    if (productionMode) {
      console.log('   📋 Modo production: claims bloqueantes detectados. Revisar antes de producción.\n');
    }
    process.exit(1);
  } else if (warnings.length > 0) {
    console.log(`   ⚠️  Warnings (${warnings.length}):\n`);
    for (const w of warnings) {
      console.log(`     ⚠️  ${w.message}`);
    }
    console.log('');
    console.log('   ✅ Sin errores críticos ni altos. Exit 0.\n');
    process.exit(0);
  } else {
    console.log('   ✅ Todos los claims revisados. No se detectaron problemas.\n');
    process.exit(0);
  }
}

main();
