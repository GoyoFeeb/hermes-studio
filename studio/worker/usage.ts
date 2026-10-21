/**
 * usage.ts — tokens de una sesión de Hermes y de cada llamada directa (2026-10-21).
 *
 * `hermes sessions export` devuelve el objeto de la sesión. Cada mensaje puede traer
 * `usage` (o `token_usage`) con entrada, salida y caché de lectura y de escritura.
 * Al retomar una sesión el export trae también los mensajes ya contados: el libro se
 * queda con el total visto y solo suma el incremento, por paso y por modelo.
 * `addCall` suma una llamada que no pasa por una sesión (el brief de ClickUp, p. ej.).
 */
import { costFor, type TokenCounts } from './pricing';

export type { TokenCounts };

export interface UsagePhase extends TokenCounts {
  id: string;
  model: string;
  provider: string;
  durationSec: number;
}

export interface UsageStepReport {
  id: string;
  label: string;
  model: string;
  provider: string;
  inputTokens: number;
  outputTokens: number;
  cacheReadTokens: number;
  cacheWriteTokens: number;
  cacheTokens: number;
  costUsd: number | null;
  costEur: number | null;
  durationSec: number;
}

export interface UsageReport {
  inputTokens: number;
  outputTokens: number;
  cacheReadTokens: number;
  cacheWriteTokens: number;
  cacheTokens: number;
  costUsd: number | null;
  costEur: number | null;
  durationSec: number;
  model: string | null;
  provider: string | null;
  phases: UsageStepReport[];
}

const INPUT_KEYS = ['input_tokens', 'input', 'prompt_tokens', 'promptTokens'];
const OUTPUT_KEYS = ['output_tokens', 'output', 'completion_tokens', 'completionTokens'];

const STEP_LABELS: Record<string, string> = {
  brief: 'Brief',
  'brief-normalizado': 'Brief normalizado',
  draft: 'Generación',
  measure: 'Identidad',
  product: 'Ficha de producto',
  selfaudit: 'Autoauditoría',
  check: 'Comprobación',
  art: 'Nota visual',
  nota: 'Nota visual',
  defectos: 'Arreglo de defectos',
  gusto: 'Pasada de gusto',
  comparacion: 'Comparación',
  previo: 'Uso anterior',
  otro: 'Otro',
};

export function usageStepLabel(id: string): string {
  const channelB = id.startsWith('b-');
  const core = channelB ? id.slice(2) : id;
  let label = STEP_LABELS[core];
  const fix = core.match(/^fix-(\d+)$/);
  const mejora = core.match(/^mejora-(\d+)$/);
  const nota = core.match(/^nota-mejora-(\d+)$/);
  if (!label && fix) label = `Corrección ${fix[1]}`;
  if (!label && mejora) label = `Mejora ${mejora[1]}`;
  if (!label && nota) label = `Nota tras la mejora ${nota[1]}`;
  if (!label) label = core || 'Otro';
  return channelB ? `${label} (B)` : label;
}

function zero(): TokenCounts {
  return { input: 0, output: 0, cache: 0, cacheRead: 0, cacheWrite: 0, cacheWrite1h: 0 };
}

function asBag(value: unknown): Record<string, unknown> | null {
  if (!value) return null;
  if (typeof value === 'string') {
    try {
      return asBag(JSON.parse(value));
    } catch {
      return null;
    }
  }
  if (typeof value === 'object') return value as Record<string, unknown>;
  return null;
}

function firstNum(bag: Record<string, unknown> | null, keys: string[]): number | null {
  if (!bag) return null;
  for (const key of keys) {
    const n = Number(bag[key]);
    if (Number.isFinite(n) && n >= 0) return n;
  }
  return null;
}

function tokensFromBag(bag: Record<string, unknown>): TokenCounts | null {
  const input = firstNum(bag, INPUT_KEYS);
  const output = firstNum(bag, OUTPUT_KEYS);
  const read = firstNum(bag, ['cache_read_input_tokens', 'cache_read_tokens', 'cacheReadInputTokens']);
  const details = asBag(bag.prompt_tokens_details) || asBag(bag.input_tokens_details);
  const fromDetails = firstNum(details, ['cached_tokens', 'cache_read_input_tokens', 'cache_tokens']);
  const cacheRead = read != null ? read : fromDetails;
  const write = firstNum(bag, ['cache_creation_input_tokens', 'cache_write_tokens', 'cache_creation_tokens', 'cacheWriteTokens']);
  const creation = asBag(bag.cache_creation);
  const write5 = firstNum(creation, ['ephemeral_5m_input_tokens']);
  const write1h = firstNum(creation, ['ephemeral_1h_input_tokens']);
  const cacheWrite = write != null ? write : write5 != null || write1h != null ? (write5 || 0) + (write1h || 0) : null;
  const combined = firstNum(bag, ['cache_tokens', 'cache']);
  if (input == null && output == null && cacheRead == null && cacheWrite == null && combined == null) return null;
  const cacheReadN = cacheRead || 0;
  const cacheWriteN = cacheWrite || 0;
  const cacheWrite1h = Math.min(cacheWriteN, write1h || 0);
  const split = cacheReadN + cacheWriteN;
  return {
    input: input || 0,
    output: output || 0,
    cacheRead: cacheReadN,
    cacheWrite: cacheWriteN,
    cacheWrite1h,
    cache: split > 0 ? split : combined || 0,
  };
}

/** Tokens de un mensaje o de una respuesta de API. Cero si no trae uso. */
export function usageFromMessage(message: unknown): TokenCounts {
  const record = asBag(message);
  if (!record) return zero();
  const meta = asBag(record.metadata);
  const response = asBag(record.response) || asBag(record.raw) || asBag(record.raw_response) || asBag(record.api_response);
  const llm = asBag(record.llm);
  const candidates = [
    record.usage,
    record.token_usage,
    record.tokenUsage,
    meta?.usage,
    meta?.token_usage,
    response?.usage,
    llm?.usage,
    asBag(record.result)?.usage,
    record,
  ];
  for (const candidate of candidates) {
    const bag = asBag(candidate);
    const parsed = bag ? tokensFromBag(bag) : null;
    if (parsed) return parsed;
  }
  return zero();
}

function sumCounts(parts: TokenCounts[]): TokenCounts {
  return parts.reduce((sum, part) => add(sum, part), zero());
}

/** Suma el uso de cada mensaje. Si ninguno trae tokens, mira el uso de la sesión entera. */
export function sessionUsage(session: { messages?: unknown[] } | unknown[] | null | undefined): TokenCounts {
  const record = Array.isArray(session) ? null : asBag(session);
  const messages = Array.isArray(session) ? session : record?.messages && Array.isArray(record.messages) ? record.messages : [];
  const fromMessages = sumCounts(messages.map((message) => usageFromMessage(message)));
  if (fromMessages.input || fromMessages.output || fromMessages.cache) return fromMessages;
  if (!record) return zero();
  const top = usageFromMessage({
    usage: record.usage || record.token_usage || asBag(record.metadata)?.usage || asBag(record.stats)?.usage,
  });
  return top;
}

function add(a: TokenCounts, b: TokenCounts): TokenCounts {
  return {
    input: a.input + b.input,
    output: a.output + b.output,
    cache: a.cache + b.cache,
    cacheRead: (a.cacheRead || 0) + (b.cacheRead || 0),
    cacheWrite: (a.cacheWrite || 0) + (b.cacheWrite || 0),
    cacheWrite1h: (a.cacheWrite1h || 0) + (b.cacheWrite1h || 0),
  };
}

function round6(n: number): number {
  return Math.round(n * 1e6) / 1e6;
}

export interface SeedUsage {
  input?: number;
  output?: number;
  cache?: number;
  cacheRead?: number;
  cacheWrite?: number;
  cacheWrite1h?: number;
  model?: string | null;
  provider?: string | null;
  steps?: {
    id: string;
    model?: string | null;
    provider?: string | null;
    inputTokens?: number;
    outputTokens?: number;
    cacheReadTokens?: number;
    cacheWriteTokens?: number;
    cacheTokens?: number;
    durationSec?: number;
  }[];
}

/**
 * Acumulado de un trabajo. `note` recibe el export entero de la sesión y solo suma
 * lo nuevo. `seed` mete tokens de una ejecución anterior del mismo trabajo (el brief
 * que esperó aprobación, o la normalización del brief) para no perderlos al volver a cogerlo.
 */
export class UsageLedger {
  private seen = new Map<string, TokenCounts>();
  private phases = new Map<string, UsagePhase>();

  constructor(private readonly job: { model: string; provider: string }) {}

  seed(prior: SeedUsage): void {
    if (prior.steps?.length) {
      for (const step of prior.steps) {
        const tokens = {
          input: step.inputTokens || 0,
          output: step.outputTokens || 0,
          cacheRead: step.cacheReadTokens || 0,
          cacheWrite: step.cacheWriteTokens || 0,
          cacheWrite1h: 0,
          cache: step.cacheTokens || (step.cacheReadTokens || 0) + (step.cacheWriteTokens || 0),
        };
        if (!tokens.input && !tokens.output && !tokens.cache && !(step.durationSec || 0)) continue;
        const model = step.model || prior.model || this.job.model || '';
        const provider = step.provider || prior.provider || this.job.provider || '';
        const key = `${step.id}\0${model}\0${provider}`;
        const current = this.phases.get(key) || { id: step.id, model, provider, durationSec: 0, ...zero() };
        this.phases.set(key, { ...current, ...add(current, tokens), durationSec: current.durationSec + Math.max(0, Math.round(step.durationSec || 0)) });
      }
      return;
    }
    const tokens = {
      input: prior.input || 0,
      output: prior.output || 0,
      cacheRead: prior.cacheRead || 0,
      cacheWrite: prior.cacheWrite || 0,
      cacheWrite1h: prior.cacheWrite1h || 0,
      cache: prior.cache || (prior.cacheRead || 0) + (prior.cacheWrite || 0),
    };
    if (!tokens.input && !tokens.output && !tokens.cache) return;
    const model = prior.model || this.job.model || '';
    const provider = prior.provider || this.job.provider || '';
    const key = `previo\0${model}\0${provider}`;
    const current = this.phases.get(key) || { id: 'previo', model, provider, durationSec: 0, ...zero() };
    this.phases.set(key, { ...current, ...add(current, tokens) });
  }

  /** Suma una llamada que no viene de una sesión (respuesta directa de la API). */
  addCall(phase: string, tokens: TokenCounts, model: string, provider: string, durationSec = 0): void {
    if (!tokens.input && !tokens.output && !tokens.cache && !durationSec) return;
    const usedModel = model || this.job.model || '';
    const usedProvider = provider || this.job.provider || '';
    const key = `${phase}\0${usedModel}\0${usedProvider}`;
    const current = this.phases.get(key) || { id: phase, model: usedModel, provider: usedProvider, durationSec: 0, ...zero() };
    this.phases.set(key, {
      ...current,
      ...add(current, tokens),
      durationSec: current.durationSec + Math.max(0, Math.round(durationSec)),
    });
  }

  /** Incremento atribuido a este paso. Cero si la sesión no trae uso nuevo. */
  note(
    sessionId: string,
    session: { messages?: unknown[] } | unknown[] | null | undefined,
    phase: string,
    model: string,
    provider: string,
    durationSec = 0
  ): TokenCounts {
    const total = sessionUsage(session);
    const prev = this.seen.get(sessionId) || zero();
    const delta = {
      input: Math.max(0, total.input - prev.input),
      output: Math.max(0, total.output - prev.output),
      cache: Math.max(0, total.cache - prev.cache),
      cacheRead: Math.max(0, (total.cacheRead || 0) - (prev.cacheRead || 0)),
      cacheWrite: Math.max(0, (total.cacheWrite || 0) - (prev.cacheWrite || 0)),
      cacheWrite1h: Math.max(0, (total.cacheWrite1h || 0) - (prev.cacheWrite1h || 0)),
    };
    this.seen.set(sessionId, {
      input: Math.max(prev.input, total.input),
      output: Math.max(prev.output, total.output),
      cache: Math.max(prev.cache, total.cache),
      cacheRead: Math.max(prev.cacheRead || 0, total.cacheRead || 0),
      cacheWrite: Math.max(prev.cacheWrite || 0, total.cacheWrite || 0),
      cacheWrite1h: Math.max(prev.cacheWrite1h || 0, total.cacheWrite1h || 0),
    });
    const sec = Math.max(0, Math.round(durationSec));
    if (!delta.input && !delta.output && !delta.cache && !sec) return delta;
    const usedModel = model || this.job.model || '';
    const usedProvider = provider || this.job.provider || '';
    const key = `${phase}\0${usedModel}\0${usedProvider}`;
    const current = this.phases.get(key) || { id: phase, model: usedModel, provider: usedProvider, durationSec: 0, ...zero() };
    this.phases.set(key, { ...current, ...add(current, delta), durationSec: current.durationSec + sec });
    return delta;
  }

  report(env: NodeJS.ProcessEnv = process.env): UsageReport {
    let input = 0;
    let output = 0;
    let cache = 0;
    let cacheRead = 0;
    let cacheWrite = 0;
    let durationSec = 0;
    let usd = 0;
    let eur = 0;
    let priced = false;
    const phases = [...this.phases.values()].map((phase) => {
      input += phase.input;
      output += phase.output;
      cache += phase.cache;
      cacheRead += phase.cacheRead || 0;
      cacheWrite += phase.cacheWrite || 0;
      durationSec += phase.durationSec || 0;
      const cost = costFor(phase, phase.provider, phase.model, env);
      const used = phase.input + phase.output + phase.cache;
      if (cost && used > 0) {
        priced = true;
        usd += cost.usd;
        eur += cost.eur;
      }
      return {
        id: phase.id,
        label: usageStepLabel(phase.id),
        model: phase.model,
        provider: phase.provider,
        inputTokens: phase.input,
        outputTokens: phase.output,
        cacheReadTokens: phase.cacheRead || 0,
        cacheWriteTokens: phase.cacheWrite || 0,
        cacheTokens: phase.cache,
        costUsd: cost && used > 0 ? cost.usd : used > 0 ? null : 0,
        costEur: cost && used > 0 ? cost.eur : used > 0 ? null : 0,
        durationSec: phase.durationSec || 0,
      };
    });
    const hasTokens = input + output + cache > 0;
    return {
      inputTokens: input,
      outputTokens: output,
      cacheReadTokens: cacheRead,
      cacheWriteTokens: cacheWrite,
      cacheTokens: cache,
      costUsd: !hasTokens ? 0 : priced ? round6(usd) : null,
      costEur: !hasTokens ? 0 : priced ? round6(eur) : null,
      durationSec,
      model: this.job.model || null,
      provider: this.job.provider || null,
      phases,
    };
  }
}
