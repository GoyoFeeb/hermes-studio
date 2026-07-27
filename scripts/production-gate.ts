#!/usr/bin/env npx tsx
/**
 * production-gate.ts — Ejecuta los 3 gates de producción necesarios para validar
 * si una campaña es candidata a envío real.
 *
 * Uso:
 *   npx tsx scripts/production-gate.ts --campaign newsletters/{year}/{client}/{campaign}
 */

import { execSync, ExecSyncOptions } from 'child_process';
import * as path from 'path';

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

// ── Ejecutar un gate ──────────────────────────────────────────────────────

function runGate(name: string, script: string, args: string[]): GateResult {
  const tsx = path.resolve(ROOT, 'node_modules', '.bin', 'tsx');
  const scriptPath = path.resolve(ROOT, 'scripts', script);
  const cmd = `"${tsx}" "${scriptPath}" ${args.join(' ')}`;

  console.log(`\n${'='.repeat(60)}`);
  console.log(`   Gate ${gates.length + 1}: ${name}`);
  console.log(`   ${cmd}`);
  console.log(`${'='.repeat(60)}\n`);

  try {
    const opts: ExecSyncOptions = { cwd: ROOT, encoding: 'utf-8', timeout: 60000, maxBuffer: 50 * 1024 };
    const output = execSync(cmd, opts);
    const result: GateResult = { name, command: cmd, passed: true, output };
    gates.push(result);
    console.log(output);
    return result;
  } catch (err: any) {
    const output = err.stdout || '';
    const stderr = err.stderr || '';
    const result: GateResult = { name, command: cmd, passed: false, output: output + stderr };
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

  const campaignDir = resolveCampaignPath(args.campaign);
  const campaignArg = `--campaign "${campaignDir}"`;

  console.log('\n═══════════════════════════════════════════════════');
  console.log('   Hermes Newsletter System — Production Gate');
  console.log('═══════════════════════════════════════════════════');
  console.log(`\n   Campaña: ${campaignDir}\n`);

  // ── Gate 1: validate-newsletter --production ──────────────────────────
  const g1 = runGate('validate-newsletter --production', 'validate-newsletter.ts', [campaignArg, '--production']);

  // ── Gate 2: check-links --strict ──────────────────────────────────────
  const g2 = runGate('check-links --strict', 'check-links.ts', [campaignArg, '--strict']);

  // ── Gate 3: validate-claims --production ──────────────────────────────
  const g3 = runGate('validate-claims --production', 'validate-claims.ts', [campaignArg, '--production']);

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
