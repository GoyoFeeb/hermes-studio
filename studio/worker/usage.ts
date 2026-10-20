/**
 * usage.ts — tokens de una sesión de Hermes (2026-10-20).
 *
 * `hermes sessions export` devuelve el objeto de la sesión. Cada mensaje puede traer
 * `usage` (o `token_usage`) con entrada, salida y caché. Al retomar una sesión el
 * export trae también los mensajes ya contados: el libro se queda con el total visto
 * y solo suma el incremento, por fase y por modelo.
 */
import { costFor, type TokenCounts } from './pricing';

export type { TokenCounts };

export interface UsagePhase extends TokenCounts {
  id: string;
  model: string;
  provider: string;
}

export interface UsageReport {
  inputTokens: number;
  outputTokens: number;
  cacheTokens: number;
  costUsd: number | null;
  costEur: number | null;
  model: string | null;
  provider: string | null;
  phases: {
    id: string;
    model: string;
    provider: string;
    inputTokens: number;
    outputTokens: number;
    cacheTokens: number;
    costUsd: number | null;
    costEur: number | null;
  }[];
}

const INPUT_KEYS = ['input_tokens', 'input', 'prompt_tokens', 'promptTokens'];
const OUTPUT_KEYS = ['output_tokens', 'output', 'completion_tokens', 'completionTokens'];

function zero(): TokenCounts {
  return { input: 0, output: 0, cache: 0 };
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

function cacheFrom(bag: Record<string, unknown>): number | null {
  const direct = firstNum(bag, ['cache_tokens', 'cache']);
  if (direct != null) return direct;
  const read = firstNum(bag, ['cache_read_input_tokens', 'cache_read_tokens', 'cached_tokens', 'cacheReadInputTokens']);
  const details = asBag(bag.prompt_tokens_details) || asBag(bag.input_tokens_details);
  const fromDetails = firstNum(details, ['cached_tokens', 'cache_read_input_tokens', 'cache_tokens']);
  const write = firstNum(bag, ['cache_creation_input_tokens', 'cache_write_tokens', 'cache_creation_tokens', 'cacheWriteTokens']);
  const cacheRead = read != null ? read : fromDetails;
  if (cacheRead == null && write == null) return null;
  return (cacheRead || 0) + (write || 0);
}

function tokensFromBag(bag: Record<string, unknown>): TokenCounts | null {
  const input = firstNum(bag, INPUT_KEYS);
  const output = firstNum(bag, OUTPUT_KEYS);
  const cache = cacheFrom(bag);
  if (input == null && output == null && cache == null) return null;
  return { input: input || 0, output: output || 0, cache: cache || 0 };
}

/** Tokens de un mensaje. Cero si no trae uso. */
export function usageFromMessage(message: unknown): TokenCounts {
  const record = asBag(message);
  if (!record) return zero();
  const meta = asBag(record.metadata);
  const response = asBag(record.response);
  const candidates = [record.usage, record.token_usage, meta?.usage, response?.usage, record];
  for (const candidate of candidates) {
    const bag = asBag(candidate);
    const parsed = bag ? tokensFromBag(bag) : null;
    if (parsed) return parsed;
  }
  return zero();
}

/** Suma el uso de cada mensaje de una sesión exportada. */
export function sessionUsage(session: { messages?: unknown[] } | unknown[] | null | undefined): TokenCounts {
  const messages = Array.isArray(session) ? session : session?.messages || [];
  return messages.reduce(
    (sum, message) => {
      const part = usageFromMessage(message);
      return { input: sum.input + part.input, output: sum.output + part.output, cache: sum.cache + part.cache };
    },
    zero()
  );
}

function add(a: TokenCounts, b: TokenCounts): TokenCounts {
  return { input: a.input + b.input, output: a.output + b.output, cache: a.cache + b.cache };
}

function round6(n: number): number {
  return Math.round(n * 1e6) / 1e6;
}

/**
 * Acumulado de un trabajo. `note` recibe el export entero de la sesión y solo suma
 * lo nuevo. `seed` mete tokens de una ejecución anterior del mismo trabajo (el brief
 * que esperó aprobación) para no perderlos al volver a cogerlo.
 */
export class UsageLedger {
  private seen = new Map<string, TokenCounts>();
  private phases = new Map<string, UsagePhase>();

  constructor(private readonly job: { model: string; provider: string }) {}

  seed(prior: Partial<TokenCounts> & { model?: string | null; provider?: string | null }): void {
    const tokens = { input: prior.input || 0, output: prior.output || 0, cache: prior.cache || 0 };
    if (!tokens.input && !tokens.output && !tokens.cache) return;
    const model = prior.model || this.job.model || '';
    const provider = prior.provider || this.job.provider || '';
    const key = `previo\0${model}\0${provider}`;
    const current = this.phases.get(key) || { id: 'previo', model, provider, ...zero() };
    this.phases.set(key, { ...current, ...add(current, tokens) });
  }

  /** Incremento atribuido a esta fase. Cero si la sesión no trae uso nuevo. */
  note(sessionId: string, session: { messages?: unknown[] } | unknown[] | null | undefined, phase: string, model: string, provider: string): TokenCounts {
    const total = sessionUsage(session);
    const prev = this.seen.get(sessionId) || zero();
    const delta = {
      input: Math.max(0, total.input - prev.input),
      output: Math.max(0, total.output - prev.output),
      cache: Math.max(0, total.cache - prev.cache),
    };
    this.seen.set(sessionId, {
      input: Math.max(prev.input, total.input),
      output: Math.max(prev.output, total.output),
      cache: Math.max(prev.cache, total.cache),
    });
    if (!delta.input && !delta.output && !delta.cache) return delta;
    const usedModel = model || this.job.model || '';
    const usedProvider = provider || this.job.provider || '';
    const key = `${phase}\0${usedModel}\0${usedProvider}`;
    const current = this.phases.get(key) || { id: phase, model: usedModel, provider: usedProvider, ...zero() };
    this.phases.set(key, { ...current, ...add(current, delta) });
    return delta;
  }

  report(env: NodeJS.ProcessEnv = process.env): UsageReport {
    let input = 0;
    let output = 0;
    let cache = 0;
    let usd = 0;
    let eur = 0;
    let priced = false;
    const phases = [...this.phases.values()].map((phase) => {
      input += phase.input;
      output += phase.output;
      cache += phase.cache;
      const cost = costFor(phase, phase.provider, phase.model, env);
      const used = phase.input + phase.output + phase.cache;
      if (cost && used > 0) {
        priced = true;
        usd += cost.usd;
        eur += cost.eur;
      }
      return {
        id: phase.id,
        model: phase.model,
        provider: phase.provider,
        inputTokens: phase.input,
        outputTokens: phase.output,
        cacheTokens: phase.cache,
        costUsd: cost?.usd ?? null,
        costEur: cost?.eur ?? null,
      };
    });
    const hasTokens = input + output + cache > 0;
    return {
      inputTokens: input,
      outputTokens: output,
      cacheTokens: cache,
      costUsd: !hasTokens ? 0 : priced ? round6(usd) : null,
      costEur: !hasTokens ? 0 : priced ? round6(eur) : null,
      model: this.job.model || null,
      provider: this.job.provider || null,
      phases,
    };
  }
}
