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

const HERO_PLACEHOLDER = '{{GENERATE_HERO}}';

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

  const raw = await callAgent({ systemPrompt, userText, maxTokens: 8000 });
  const files = parseFileBlocks(raw);

  if (!(expectedFile in files)) {
    throw new Error('La fase 06 no devolvió campaign-data.json');
  }

  if (files[expectedFile].includes(HERO_PLACEHOLDER)) {
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
    const publicUrl = toPublicAssetUrl(heroRelPath);
    files[expectedFile] = files[expectedFile].split(HERO_PLACEHOLDER).join(publicUrl);
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(files[expectedFile]);
  } catch (err) {
    throw new Error(`campaign-data.json generado no es JSON válido: ${(err as Error).message}`);
  }

  const schemaJson = JSON.parse(schema);
  const ajv = new Ajv({ allErrors: true, strict: false });
  const validateFn = ajv.compile(schemaJson);
  if (!validateFn(parsed)) {
    const messages = (validateFn.errors || []).map((e) => `${e.instancePath || '(raíz)'} ${e.message}`).join('; ');
    throw new Error(`campaign-data.json no cumple el schema del motor: ${messages}`);
  }

  writeGeneratedFiles(files, [campaignRelPath]);
}
