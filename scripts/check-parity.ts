#!/usr/bin/env npx tsx
/**
 * check-parity.ts — Auditoría INDEPENDIENTE de paridad fuente/inline para campañas
 * construidas por el motor (engine/build-newsletter.js).
 *
 * F3 del plan de transformación (docs/auditoria-total-y-plan-transformacion-2026-07-17.md,
 * §4). El motor ya garantiza paridad por construcción — engine/lib/verify.js corre dentro del
 * mismo proceso que escribe final.html/final-inline.html/build-manifest.json (ver
 * engine/README.md, "Garantía de no dejar outputs parciales"). Lo que este script añade es la
 * auditoría DESPUÉS del hecho: ¿siguen esos 3 archivos siendo consistentes entre sí HOY, o
 * alguien los tocó (a mano, con otro build, con un merge) después de que se certificaran?
 *
 * Es la respuesta directa al Defecto N1 (docs/re-auditoria-sistema-hermes-2026-07-17.md): un
 * inline certificado que en realidad estaba desincronizado de su fuente, sin que ningún script
 * lo detectara. Este script recalcula todo desde los archivos reales en disco — nunca confía
 * en que build-manifest.json dice la verdad solo porque lo dice.
 *
 * Uso:
 *   npx tsx scripts/check-parity.ts --campaign newsletters/{year}/{client}/{campaign}
 *   npx tsx scripts/check-parity.ts --campaign-set newsletters/{year}/{client}
 */

import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

// ── Configuración ──────────────────────────────────────────────────────────

const ROOT = path.resolve(import.meta.dirname, '..');
const MAX_INLINE_BYTES = 90 * 1024;
const WARN_INLINE_BYTES = 80 * 1024;

interface Result {
  type: 'error' | 'warning';
  message: string;
}

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

// ── Utilidades ─────────────────────────────────────────────────────────────

function sha256(content: string): string {
  return crypto.createHash('sha256').update(content, 'utf8').digest('hex');
}

function countOccurrences(str: string, re: RegExp): number {
  const m = str.match(re);
  return m ? m.length : 0;
}

function tagBalance(str: string): { open: number; close: number } {
  return {
    open: countOccurrences(str, /<table[ >]/g),
    close: countOccurrences(str, /<\/table>/g),
  };
}

// ── Verificación de una campaña ─────────────────────────────────────────────

interface CampaignCheckResult {
  campaign: string;
  errors: string[];
  warnings: string[];
  skipped?: string; // motivo si no aplica (no es campaña del motor)
}

function checkCampaign(campaignDir: string): CampaignCheckResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const label = path.basename(campaignDir);

  const exportsDir = path.join(campaignDir, '09-exports');
  const manifestPath = path.join(exportsDir, 'build-manifest.json');
  const sourcePath = path.join(exportsDir, 'final.html');
  const inlinePath = path.join(exportsDir, 'final-inline.html');
  const dataPath = path.join(campaignDir, '06-data', 'campaign-data.json');

  // Si no hay build-manifest.json, esta campaña no pasó por el motor — no es un error de
  // check-parity, es una campaña fuera de su alcance (pipeline React Email, o sin exportar
  // todavía). Se reporta como "skipped", no como fallo.
  if (!fs.existsSync(manifestPath)) {
    return { campaign: label, errors, warnings, skipped: 'no existe build-manifest.json (no es una campaña construida por engine/build-newsletter.js)' };
  }

  let manifest: any;
  try {
    manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  } catch (err) {
    errors.push(`build-manifest.json no es JSON válido: ${(err as Error).message}`);
    return { campaign: label, errors, warnings };
  }

  if (!fs.existsSync(sourcePath)) {
    errors.push('build-manifest.json existe pero falta 09-exports/final.html');
  }
  if (!fs.existsSync(inlinePath)) {
    errors.push('build-manifest.json existe pero falta 09-exports/final-inline.html');
  }
  if (errors.length > 0) return { campaign: label, errors, warnings };

  const source = fs.readFileSync(sourcePath, 'utf8');
  const inline = fs.readFileSync(inlinePath, 'utf8');

  // 1) Hashes de fuente/inline recalculados vs. los que el manifest dice haber escrito.
  //    Si no coinciden, alguien tocó el archivo DESPUÉS del build — exactamente el escenario N1.
  const realSourceSha = sha256(source);
  const realInlineSha = sha256(inline);
  if (manifest.sourceSha256 && realSourceSha !== manifest.sourceSha256) {
    errors.push(
      `final.html fue modificado después del build — hash real ${realSourceSha.slice(0, 12)}... ` +
      `no coincide con el certificado en build-manifest.json (${String(manifest.sourceSha256).slice(0, 12)}...)`
    );
  }
  if (manifest.inlineSha256 && realInlineSha !== manifest.inlineSha256) {
    errors.push(
      `final-inline.html fue modificado después del build — hash real ${realInlineSha.slice(0, 12)}... ` +
      `no coincide con el certificado en build-manifest.json (${String(manifest.inlineSha256).slice(0, 12)}...)`
    );
  }

  // 2) campaign-data.json actual vs. el que certificó el manifest — si cambió, el HTML ya no
  //    representa esos datos (build desactualizado).
  if (fs.existsSync(dataPath)) {
    const realDataSha = sha256(fs.readFileSync(dataPath, 'utf8'));
    if (manifest.campaignDataSha256 && realDataSha !== manifest.campaignDataSha256) {
      errors.push(
        `06-data/campaign-data.json cambió desde el último build certificado — el HTML de ` +
        `09-exports/ está desactualizado respecto a los datos actuales. Reconstruir con ` +
        `engine/build-newsletter.js antes de certificar.`
      );
    }
  } else {
    warnings.push('No se encontró 06-data/campaign-data.json para comparar contra campaignDataSha256 del manifest');
  }

  // 3) Recuento independiente fuente vs. inline (misma regla que engine/lib/verify.js, pero
  //    implementación separada — la garantía de "independiente" es que un bug en una no se
  //    esconde automáticamente detrás del veredicto de la otra).
  const metrics = ['<img', 'utm_source', 'v:roundrect'];
  for (const metric of metrics) {
    const re = new RegExp(metric.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
    const srcCount = countOccurrences(source, re);
    const inlineCount = countOccurrences(inline, re);
    if (srcCount !== inlineCount) {
      errors.push(`Conteo de "${metric}" no coincide entre fuente (${srcCount}) e inline (${inlineCount})`);
    }
  }

  const srcBalance = tagBalance(source);
  const inlineBalance = tagBalance(inline);
  if (srcBalance.open !== srcBalance.close) {
    errors.push(`final.html: <table> desbalanceadas (${srcBalance.open} abiertas, ${srcBalance.close} cerradas)`);
  }
  if (inlineBalance.open !== inlineBalance.close) {
    errors.push(`final-inline.html: <table> desbalanceadas (${inlineBalance.open} abiertas, ${inlineBalance.close} cerradas)`);
  }

  // 4) Peso del inline
  const inlineBytes = Buffer.byteLength(inline, 'utf8');
  if (inlineBytes >= MAX_INLINE_BYTES) {
    errors.push(`final-inline.html pesa ${(inlineBytes / 1024).toFixed(1)} KB — supera el límite de 90 KB`);
  } else if (inlineBytes >= WARN_INLINE_BYTES) {
    warnings.push(`final-inline.html pesa ${(inlineBytes / 1024).toFixed(1)} KB — por encima del aviso de 80 KB`);
  }

  return { campaign: label, errors, warnings };
}

// ── Impresión de resultados ─────────────────────────────────────────────────

function printCampaignResult(r: CampaignCheckResult): boolean {
  if (r.skipped) {
    console.log(`   ⏭️  ${r.campaign}: omitida (${r.skipped})`);
    return true;
  }
  const icon = r.errors.length === 0 ? '✅' : '❌';
  console.log(`   ${icon} ${r.campaign}`);
  for (const e of r.errors) console.log(`        ❌ ${e}`);
  for (const w of r.warnings) console.log(`        ⚠️  ${w}`);
  return r.errors.length === 0;
}

// ── Main ───────────────────────────────────────────────────────────────────

function main(): void {
  const args = parseArgs();

  console.log('\n═══════════════════════════════════════════════════');
  console.log('   Hermes Newsletter System — check-parity');
  console.log('   Auditoría independiente fuente/inline (motor)');
  console.log('═══════════════════════════════════════════════════\n');

  if (args['campaign-set']) {
    const setDir = resolveCampaignPath(args['campaign-set']);
    if (!fs.existsSync(setDir)) {
      console.error(`\n   ❌ La carpeta no existe: ${setDir}\n`);
      process.exit(1);
    }
    const campaignDirs = fs.readdirSync(setDir, { withFileTypes: true })
      .filter((d) => d.isDirectory())
      .map((d) => path.join(setDir, d.name));

    console.log(`   Auditando ${campaignDirs.length} campañas en ${setDir}\n`);

    let allOk = true;
    for (const dir of campaignDirs) {
      const r = checkCampaign(dir);
      const ok = printCampaignResult(r);
      if (!ok) allOk = false;
    }

    console.log('');
    if (allOk) {
      console.log('   ✅ Todas las campañas auditadas están en paridad.\n');
      process.exit(0);
    } else {
      console.log('   ❌ Al menos una campaña tiene paridad rota. Ver detalle arriba.\n');
      process.exit(1);
    }
    return;
  }

  if (!args.campaign) {
    console.error('\n  ❌ Error: falta --campaign o --campaign-set\n');
    console.error('  Uso: npx tsx scripts/check-parity.ts --campaign newsletters/{year}/{client}/{campaign}\n');
    console.error('       npx tsx scripts/check-parity.ts --campaign-set newsletters/{year}/{client}\n');
    process.exit(1);
  }

  const campaignDir = resolveCampaignPath(args.campaign);
  if (!fs.existsSync(campaignDir)) {
    console.error(`\n   ❌ La carpeta de campaña no existe: ${campaignDir}\n`);
    process.exit(1);
  }

  const r = checkCampaign(campaignDir);
  console.log(`   Campaña: ${campaignDir}\n`);

  if (r.skipped) {
    console.log(`   ⏭️  Omitida: ${r.skipped}\n`);
    process.exit(0);
    return;
  }

  if (r.errors.length === 0 && r.warnings.length === 0) {
    console.log('   ✅ Paridad fuente/inline verificada. Sin desviaciones.\n');
    process.exit(0);
  }

  if (r.errors.length > 0) {
    console.log(`   ❌ Errores (${r.errors.length}):\n`);
    for (const e of r.errors) console.log(`     ❌ ${e}`);
    console.log('');
  }
  if (r.warnings.length > 0) {
    console.log(`   ⚠️  Avisos (${r.warnings.length}):\n`);
    for (const w of r.warnings) console.log(`     ⚠️  ${w}`);
    console.log('');
  }

  process.exit(r.errors.length > 0 ? 1 : 0);
}

main();
