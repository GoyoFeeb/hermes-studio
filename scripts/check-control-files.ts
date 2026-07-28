#!/usr/bin/env npx tsx
/**
 * check-control-files.ts — Verifica que los 4 archivos de control de una campaña
 * (campaign-status.md, task-log.md, handoff.md, next-steps.md) cuentan la misma historia.
 *
 * F3 del plan de transformación (docs/auditoria-total-y-plan-transformacion-2026-07-17.md,
 * §4). Cierra el Defecto H5 (docs/re-auditoria-sistema-hermes-2026-07-17.md): nunca existió un
 * script que verificara la sincronización de estos 4 archivos — "el Defecto N1 es exactamente
 * el tipo de fallo que ese script habría atrapado" (un estado declarado que no correspondía a
 * lo que de verdad había pasado).
 *
 * Formato esperado (observado en newsletters/_campaign-template/ y en campañas reales, no
 * inventado — ver prompts-fase3-verificacion/20-check-control-files.md para la justificación):
 *   - campaign-status.md: tabla markdown con una fila "| Estado actual | {valor} |", con
 *     {valor} de un vocabulario fijo (ver ESTADOS_VALIDOS abajo). Opcionalmente una sección
 *     "## Completed Phases" con checklist "- [x]"/"- [ ]" — se audita SOLO si el archivo usa
 *     exactamente ese encabezado; campañas maduras reales divergen del checklist de 9 fases del
 *     template hacia un log narrativo más largo, y eso no se penaliza (no es lo mismo que un
 *     desajuste real de estado).
 *   - task-log.md: tabla markdown con al menos 1 fila de datos si el estado no es "created".
 *   - handoff.md: no vacío si el estado no es "created".
 *   - next-steps.md: siempre debe existir (puede estar vacío o con pendientes reales, ambos
 *     son válidos — no es un fallo tener next-steps abiertos, es un fallo no tener el archivo).
 *
 * Uso:
 *   npx tsx scripts/check-control-files.ts --campaign newsletters/{year}/{client}/{campaign}
 */

import * as fs from 'fs';
import * as path from 'path';
import { parseArgs, resolveCampaignPath } from './lib/cli';

// ── Configuración ──────────────────────────────────────────────────────────

const ROOT = path.resolve(import.meta.dirname, '..');

// Vocabulario de "Estado actual" — de pipeline-skill/references/agent-roles.md (columna
// "State" de cada agente 01-09) + los 2 estados de control observados en campañas reales
// (created, completed) + blocked (agents/00-orchestrator.md, "blocked-reason.md").
const ESTADOS_VALIDOS = [
  'created', 'briefing', 'analysis', 'strategy', 'design', 'copy', 'data',
  'development', 'qa', 'corrections', 'export', 'completed', 'blocked',
];

interface Result { type: 'error' | 'warning'; message: string; }

// ── Argumentos ─────────────────────────────────────────────────────────────



// ── Lectura segura ───────────────────────────────────────────────────────────

function readIfExists(p: string): string | null {
  if (!fs.existsSync(p)) return null;
  return fs.readFileSync(p, 'utf8');
}

// ── Verificación ─────────────────────────────────────────────────────────────

function checkCampaign(campaignDir: string): { errors: string[]; warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];

  const paths = {
    status: path.join(campaignDir, 'campaign-status.md'),
    log: path.join(campaignDir, 'task-log.md'),
    handoff: path.join(campaignDir, 'handoff.md'),
    next: path.join(campaignDir, 'next-steps.md'),
  };

  // 1) Existencia de los 4 archivos
  const status = readIfExists(paths.status);
  const log = readIfExists(paths.log);
  const handoff = readIfExists(paths.handoff);
  const next = readIfExists(paths.next);

  if (status === null) errors.push('Falta campaign-status.md');
  if (log === null) errors.push('Falta task-log.md');
  if (handoff === null) errors.push('Falta handoff.md');
  if (next === null) errors.push('Falta next-steps.md');
  if (errors.length > 0) return { errors, warnings };

  // 2) campaign-status.md: extraer "Estado actual"
  const stateMatch = status!.match(/\|\s*Estado actual\s*\|\s*([a-zA-Z_-]+)\s*\|/);
  if (!stateMatch) {
    errors.push('campaign-status.md no tiene una fila "| Estado actual | {valor} |" reconocible');
    return { errors, warnings };
  }
  const state = stateMatch[1].trim().toLowerCase();
  if (!ESTADOS_VALIDOS.includes(state)) {
    errors.push(`campaign-status.md declara un estado no reconocido: "${state}" (válidos: ${ESTADOS_VALIDOS.join(', ')})`);
  }

  // 3) task-log.md: debe tener al menos 1 fila de datos si el estado no es "created"
  if (state !== 'created') {
    const dataRows = (log!.match(/^\|(?!.*---).+\|.+\|/gm) || []).filter((r) => !/\|\s*Fecha\s*\|/.test(r));
    if (dataRows.length === 0) {
      errors.push(`task-log.md no tiene entradas de datos, pero campaign-status.md declara el estado "${state}" (no "created")`);
    }
  }

  // 4) handoff.md: no vacío (más allá de espacio en blanco) si el estado no es "created"
  if (state !== 'created' && handoff!.trim().length < 20) {
    errors.push(`handoff.md está vacío o casi vacío, pero campaign-status.md declara el estado "${state}"`);
  }

  // 5) Checklist "## Completed Phases" — solo se audita si el archivo usa ese formato exacto
  //    (el template lo usa; campañas maduras reales divergen hacia un log narrativo más largo,
  //    y esa divergencia NO es en sí misma un fallo — no se penaliza).
  const phasesSection = status!.match(/## Completed Phases\n([\s\S]*?)(\n##|\n?$)/);
  if (phasesSection) {
    const checked = (phasesSection[1].match(/-\s*\[x\]/gi) || []).length;
    const unchecked = (phasesSection[1].match(/-\s*\[ \]/g) || []).length;
    if (state === 'completed' && unchecked > 0) {
      errors.push(
        `campaign-status.md declara el estado "completed" pero la sección "## Completed Phases" ` +
        `tiene ${unchecked} fase(s) sin marcar — desajuste entre el estado declarado y el checklist`
      );
    }
    if (state === 'created' && checked > 0) {
      warnings.push(
        `campaign-status.md declara el estado "created" pero "## Completed Phases" ya tiene ` +
        `${checked} fase(s) marcadas — revisar si el estado está desactualizado`
      );
    }
  }

  // 6) Si el estado es "completed", verificación externa: debe existir un export real en disco.
  //    Es la comprobación más fuerte de todas — no depende de ningún formato de prosa, solo de
  //    que el HTML que "completed" promete realmente exista.
  if (state === 'completed') {
    const finalHtml = path.join(campaignDir, '09-exports', 'final.html');
    if (!fs.existsSync(finalHtml)) {
      errors.push(
        `campaign-status.md declara el estado "completed" pero no existe ` +
        `09-exports/final.html — el estado no corresponde con lo que hay en disco`
      );
    }
  }

  // 7) Si el estado es "blocked", debe existir blocked-reason.md (agents/00-orchestrator.md).
  if (state === 'blocked') {
    const blockedReason = path.join(campaignDir, 'blocked-reason.md');
    if (!fs.existsSync(blockedReason)) {
      errors.push('campaign-status.md declara el estado "blocked" pero no existe blocked-reason.md');
    }
  }

  return { errors, warnings };
}

// ── Main ───────────────────────────────────────────────────────────────────

function main(): void {
  const args = parseArgs();

  console.log('\n═══════════════════════════════════════════════════');
  console.log('   Hermes Newsletter System — check-control-files');
  console.log('   Sincronización de los 4 archivos de control (H5)');
  console.log('═══════════════════════════════════════════════════\n');

  if (!args.campaign) {
    console.error('  ❌ Error: falta --campaign\n');
    console.error('  Uso: npx tsx scripts/check-control-files.ts --campaign newsletters/{year}/{client}/{campaign}\n');
    process.exit(1);
  }

  const campaignDir = resolveCampaignPath(ROOT, args.campaign);
  if (!fs.existsSync(campaignDir)) {
    console.error(`\n   ❌ La carpeta de campaña no existe: ${campaignDir}\n`);
    process.exit(1);
  }

  console.log(`   Campaña: ${campaignDir}\n`);

  const { errors, warnings } = checkCampaign(campaignDir);

  if (errors.length === 0 && warnings.length === 0) {
    console.log('   ✅ Los 4 archivos de control están sincronizados.\n');
    process.exit(0);
  }

  if (errors.length > 0) {
    console.log(`   ❌ Errores (${errors.length}):\n`);
    for (const e of errors) console.log(`     ❌ ${e}`);
    console.log('');
  }
  if (warnings.length > 0) {
    console.log(`   ⚠️  Avisos (${warnings.length}):\n`);
    for (const w of warnings) console.log(`     ⚠️  ${w}`);
    console.log('');
  }

  process.exit(errors.length > 0 ? 1 : 0);
}

main();
