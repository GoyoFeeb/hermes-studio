/**
 * pricing.ts — precio de los tokens de un trabajo (2026-10-21).
 *
 * USD por millón de tokens. La tabla por defecto es `price-table.json` (mismo directorio).
 * `HERMES_PRICE_TABLE` (JSON) la pisa. `HERMES_PRICE_<PROVEEDOR>_<MODELO>` o
 * `HERMES_PRICE_<MODELO>` pisan un modelo: `entrada,salida,cache` o
 * `entrada,salida,lectura,escritura` (la quinta cifra, si viene, es la escritura de caché de 1 h).
 *
 * El euro sale de `HERMES_USD_EUR` (si no está, `USD_EUR`). Por defecto 0,92.
 *
 * Tarifas de catálogo de Anthropic, Claude API, estándar, global, cualquier contexto.
 * Fuente: https://platform.claude.com/docs/en/about-claude/pricing
 * (lista vigente el 2026-10-07, https://platform.claude.com/docs/en/about-claude/pricing).
 * Claude Sonnet 5.5 (`claude-sonnet-5-5`): entrada 2 USD, salida 10 USD,
 * escritura de caché 5 min 2,50 USD, escritura 1 h 4 USD, lectura de caché 0,10 USD,
 * por millón de tokens. Claude Haiku 5.5, prompts de hasta 100.000 tokens:
 * 0,10 / 0,50 / escritura 5 min 0,125 / escritura 1 h 0,20 / lectura 0,01.
 * Una caché sin distinguir lectura y escritura se cobra como lectura.
 */
import * as fs from 'fs';
import * as path from 'path';

export interface TokenRates {
  /** USD por millón de tokens de entrada. */
  input: number;
  /** USD por millón de tokens de salida. */
  output: number;
  /** USD por millón cuando el proveedor no separa lectura y escritura de caché. */
  cache: number;
  /** USD por millón de tokens leídos de caché. */
  cacheRead: number;
  /** USD por millón de tokens escritos en la caché de 5 minutos. */
  cacheWrite: number;
  /** USD por millón de tokens escritos en la caché de 1 hora. */
  cacheWrite1h: number;
}

export interface TokenCounts {
  input: number;
  output: number;
  /** Lectura + escritura, o el total si el proveedor no las separa. */
  cache: number;
  cacheRead?: number;
  cacheWrite?: number;
  /** Parte de `cacheWrite` que es escritura de 1 hora. */
  cacheWrite1h?: number;
}

const DEFAULT_USD_EUR = 0.92;

/** Si falta el fichero, las mismas cifras que `price-table.json`. */
const FALLBACK: Record<string, Partial<TokenRates> & Pick<TokenRates, 'input' | 'output'>> = {
  'anthropic::claude-sonnet-5-5': { input: 2, output: 10, cacheRead: 0.1, cacheWrite: 2.5, cacheWrite1h: 4 },
  'anthropic::claude-haiku-5-5': { input: 0.1, output: 0.5, cacheRead: 0.01, cacheWrite: 0.125, cacheWrite1h: 0.2 },
  'nous::deepseek/deepseek-v4-flash': { input: 0.091, output: 0.182, cache: 0.0182, cacheRead: 0.0182, cacheWrite: 0.0182 },
};

let fileTable: Record<string, TokenRates> | null = null;

function finite(value: unknown): number | null {
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 ? n : null;
}

function normalizeRates(raw: Partial<TokenRates> & { input?: number; output?: number }): TokenRates | null {
  const input = finite(raw.input);
  const output = finite(raw.output);
  if (input == null || output == null) return null;
  const cacheRead = finite(raw.cacheRead) ?? finite(raw.cache) ?? 0;
  const cacheWrite = finite(raw.cacheWrite) ?? finite(raw.cache) ?? cacheRead;
  const cacheWrite1h = finite(raw.cacheWrite1h) ?? cacheWrite;
  const cache = finite(raw.cache) ?? cacheRead;
  return { input, output, cache, cacheRead, cacheWrite, cacheWrite1h };
}

function tableFromJson(value: unknown): Record<string, TokenRates> {
  const bag = value && typeof value === 'object' ? (value as Record<string, unknown>) : null;
  const models = bag && bag.models && typeof bag.models === 'object' ? (bag.models as Record<string, unknown>) : bag;
  const out: Record<string, TokenRates> = {};
  if (!models) return out;
  for (const [key, row] of Object.entries(models)) {
    if (!row || typeof row !== 'object' || key === 'models' || key === 'source') continue;
    const rates = normalizeRates(row as Partial<TokenRates>);
    if (rates) out[key] = rates;
  }
  return out;
}

function loadFileTable(): Record<string, TokenRates> {
  if (fileTable) return fileTable;
  try {
    const raw = JSON.parse(fs.readFileSync(path.join(__dirname, 'price-table.json'), 'utf8'));
    fileTable = tableFromJson(raw);
  } catch {
    fileTable = {};
  }
  return fileTable;
}

/** `custom:nous-api` y `nous-api` cobran como Nous. */
export function priceProvider(provider: string): string {
  const clean = (provider || '').trim().toLowerCase();
  if (clean === 'nous' || clean === 'nous-api' || clean === 'custom:nous-api') return 'nous';
  return clean;
}

function slug(value: string): string {
  return value.toUpperCase().replace(/[^A-Z0-9]+/g, '_').replace(/^_|_$/g, '');
}

/** Nombre de la variable que pisa la tarifa de un proveedor y un modelo. */
export function priceEnvKey(provider: string, model: string): string {
  return `HERMES_PRICE_${slug(`${priceProvider(provider)}_${model}`)}`;
}

function priceEnvKeyModel(model: string): string {
  return `HERMES_PRICE_${slug(model)}`;
}

function ratesFromList(raw: string | undefined): TokenRates | null {
  if (!raw?.trim()) return null;
  const parts = raw.trim().split(/[,;\s]+/).filter(Boolean);
  if (parts.length < 3 || parts.length > 5) return null;
  const nums = parts.map((p) => Number(p));
  if (nums.some((n) => !Number.isFinite(n) || n < 0)) return null;
  if (parts.length === 3) {
    return normalizeRates({ input: nums[0], output: nums[1], cache: nums[2], cacheRead: nums[2], cacheWrite: nums[2], cacheWrite1h: nums[2] });
  }
  return normalizeRates({
    input: nums[0],
    output: nums[1],
    cacheRead: nums[2],
    cacheWrite: nums[3],
    cacheWrite1h: nums[4],
  });
}

function envTable(env: NodeJS.ProcessEnv): Record<string, TokenRates> {
  const raw = (env.HERMES_PRICE_TABLE || '').trim();
  if (!raw) return {};
  try {
    return tableFromJson(JSON.parse(raw));
  } catch {
    return {};
  }
}

export function usdEurRate(env: NodeJS.ProcessEnv = process.env): number {
  const raw = (env.HERMES_USD_EUR ?? env.USD_EUR ?? '').trim();
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? n : DEFAULT_USD_EUR;
}

function lookup(table: Record<string, TokenRates>, provider: string, model: string): TokenRates | null {
  if (!model) return null;
  const priced = priceProvider(provider);
  return table[`${priced}::${model}`] || table[model] || table[`${priced}/${model}`] || null;
}

/** Tarifa aplicable, o null si el modelo no está en el catálogo ni en el entorno. */
export function ratesFor(provider: string, model: string, env: NodeJS.ProcessEnv = process.env): TokenRates | null {
  const pricedProvider = priceProvider(provider);
  const fromEnv = ratesFromList(env[priceEnvKey(pricedProvider, model)]) || ratesFromList(env[priceEnvKeyModel(model)]);
  if (fromEnv) return fromEnv;
  const fromTable = lookup(envTable(env), pricedProvider, model);
  if (fromTable) return fromTable;
  const fromFile = lookup(loadFileTable(), pricedProvider, model);
  if (fromFile) return fromFile;
  const fallback = lookup(
    Object.fromEntries(Object.entries(FALLBACK).flatMap(([key, row]) => {
      const rates = normalizeRates(row);
      return rates ? [[key, rates]] : [];
    })),
    pricedProvider,
    model
  );
  return fallback;
}

function round6(n: number): number {
  return Math.round(n * 1e6) / 1e6;
}

/** Coste de un recuento. Null si no hay tarifa y hay tokens. Con cero tokens, cero. */
export function costFor(
  tokens: TokenCounts,
  provider: string,
  model: string,
  env: NodeJS.ProcessEnv = process.env
): { usd: number; eur: number } | null {
  const read = tokens.cacheRead || 0;
  const write = tokens.cacheWrite || 0;
  const write1h = Math.min(write, tokens.cacheWrite1h || 0);
  const write5 = Math.max(0, write - write1h);
  const extra = Math.max(0, (tokens.cache || 0) - read - write);
  const used = tokens.input + tokens.output + read + write + extra;
  const rates = ratesFor(provider, model, env);
  if (!rates) return used > 0 ? null : { usd: 0, eur: 0 };
  const usd =
    (tokens.input * rates.input +
      tokens.output * rates.output +
      read * rates.cacheRead +
      write5 * rates.cacheWrite +
      write1h * rates.cacheWrite1h +
      extra * rates.cache) /
    1_000_000;
  return { usd: round6(usd), eur: round6(usd * usdEurRate(env)) };
}
