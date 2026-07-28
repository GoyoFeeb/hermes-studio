#!/usr/bin/env npx tsx
/**
 * check-brand-visual-report-completeness.ts — "Nivel 5" (2026-07-28, evolución del agente 02,
 * ver pipeline-skill/references/brand-visual-analysis-methodology.md): verifica la existencia y
 * el contenido real (no placeholder) de los 9 artefactos nuevos que el agente 02 produce además
 * del brand pack — 3 documentos de campaña (02-analysis/) + 6 documentos/CSS de marca
 * (brands/{cliente}/).
 *
 * Rollout deliberadamente NO bloqueante (mismo criterio que "Nivel 4" en
 * check-brand-pack-completeness.ts): hoy NINGUNO de los 12 brand packs reales tiene ninguno de
 * estos archivos — bloquear producción por su ausencia el mismo día en que se introducen
 * fallaría retroactivamente toda campaña real existente. Ausencia → aviso, sin excepción de
 * _changelog (a diferencia de Nivel 3/4, aquí no hace falta declarar el hueco: todavía no existe
 * ningún pack que "debería" tenerlo). Presencia con contenido placeholder sin resolver → error,
 * misma disciplina anti-fabricación que el resto del sistema (parece dato real y no lo es, que es
 * peor que declarar el hueco).
 *
 * Uso:
 *   npx tsx scripts/check-brand-visual-report-completeness.ts --campaign newsletters/{year}/{client}/{campaign}
 *   npx tsx scripts/check-brand-visual-report-completeness.ts --brand {slug}
 */
import * as fs from 'fs';
import * as path from 'path';
import { parseArgs, resolveCampaignPath } from './lib/cli';
import { resolveBrandPackPathOrNull } from './lib/brand-path';

const ROOT = path.resolve(import.meta.dirname, '..');

const CAMPAIGN_FILES = ['visual-identity-report.md', 'source-inventory.md', 'open-questions.md'];
const BRAND_STYLE_FILES = ['reference.css', 'email-safe.css'];
const BRAND_GUIDELINE_FILES = [
  'component-inventory.md',
  'responsive.md',
  'email-adaptation.md',
  'art-direction.md'
];

const MIN_REAL_CONTENT_LENGTH = 40;

function isPlaceholderContent(text: string): boolean {
  const trimmed = text.trim();
  if (trimmed.length === 0) return true;
  if (trimmed.length < MIN_REAL_CONTENT_LENGTH) return true;
  if (/^\[/.test(trimmed)) return true;
  if (/\[PENDIENTE\]/i.test(trimmed)) return true;
  return false;
}

interface CheckResult {
  warnings: string[];
  errors: string[];
}

function checkFile(fullPath: string, label: string, result: CheckResult): void {
  if (!fs.existsSync(fullPath)) {
    result.warnings.push(`${label} ausente (${fullPath}) — Nivel 5, no bloqueante.`);
    return;
  }
  const content = fs.readFileSync(fullPath, 'utf8');
  if (isPlaceholderContent(content)) {
    result.errors.push(
      `${label} existe pero su contenido es un placeholder sin resolver o está vacío (${fullPath}) — ` +
      `un archivo que se declara entregado no puede estar vacío ni empezar por "[": eso parece dato ` +
      `real y no lo es, peor que no tenerlo.`
    );
  }
}

function checkCampaignFiles(campaignDir: string, result: CheckResult): void {
  for (const f of CAMPAIGN_FILES) {
    checkFile(path.join(campaignDir, '02-analysis', f), `02-analysis/${f}`, result);
  }
}

function checkBrandFiles(brandDir: string, result: CheckResult): void {
  for (const f of BRAND_STYLE_FILES) {
    checkFile(path.join(brandDir, 'styles', f), `styles/${f}`, result);
  }
  for (const f of BRAND_GUIDELINE_FILES) {
    checkFile(path.join(brandDir, 'guidelines', f), `guidelines/${f}`, result);
  }
}

function main(): void {
  const args = parseArgs();
  const result: CheckResult = { warnings: [], errors: [] };

  console.log('\n═══════════════════════════════════════════════════');
  console.log('   check-brand-visual-report-completeness (Nivel 5)');
  console.log('═══════════════════════════════════════════════════\n');

  if (args.campaign) {
    const campaignDir = resolveCampaignPath(ROOT, args.campaign);
    const dataPath = path.join(campaignDir, '06-data', 'campaign-data.json');
    if (!fs.existsSync(dataPath)) {
      console.log(`   ⏭️  No existe ${dataPath} — omitida (no es una campaña del motor).\n`);
      process.exit(0);
    }
    console.log(`   Campaña: ${campaignDir}\n`);
    checkCampaignFiles(campaignDir, result);

    const campaignData = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
    if (campaignData.brand) {
      const brandPackPath = resolveBrandPackPathOrNull(ROOT, campaignData.brand);
      if (brandPackPath) {
        const brandDir = path.dirname(path.dirname(brandPackPath)); // .../brands/{slug}/tokens/brand-tokens.json -> .../brands/{slug}
        console.log(`   Brand:   ${brandDir}\n`);
        checkBrandFiles(brandDir, result);
      }
    }
  } else if (args.brand) {
    const brandDir = path.resolve(ROOT, 'brands', args.brand);
    console.log(`   Brand: ${brandDir}\n`);
    checkBrandFiles(brandDir, result);
  } else {
    console.error('\n  ❌ Error: falta --campaign o --brand\n');
    console.error('  Uso: npx tsx scripts/check-brand-visual-report-completeness.ts --campaign newsletters/{year}/{client}/{campaign}\n');
    console.error('   o : npx tsx scripts/check-brand-visual-report-completeness.ts --brand {slug}\n');
    process.exit(1);
  }

  for (const w of result.warnings) console.log(`   ⚠️  ${w}`);
  for (const e of result.errors) console.log(`   ❌ ${e}`);

  console.log('');
  if (result.errors.length > 0) {
    console.log('   ❌ check-brand-visual-report-completeness: FAIL (placeholder sin resolver)\n');
    process.exit(1);
  }
  if (result.warnings.length > 0) {
    console.log('   ✅ check-brand-visual-report-completeness: OK (con avisos — Nivel 5, no bloqueante)\n');
    process.exit(0);
  }
  console.log('   ✅ check-brand-visual-report-completeness: OK\n');
}

main();
