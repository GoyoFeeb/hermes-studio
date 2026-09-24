/**
 * dataPhase.ts — fase 06 (Data Specialist): ensambla campaign-data.json a partir de las fases
 * 03/04/05, lo valida contra el schema real del motor (ajv, igual que
 * scripts/create-campaign.ts), y si el patrón requiere una imagen de hero nueva, la genera
 * (heroImage.ts) y sustituye el placeholder por la URL pública real antes de validar.
 */
import * as path from 'path';
import Ajv from 'ajv';
import { readRepoFile, readRepoFilesGlobLike, writeGeneratedFiles } from '../campaignFs';
import { callAgent } from '../llmClient';
import { parseFileBlocks, buildOutputContract } from '../util/fileBlocks';
import { generateHeroImage, toPublicAssetUrl } from '../heroImage';
import { sanitizeLandingPrompt } from '../../../scripts/lib/sanitize-hero-prompt';
import type { JobInput } from '../store';
import { ROOT } from '../paths';
// Misma comprobación de gramática de patrón que aplica el motor en la fase 07 (única fuente,
// no se duplica): así un fallo de orden de módulos entra en la ronda de corrección de la 06 en
// vez de bloquear el job en la 07.
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { loadPattern, validateModulesAgainstPattern } = require('../../../engine/lib/pattern');

const HERO_PLACEHOLDER = '{{GENERATE_HERO}}';
/** Solo para validar antes de generar el hero; nunca se escribe a disco. */
const PROVISIONAL_HERO_URL = 'https://example.com/hero-provisional.png';
const MAX_REPAIRS = 2;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type JsonSchema = any;

function patternErrors(data: JsonSchema, systemRoot: string): string[] {
  let sequence: unknown;
  try {
    ({ sequence } = loadPattern(data.pattern, systemRoot));
  } catch (err) {
    return [(err as Error).message];
  }
  const check = validateModulesAgainstPattern(sequence, data.modules) as { ok: boolean; errors: string[] };
  return check.ok ? [] : check.errors.map((e) => `Patrón "${data.pattern}": ${e}`);
}

/** Valida contra el schema del motor y devuelve errores LEGIBLES. Con `modules.items.oneOf`,
 *  ajv lista los fallos de las ~20 ramas a la vez (cientos de líneas inútiles); aquí cada
 *  módulo inválido se re-valida solo contra la rama de SU componente. */
export function buildValidator(schemaJson: JsonSchema, systemRoot: string = ROOT): (json: string) => string[] {
  const ajv = new Ajv({ allErrors: true, strict: false });
  const validateAll = ajv.compile(schemaJson);
  const branches: JsonSchema[] = schemaJson?.properties?.modules?.items?.oneOf || [];
  const branchValidators = branches.map((b) => ({
    component: b?.properties?.component || {},
    validate: ajv.compile({ ...b, $defs: schemaJson.$defs }),
  }));
  const matches = (c: JsonSchema, name: unknown): boolean =>
    typeof name === 'string' &&
    (c.const === name || (Array.isArray(c.enum) && c.enum.includes(name)) || (c.pattern && new RegExp(c.pattern).test(name)));

  return (json: string): string[] => {
    let data: JsonSchema;
    try {
      data = JSON.parse(json);
    } catch (err) {
      return [`No es JSON válido: ${(err as Error).message}`];
    }
    if (validateAll(data)) return patternErrors(data, systemRoot);

    const out = new Set<string>();
    for (const e of validateAll.errors || []) {
      const m = (e.instancePath || '').match(/^\/modules\/(\d+)/);
      if (!m) {
        out.add(`${e.instancePath || '(raíz)'} ${e.message}`);
        continue;
      }
      const i = Number(m[1]);
      const mod = data?.modules?.[i];
      const branch = branchValidators.find((b) => matches(b.component, mod?.component));
      if (!branch) {
        out.add(`/modules/${i}: el componente "${mod?.component}" no existe en el motor`);
      } else if (!branch.validate(mod)) {
        for (const be of branch.validate.errors || []) {
          const extra = be.keyword === 'additionalProperties' ? ` ("${(be.params as { additionalProperty?: string }).additionalProperty}")` : '';
          out.add(`/modules/${i} (${mod.component})${be.instancePath} ${be.message}${extra}`);
        }
      }
    }
    return [...out];
  };
}

function joinFiles(files: Record<string, string>): string {
  return Object.entries(files)
    .map(([p, c]) => `\n\n--- ${p} ---\n${c}`)
    .join('');
}

export async function runDataPhase(
  campaignRelPath: string,
  campaignSlug: string,
  brandSlug: string,
  input: JobInput
): Promise<void> {
  const expectedFile = path.join(campaignRelPath, '06-data/campaign-data.json');
  const agentPrompt = readRepoFile('agents/06-data-specialist.md');
  const schema = readRepoFile('engine/schema/campaign-data.schema.json');
  const inventory = readRepoFile('engine/components/INVENTORY.md');
  const tokens = readRepoFile(path.join('brands', brandSlug, 'tokens', 'brand-tokens.json'));

  if (!schema) throw new Error('No se encuentra engine/schema/campaign-data.schema.json');

  const systemPrompt = [
    agentPrompt,
    '\n--- engine/schema/campaign-data.schema.json (debes cumplirlo exactamente) ---',
    schema,
    inventory ? `\n--- engine/components/INVENTORY.md (campos exactos por componente) ---\n${inventory}` : '',
    '\n--- Regla especial de esta ejecución automatizada ---',
    'Si un módulo necesita una imagen de hero nueva generada por IA (no un asset real ya',
    `capturado de la marca), usa literalmente "${HERO_PLACEHOLDER}" como valor de ese campo`,
    '"src" — el sistema lo sustituirá por la URL real después de generar la imagen. No inventes',
    'URLs de imagen que no existen para ningún otro campo.',
    buildOutputContract([expectedFile]),
  ].join('\n');

  const userText = [
    joinFiles(readRepoFilesGlobLike(path.join(campaignRelPath, '03-strategy'))),
    joinFiles(readRepoFilesGlobLike(path.join(campaignRelPath, '04-design'))),
    joinFiles(readRepoFilesGlobLike(path.join(campaignRelPath, '05-copy'))),
    tokens ? `\n\n--- brand-tokens.json ---\n${tokens}` : '',
    `\n\nRuta del brand pack a usar en el campo "brand": brands/${brandSlug}/tokens/brand-tokens.json`,
    input.ctaUrl ? `\nEnlace principal confirmado por el compañero: ${input.ctaUrl}` : '',
  ].join('');

  const schemaJson = JSON.parse(schema);
  const validator = buildValidator(schemaJson);

  // Ronda de corrección (2026-09-24): un solo campo mal (p. ej. un string vacío) tumbaba el job
  // entero. Se valida ANTES de generar el hero (la parte cara) con una URL provisional en el
  // placeholder, y si falla se devuelve al modelo el error concreto del módulo afectado.
  let json = '';
  let errors: string[] = [];
  let prompt = userText;
  for (let attempt = 0; attempt <= MAX_REPAIRS; attempt++) {
    const raw = await callAgent({ systemPrompt, userText: prompt, maxTokens: 8000 });
    const files = parseFileBlocks(raw);
    if (!(expectedFile in files)) {
      errors = ['La respuesta no contenía el bloque de campaign-data.json.'];
    } else {
      json = files[expectedFile];
      errors = validator(json.split(HERO_PLACEHOLDER).join(PROVISIONAL_HERO_URL));
    }
    if (errors.length === 0) break;
    prompt = [
      userText,
      json ? `\n\n--- Tu campaign-data.json anterior (NO válido) ---\n${json}` : '',
      '\n\n--- Errores de validación contra el schema del motor ---',
      ...errors.map((e) => `- ${e}`),
      '\nDevuelve campaign-data.json completo y corregido. Ningún campo obligatorio puede ir',
      'vacío: si un componente exige un campo que no tienes, cámbialo por otro componente del',
      'schema que sí encaje con el contenido.',
    ].join('\n');
  }
  if (errors.length > 0) {
    throw new Error(`campaign-data.json no cumple el schema del motor: ${errors.join('; ')}`);
  }

  if (json.includes(HERO_PLACEHOLDER)) {
    // El brief (input.briefText) es texto libre escrito por una persona — mismo tipo de riesgo
    // que la descripción por visión del flujo CLI (incidente BMW, 2026-07-27, ver memory.md):
    // puede nombrar personajes/logos/modelos/matrículas/precios que activan el safety system de
    // OpenAI. Se sanea antes de interpolarlo, no solo el nombre de marca (auditoría 2026-09-23,
    // BUG-H08 — antes Studio generaba el hero sin ningún saneado).
    const sanitizedBrief = sanitizeLandingPrompt(input.briefText, input.clientName);
    const heroPrompt =
      `Imagen de hero premium para un email de marketing de la marca ${input.clientName}. ` +
      `Contexto de campaña: ${sanitizedBrief}. Fotografía de producto o estilo de vida, sin ` +
      'texto superpuesto, sin logotipos de terceros, apta para email marketing.';
    const heroRelPath = await generateHeroImage({ brandSlug, campaignSlug, prompt: heroPrompt });
    json = json.split(HERO_PLACEHOLDER).join(toPublicAssetUrl(heroRelPath));
    const finalErrors = validator(json);
    if (finalErrors.length > 0) {
      throw new Error(`campaign-data.json no cumple el schema del motor: ${finalErrors.join('; ')}`);
    }
  }

  const files = { [expectedFile]: json };
  writeGeneratedFiles(files, [campaignRelPath]);
}
