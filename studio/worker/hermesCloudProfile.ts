/**
 * hermesCloudProfile.ts — proveedor y modelo de Hermes en el servicio Railway.
 *
 * En el Mac, Hermes usa la sesión OAuth de Nous (`~/.hermes/auth.json`). En
 * `hermes-worker` esa sesión no está: el proceso trae `NOUS_API_KEY`. El id
 * `nous` del CLI es solo OAuth, y `nous-api` no existe (Hermes Agent v0.22.2
 * responde «Unknown provider 'nous-api'»). Con la clave y sin `auth.json`, el
 * worker deja un proveedor custom compatible con OpenAI:
 *
 *   model.provider: custom:nous-api
 *   providers.nous-api.api: https://inference-api.nousresearch.com/v1
 *   providers.nous-api.key_env: NOUS_API_KEY
 *
 * La clave se copia a `HERMES_HOME/.env` (Hermes la lee de ahí). No se escribe
 * en config.yaml ni en el log. `HERMES_PROVIDER=nous-api` es un alias de
 * `custom:nous-api`. `nous` sigue siendo el login OAuth. Si el volumen ya
 * tiene `auth.json`, no se toca esa sesión.
 *
 * `HERMES_PROVIDER=anthropic` es el proveedor nativo de Hermes Agent v0.22.2.
 * La clave es `ANTHROPIC_API_KEY` del entorno del proceso: no se copia a
 * config.yaml ni a `.env`. El modelo llega por `HERMES_INFERENCE_MODEL`
 * (p. ej. `claude-sonnet-5-5`). Los `HERMES_MODEL_*` de cada fase siguen
 * yendo en `--model` del turno.
 */
import { spawnSync, type SpawnSyncOptions, type SpawnSyncReturns } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { shellSingleQuote } from './cloudEnv';
import { redactSecrets, secretValues } from './hermesTrace';

export const DEFAULT_NOUS_MODEL = 'deepseek/deepseek-v4-flash';
export const NOUS_INFERENCE_BASE = 'https://inference-api.nousresearch.com/v1';
/** Id que acepta el CLI instalado (proveedor custom, no el OAuth `nous`). */
export const NOUS_API_PROVIDER = 'custom:nous-api';
/** Proveedor nativo de Hermes Agent v0.22.2. La clave no se escribe en el yaml. */
export const ANTHROPIC_PROVIDER = 'anthropic';
const NOUS_API_KEY_NAME = 'nous-api';

const PROVIDER_RE = /^(?:[a-z0-9][a-z0-9._-]{0,40}|custom:[a-z0-9][a-z0-9._-]{0,40})$/;
const MODEL_RE = /^[A-Za-z0-9._:@/+-]{1,160}$/;

export interface CloudHermesSettings {
  /** Vacío: no pasar `--provider` ni reescribir config.yaml. */
  provider: string;
  /** Vacío: no forzar modelo. */
  model: string;
  /** Copiar NOUS_API_KEY a HERMES_HOME/.env. */
  writeNousKey: boolean;
  /** True si HERMES_PROVIDER vino del entorno (pisa un config.yaml distinto). */
  force: boolean;
  /** Una línea para el log. Sin secretos. */
  log: string;
}

function valid(value: string | undefined, re: RegExp): string {
  const clean = (value || '').trim();
  return re.test(clean) ? clean : '';
}

/** `nous-api` (el id que escribió el worker anterior) y `custom:nous-api` son el mismo proveedor. `nous` no. */
export function canonicalProvider(value: string): string {
  const clean = valid(value, PROVIDER_RE);
  if (!clean) return '';
  if (clean === NOUS_API_KEY_NAME || clean === NOUS_API_PROVIDER) return NOUS_API_PROVIDER;
  return clean;
}

function usesNousEndpoint(provider: string): boolean {
  return provider === 'nous' || provider === NOUS_API_PROVIDER;
}

function anthropicKeyReady(env: NodeJS.ProcessEnv): boolean {
  const key = (env.ANTHROPIC_API_KEY || '').trim();
  return !!key && !/[\r\n]/.test(key);
}

/**
 * `--provider` del turno, si el CLI lo anuncia. `nous-api` sale como `custom:nous-api`.
 * `anthropic` sale tal cual: es el id nativo.
 */
export function providerArgs(provider: string, supportsFlag = true): string[] {
  const target = canonicalProvider(provider);
  if (!target || !supportsFlag) return [];
  return ['--provider', target];
}

/** `--model` de la fase y `--provider` del trabajo, en ese orden. */
export function turnModelAndProviderArgs(
  model: string | undefined,
  provider: string,
  flags: { model?: string | null; provider?: boolean }
): string[] {
  const out: string[] = [];
  if (model && flags.model) out.push(flags.model, model);
  if (flags.provider) out.push(...providerArgs(provider, true));
  return out;
}

/** auth.json con una sesión. Vacío o `{}` no cuenta: no es el login del Mac. */
export function hermesVolumeHasAuth(dir: string): boolean {
  if (!dir) return false;
  try {
    const text = fs.readFileSync(path.join(dir, 'auth.json'), 'utf8').trim();
    return !!text && text !== '{}' && text !== '[]';
  } catch {
    return false;
  }
}

export function cloudHermesSettings(env: NodeJS.ProcessEnv, opts: { hasAuth: boolean }): CloudHermesSettings {
  if (env.HERMES_CLOUD !== '1') {
    return { provider: '', model: '', writeNousKey: false, force: false, log: '' };
  }
  const rawProvider = valid(env.HERMES_PROVIDER, PROVIDER_RE);
  const explicitProvider = canonicalProvider(rawProvider);
  const explicitModel = valid(env.HERMES_INFERENCE_MODEL, MODEL_RE);
  const key = (env.NOUS_API_KEY || '').trim();
  const hasKey = !!key && !/[\r\n]/.test(key);
  const nousModel = explicitModel || DEFAULT_NOUS_MODEL;
  if (explicitProvider) {
    const nous = usesNousEndpoint(explicitProvider);
    const anthropic = explicitProvider === ANTHROPIC_PROVIDER;
    const model = explicitModel || (nous ? DEFAULT_NOUS_MODEL : '');
    const alias = rawProvider !== explicitProvider ? `=${rawProvider}` : '';
    const keyNote = anthropic && !anthropicKeyReady(env) ? ', falta ANTHROPIC_API_KEY' : '';
    return {
      provider: explicitProvider,
      model,
      writeNousKey: hasKey && nous,
      force: true,
      log: `proveedor ${explicitProvider}${model ? `, modelo ${model}` : ''}${keyNote} (HERMES_PROVIDER${alias})`,
    };
  }
  if (opts.hasAuth) {
    return {
      provider: '',
      model: explicitModel,
      writeNousKey: false,
      force: false,
      log: explicitModel
        ? `sesión de Hermes en el volumen (auth.json); modelo ${explicitModel}`
        : 'sesión de Hermes en el volumen (auth.json); no se fuerza el proveedor',
    };
  }
  if (hasKey) {
    return {
      provider: NOUS_API_PROVIDER,
      model: nousModel,
      writeNousKey: true,
      force: false,
      log: `proveedor ${NOUS_API_PROVIDER}, modelo ${nousModel} (NOUS_API_KEY, sin sesión OAuth)`,
    };
  }
  return {
    provider: '',
    model: explicitModel,
    writeNousKey: false,
    force: false,
    log: 'sin auth.json ni NOUS_API_KEY: Hermes no puede llamar al modelo',
  };
}

function nousApiChild(model: string): string[] {
  const lines = [
    `  ${NOUS_API_KEY_NAME}:`,
    '    name: "Nous API"',
    `    api: ${JSON.stringify(NOUS_INFERENCE_BASE)}`,
    '    key_env: NOUS_API_KEY',
  ];
  if (model && MODEL_RE.test(model)) lines.push(`    default_model: ${JSON.stringify(model)}`);
  lines.push('    transport: chat_completions');
  return lines;
}

export function renderCloudConfig(provider: string, model: string): string {
  const target = canonicalProvider(provider) || provider;
  const lines = ['# Generado por el worker de Hermes Studio. No está en git.', 'model:'];
  lines.push(`  provider: ${JSON.stringify(target)}`);
  if (model) lines.push(`  default: ${JSON.stringify(model)}`);
  // anthropic no lleva base_url ni bloque providers: Hermes lee ANTHROPIC_API_KEY del entorno.
  if (usesNousEndpoint(target)) lines.push(`  base_url: ${JSON.stringify(NOUS_INFERENCE_BASE)}`);
  lines.push('');
  if (target === NOUS_API_PROVIDER) {
    lines.push('providers:');
    lines.push(...nousApiChild(model));
    lines.push('');
  }
  return lines.join('\n');
}

function unquote(value: string): string {
  const clean = value.replace(/\s+#.*$/, '').trim();
  const quoted = clean.match(/^(["'])(.*)\1$/);
  return quoted ? quoted[2] : clean;
}

function modelBlock(lines: string[]): { start: number; end: number } | null {
  const start = lines.findIndex((line) => /^model:\s*(?:#.*)?$/.test(line));
  if (start < 0) return null;
  let end = lines.length;
  for (let i = start + 1; i < lines.length; i++) {
    if (lines[i].trim() === '' || /^\s*#/.test(lines[i])) continue;
    if (!/^[ \t]/.test(lines[i])) {
      end = i;
      break;
    }
  }
  return { start, end };
}

function managedProvider(current: string, target: string): boolean {
  return current === 'auto' || current === 'nous' || current === NOUS_API_KEY_NAME || current === NOUS_API_PROVIDER || current === target;
}

function dropScalar(lines: string[], start: number, end: number, key: string): { lines: string[]; end: number } {
  const next = lines.slice();
  for (let i = end - 1; i > start; i--) {
    if (new RegExp(`^[ \\t]+${key}:\\s*`).test(next[i])) {
      next.splice(i, 1);
      end -= 1;
    }
  }
  return { lines: next, end };
}

function setScalar(lines: string[], start: number, end: number, key: string, value: string): { lines: string[]; end: number } {
  const next = lines.slice();
  const rendered = `  ${key}: ${JSON.stringify(value)}`;
  for (let i = start + 1; i < end; i++) {
    const match = next[i].match(new RegExp(`^([ \\t]+)${key}:\\s*(.*)$`));
    if (!match) continue;
    if (unquote(match[2]) === value) return { lines: next, end };
    const indent = next[i].match(/^[ \t]*/)?.[0] || '  ';
    next[i] = `${indent}${key}: ${JSON.stringify(value)}`;
    return { lines: next, end };
  }
  next.splice(end, 0, rendered);
  return { lines: next, end: end + 1 };
}

/** Inserta o sustituye `providers.nous-api` sin tocar otras entradas. */
export function ensureNousApiProvider(yaml: string, model: string): string {
  const child = nousApiChild(model);
  const lines = yaml.split(/\r?\n/);
  const root = lines.findIndex((line) => /^providers:\s*(?:\{\s*\})?\s*(?:#.*)?$/.test(line));
  if (root < 0) {
    const base = yaml.endsWith('\n') || yaml === '' ? yaml : `${yaml}\n`;
    const sep = base.trim() && !base.endsWith('\n\n') ? '\n' : '';
    return `${base}${sep}providers:\n${child.join('\n')}\n`;
  }
  if (/^providers:\s*\{\s*\}/.test(lines[root])) {
    lines.splice(root, 1, 'providers:', ...child);
    return withTrailingNewline(lines.join('\n'), yaml);
  }
  let end = lines.length;
  for (let i = root + 1; i < lines.length; i++) {
    if (lines[i].trim() === '' || /^\s*#/.test(lines[i])) continue;
    if (!/^[ \t]/.test(lines[i])) {
      end = i;
      break;
    }
  }
  let childStart = -1;
  for (let i = root + 1; i < end; i++) {
    if (/^  ["']?nous-api["']?:\s*(?:#.*)?$/.test(lines[i])) {
      childStart = i;
      break;
    }
  }
  if (childStart < 0) {
    lines.splice(root + 1, 0, ...child);
  } else {
    let childEnd = end;
    for (let i = childStart + 1; i < end; i++) {
      if (lines[i].trim() === '' || /^\s*#/.test(lines[i])) continue;
      if (/^  \S/.test(lines[i])) {
        childEnd = i;
        break;
      }
    }
    if (lines.slice(childStart, childEnd).join('\n') !== child.join('\n')) {
      lines.splice(childStart, childEnd - childStart, ...child);
    }
  }
  return withTrailingNewline(lines.join('\n'), yaml);
}

function withTrailingNewline(text: string, original: string): string {
  if ((original.endsWith('\n') || original === '') && !text.endsWith('\n')) return `${text}\n`;
  return text;
}

/** Ajusta el bloque `model:` . null = no hace falta cambiar el archivo. */
export function retargetCloudConfig(existing: string, provider: string, model: string, force: boolean): string | null {
  const target = canonicalProvider(provider);
  if (!target) return null;
  const lines = existing.split(/\r?\n/);
  const block = modelBlock(lines);
  if (!block) {
    if (!force && !usesNousEndpoint(target)) return null;
    const sep = existing.endsWith('\n') || existing === '' ? '' : '\n';
    return existing + sep + (existing.trim() ? '\n' : '') + renderCloudConfig(target, model);
  }
  let providerAt = -1;
  let current = '';
  for (let i = block.start + 1; i < block.end; i++) {
    const match = lines[i].match(/^([ \t]+)provider:\s*(.*)$/);
    if (!match) continue;
    providerAt = i;
    current = unquote(match[2]);
    break;
  }
  if (current && !managedProvider(current, target) && !force) return null;
  let next = lines.slice();
  let end = block.end;
  if (providerAt === -1) {
    next.splice(block.start + 1, 0, `  provider: ${JSON.stringify(target)}`);
    end += 1;
  } else if (current !== target) {
    const indent = next[providerAt].match(/^[ \t]*/)?.[0] || '  ';
    next[providerAt] = `${indent}provider: ${JSON.stringify(target)}`;
  }
  let modelForProvider = model;
  if (model && MODEL_RE.test(model)) {
    let defaultAt = -1;
    let currentModel = '';
    for (let i = block.start + 1; i < end; i++) {
      const match = next[i].match(/^([ \t]+)default:\s*(.*)$/);
      if (!match) continue;
      defaultAt = i;
      currentModel = unquote(match[2]);
      break;
    }
    const replaceModel = !currentModel || force;
    if (!replaceModel) modelForProvider = currentModel;
    if (defaultAt === -1) {
      const after = providerAt === -1 ? block.start + 2 : providerAt + 1;
      next.splice(after, 0, `  default: ${JSON.stringify(model)}`);
      end += 1;
    } else if (replaceModel && currentModel !== model) {
      const indent = next[defaultAt].match(/^[ \t]*/)?.[0] || '  ';
      next[defaultAt] = `${indent}default: ${JSON.stringify(model)}`;
    }
  }
  if (usesNousEndpoint(target)) {
    const updated = setScalar(next, block.start, end, 'base_url', NOUS_INFERENCE_BASE);
    next = updated.lines;
    end = updated.end;
  } else if (force) {
    // Al pasar a anthropic (u otro nativo) no puede quedarse el base_url de Nous.
    const dropped = dropScalar(next, block.start, end, 'base_url');
    next = dropped.lines;
    end = dropped.end;
  }
  let yaml = next.join('\n');
  if (target === NOUS_API_PROVIDER) yaml = ensureNousApiProvider(yaml, modelForProvider);
  return yaml === existing ? null : yaml;
}

function upsertEnvAssignment(text: string, key: string, value: string): string {
  const line = `${key}=${shellSingleQuote(value)}`;
  const re = new RegExp(`^${key}=.*$`, 'm');
  if (re.test(text)) return text.replace(re, line);
  const base = text === '' || text.endsWith('\n') ? text : `${text}\n`;
  return `${base}${line}\n`;
}

export interface CloudProfileReport {
  log: string;
  config: 'create' | 'patch' | 'keep' | 'skip';
}

/** Crea o ajusta config.yaml y .env en `dir`. No escribe la clave en `log`. */
export function seedHermesCloudProfile(env: NodeJS.ProcessEnv, dir: string, opts: { hasAuth?: boolean } = {}): CloudProfileReport {
  const hasAuth = opts.hasAuth ?? hermesVolumeHasAuth(dir);
  const settings = cloudHermesSettings(env, { hasAuth });
  if (env.HERMES_CLOUD !== '1' || !dir) return { log: settings.log, config: 'skip' };
  fs.mkdirSync(dir, { recursive: true });
  let config: CloudProfileReport['config'] = 'keep';
  if (settings.provider) {
    const file = path.join(dir, 'config.yaml');
    const existing = fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : null;
    const yaml = existing == null || existing.trim() === ''
      ? renderCloudConfig(settings.provider, settings.model)
      : retargetCloudConfig(existing, settings.provider, settings.model, settings.force);
    if (existing == null || existing.trim() === '') {
      fs.writeFileSync(file, yaml || renderCloudConfig(settings.provider, settings.model), { mode: 0o600 });
      config = 'create';
    } else if (yaml) {
      fs.writeFileSync(file, yaml, { mode: 0o600 });
      config = 'patch';
    }
  }
  if (settings.writeNousKey) {
    const key = (env.NOUS_API_KEY || '').trim();
    const envFile = path.join(dir, '.env');
    const prev = fs.existsSync(envFile) ? fs.readFileSync(envFile, 'utf8') : '';
    const next = upsertEnvAssignment(prev, 'NOUS_API_KEY', key);
    if (next !== prev) fs.writeFileSync(envFile, next, { mode: 0o600 });
  }
  const where = config === 'create' ? 'config.yaml nuevo' : config === 'patch' ? 'config.yaml actualizado' : 'config.yaml sin cambios';
  return { log: `${settings.log}; ${where}`, config };
}

/**
 * Comprueba el config.yaml con el mismo intérprete del CLI, sin llamar al modelo.
 * `hermes doctor` además audita npm y el login OAuth, y daría un falso fallo
 * en el modo de clave. Esto solo ejecuta `resolve_runtime_provider()`.
 */
const PROVIDER_PROBE_PY = `
import json, os, sys
os.environ.pop("PYTHONHOME", None)
os.environ.pop("PYTHONPATH", None)
os.environ.pop("VIRTUAL_ENV", None)
root = sys.argv[2] if len(sys.argv) > 2 else ""
if root:
    sys.path.insert(0, root)
os.environ["HERMES_HOME"] = sys.argv[1]
import hermes_bootstrap
from hermes_cli.runtime_provider import resolve_runtime_provider
try:
    runtime = resolve_runtime_provider()
except Exception as exc:
    print(json.dumps({"ok": False, "error": type(exc).__name__, "message": str(exc)}))
    raise SystemExit(2)
key = runtime.get("api_key")
print(json.dumps({
    "ok": True,
    "provider": str(runtime.get("provider") or ""),
    "requested": str(runtime.get("requested_provider") or ""),
    "base_url": str(runtime.get("base_url") or ""),
    "api_mode": str(runtime.get("api_mode") or ""),
    "source": str(runtime.get("source") or ""),
    "has_key": isinstance(key, str) and len(key.strip()) >= 4,
}))
`.trim();

export interface HermesProbeVerdict {
  ok: boolean;
  /** El CLI no está, o no se pudo lanzar. No es un proveedor rechazado. */
  skipped: boolean;
  log: string;
}

interface ProbeJson {
  ok?: boolean;
  error?: string;
  message?: string;
  provider?: string;
  requested?: string;
  base_url?: string;
  api_mode?: string;
  has_key?: boolean;
}

function lastJson(text: string): ProbeJson | null {
  const lines = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  for (let i = lines.length - 1; i >= 0; i--) {
    if (!lines[i].startsWith('{')) continue;
    try {
      return JSON.parse(lines[i]) as ProbeJson;
    } catch {
      return null;
    }
  }
  return null;
}

/** Interpreta la salida del probe. No incluye la clave, y redacta lo que llegue en stderr. */
export function interpretHermesProviderProbe(
  code: number | null,
  stdout: string,
  stderr: string,
  expected: string,
  secrets: string[] = [],
): HermesProbeVerdict {
  const out = redactSecrets(stdout || '', secrets);
  const err = redactSecrets(stderr || '', secrets).trim();
  const parsed = lastJson(out);
  const detail = redactSecrets(String(parsed?.message || err || out || `código ${code ?? 'desconocido'}`), secrets).trim();
  const unavailable = /ModuleNotFoundError|ImportError|No module named|ENOENT/i.test(detail);
  if ((code !== 0 || !parsed || parsed.ok === false) && unavailable && !/unknown provider/i.test(detail)) {
    return { ok: true, skipped: true, log: `comprobación del proveedor omitida: ${detail.slice(0, 300)}` };
  }
  if (code !== 0 || !parsed || parsed.ok === false) {
    return { ok: false, skipped: false, log: `proveedor no aceptado: ${detail.slice(0, 400)}` };
  }
  const requested = String(parsed.requested || '');
  const provider = String(parsed.provider || '');
  const target = canonicalProvider(expected) || expected;
  const matches = requested === target || provider === target;
  if (!matches) {
    return {
      ok: false,
      skipped: false,
      log: `proveedor no aceptado: el CLI resolvió ${requested || provider || 'vacío'} y se esperaba ${target}`,
    };
  }
  if (usesNousEndpoint(target)) {
    const base = String(parsed.base_url || '').replace(/\/$/, '');
    if (base !== NOUS_INFERENCE_BASE) {
      return { ok: false, skipped: false, log: `proveedor no aceptado: base_url ${base || 'vacía'} no es la API de Nous` };
    }
  }
  if (target === NOUS_API_PROVIDER && parsed.has_key !== true) {
    return { ok: false, skipped: false, log: 'proveedor no aceptado: NOUS_API_KEY no llega al proveedor custom:nous-api' };
  }
  if (target === ANTHROPIC_PROVIDER && parsed.has_key !== true) {
    return { ok: false, skipped: false, log: 'proveedor no aceptado: ANTHROPIC_API_KEY no llega al proveedor anthropic' };
  }
  const mode = parsed.api_mode || 'desconocido';
  const key = parsed.has_key ? 'clave presente' : 'sin clave';
  return { ok: true, skipped: false, log: `proveedor ${target} aceptado por Hermes (${mode}, ${key})` };
}

type ProbeRunner = (command: string, args: string[], options: SpawnSyncOptions) => SpawnSyncReturns<string>;

/** Shebang de un script Python. El launcher de v0.22.2 es un shell: ahí no hay. */
export function interpreterForHermes(binPath: string): string {
  try {
    const first = fs.readFileSync(binPath, 'utf8').split(/\r?\n/, 1)[0] || '';
    const match = first.match(/^#!\s*(\S*python\S*)/);
    return match ? match[1] : '';
  } catch {
    return '';
  }
}

function resolveBin(bin: string, env: NodeJS.ProcessEnv): string {
  if (!bin) return '';
  if (bin.includes('/') || bin.includes('\\')) return fs.existsSync(bin) ? bin : '';
  for (const dir of (env.PATH || '').split(path.delimiter)) {
    if (!dir) continue;
    const candidate = path.join(dir, bin);
    if (fs.existsSync(candidate)) return candidate;
  }
  return '';
}

function runtimeLaunch(bin: string, env: NodeJS.ProcessEnv, run: ProbeRunner): { python: string; root: string } | null {
  const shebang = interpreterForHermes(bin);
  if (shebang) return { python: shebang, root: '' };
  let printed: SpawnSyncReturns<string>;
  try {
    printed = run(bin, ['--print-runtime-command'], {
      encoding: 'utf8',
      timeout: 20_000,
      env,
      cwd: path.dirname(bin),
    });
  } catch {
    return null;
  }
  if (printed.status !== 0 || !printed.stdout) return null;
  try {
    const argv = JSON.parse(String(printed.stdout).trim()) as unknown;
    if (!Array.isArray(argv) || typeof argv[0] !== 'string') return null;
    const code = argv.find((part, index) => argv[index - 1] === '-c' && typeof part === 'string') as string | undefined;
    const root = code?.match(/sys\.path\.insert\(\s*0,\s*['"]([^'"]+)['"]\s*\)/)?.[1] || '';
    return { python: argv[0], root };
  } catch {
    return null;
  }
}

/**
 * Valida el config.yaml de `home` con el CLI instalado. No tumba el proceso:
 * el que llama solo registra el veredicto. Si falta el binario, se omite.
 */
export function probeInstalledHermes(opts: {
  home: string;
  bin: string;
  expected: string;
  env: NodeJS.ProcessEnv;
  run?: ProbeRunner;
}): HermesProbeVerdict {
  const secrets = secretValues(opts.env);
  const run = opts.run || ((command, args, options) => spawnSync(command, args, options) as SpawnSyncReturns<string>);
  const bin = resolveBin(opts.bin, opts.env);
  if (!bin) {
    return { ok: true, skipped: true, log: 'comprobación del proveedor omitida: no está el CLI de Hermes' };
  }
  const launch = runtimeLaunch(bin, opts.env, run);
  if (!launch) {
    return { ok: true, skipped: true, log: 'comprobación del proveedor omitida: no se pudo localizar el intérprete del CLI' };
  }
  let result: SpawnSyncReturns<string>;
  try {
    result = run(launch.python, ['-I', '-c', PROVIDER_PROBE_PY, opts.home, launch.root], {
      encoding: 'utf8',
      timeout: 45_000,
      env: { ...opts.env, HERMES_HOME: opts.home },
    });
  } catch (err) {
    return { ok: true, skipped: true, log: `comprobación del proveedor omitida: ${redactSecrets((err as Error).message, secrets).slice(0, 200)}` };
  }
  if (result.error && (result.error as NodeJS.ErrnoException).code === 'ETIMEDOUT') {
    return { ok: true, skipped: true, log: 'comprobación del proveedor omitida: el CLI no respondió a tiempo' };
  }
  return interpretHermesProviderProbe(result.status, String(result.stdout || ''), String(result.stderr || ''), opts.expected, secrets);
}
