#!/usr/bin/env npx tsx
/**
 * check-links.ts — Comprueba enlaces, CTAs e imágenes en newsletter-data.json.
 *
 * Uso:
 *   npx tsx scripts/check-links.ts --campaign newsletters/{year}/{client}/{campaign}
 *   npx tsx scripts/check-links.ts --campaign /ruta/absoluta --online
 *   npx tsx scripts/check-links.ts --campaign /ruta/absoluta --strict
 */

import * as fs from 'fs';
import * as path from 'path';

// ── Configuración ──────────────────────────────────────────────────────────

const ROOT = path.resolve(import.meta.dirname, '..');
const RESULTS: { type: 'error' | 'warning'; message: string }[] = [];
let online = false;
let strict = false;

function error(msg: string): void { RESULTS.push({ type: 'error', message: msg }); }
function warn(msg: string): void { RESULTS.push({ type: 'warning', message: msg }); }

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

// ── Validaciones de formato ────────────────────────────────────────────────

const INVALID_HREFS = ['', '#', 'null', '[PENDIENTE]'];
const STRICT_PLACEHOLDER_PATTERNS = [
  /^#placeholder/i,
  /\[PENDIENTE\]/,
  /\[TODO\]/,
  /\[FIXME\]/,
  /\[ESCRIBIR.AQUÍ\]/i,
];

function isPlaceholder(val: string): boolean {
  return /^\[.*\]$/.test(val.trim());
}

function isStrictPlaceholder(val: string): boolean {
  return STRICT_PLACEHOLDER_PATTERNS.some(p => p.test(val.trim()));
}

function isHttpUrl(s: string): boolean {
  return /^https?:\/\//i.test(s.trim());
}

function isAbsoluteUrl(s: string): boolean {
  return /^[a-z][a-z0-9+.-]*:\/\//i.test(s.trim());
}

// ── Online check ───────────────────────────────────────────────────────────

async function checkUrl(url: string, label: string): Promise<void> {
  const start = Date.now();
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    const res = await fetch(url, { method: 'HEAD', signal: controller.signal });
    clearTimeout(timeout);

    if (res.status >= 400) {
      warn(`${label}: HTTP ${res.status} — ${url}`);
    } else {
      console.log(`     ✅ ${res.status}  ${url}  (${Date.now() - start}ms)`);
    }
  } catch (err) {
    const cause = (err as Error).cause || (err as Error).message;
    warn(`${label}: sin respuesta — ${url}  (${cause})`);
  }
}

// ── Extraer y validar ──────────────────────────────────────────────────────

interface LinkEntry {
  type: 'cta' | 'link' | 'image';
  module: string;
  field: string;
  value: string;
  label: string;
}

function extractLinks(data: any): LinkEntry[] {
  const entries: LinkEntry[] = [];

  if (!Array.isArray(data.modules)) return entries;

  for (let i = 0; i < data.modules.length; i++) {
    const mod = data.modules[i];
    const modLabel = `Módulo ${mod.order || i + 1} (${mod.id || '?'} — ${mod.type || '?'})`;

    // CTA
    if (mod.cta) {
      if (mod.cta.href !== undefined) {
        entries.push({
          type: 'cta',
          module: modLabel,
          field: `modules[${i}].cta.href`,
          value: mod.cta.href,
          label: `CTA → ${mod.cta.text || '(sin texto)'}`,
        });
      }
    }

    // Enlaces adicionales (footer links, etc.)
    if (Array.isArray(mod.links)) {
      for (let j = 0; j < mod.links.length; j++) {
        if (mod.links[j].href !== undefined) {
          entries.push({
            type: 'link',
            module: modLabel,
            field: `modules[${i}].links[${j}].href`,
            value: mod.links[j].href,
            label: `Enlace → ${mod.links[j].text || '(sin texto)'}`,
          });
        }
      }
    }

    // Imágenes
    if (mod.image) {
      if (mod.image.src !== undefined) {
        entries.push({
          type: 'image',
          module: modLabel,
          field: `modules[${i}].image.src`,
          value: mod.image.src,
          label: `Imagen src → ${mod.image.alt || '(sin alt)'}`,
        });
      }
    }
  }

  return entries;
}

function validateFormat(entry: LinkEntry): void {
  const val = entry.value;

  // Vacío
  if (INVALID_HREFS.includes(val.trim())) {
    const msg = `${entry.label}: ${entry.field} está vacío o inválido ("${val}")`;
    if (strict) error(`[STRICT] ${msg}`);
    else error(msg);
    return;
  }

  // Placeholder pendiente (modo normal)
  if (isPlaceholder(val)) {
    error(`${entry.label}: ${entry.field} contiene un placeholder pendiente — ${val}`);
    return;
  }

  // Placeholder strict (#placeholder-*, [PENDIENTE], [TODO], [FIXME], [ESCRIBIR AQUÍ])
  if (isStrictPlaceholder(val)) {
    if (strict) {
      error(`[STRICT] ${entry.label}: ${entry.field} contiene un placeholder de CRM — ${val}`);
    } else {
      warn(`${entry.label}: ${entry.field} contiene un placeholder — ${val} (bloqueante en modo --strict)`);
    }
    return;
  }

  // URLs que no son absolutas
  if (entry.type !== 'image' && val.startsWith('http') && !isAbsoluteUrl(val)) {
    error(`${entry.label}: ${entry.field} no es una URL absoluta — ${val}`);
    return;
  }

  // Imágenes deben tener URL absoluta
  if (entry.type === 'image' && !isAbsoluteUrl(val) && !val.startsWith('//')) {
    warn(`${entry.label}: ${entry.field} podría necesitar URL absoluta — ${val}`);
  }
}

async function checkOnline(entries: LinkEntry[]): Promise<void> {
  console.log('\n   Comprobación online...');
  let checked = 0;

  for (const entry of entries) {
    const val = entry.value.trim();
    if (isHttpUrl(val) && !isPlaceholder(val) && !isStrictPlaceholder(val)) {
      checked++;
      await checkUrl(val, entry.label);
    }
  }

  if (checked === 0) {
    console.log('     (no hay URLs HTTP(S) para verificar)');
  }
}

// ── Strict checks on metadata ──────────────────────────────────────────────

function checkMetadataStrict(data: any): void {
  const meta = data.metadata;
  if (!meta) return;

  // fromEmail vacío
  if (meta.fromEmail === undefined || meta.fromEmail === null || meta.fromEmail.trim() === '') {
    error('[STRICT] metadata.fromEmail está vacío — debe definirse antes de producción');
  }

  // fromEmail con placeholder
  if (meta.fromEmail && isStrictPlaceholder(meta.fromEmail)) {
    error(`[STRICT] metadata.fromEmail contiene un placeholder — ${meta.fromEmail}`);
  }
}

// ── Main ───────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  const args = parseArgs();
  online = args.online === 'true';
  strict = args.strict === 'true';

  if (!args.campaign) {
    console.error('\n  ❌ Error: falta --campaign\n');
    console.error('  Uso: npx tsx scripts/check-links.ts --campaign newsletters/{year}/{client}/{campaign} [--online] [--strict]\n');
    process.exit(1);
  }

  const campaignDir = resolveCampaignPath(args.campaign);

  const modeLabel = strict ? ' (strict)' : online ? ' (online)' : ' (offline)';
  console.log('\n═══════════════════════════════════════════════════');
  console.log(`   Hermes Newsletter System — Check links${modeLabel}`);
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

  // 4. Strict: comprobar metadata
  if (strict) {
    checkMetadataStrict(data);
  }

  // 5. Extraer y validar enlaces
  console.log('   Extrayendo enlaces...\n');
  const entries = extractLinks(data);

  if (entries.length === 0) {
    warn('No se encontraron CTAs, enlaces ni imágenes en newsletter-data.json');
  } else {
    console.log(`     Total: ${entries.length} enlaces encontrados\n`);

    const ctaCount = entries.filter(e => e.type === 'cta').length;
    const linkCount = entries.filter(e => e.type === 'link').length;
    const imgCount = entries.filter(e => e.type === 'image').length;

    console.log(`     CTAs:     ${ctaCount}`);
    console.log(`     Enlaces:  ${linkCount}`);
    console.log(`     Imágenes: ${imgCount}\n`);

    console.log('   Validando formato...');
    for (const entry of entries) {
      validateFormat(entry);
    }
    console.log('');

    // Verificar imágenes sin alt
    for (let i = 0; i < (data.modules || []).length; i++) {
      const mod = data.modules[i];
      if (mod.image) {
        const modLabel = `Módulo ${mod.order || i + 1} (${mod.id || '?'})`;
        if (!mod.image.alt) {
          error(`${modLabel}: image.alt está vacío o no definido`);
        }
      }
    }

    // Verificar CTAs sin texto
    for (let i = 0; i < (data.modules || []).length; i++) {
      const mod = data.modules[i];
      if (mod.cta && !mod.cta.text) {
        const modLabel = `Módulo ${mod.order || i + 1} (${mod.id || '?'})`;
        warn(`${modLabel}: cta.text está vacío`);
      }
    }
  }

  // 6. Online check
  if (online) {
    await checkOnline(entries);
  }

  console.log('');
  printResults();
}

function printResults(): void {
  const errors = RESULTS.filter(r => r.type === 'error');
  const warnings = RESULTS.filter(r => r.type === 'warning');

  console.log('═══════════════════════════════════════════════════');
  console.log(`   Resultados${strict ? ' (modo strict)' : ''}`);
  console.log('═══════════════════════════════════════════════════\n');

  if (errors.length === 0 && warnings.length === 0) {
    console.log('   ✅ Todos los enlaces están correctos.\n');
    process.exit(0);
    return;
  }

  if (errors.length > 0) {
    console.log(`   ❌ Errores (${errors.length}):\n`);
    for (const e of errors) {
      console.log(`     ❌ ${e.message}`);
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

  if (strict) {
    if (errors.length > 0) {
      console.log('   📋 Modo strict: errores bloqueantes detectados. La campaña no está lista para producción.\n');
      process.exit(1);
    } else {
      console.log('   ✅ Modo strict: sin errores. Campaña candidata a producción.\n');
      process.exit(0);
    }
  } else if (errors.length > 0) {
    console.log('   📋 Revise los errores antes de continuar.\n');
    if (warnings.length > 0) {
      console.log('   ⚠️  Los placeholders detectados bloquearán el modo --strict.\n');
    }
    process.exit(1);
  } else {
    console.log('   ✅ Sin errores críticos. Solo warnings menores.\n');
    if (warnings.length > 0) {
      console.log('   ⚠️  Validación sintáctica/offline correcta. Los placeholders siguen pendientes y bloquearán el modo --strict.\n');
    }
    process.exit(0);
  }
}

main();
