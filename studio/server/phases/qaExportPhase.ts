/**
 * qaExportPhase.ts — fase 08 (QA Specialist) y fase 09 (Export Manager).
 *
 * Fase 08 renderiza el HTML ya construido en 4 tamaños (scripts/render-preview.js, el mismo
 * script que produce esas 4 imágenes en el flujo manual) y le pide a Claude un veredicto sobre
 * esos renders + los datos de campaña. El veredicto se pide en dos formas: el markdown legible
 * de siempre (08-qa/final-checklist.md) y un bloque JSON machine-readable adicional que este
 * servicio necesita para decidir automáticamente si entrega el HTML o no.
 *
 * Fase 09 corre production-gate-motor.ts (13 gates) y parsea su stdout de texto plano — no
 * existe un modo --json en el script real, así que el parseo es por regex sobre el resumen
 * final que el propio script imprime.
 */
import * as path from 'path';
import * as fs from 'fs';
import { execFile } from 'child_process';
import { promisify } from 'util';
import { ROOT } from '../paths';
import { readRepoFile, writeGeneratedFiles } from '../campaignFs';
import { callAgent } from '../llmClient';
import { parseFileBlocks, buildOutputContract } from '../util/fileBlocks';
import type { JobInput } from '../store';

const execFileAsync = promisify(execFile);
const VERDICT_KEY = '__verdict__.json';

export interface QAResult {
  verdict: 'Aprobado' | 'Devuelto' | 'Bloqueado';
  blockers: string[];
}

export async function runQaPhase(campaignRelPath: string, brandSlug: string, input: JobInput): Promise<QAResult> {
  const finalHtmlRel = path.join(campaignRelPath, '09-exports', 'final.html');
  const prefixRel = path.join(campaignRelPath, '09-exports', 'qa-preview');

  await execFileAsync('node', ['scripts/render-preview.js', '--file', finalHtmlRel, '--out-prefix', prefixRel], {
    cwd: ROOT,
  });

  const sizes = ['320', '375', '600', '600-dark'];
  const images = sizes.map((size) => {
    const abs = path.join(ROOT, `${prefixRel}-${size}.png`);
    return { base64: fs.readFileSync(abs).toString('base64'), mediaType: 'image/png' };
  });

  const expected = [path.join(campaignRelPath, '08-qa/final-checklist.md')];
  const agentPrompt = readRepoFile('agents/08-qa-specialist.md');
  const campaignData = readRepoFile(path.join(campaignRelPath, '06-data/campaign-data.json'));
  const tokens = readRepoFile(path.join('brands', brandSlug, 'tokens', 'brand-tokens.json'));

  const systemPrompt = [
    agentPrompt,
    '\n--- Formato adicional obligatorio de esta ejecución automatizada ---',
    'Además de los archivos de texto pedidos abajo, incluye SIEMPRE un bloque extra con el',
    `veredicto machine-readable, usando esta ruta literal de archivo "${VERDICT_KEY}" y este`,
    'contenido exacto (JSON válido, una sola línea, sin comentarios ni texto extra):',
    '{"verdict": "Aprobado" | "Devuelto" | "Bloqueado", "blockers": ["motivo concreto 1", "..."]}',
    '"blockers" debe estar vacío solo si verdict es "Aprobado". Sé estricto: un compañero de',
    'equipo va a recibir este HTML sin que nadie más lo revise antes.',
    // El veredicto va TAMBIÉN en la lista del contrato: el contrato dice "EXCLUSIVAMENTE los
    // archivos pedidos", y un modelo que lo sigue al pie de la letra (gpt-5.4-mini, 2026-09-24)
    // omitía el bloque del veredicto por no estar en esa lista.
    buildOutputContract([...expected, VERDICT_KEY]),
  ].join('\n');

  const userText = [
    `Brief original: ${input.briefText}`,
    campaignData ? `\n\n--- campaign-data.json ---\n${campaignData}` : '',
    tokens ? `\n\n--- brand-tokens.json ---\n${tokens}` : '',
    '\n\nAdjunto: 4 renders (320/375/600/600-dark) del final.html ya construido por el motor.',
  ].join('');

  const raw = await callAgent({ systemPrompt, userText, images, maxTokens: 6000 });
  const files = parseFileBlocks(raw);

  const verdictRaw = files[VERDICT_KEY];
  delete files[VERDICT_KEY];

  const missing = expected.filter((f) => !(f in files));
  if (missing.length > 0) {
    throw new Error(`La fase 08 no devolvió: ${missing.join(', ')}`);
  }
  writeGeneratedFiles(files, [campaignRelPath]);

  return extractVerdict(verdictRaw, files[expected[0]]);
}

/** "Aprobado — prueba interna" / "Aprobado — producción" (agents/08-qa-specialist.md) cuentan
 *  como Aprobado; el nivel lo decide después el production gate de la fase 09. */
function normalizeVerdict(value: unknown): QAResult['verdict'] | null {
  const m = String(value ?? '').trim().match(/^(Aprobado|Devuelto|Bloqueado)\b/i);
  if (!m) return null;
  return (m[1][0].toUpperCase() + m[1].slice(1).toLowerCase()) as QAResult['verdict'];
}

export function extractVerdict(verdictRaw: string | undefined, checklist: string | undefined): QAResult {
  if (verdictRaw) {
    let parsed: { verdict?: unknown; blockers?: unknown };
    try {
      parsed = JSON.parse(verdictRaw.trim().replace(/^```(?:json)?\s*|\s*```$/g, ''));
    } catch (err) {
      throw new Error(`Veredicto de QA no es JSON válido: ${(err as Error).message}`);
    }
    const verdict = normalizeVerdict(parsed.verdict);
    if (!verdict) throw new Error(`Veredicto de QA no reconocido: ${String(parsed.verdict)}`);
    const blockers = Array.isArray(parsed.blockers) ? parsed.blockers.map(String) : [];
    return { verdict, blockers };
  }

  // Sin bloque JSON: el veredicto humano de final-checklist.md es la fuente de verdad del
  // agente 08 ("Veredicto: ..." — ver agents/08-qa-specialist.md). Solo se acepta si está
  // declarado explícitamente; si no, se falla en vez de adivinar.
  const line = checklist?.match(/veredicto[^:\n]*:\s*\**\s*([^\n]+)/i);
  const verdict = line ? normalizeVerdict(line[1].replace(/\*/g, '')) : null;
  if (!verdict) {
    throw new Error('La fase 08 no devolvió el veredicto machine-readable esperado.');
  }
  const blockers =
    verdict === 'Aprobado'
      ? []
      : ['Veredicto tomado de 08-qa/final-checklist.md (sin bloque JSON) — ver ese archivo para los motivos.'];
  return { verdict, blockers };
}

export interface GateResult {
  ok: boolean;
  output: string;
  failedGates: string[];
}

export async function runProductionGate(campaignRelPath: string): Promise<GateResult> {
  try {
    const { stdout } = await execFileAsync('npx', ['tsx', 'scripts/production-gate-motor.ts', '--campaign', campaignRelPath], {
      cwd: ROOT,
    });
    return { ok: true, output: stdout, failedGates: [] };
  } catch (err) {
    const e = err as { stdout?: string; stderr?: string; message: string };
    const output = (e.stdout || '') + (e.stderr ? `\n${e.stderr}` : '') || e.message;
    const match = output.match(/gate\(s\) failed:\s*(.+)/i);
    const failedGates = match ? match[1].split(',').map((s) => s.trim()) : [];
    return { ok: false, output, failedGates };
  }
}

export function writeDeliveryNotes(campaignRelPath: string, gate: GateResult): void {
  const manifestPath = path.join(ROOT, campaignRelPath, '09-exports', 'build-manifest.json');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let manifest: any = {};
  try {
    manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  } catch {
    // El manifest es informativo; su ausencia no debe bloquear la escritura de las notas.
  }

  const lines = [
    '# Delivery Notes',
    '',
    `Generado automáticamente por Hermes Studio el ${new Date().toISOString()}.`,
    '',
    `- Production gate: ${gate.ok ? 'PASSED' : 'FAILED'}`,
    gate.failedGates.length ? `- Gates fallidos: ${gate.failedGates.join(', ')}` : '',
    `- final.html: ${path.join(campaignRelPath, '09-exports/final.html')}`,
    `- final-inline.html: ${path.join(campaignRelPath, '09-exports/final-inline.html')}`,
    manifest.pattern ? `- Patrón: ${manifest.pattern}` : '',
    manifest.brandVersion ? `- Versión de brand pack: ${manifest.brandVersion}` : '',
  ].filter(Boolean);

  fs.writeFileSync(path.join(ROOT, campaignRelPath, '09-exports', 'delivery-notes.md'), lines.join('\n') + '\n', 'utf8');
}
