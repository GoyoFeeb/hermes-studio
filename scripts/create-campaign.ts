#!/usr/bin/env npx tsx
/**
 * create-campaign.ts — Crea una nueva campaña copiando la plantilla base
 *
 * Uso:
 *   npx tsx scripts/create-campaign.ts --year 2026 --client mi-cliente --campaign 2026-jul-campana --date 2026-07-05
 *
 * Opciones:
 *   --year        Año de la campaña (obligatorio)
 *   --client      Slug del cliente para la carpeta (obligatorio, ej: mi-cliente)
 *   --client-name Nombre visible del cliente (opcional, ej: "Mi Cliente")
 *                 Si se omite, se genera automáticamente desde --client
 *   --campaign    Nombre de la campaña (obligatorio)
 *   --date        Fecha en formato YYYY-MM-DD (opcional, por defecto: hoy)
 *   --cta         Texto del CTA principal (opcional, por defecto: "Definir CTA")
 *   --url         URL principal (opcional, por defecto: https://placeholder.invalid/{client}/{campaign})
 *   --force       Sobrescribir si la campaña ya existe (opcional)
 */

import * as fs from 'fs';
import * as path from 'path';
import Ajv from 'ajv';
import { parseArgs } from './lib/cli';

// ── Configuración ──────────────────────────────────────────────────────────

const ROOT = path.resolve(import.meta.dirname, '..');
const TEMPLATE = path.join(ROOT, 'newsletters', '_campaign-template');
const CAMPAIGN_DATA_SCHEMA = path.join(ROOT, 'engine', 'schema', 'campaign-data.schema.json');
const PLACEHOLDER_FILES = ['.md', '.json', '.ts'];

/**
 * Deriva un nombre visible a partir del slug del cliente.
 * Convierte guiones en espacios y capitaliza cada palabra.
 * Ejemplo: "mi-cliente" -> "Mi Cliente"
 */
function slugToClientName(slug: string): string {
  return slug
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

// ── Validación ─────────────────────────────────────────────────────────────

function validate(args: Record<string, string>): void {
  const required = ['year', 'client', 'campaign'];
  const missing = required.filter((k) => !args[k]);

  if (missing.length > 0) {
    console.error(`\n  ❌ Error: faltan argumentos obligatorios: ${missing.join(', ')}\n`);
    console.error('  Uso: npx tsx scripts/create-campaign.ts \\');
    console.error('         --year 2026 --client mi-cliente --campaign 2026-jul-campana --date 2026-07-05 \\');
    console.error('         [--client-name "Mi Cliente"] [--cta "Texto"] [--url "https://..."] [--force]\n');
    process.exit(1);
  }

  if (!/^\d{4}$/.test(args.year)) {
    console.error(`\n  ❌ Error: --year debe ser un año válido de 4 dígitos (ej: 2026)\n`);
    process.exit(1);
  }

  if (!/^[a-z0-9][a-z0-9-]*$/.test(args.client)) {
    console.error(`\n  ❌ Error: --client debe usar minúsculas, guiones y números (ej: mi-cliente)\n`);
    process.exit(1);
  }

  if (!fs.existsSync(TEMPLATE)) {
    console.error(`\n  ❌ Error: no se encuentra la plantilla en ${TEMPLATE}\n`);
    process.exit(1);
  }
}

// ── Creación de campaña ────────────────────────────────────────────────────

function buildDestPath(year: string, client: string, campaign: string): string {
  return path.join(ROOT, 'newsletters', year, client, campaign);
}

/**
 * Copia recursiva manual archivo por archivo, usada como fallback cuando
 * fs.cpSync falla con EACCES (visto en carpetas montadas de sesiones tipo
 * Cowork, donde el equivalente `cp -r` sí funciona).
 */
function copyRecursiveManual(src: string, dest: string): void {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyRecursiveManual(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

function copyTemplate(src: string, dest: string, force: boolean): number {
  if (fs.existsSync(dest)) {
    if (!force) {
      console.error(`\n  ❌ Error: la campaña ya existe en ${dest}`);
      console.error('     Usa --force para sobrescribir.\n');
      process.exit(1);
    }
    fs.rmSync(dest, { recursive: true, force: true });
    console.log(`  ⚠️  Campaña existente sobrescrita (--force)\n`);
  }

  fs.mkdirSync(dest, { recursive: true });

  try {
    fs.cpSync(src, dest, { recursive: true });
    console.log('     (método: copia rápida — fs.cpSync)');
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code !== 'EACCES') {
      throw err;
    }
    console.log('     ⚠️  fs.cpSync falló con EACCES (carpeta montada) — usando fallback manual');
    copyRecursiveManual(src, dest);
    console.log('     (método: copia fallback — archivo por archivo)');
  }

  // Contar archivos (excluyendo .gitkeep)
  let count = 0;
  function walk(dir: string) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(full);
      } else if (entry.name !== '.gitkeep') {
        count++;
      }
    }
  }
  walk(dest);

  return count;
}

// ── Reemplazo de placeholders ──────────────────────────────────────────────

function replacePlaceholders(dest: string, replacements: Record<string, string>): number {
  let filesModified = 0;

  function walk(dir: string) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(full);
        continue;
      }

      const ext = path.extname(entry.name).toLowerCase();
      if (!PLACEHOLDER_FILES.includes(ext)) continue;

      let content = fs.readFileSync(full, 'utf-8');
      let changed = false;

      for (const [placeholder, value] of Object.entries(replacements)) {
        if (content.includes(placeholder)) {
          const regex = new RegExp(placeholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
          content = content.replace(regex, value);
          changed = true;
        }
      }

      if (changed) {
        fs.writeFileSync(full, content, 'utf-8');
        filesModified++;
      }
    }
  }

  walk(dest);
  return filesModified;
}

// ── Actualizar campaign-status.md ──────────────────────────────────────────

function updateCampaignStatus(dest: string): void {
  const statusPath = path.join(dest, 'campaign-status.md');
  if (!fs.existsSync(statusPath)) {
    console.warn('  ⚠️  No se encontró campaign-status.md, se omite actualización');
    return;
  }

  let content = fs.readFileSync(statusPath, 'utf-8');
  content = content.replace(/\| Estado actual \| .* \|/, '| Estado actual | created |');

  content = content.replace(
    /^\| Estado actual \| .+ \|$/m,
    '| Estado actual | created |'
  );

  fs.writeFileSync(statusPath, content, 'utf-8');
}

// ── Validar campaign-data.json ─────────────────────────────────────────────

function validateJson(dest: string): boolean {
  const jsonPath = path.join(dest, '06-data', 'campaign-data.json');
  if (!fs.existsSync(jsonPath)) {
    console.warn('  ⚠️  No se encontró campaign-data.json, se omite validación');
    return false;
  }

  try {
    const content = fs.readFileSync(jsonPath, 'utf-8');
    const parsed = JSON.parse(content);
    const schema = JSON.parse(fs.readFileSync(CAMPAIGN_DATA_SCHEMA, 'utf-8'));
    const ajv = new Ajv({ allErrors: true, strict: false });
    const validate = ajv.compile(schema);
    if (!validate(parsed)) {
      const messages = (validate.errors || [])
        .map((e) => `${e.instancePath || '(raíz)'} ${e.message}`)
        .join('; ');
      console.error(`  ❌ campaign-data.json: no valida contra el schema — ${messages}`);
      return false;
    }
    return true;
  } catch (err) {
    console.error(`  ❌ campaign-data.json: error de sintaxis/schema — ${(err as Error).message}`);
    return false;
  }
}

// ── Main ───────────────────────────────────────────────────────────────────

function main(): void {
  console.log('\n═══════════════════════════════════════════════════');
  console.log('   Hermes Newsletter System — Crear campaña');
  console.log('═══════════════════════════════════════════════════\n');

  const args = parseArgs(['force']);
  validate(args);

  const year = args.year;
  const clientSlug = args.client;
  const clientName = args['client-name'] || slugToClientName(clientSlug);
  const campaign = args.campaign;
  const date = args.date || new Date().toISOString().slice(0, 10);
  const cta = args.cta || 'Definir CTA';
  const url = args.url || `https://placeholder.invalid/${clientSlug}/${campaign}`;
  const force = args.force === 'true';

  const dest = buildDestPath(year, clientSlug, campaign);

  console.log(`  📁 Creando campaña en:  newsletters/${year}/${clientSlug}/${campaign}/\n`);

  // 1. Copiar plantilla
  console.log('  1. Copiando plantilla...');
  const fileCount = copyTemplate(TEMPLATE, dest, force);
  console.log(`     ✅ ${fileCount} archivos copiados\n`);

  // 2. Reemplazar placeholders
  console.log('  2. Reemplazando placeholders...');
  const replacements: Record<string, string> = {
    '[CLIENTE]': clientName,
    '[CLIENT_SLUG]': clientSlug,
    '[CAMPAÑA]': campaign,
    '[FECHA]': date,
    '[CTA_PRINCIPAL]': cta,
    '[URL_PRINCIPAL]': url,
  };

  const filesModified = replacePlaceholders(dest, replacements);
  console.log(`     ✅ ${filesModified} archivos modificados\n`);

  // 3. Actualizar campaign-status.md
  console.log('  3. Actualizando campaign-status.md...');
  updateCampaignStatus(dest);
  console.log('     ✅ Estado: created\n');

  // 4. Validar JSON
  console.log('  4. Validando campaign-data.json...');
  const jsonValid = validateJson(dest);
  console.log(`     ${jsonValid ? '✅' : '❌'} JSON ${jsonValid ? 'válido' : 'inválido'}\n`);

  // 5. Resumen
  console.log('═══════════════════════════════════════════════════');
  console.log('   Resumen de creación');
  console.log('═══════════════════════════════════════════════════\n');

  console.log(`   Ruta:       newsletters/${year}/${clientSlug}/${campaign}/`);
  console.log(`   Archivos:   ${fileCount}`);
  console.log(`   Cliente:    ${clientName} (slug: ${clientSlug})`);
  console.log(`   Campaña:    ${campaign}`);
  console.log(`   Fecha:      ${date}`);
  console.log(`   Estado:     created`);
  console.log(`   JSON:       ${jsonValid ? '✅ Válido' : '❌ Inválido'}`);

  if (cta !== 'Definir CTA') {
    console.log(`   CTA:        ${cta}`);
  }
  if (!url.includes('placeholder.invalid')) {
    console.log(`   URL:        ${url}`);
  } else {
    console.log('   URL:        placeholder de prueba (sustituir antes de producción)');
  }

  console.log('\n   ---');
  console.log('\n   📋 Siguiente paso recomendado:');
  console.log('   Ejecutar agente 01 — Briefing Strategist\n');
  console.log('═══════════════════════════════════════════════════\n');
}

main();
