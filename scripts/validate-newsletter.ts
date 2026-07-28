#!/usr/bin/env npx tsx
/**
 * validate-newsletter.ts — Valida la estructura mínima de una campaña de newsletter.
 *
 * Uso:
 *   npx tsx scripts/validate-newsletter.ts --campaign newsletters/{year}/{client}/{campaign}
 *   npx tsx scripts/validate-newsletter.ts --campaign /ruta/absoluta --production
 */

import * as fs from 'fs';
import * as path from 'path';
import { parseArgs } from './lib/cli';

// ── Configuración ──────────────────────────────────────────────────────────

const ROOT = path.resolve(import.meta.dirname, '..');

const REQUIRED_DIRS = [
  '00-brief',
  '01-inputs',
  '02-analysis',
  '03-strategy',
  '04-design',
  '05-copy',
  '06-data',
  '07-code',
  '08-qa',
  '09-exports',
];

const REQUIRED_FILES = [
  'README.md',
  'campaign-status.md',
  'task-log.md',
  'handoff.md',
  'next-steps.md',
  path.join('00-brief', 'brief.md'),
  path.join('00-brief', 'requirements.md'),
  path.join('00-brief', 'source-links.md'),
  path.join('06-data', 'newsletter-data.json'),
  path.join('06-data', 'newsletter-data.ts'),
];

const CRM_LINK_FIELDS = ['baja', 'preferencias', 'unsubscribe', 'preferences'];
const PRODUCTION_WARNING_KEYWORDS = [
  'pendiente', 'placeholder', 'no usar en producción',
  'no apto para producción', 'solo para prueba', 'prueba interna',
  'isTestCampaign', 'productionReady false', 'test campaign',
  'pending validation', 'waiting for',
];

const PLACEHOLDER_PATTERNS = [
  /^#placeholder/i,
  /\[PENDIENTE\]/,
  /\[TODO\]/,
  /\[FIXME\]/,
  /\[ESCRIBIR.AQUÍ\]/i,
];

// ── Resultados ─────────────────────────────────────────────────────────────

interface Result {
  type: 'error' | 'warning';
  message: string;
}

const results: Result[] = [];
let productionMode = false;

function error(msg: string): void {
  results.push({ type: 'error', message: msg });
}

function warn(msg: string): void {
  results.push({ type: 'warning', message: msg });
}

// ── Argumentos ─────────────────────────────────────────────────────────────


function resolveCampaignPath(raw: string): string {
  if (path.isAbsolute(raw)) return raw;
  return path.resolve(ROOT, raw);
}

// ── Helpers ────────────────────────────────────────────────────────────────

function isPlaceholder(val: string): boolean {
  return PLACEHOLDER_PATTERNS.some(p => p.test(val.trim()));
}

function isEmpty(val: string | undefined | null): boolean {
  return val === undefined || val === null || val.trim() === '';
}

function looksLikeEmail(val: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val.trim());
}

// ── Validaciones de estructura ─────────────────────────────────────────────

function validateDirExists(base: string, dir: string): boolean {
  const full = path.join(base, dir);
  if (!fs.existsSync(full) || !fs.statSync(full).isDirectory()) {
    error(`Falta carpeta: ${dir}/`);
    return false;
  }
  return true;
}

function validateFileExists(base: string, file: string): boolean {
  const full = path.join(base, file);
  if (!fs.existsSync(full) || !fs.statSync(full).isFile()) {
    error(`Falta archivo: ${file}`);
    return false;
  }
  return true;
}

function validateJson(base: string): any | null {
  const jsonPath = path.join(base, '06-data', 'newsletter-data.json');
  if (!fs.existsSync(jsonPath)) {
    error('Falta archivo: 06-data/newsletter-data.json');
    return null;
  }

  let parsed: any;
  try {
    const raw = fs.readFileSync(jsonPath, 'utf-8');
    parsed = JSON.parse(raw);
  } catch (err) {
    error(`06-data/newsletter-data.json: error de sintaxis JSON — ${(err as Error).message}`);
    return null;
  }

  // metadata
  if (!parsed.metadata) {
    error('newsletter-data.json: falta el campo "metadata"');
  }

  // settings
  if (!parsed.settings) {
    error('newsletter-data.json: falta el campo "settings"');
  }

  // modules
  if (!Array.isArray(parsed.modules)) {
    error('newsletter-data.json: "modules" debe ser un array');
    return null;
  }

  // Validar módulos si existen
  if (parsed.modules.length > 0) {
    for (let i = 0; i < parsed.modules.length; i++) {
      const mod = parsed.modules[i];
      const label = `modules[${i}]`;

      if (!mod.id) error(`${label}: falta "id"`);
      if (!mod.type) error(`${label}: falta "type"`);
      if (mod.order === undefined || mod.order === null) {
        error(`${label}: falta "order"`);
      }

      // CTA
      if (mod.cta) {
        if (!mod.cta.text) error(`${label}.cta: falta "text"`);
        if (!mod.cta.href) error(`${label}.cta: falta "href" o está vacío`);
      }

      // Image
      if (mod.image) {
        if (!mod.image.src) error(`${label}.image: falta "src"`);
        if (mod.image.alt === undefined || mod.image.alt === null) {
          error(`${label}.image: falta "alt"`);
        }
      }
    }
  }

  return parsed;
}

// ── Validaciones de producción ─────────────────────────────────────────────

function validateProduction(parsed: any): void {
  const meta = parsed.metadata;
  if (!meta) return;

  console.log('   Validando flags de producción...\n');

  let productionBlockers = 0;

  // ── isTestCampaign ──────────────────────────────────────────────────────
  if (meta.isTestCampaign !== false) {
    error(`[PRODUCTION] metadata.isTestCampaign debe ser false (actual: ${meta.isTestCampaign})`);
    productionBlockers++;
  } else {
    console.log(`     ✅ isTestCampaign: false`);
  }

  // ── productionReady ─────────────────────────────────────────────────────
  if (meta.productionReady !== true) {
    error(`[PRODUCTION] metadata.productionReady debe ser true (actual: ${meta.productionReady})`);
    productionBlockers++;
  } else {
    console.log(`     ✅ productionReady: true`);
  }

  // ── fromEmail ───────────────────────────────────────────────────────────
  if (isEmpty(meta.fromEmail)) {
    error('[PRODUCTION] metadata.fromEmail está vacío — debe ser una dirección de email real');
    productionBlockers++;
  } else if (isPlaceholder(meta.fromEmail)) {
    error(`[PRODUCTION] metadata.fromEmail contiene un placeholder — ${meta.fromEmail}`);
    productionBlockers++;
  } else if (!looksLikeEmail(meta.fromEmail)) {
    error(`[PRODUCTION] metadata.fromEmail no tiene formato de email válido — "${meta.fromEmail}"`);
    productionBlockers++;
  } else {
    console.log(`     ✅ fromEmail: ${meta.fromEmail}`);
  }

  // ── subjectLine ─────────────────────────────────────────────────────────
  if (isEmpty(meta.subjectLine)) {
    error('[PRODUCTION] metadata.subjectLine está vacío');
    productionBlockers++;
  } else {
    console.log(`     ✅ subjectLine: "${meta.subjectLine.substring(0, 50)}${meta.subjectLine.length > 50 ? '...' : ''}"`);
  }

  // ── preheader ───────────────────────────────────────────────────────────
  if (isEmpty(meta.preheader)) {
    error('[PRODUCTION] metadata.preheader está vacío');
    productionBlockers++;
  } else {
    console.log(`     ✅ preheader: "${meta.preheader.substring(0, 50)}${meta.preheader.length > 50 ? '...' : ''}"`);
  }

  // ── campaignName ────────────────────────────────────────────────────────
  if (isEmpty(meta.campaignName)) {
    error('[PRODUCTION] metadata.campaignName está vacío');
    productionBlockers++;
  } else {
    console.log(`     ✅ campaignName: ${meta.campaignName}`);
  }

  // ── clientName ──────────────────────────────────────────────────────────
  if (isEmpty(meta.clientName)) {
    error('[PRODUCTION] metadata.clientName está vacío');
    productionBlockers++;
  } else {
    console.log(`     ✅ clientName: ${meta.clientName}`);
  }

  // ── Aprobaciones opcionales ─────────────────────────────────────────────
  if (meta.clientApproved !== undefined && meta.clientApproved !== true) {
    error(`[PRODUCTION] metadata.clientApproved debe ser true (actual: ${meta.clientApproved})`);
    productionBlockers++;
  }
  if (meta.legalApproved !== undefined && meta.legalApproved !== true) {
    error(`[PRODUCTION] metadata.legalApproved debe ser true (actual: ${meta.legalApproved})`);
    productionBlockers++;
  }

  // ── Warnings en metadata ────────────────────────────────────────────────
  if (meta.warning) {
    const warningText = meta.warning.toLowerCase();
    const foundKeywords = PRODUCTION_WARNING_KEYWORDS.filter(kw => warningText.includes(kw.toLowerCase()));
    if (foundKeywords.length > 0) {
      warn(`[PRODUCTION] metadata.warning contiene términos que indican que la campaña no está lista: "${meta.warning.substring(0, 120)}..."`);
      warn('     Palabras clave detectadas: ' + foundKeywords.join(', '));
    }
  }

  // ── Footer / CRM links ─────────────────────────────────────────────────
  console.log('\n   Validando enlaces CRM (footer)...');

  if (Array.isArray(parsed.modules)) {
    for (let i = 0; i < parsed.modules.length; i++) {
      const mod = parsed.modules[i];
      if (Array.isArray(mod.links)) {
        for (let j = 0; j < mod.links.length; j++) {
          const link = mod.links[j];
          const text = (link.text || '').toLowerCase();
          const isCrmLink = CRM_LINK_FIELDS.some(f => text.includes(f));

          if (!isCrmLink) continue;

          const fieldPath = `modules[${i}].links[${j}]`;

          if (isEmpty(link.href)) {
            error(`[PRODUCTION] ${fieldPath} ("${link.text}"): href está vacío`);
            productionBlockers++;
          } else if (isPlaceholder(link.href)) {
            error(`[PRODUCTION] ${fieldPath} ("${link.text}"): href contiene un placeholder de CRM — ${link.href}`);
            productionBlockers++;
          } else if (link.href.startsWith('http') && !/^https?:\/\//i.test(link.href)) {
            error(`[PRODUCTION] ${fieldPath} ("${link.text}"): href no es una URL absoluta — ${link.href}`);
            productionBlockers++;
          } else {
            console.log(`     ✅ ${fieldPath} ("${link.text}"): ${link.href.substring(0, 80)}`);
          }
        }
      }
    }
  }

  // ── Assets warnings en production_blockers.md o similar no se revisan aquí
  //    (son documentación, no datos estructurados)
  console.log('');

  if (productionBlockers > 0) {
    console.log(`   🔴 ${productionBlockers} bloqueo(s) de producción detectado(s).\n`);
  } else {
    console.log('   ✅ Sin bloqueos de producción.\n');
  }
}

// ── Main ───────────────────────────────────────────────────────────────────

function main(): void {
  const args = parseArgs();
  productionMode = args.production === 'true';

  if (!args.campaign) {
    console.error('\n  ❌ Error: falta --campaign\n');
    console.error('  Uso: npx tsx scripts/validate-newsletter.ts --campaign newsletters/{year}/{client}/{campaign} [--production]\n');
    process.exit(1);
  }

  const campaignDir = resolveCampaignPath(args.campaign);

  const modeLabel = productionMode ? ' (production)' : '';
  console.log('\n═══════════════════════════════════════════════════');
  console.log(`   Hermes Newsletter System — Validar campaña${modeLabel}`);
  console.log('═══════════════════════════════════════════════════\n');

  console.log(`   Campaña: ${campaignDir}\n`);

  // 1. La carpeta de campaña existe
  if (!fs.existsSync(campaignDir)) {
    error(`La carpeta de campaña no existe: ${campaignDir}`);
    printResults();
    process.exit(1);
  }

  // 2. Validar carpetas principales
  console.log('   Carpetas principales...');
  let dirsOk = 0;
  for (const dir of REQUIRED_DIRS) {
    if (validateDirExists(campaignDir, dir)) dirsOk++;
  }
  console.log(`     ${dirsOk}/${REQUIRED_DIRS.length} carpetas encontradas\n`);

  // 3. Validar archivos mínimos
  console.log('   Archivos mínimos...');
  let filesOk = 0;
  for (const file of REQUIRED_FILES) {
    if (validateFileExists(campaignDir, file)) filesOk++;
  }
  console.log(`     ${filesOk}/${REQUIRED_FILES.length} archivos encontrados\n`);

  // 4. Validar JSON
  console.log('   newsletter-data.json...');
  const parsed = validateJson(campaignDir);
  console.log('');

  // 5. Validaciones de producción (solo si --production)
  if (productionMode && parsed) {
    validateProduction(parsed);
  }

  // 6. Nota sobre modo production en modo normal
  if (!productionMode) {
    const hasTestFlag = parsed?.metadata?.isTestCampaign === true;
    const hasProdFlag = parsed?.metadata?.productionReady === false;
    if (hasTestFlag || hasProdFlag) {
      console.log('   📋 Campaña válida para prueba interna.');
      console.log('      Usar --production para validar envío real.\n');
    }
  }

  // 7. Mostrar resultados
  printResults();
}

function printResults(): void {
  const errors = results.filter((r) => r.type === 'error');
  const warnings = results.filter((r) => r.type === 'warning');

  console.log('═══════════════════════════════════════════════════');
  console.log(`   Resultados${productionMode ? ' (production mode)' : ''}`);
  console.log('═══════════════════════════════════════════════════\n');

  if (errors.length === 0 && warnings.length === 0) {
    console.log('   ✅ Todos los checks pasaron. La campaña tiene la estructura mínima correcta.\n');
    process.exit(0);
    return;
  }

  if (errors.length > 0) {
    console.log(`   ❌ Errores (${errors.length}):\n`);
    for (const err of errors) {
      console.log(`     ❌ ${err.message}`);
    }
    console.log('');
  }

  if (warnings.length > 0) {
    console.log(`   ⚠️  Warnings (${warnings.length}):\n`);
    for (const w of warnings) {
      console.log(`     ⚠️  ${w.message}`);
    }
    console.log('');
  }

  if (errors.length > 0) {
    if (productionMode) {
      console.log('   📋 Modo production: errores bloqueantes. La campaña no está lista para envío real.\n');
    } else {
      console.log('   📋 Revise los errores antes de continuar con la campaña.\n');
    }
    process.exit(1);
  } else {
    console.log('   ✅ Sin errores críticos. Solo warnings menores.\n');
    process.exit(0);
  }
}

main();
