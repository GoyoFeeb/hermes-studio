/**
 * textPhase.ts — ejecutor genérico para las fases que son razonamiento de texto puro (01, 03,
 * 04, 05: leen artefactos ya en disco, escriben markdown, sin navegador ni imagen). Cada fase
 * se describe como un TextPhaseSpec (ver phases/specs.ts) y este módulo se encarga de armar el
 * system prompt (agente + contrato de salida), llamar al modelo, parsear y escribir.
 */
import { readRepoFile, writeGeneratedFiles } from '../campaignFs';
import { callAgent } from '../anthropicClient';
import { parseFileBlocks, buildOutputContract } from '../util/fileBlocks';
import type { JobInput } from '../store';

export interface TextPhaseSpec {
  id: string;
  label: string;
  agentFile: string;
  expectedFiles: (campaignRelPath: string) => string[];
  buildContext: (campaignRelPath: string, jobInput: JobInput) => string;
}

export async function runTextPhase(
  spec: TextPhaseSpec,
  campaignRelPath: string,
  jobInput: JobInput
): Promise<Record<string, string>> {
  const agentPrompt = readRepoFile(spec.agentFile);
  if (!agentPrompt) throw new Error(`No se encuentra ${spec.agentFile}`);

  const expected = spec.expectedFiles(campaignRelPath);
  const systemPrompt = `${agentPrompt}\n${buildOutputContract(expected)}`;
  const userText = spec.buildContext(campaignRelPath, jobInput);

  const raw = await callAgent({ systemPrompt, userText, maxTokens: 8000 });
  const files = parseFileBlocks(raw);

  const missing = expected.filter((f) => !(f in files));
  if (missing.length > 0) {
    throw new Error(`La fase ${spec.id} no devolvió: ${missing.join(', ')}`);
  }

  writeGeneratedFiles(files, [campaignRelPath]);
  return files;
}
