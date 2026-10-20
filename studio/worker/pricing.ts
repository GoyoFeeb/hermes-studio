/**
 * pricing.ts — precio de los tokens de un trabajo (2026-10-20).
 *
 * Dólares por millón de tokens. La caché es una sola tarifa (lectura; si el proveedor
 * también informa escritura, el uso la suma antes de llegar aquí). El euro sale de
 * USD_EUR (por defecto 0,86). Una tarifa se puede pisar con
 * HERMES_PRICE_<PROVEEDOR>_<MODELO>=entrada,salida,cache (también vale solo el modelo).
 */
export interface TokenRates {
  /** USD por millón de tokens de entrada. */
  input: number;
  /** USD por millón de tokens de salida. */
  output: number;
  /** USD por millón de tokens de caché. */
  cache: number;
}

export interface TokenCounts {
  input: number;
  output: number;
  cache: number;
}

const DEFAULT_USD_EUR = 0.86;

/** Tarifas de catálogo. La clave es `proveedor::modelo`. */
const BUILTIN: Record<string, TokenRates> = {
  'nous::deepseek/deepseek-v4-flash': { input: 0.091, output: 0.182, cache: 0.0182 },
  'anthropic::claude-sonnet-5-5': { input: 2, output: 10, cache: 0.1 },
  'anthropic::claude-haiku-5-5': { input: 0.1, output: 0.5, cache: 0.01 },
};

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

function parseRates(raw: string | undefined): TokenRates | null {
  if (!raw?.trim()) return null;
  const parts = raw.trim().split(/[,;\s]+/).filter(Boolean);
  if (parts.length !== 3) return null;
  const nums = parts.map((p) => Number(p));
  if (nums.some((n) => !Number.isFinite(n) || n < 0)) return null;
  return { input: nums[0], output: nums[1], cache: nums[2] };
}

export function usdEurRate(env: NodeJS.ProcessEnv = process.env): number {
  const n = Number((env.USD_EUR ?? '').trim());
  return Number.isFinite(n) && n > 0 ? n : DEFAULT_USD_EUR;
}

/** Tarifa aplicable, o null si el modelo no está en el catálogo ni en el entorno. */
export function ratesFor(provider: string, model: string, env: NodeJS.ProcessEnv = process.env): TokenRates | null {
  const pricedProvider = priceProvider(provider);
  const fromEnv = parseRates(env[priceEnvKey(pricedProvider, model)]) || parseRates(env[priceEnvKeyModel(model)]);
  if (fromEnv) return fromEnv;
  if (!model) return null;
  return BUILTIN[`${pricedProvider}::${model}`] || null;
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
  const used = tokens.input + tokens.output + tokens.cache;
  const rates = ratesFor(provider, model, env);
  if (!rates) return used > 0 ? null : { usd: 0, eur: 0 };
  const usd = (tokens.input * rates.input + tokens.output * rates.output + tokens.cache * rates.cache) / 1_000_000;
  return { usd: round6(usd), eur: round6(usd * usdEurRate(env)) };
}
