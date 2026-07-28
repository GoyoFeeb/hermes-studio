#!/usr/bin/env npx tsx
/**
 * production-gate.ts — Ejecuta los 3 gates de producción necesarios para validar
 * si una campaña es candidata a envío real.
 *
 * Uso:
 *   npx tsx scripts/production-gate.ts --campaign newsletters/{year}/{client}/{campaign}
 */

import { execFileSync } from 'child_process';
import * as path from 'path';
import { parseArgs, resolveCampaignPath } from './lib/cli';

// ── Configuración ──────────────────────────────────────────────────────────

const ROOT = path.resolve(import.meta.dirname, '..');

interface GateResult {
  name: string;
  command: string;
  passed: boolean;
  output: string;
}

const gates: GateResult[] = [];
let allPassed = true;

// ── Argumentos ─────────────────────────────────────────────────────────────



// ── Ejecutar un gate ──────────────────────────────────────────────────────

function runGate(name: string, script: string, args: string[]): GateResult {
  const tsx = path.resolve(ROOT, 'node_modules', '.bin', 'tsx');
  const scriptPath = path.resolve(ROOT, 'scripts', script);
  const cmdLabel = `"${tsx}" "${scriptPath}" ${args.join(' ')}`;

  console.log(`\n${'='.repeat(60)}`);
  console.log(`   Gate ${gates.length + 1}: ${name}`);
  console.log(`   ${cmdLabel}`);
  console.log(`${'='.repeat(60)}\n`);

  // Fix (auditoría enterprise 2026-07-28): execSync sobre un string interpolado pasa por
  // /bin/sh — execFileSync con array de argumentos no, y ya no depende de que cada `args[]`
  // llegue pre-envuelto en comillas (los llamadores de main() ya no necesitan `--campaign "x"`
  // como un único string, ver más abajo).
  try {
    const output = execFileSync(tsx, [scriptPath, ...args], {
      cwd: ROOT,
      encoding: 'utf-8',
      timeout: 60000,
      maxBuffer: 50 * 1024,
    });
    const result: GateResult = { name, command: cmdLabel, passed: true, output };
    gates.push(result);
    console.log(output);
    return result;
  } catch (err: any) {
    const output = err.stdout || '';
    const stderr = err.stderr || '';
    const result: GateResult = { name, command: cmdLabel, passed: false, output: output + stderr };
    gates.push(result);
    if (output) console.log(output);
    if (stderr) console.error(stderr);
    return result;
  }
}

// ── Main ───────────────────────────────────────────────────────────────────

function main(): void {
  const args = parseArgs();

  if (!args.campaign) {
    console.error('\n  ❌ Error: falta --campaign\n');
    console.error('  Uso: npx tsx scripts/production-gate.ts --campaign newsletters/{year}/{client}/{campaign}\n');
    process.exit(1);
  }

  const campaignDir = resolveCampaignPath(ROOT, args.campaign);
  const campaignArgs = ['--campaign', campaignDir];

  console.log('\n═══════════════════════════════════════════════════');
  console.log('   Hermes Newsletter System — Production Gate');
  console.log('═══════════════════════════════════════════════════');
  console.log(`\n   Campaña: ${campaignDir}\n`);

  // ── Gate 1: validate-newsletter --production ──────────────────────────
  runGate('validate-newsletter --production', 'validate-newsletter.ts', [...campaignArgs, '--production']);

  // ── Gate 2: check-links --strict ──────────────────────────────────────
  runGate('check-links --strict', 'check-links.ts', [...campaignArgs, '--strict']);

  // ── Gate 3: validate-claims --production ──────────────────────────────
  runGate('validate-claims --production', 'validate-claims.ts', [...campaignArgs, '--production']);

  // ── Resultados ─────────────────────────────────────────────────────────
  console.log(`\n${'='.repeat(60)}`);
  console.log('   Resultados del Production Gate');
  console.log(`${'='.repeat(60)}\n`);

  for (const g of gates) {
    const icon = g.passed ? '✅' : '❌';
    console.log(`   ${icon} ${g.name}`);
    if (!g.passed) allPassed = false;
  }

  console.log('');

  if (allPassed) {
    console.log('   ✅ Production gate passed.');
    console.log('      Campaign is candidate for production,');
    console.log('      pending final human/client approval.\n');
    process.exit(0);
  } else {
    const failed = gates.filter(g => !g.passed).map(g => g.name);
    console.log('   ❌ Production gate failed.');
    console.log(`      Campaign is NOT ready for production.\n`);
    console.log(`      ${failed.length} gate(s) failed:`);
    for (const f of failed) {
      console.log(`        ❌ ${f}`);
    }
    console.log('');
    process.exit(1);
  }
}

main();
