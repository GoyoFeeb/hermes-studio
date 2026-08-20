#!/usr/bin/env npx tsx
/**
 * check-brand-visual-report-completeness.ts — "Nivel 5" (2026-07-28, evolución del agente 02,
 * ver pipeline-skill/references/brand-visual-analysis-methodology.md): verifica la existencia y
 * el contenido real (no placeholder) de los 9 artefactos nuevos que el agente 02 produce además
 * del brand pack — 3 documentos de campaña (02-analysis/) + 6 documentos/CSS de marca
 * (brands/{cliente}/).
 *
 * Rollout inicial (2026-07-28) deliberadamente NO bloqueante (mismo criterio que "Nivel 4" en
 * check-brand-pack-completeness.ts): en ese momento NINGUNO de los 12 brand packs reales tenía
 * ninguno de estos archivos — bloquear producción por su ausencia el mismo día en que se
 * introducían habría fallado retroactivamente toda campaña real existente.
 *
 * Actualización 2026-08-20 (petición del usuario: "que el sistema capte siempre las fuentes de
 * las marcas"): pasa a ser BLOQUEANTE, con la misma válvula de escape que ya usa
 * check-brand-pack-completeness.ts (Nivel 3) — ausencia declarada explícitamente en el
 * `_changelog` del brand pack (con la palabra clave del archivo, ej. "source-inventory") → aviso,
 * no bloquea; ausencia sin ninguna mención → error, bloquea. Presencia con contenido placeholder
 * sin resolver sigue siendo error incondicional (sin válvula de escape — un archivo declarado
 * entregado no puede fingir contenido real), misma disciplina anti-fabricación que el resto del
 * sistema.
 *
 * Efecto esperado: los brand packs reales que aún no tienen estos artefactos (la mayoría a fecha
 * de este cambio) empezarán a fallar `production-gate` hasta que el agente 02 los genere para esa
 * marca, o se declare el hueco en `_changelog` — decisión explícita del usuario, no un efecto
 * secundario no buscado.
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

// Mismo helper que check-brand-pack-completeness.ts (Nivel 3): un hueco declarado explícitamente
// en _changelog no es el mismo problema que uno silencioso.
function changelogMentions(changelog: any[], ...keywords: string[]): boolean {
  const text = JSON.stringify(changelog || []).toLowerCase();
  return keywords.every((k) => text.includes(k.toLowerCase()));
}

interface CheckResult {
  warnings: string[];
  errors: string[];
}

function checkFile(fullPath: string, label: string, keyword: string, changelog: any[], result: CheckResult): void {
  if (!fs.existsSync(fullPath)) {
    const declared = changelogMentions(changelog, keyword);
    if (declared) {
      result.warnings.push(
        `${label} ausente (${fullPath}) — válvula de escape documentada en _changelog (hueco declarado, no silencioso).`
      );
    } else {
      result.errors.push(
        `${label} ausente (${fullPath}) — SIN ninguna mención en _changelog. Hueco silencioso: ni generado ni declarado.`
      );
    }
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

function checkCampaignFiles(campaignDir: string, changelog: any[], result: CheckResult): void {
  for (const f of CAMPAIGN_FILES) {
    checkFile(path.join(campaignDir, '02-analysis', f), `02-analysis/${f}`, f, changelog, result);
  }
}

function checkBrandFiles(brandDir: string, changelog: any[], result: CheckResult): void {
  for (const f of BRAND_STYLE_FILES) {
    checkFile(path.join(brandDir, 'styles', f), `styles/${f}`, f, changelog, result);
  }
  for (const f of BRAND_GUIDELINE_FILES) {
    checkFile(path.join(brandDir, 'guidelines', f), `guidelines/${f}`, f, changelog, result);
  }
}

function loadBrandChangelog(brandTokensPath: string | null): any[] {
  if (!brandTokensPath || !fs.existsSync(brandTokensPath)) return [];
  try {
    const tokens = JSON.parse(fs.readFileSync(brandTokensPath, 'utf8'));
    return tokens._changelog || [];
  } catch {
    return [];
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

    const campaignData = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
    let brandPackPath: string | null = null;
    if (campaignData.brand) {
      brandPackPath = resolveBrandPackPathOrNull(ROOT, campaignData.brand);
    }
    const changelog = loadBrandChangelog(brandPackPath);
    checkCampaignFiles(campaignDir, changelog, result);

    if (brandPackPath) {
      const brandDir = path.dirname(path.dirname(brandPackPath)); // .../brands/{slug}/tokens/brand-tokens.json -> .../brands/{slug}
      console.log(`   Brand:   ${brandDir}\n`);
      checkBrandFiles(brandDir, changelog, result);
    }
  } else if (args.brand) {
    const brandDir = path.resolve(ROOT, 'brands', args.brand);
    const changelog = loadBrandChangelog(path.join(brandDir, 'tokens', 'brand-tokens.json'));
    console.log(`   Brand: ${brandDir}\n`);
    checkBrandFiles(brandDir, changelog, result);
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
    console.log('   ❌ check-brand-visual-report-completeness: FAIL (hueco silencioso o placeholder sin resolver)\n');
    process.exit(1);
  }
  if (result.warnings.length > 0) {
    console.log('   ✅ check-brand-visual-report-completeness: OK (con avisos — huecos declarados en _changelog)\n');
    process.exit(0);
  }
  console.log('   ✅ check-brand-visual-report-completeness: OK\n');
}

main();
