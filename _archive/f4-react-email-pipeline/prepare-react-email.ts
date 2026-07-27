#!/usr/bin/env npx tsx
/**
 * prepare-react-email.ts — Copia la plantilla React Email base dentro de una campaña.
 *
 * Uso:
 *   npx tsx scripts/prepare-react-email.ts --campaign newsletters/{year}/{client}/{campaign}
 *   npx tsx scripts/prepare-react-email.ts --campaign /ruta/absoluta [--force]
 */

import * as fs from 'fs';
import * as path from 'path';

// ── Configuración ──────────────────────────────────────────────────────────

const ROOT = path.resolve(import.meta.dirname, '..');
const TEMPLATE_DIR = path.join(ROOT, 'react-email-template');
const COPY_ITEMS = ['template-hermes.tsx', 'newsletter-schema.json', 'components'];
const EXCLUDE_FROM_COPY = ['.gitkeep'];
const RESULTS: { type: 'ok' | 'warn' | 'err'; message: string }[] = [];

function ok(msg: string): void { RESULTS.push({ type: 'ok', message: msg }); }
function warn(msg: string): void { RESULTS.push({ type: 'warn', message: msg }); }
function err(msg: string): void { RESULTS.push({ type: 'err', message: msg }); }

// ── Argumentos ─────────────────────────────────────────────────────────────

function parseArgs(): Record<string, string> {
  const args = process.argv.slice(2);
  const parsed: Record<string, string> = {};
  for (let i = 0; i < args.length; i++) {
    const key = args[i].replace(/^--/, '');
    const next = args[i + 1];
    if (key === 'force') {
      parsed[key] = 'true';
    } else if (next && !next.startsWith('--')) {
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

// ── Contar archivos (sin .gitkeep) ─────────────────────────────────────────

function countFiles(dir: string): number {
  let count = 0;
  function walk(d: string): void {
    for (const entry of fs.readdirSync(d, { withFileTypes: true })) {
      const full = path.join(d, entry.name);
      if (entry.isDirectory()) {
        walk(full);
      } else if (entry.name !== '.gitkeep') {
        count++;
      }
    }
  }
  walk(dir);
  return count;
}

// ── Validaciones ───────────────────────────────────────────────────────────

function validate(args: Record<string, string>): string {
  if (!args.campaign) {
    console.error('\n  ❌ Error: falta --campaign\n');
    console.error('  Uso: npx tsx scripts/prepare-react-email.ts --campaign newsletters/{year}/{client}/{campaign} [--force]\n');
    process.exit(1);
  }

  const campaignDir = resolveCampaignPath(args.campaign);

  if (!fs.existsSync(campaignDir)) {
    console.error(`\n  ❌ Error: la carpeta de campaña no existe: ${campaignDir}\n`);
    process.exit(1);
  }

  const jsonPath = path.join(campaignDir, '06-data', 'newsletter-data.json');
  if (!fs.existsSync(jsonPath)) {
    console.error(`\n  ❌ Error: no se encuentra 06-data/newsletter-data.json en la campaña\n`);
    process.exit(1);
  }

  // Validar JSON de campaña
  try {
    JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
  } catch (e) {
    console.error(`\n  ❌ Error: 06-data/newsletter-data.json no es válido: ${(e as Error).message}\n`);
    process.exit(1);
  }

  if (!fs.existsSync(TEMPLATE_DIR)) {
    console.error(`\n  ❌ Error: no se encuentra la plantilla origen en ${TEMPLATE_DIR}\n`);
    process.exit(1);
  }

  return campaignDir;
}

// ── Preparación ────────────────────────────────────────────────────────────

function prepareReactEmail(campaignDir: string, force: boolean): void {
  const destDir = path.join(campaignDir, '07-code', 'react-email');
  const nuevaFile = path.join(destDir, 'NuevaCrea.tsx');
  const jsonCampaign = path.join(campaignDir, '06-data', 'newsletter-data.json');
  const exampleJson = path.join(destDir, 'newsletter-data.example.json');

  // Comprobar si ya existe NuevaCrea.tsx
  if (fs.existsSync(nuevaFile) && !force) {
    console.error(`\n  ❌ Error: ya existe NuevaCrea.tsx en ${destDir}`);
    console.error('     Usa --force para sobrescribir.\n');
    process.exit(1);
  }

  // Crear carpeta destino
  fs.mkdirSync(destDir, { recursive: true });

  // Si force y ya existe, limpiar components/ para copia limpia
  const compDest = path.join(destDir, 'components');
  if (force && fs.existsSync(compDest)) {
    fs.rmSync(compDest, { recursive: true, force: true });
    // No borrar otros archivos en destDir (NuevaCrea.tsx, example, schema)
  }

  // ── Copiar archivos ────────────────────────────────────────────────

  // 1. template-hermes.tsx → NuevaCrea.tsx
  const srcTemplate = path.join(TEMPLATE_DIR, 'template-hermes.tsx');
  let newContent = fs.readFileSync(srcTemplate, 'utf-8');
  newContent = newContent.replace(
    "import defaultData from './newsletter-data.json';",
    "import defaultData from '../../06-data/newsletter-data.json';"
  );
  fs.writeFileSync(nuevaFile, newContent, 'utf-8');
  ok('NuevaCrea.tsx creado con import actualizado');

  // 2. newsletter-schema.json
  const srcSchema = path.join(TEMPLATE_DIR, 'newsletter-schema.json');
  fs.copyFileSync(srcSchema, path.join(destDir, 'newsletter-schema.json'));
  ok('newsletter-schema.json copiado');

  // 3. components/ (recursivo)
  const srcComp = path.join(TEMPLATE_DIR, 'components');
  fs.cpSync(srcComp, compDest, {
    recursive: true,
    filter: (src) => {
      const name = path.basename(src);
      return !EXCLUDE_FROM_COPY.includes(name);
    },
  });
  const compCount = countFiles(compDest);
  ok(`components/ copiado (${compCount} archivos)`);

  // 4. newsletter-data.example.json desde JSON real de campaña
  const realData = JSON.parse(fs.readFileSync(jsonCampaign, 'utf-8'));
  fs.writeFileSync(exampleJson, JSON.stringify(realData, null, 2), 'utf-8');
  ok('newsletter-data.example.json creado desde campaña');

  // ── Resumen ────────────────────────────────────────────────────────

  const totalFiles = countFiles(destDir);

  console.log('\n═══════════════════════════════════════════════════');
  console.log('   Resumen de preparación');
  console.log('═══════════════════════════════════════════════════\n');

  console.log(`   Campaña:                 ${path.basename(campaignDir)}`);
  console.log(`   Ruta destino:            07-code/react-email/`);
  console.log(`   Archivos copiados:       ${totalFiles}`);
  console.log(`   Componentes copiados:    ${compCount}`);
  console.log(`   JSON campaña válido:     ✅`);
  console.log(`   Import actualizado:      ✅`);
  console.log('');

  if (force) {
    console.log('   ⚠️  Modo --force: carpeta components/ sobrescrita\n');
  }

  console.log('   📋 Siguiente paso recomendado:');
  console.log('   Ejecutar agente 07 — React Email Developer\n');
  console.log('═══════════════════════════════════════════════════\n');
}

// ── Main ───────────────────────────────────────────────────────────────────

function main(): void {
  console.log('\n═══════════════════════════════════════════════════');
  console.log('   Hermes Newsletter System — Preparar React Email');
  console.log('═══════════════════════════════════════════════════\n');

  const args = parseArgs();
  const campaignDir = validate(args);
  const force = args.force === 'true';

  console.log(`   Campaña: ${campaignDir}\n`);

  prepareReactEmail(campaignDir, force);
}

main();
