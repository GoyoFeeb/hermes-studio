/**
 * brandPhase.ts — fase 02 (Brand Visual Analyst) automatizada: captura la web real de la marca
 * (brandCapture.ts) y le pasa los datos ya extraídos a Claude para que redacte el brand pack.
 * Ver la limitación documentada en brandCapture.ts y en studio/README.md.
 */
import * as path from 'path';
import { readRepoFile, writeGeneratedFiles } from '../campaignFs';
import { captureBrandSite } from '../brandCapture';
import { callAgent } from '../llmClient';
import { parseFileBlocks, buildOutputContract } from '../util/fileBlocks';
import type { JobInput } from '../store';

export async function runBrandPhase(campaignRelPath: string, brandSlug: string, input: JobInput): Promise<void> {
  if (!input.brandUrl) {
    throw new Error('Falta la URL de la marca para poder analizarla (fase 02).');
  }

  const capture = await captureBrandSite(brandSlug, input.brandUrl);

  const expected = [
    `brands/${brandSlug}/tokens/brand-tokens.json`,
    path.join(campaignRelPath, '02-analysis/brand-analysis.md'),
    path.join(campaignRelPath, '02-analysis/visual-analysis.md'),
    path.join(campaignRelPath, '02-analysis/risks.md'),
  ];

  const agentPrompt = readRepoFile('agents/02-brand-visual-analyst.md');
  const schema = readRepoFile('engine/schema/brand-tokens.schema.json');

  const systemPrompt = [
    agentPrompt,
    '',
    '--- LIMITACIÓN DE ESTA EJECUCIÓN AUTOMATIZADA ---',
    'No tienes control interactivo de un navegador: te han dado ya 2 capturas de la home de la',
    'marca (viewport 1280px y 390px) y un extracto de getComputedStyle de un puñado de',
    'selectores clave (body, h1, h2, párrafo, botón/CTA probable, header/nav). Marca como',
    '"inferido" (nunca "observado") cualquier valor que no puedas confirmar directamente en',
    'estos datos, tal como exige tu propio contrato de procedencia.',
    schema ? `\n--- engine/schema/brand-tokens.schema.json ---\n${schema}` : '',
    buildOutputContract(expected),
  ].join('\n');

  const userText = [
    `Marca: ${input.clientName} (slug: ${brandSlug})`,
    `URL analizada: ${input.brandUrl}`,
    `Brief de la campaña que va a usar esta marca: ${input.briefText}`,
    '',
    '--- getComputedStyle extraído (viewport 1280px) ---',
    JSON.stringify(capture.computedStyles, null, 2),
    capture.capturedLogoRelPath
      ? `\nLogo capturado automáticamente en: ${capture.capturedLogoRelPath}. Está servido por ` +
        'este mismo servicio en STUDIO_PUBLIC_BASE_URL + "/assets/" + la ruta sin el prefijo ' +
        '"brands/" (por ejemplo, si STUDIO_PUBLIC_BASE_URL es https://hermes.miempresa.com, ' +
        `la URL pública es https://hermes.miempresa.com/assets/${brandSlug}/logo-captured.<ext>).`
      : '\nNo se pudo capturar un logo automáticamente — decláralo como riesgo/pendiente en ' +
        'risks.md, no inventes una URL de logo que no existe.',
  ].join('\n');

  const raw = await callAgent({
    systemPrompt,
    userText,
    images: capture.screenshots.map((s) => ({ base64: s.base64, mediaType: s.mediaType })),
    maxTokens: 8000,
  });

  const files = parseFileBlocks(raw);
  const missing = expected.filter((f) => !(f in files));
  if (missing.length > 0) {
    throw new Error(`La fase 02 no devolvió: ${missing.join(', ')}`);
  }

  writeGeneratedFiles(files, [campaignRelPath, `brands/${brandSlug}`]);
}
