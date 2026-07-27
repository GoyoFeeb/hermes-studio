#!/usr/bin/env npx tsx
/**
 * check-brand-pack-completeness.ts — Verifica que un brand-tokens.json real tiene
 * photography/iconography/voice.rhythm (Nivel 3, 2026-07-22) y layout.contentRhythm (Nivel 4,
 * 2026-07-24) realmente investigados, no solo presentes como clave vacía o placeholder.
 *
 * Motivo (auditoría del motor, 2026-07-24, a petición del usuario: "analiza el motor... y vemos
 * las cosas que se pueden mejorar y corregir"): todo lo demás en este sistema se certifica con
 * un gate automático (schema, patrón, claims, contraste, balance de columnas, control files) —
 * la única pieza que dependía 100% de la autodisciplina del agente 02 (nunca dejar photography/
 * iconography/voice.rhythm en blanco o con un placeholder sin resolver) era precisamente la que
 * más ha importado esta sesión para que las newsletters dejen de sentirse genéricas. Ejecutar
 * este script contra los brand packs reales existentes durante su desarrollo confirmó que el
 * hueco era real y no hipotético: `brands/adeslas/tokens/brand-tokens.json` tiene
 * `photography.usesRealPhotography` literalmente como el string
 * "[Q-NNN] No investigado con Chrome real..." (no un booleano, un placeholder de pregunta
 * abierta sin resolver) — un hueco que hoy pasa desapercibido porque ningún gate lo mira.
 *
 * Distingue 3 situaciones, no solo "presente/ausente":
 *   1. Campo con datos reales (ni vacío ni placeholder) → OK.
 *   2. Campo AUSENTE pero con una entrada en `_changelog` que documenta explícitamente la
 *      válvula de escape (ver agents/02-brand-visual-analyst.md §"Válvula de escape") → aviso,
 *      no bloquea. Un hueco declarado a propósito (ej. UAX/paraycompara/tarifalo, Nivel 3
 *      pospuesto por decisión explícita del usuario) no es el mismo problema que uno silencioso.
 *   3. Campo AUSENTE sin ninguna mención en `_changelog`, O presente pero con un valor
 *      placeholder sin resolver (empieza por "[", la misma convención `[Q-NNN]`/`[PENDIENTE]`
 *      que ya usa el resto del sistema) → error, bloquea.
 *
 * `layout.contentRhythm` (Nivel 4, recién introducido) se trata solo como aviso si está
 * completamente ausente — no bloquea builds de packs previos a su creación; si está presente,
 * se le exige la misma disciplina anti-placeholder que a los campos de Nivel 3.
 *
 * Uso:
 *   npx tsx scripts/check-brand-pack-completeness.ts --campaign newsletters/{year}/{client}/{campaign}
 *   npx tsx scripts/check-brand-pack-completeness.ts --brand {slug}
 */
import * as fs from 'fs';
import * as path from 'path';
import Ajv from 'ajv';

const ROOT = path.resolve(import.meta.dirname, '..');
const BRAND_SCHEMA_PATH = path.join(ROOT, 'engine', 'schema', 'brand-tokens.schema.json');

function parseArgs(): Record<string, string> {
  const args = process.argv.slice(2);
  const out: Record<string, string> = {};
  for (let i = 0; i < args.length; i++) {
    const key = args[i].replace(/^--/, '');
    const next = args[i + 1];
    if (next && !next.startsWith('--')) {
      out[key] = next;
      i++;
    } else {
      out[key] = 'true';
    }
  }
  return out;
}

/** Misma resolución dual de rutas que engine/lib/tokens.js (brands/ en la raíz, o el prefijo
 * histórico newsletters/2026/newsletter-system/ — ver ese archivo para el porqué). */
function resolveBrandPackPath(brandRelPath: string): string {
  const candidates = [
    path.resolve(ROOT, brandRelPath),
    path.resolve(ROOT, 'newsletters/2026/newsletter-system', brandRelPath)
  ];
  const found = candidates.find((p) => fs.existsSync(p));
  if (!found) {
    throw new Error(`Brand pack no encontrado. Probado:\n  - ${candidates.join('\n  - ')}`);
  }
  return found;
}

function isPlaceholder(value: unknown): boolean {
  return typeof value === 'string' && value.trim().startsWith('[');
}

function get(obj: any, dotted: string): any {
  return dotted.split('.').reduce((cur, k) => (cur == null ? undefined : cur[k]), obj);
}

function changelogMentions(changelog: any[], ...keywords: string[]): boolean {
  const text = JSON.stringify(changelog || []).toLowerCase();
  return keywords.every((k) => text.includes(k.toLowerCase()));
}

interface FieldGroup {
  label: string;
  leafPaths: string[]; // paths completos para comprobar placeholder, ej. "photography.treatment"
  level: 3 | 4; // 3 = bloqueante si silencioso; 4 = solo aviso si ausente
  changelogKeywords: string[]; // palabras que deben aparecer en _changelog para aceptar el hueco declarado
}

const FIELD_GROUPS: FieldGroup[] = [
  {
    label: 'photography',
    leafPaths: ['photography.usesRealPhotography', 'photography.treatment', 'photography.source'],
    level: 3,
    changelogKeywords: ['photography']
  },
  {
    label: 'iconography',
    leafPaths: ['iconography.style', 'iconography.source', 'iconography.componentImplication'],
    level: 3,
    changelogKeywords: ['iconography']
  },
  {
    label: 'voice.rhythm',
    leafPaths: [
      'voice.rhythm.sentenceLength',
      'voice.rhythm.mode',
      'voice.rhythm.formality',
      'voice.rhythm.punctuationHabits',
      'voice.rhythm.source'
    ],
    level: 3,
    changelogKeywords: ['voice.rhythm']
  },
  {
    label: 'layout.contentRhythm',
    leafPaths: [
      'layout.contentRhythm.realSectionCount',
      'layout.contentRhythm.photographyWeight',
      'layout.contentRhythm.iconDensity',
      'layout.contentRhythm.source'
    ],
    level: 4,
    changelogKeywords: ['contentrhythm']
  }
];

/** Añadido 2026-07-24 (auditoría profunda del motor): brand-tokens.json no tenía NINGÚN
 * schema hasta ahora — un error estructural (campo mal anidado, tipo incorrecto) solo se
 * detectaba si algún componente intentaba resolver ese {{token:...}} exacto, nunca si el campo
 * quedaba huérfano. Validación ligera y permisiva (additionalProperties:true en casi todo) a
 * propósito — ver engine/schema/brand-tokens.schema.json para el razonamiento completo. */
function checkStructuralSchema(tokens: any, packPath: string): string[] {
  const errors: string[] = [];
  if (!fs.existsSync(BRAND_SCHEMA_PATH)) return errors; // defensivo: no bloquear si el schema no existe
  const schema = JSON.parse(fs.readFileSync(BRAND_SCHEMA_PATH, 'utf8'));
  const ajv = new Ajv({ allErrors: true, strict: false });
  const validate = ajv.compile(schema);
  const valid = validate(tokens);
  if (!valid) {
    for (const e of validate.errors || []) {
      errors.push(`Schema estructural (${packPath}): ${e.instancePath || '(raíz)'} ${e.message}`);
    }
  }
  return errors;
}

function checkPack(tokens: any, packPath: string): { errors: string[]; warnings: string[] } {
  const errors: string[] = [...checkStructuralSchema(tokens, packPath)];
  const warnings: string[] = [];
  const changelog = tokens._changelog || [];

  const presence: Record<string, boolean> = {
    photography: tokens.photography !== undefined,
    iconography: tokens.iconography !== undefined,
    'voice.rhythm': get(tokens, 'voice.rhythm') !== undefined,
    'layout.contentRhythm': get(tokens, 'layout.contentRhythm') !== undefined
  };

  for (const group of FIELD_GROUPS) {
    const present = presence[group.label];
    const levelLabel = group.level === 3 ? 'Nivel 3 (2026-07-22)' : 'Nivel 4 (2026-07-24)';

    if (!present) {
      const declared = changelogMentions(changelog, ...group.changelogKeywords);
      const msg = `${group.label} (${levelLabel}) ausente en ${packPath}`;
      if (group.level === 4) {
        // Nivel 4 es demasiado nuevo para bloquear packs anteriores a su creación — aviso.
        warnings.push(`${msg} — pack anterior a su introducción o pendiente, no bloqueante.`);
      } else if (declared) {
        warnings.push(`${msg} — válvula de escape documentada en _changelog (hueco declarado, no silencioso).`);
      } else {
        errors.push(`${msg} — SIN ninguna mención en _changelog. Hueco silencioso: ni investigado ni declarado.`);
      }
      continue;
    }

    // Presente: ningún campo hoja puede ser un placeholder sin resolver (ej. "[Q-NNN]...").
    const placeholderLeaves = group.leafPaths.filter((p) => isPlaceholder(get(tokens, p)));
    if (placeholderLeaves.length > 0) {
      errors.push(
        `${group.label} (${levelLabel}) presente en ${packPath} pero con placeholder sin resolver en: ` +
        `${placeholderLeaves.join(', ')} — un campo que se declara investigado no puede contener un ` +
        `"[Q-NNN]"/"[..]" sin resolver (eso es peor que declarar el hueco: parece dato real y no lo es).`
      );
    }
  }

  return { errors, warnings };
}

function main(): void {
  const args = parseArgs();
  let packPath: string;

  if (args.campaign) {
    const campaignDir = path.isAbsolute(args.campaign) ? args.campaign : path.resolve(ROOT, args.campaign);
    const dataPath = path.join(campaignDir, '06-data', 'campaign-data.json');
    if (!fs.existsSync(dataPath)) {
      console.error(`\n  ❌ No existe ${dataPath}\n`);
      process.exit(1);
    }
    const campaignData = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
    if (!campaignData.brand) {
      console.error(`\n  ❌ ${dataPath} no declara "brand".\n`);
      process.exit(1);
    }
    try {
      packPath = resolveBrandPackPath(campaignData.brand);
    } catch (err: any) {
      console.error(`\n  ❌ ${err.message}\n`);
      process.exit(1);
    }
  } else if (args.brand) {
    try {
      packPath = resolveBrandPackPath(`brands/${args.brand}/tokens/brand-tokens.json`);
    } catch (err: any) {
      console.error(`\n  ❌ ${err.message}\n`);
      process.exit(1);
    }
  } else {
    console.error('\n  ❌ Error: falta --campaign o --brand\n');
    console.error('  Uso: npx tsx scripts/check-brand-pack-completeness.ts --campaign newsletters/{year}/{client}/{campaign}\n');
    console.error('   o : npx tsx scripts/check-brand-pack-completeness.ts --brand {slug}\n');
    process.exit(1);
  }

  console.log('\n═══════════════════════════════════════════════════');
  console.log('   check-brand-pack-completeness');
  console.log('═══════════════════════════════════════════════════\n');
  console.log(`   Brand pack: ${packPath}\n`);

  const tokens = JSON.parse(fs.readFileSync(packPath, 'utf8'));
  const { errors, warnings } = checkPack(tokens, packPath);

  for (const w of warnings) console.log(`   ⚠️  ${w}`);
  for (const e of errors) console.log(`   ❌ ${e}`);

  console.log('');
  if (errors.length > 0) {
    console.log('   ❌ check-brand-pack-completeness: FAIL\n');
    process.exit(1);
  }
  console.log('   ✅ check-brand-pack-completeness: OK' + (warnings.length ? ' (con avisos, ver arriba)' : '') + '\n');
}

main();
