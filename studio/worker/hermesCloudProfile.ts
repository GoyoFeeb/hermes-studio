/**
 * hermesCloudProfile.ts — proveedor y modelo de Hermes en el servicio Railway.
 *
 * En el Mac, Hermes usa la sesión OAuth de Nous (`~/.hermes/auth.json`). En
 * `hermes-worker` esa sesión no está: el proceso trae `NOUS_API_KEY`. Sin
 * `config.yaml` (o con `provider: nous`, que es el login OAuth), `hermes chat`
 * termina en segundos con código 1 y no llega a escribir el HTML.
 *
 * Con la clave y sin `auth.json`, el worker deja `provider: nous-api` y el
 * modelo DeepSeek V4 Flash, y copia la clave a `HERMES_HOME/.env` (Hermes lee
 * los secretos de ahí). No imprime la clave. Un `HERMES_PROVIDER` explícito
 * manda. Si el volumen ya tiene `auth.json`, no se toca esa sesión.
 */
import * as fs from 'fs';
import * as path from 'path';
import { shellSingleQuote } from './cloudEnv';

export const DEFAULT_NOUS_MODEL = 'deepseek/deepseek-v4-flash';
export const NOUS_INFERENCE_BASE = 'https://inference-api.nousresearch.com/v1';

const PROVIDER_RE = /^[a-z0-9][a-z0-9._-]{0,40}$/;
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
  const explicitProvider = valid(env.HERMES_PROVIDER, PROVIDER_RE);
  const explicitModel = valid(env.HERMES_INFERENCE_MODEL, MODEL_RE);
  const key = (env.NOUS_API_KEY || '').trim();
  const hasKey = !!key && !/[\r\n]/.test(key);
  const nousModel = explicitModel || DEFAULT_NOUS_MODEL;
  if (explicitProvider) {
    const nous = explicitProvider === 'nous' || explicitProvider === 'nous-api';
    const model = explicitModel || (nous ? DEFAULT_NOUS_MODEL : '');
    return {
      provider: explicitProvider,
      model,
      writeNousKey: hasKey && nous,
      force: true,
      log: `proveedor ${explicitProvider}${model ? `, modelo ${model}` : ''} (HERMES_PROVIDER)`,
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
      provider: 'nous-api',
      model: nousModel,
      writeNousKey: true,
      force: false,
      log: `proveedor nous-api, modelo ${nousModel} (NOUS_API_KEY, sin sesión OAuth)`,
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

export function renderCloudConfig(provider: string, model: string): string {
  const lines = ['# Generado por el worker de Hermes Studio. No está en git.', 'model:'];
  lines.push(`  provider: ${JSON.stringify(provider)}`);
  if (model) lines.push(`  default: ${JSON.stringify(model)}`);
  if (provider === 'nous' || provider === 'nous-api') lines.push(`  base_url: ${JSON.stringify(NOUS_INFERENCE_BASE)}`);
  lines.push('');
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

/** Ajusta el bloque `model:` . null = no hace falta cambiar el archivo. */
export function retargetCloudConfig(existing: string, provider: string, model: string, force: boolean): string | null {
  if (!PROVIDER_RE.test(provider)) return null;
  const lines = existing.split(/\r?\n/);
  const block = modelBlock(lines);
  if (!block) {
    if (!force && provider !== 'nous-api' && provider !== 'nous') return null;
    const sep = existing.endsWith('\n') || existing === '' ? '' : '\n';
    return existing + sep + (existing.trim() ? '\n' : '') + renderCloudConfig(provider, model);
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
  const foreign = !!current && current !== 'auto' && current !== 'nous' && current !== 'nous-api' && current !== provider;
  if (foreign && !force) return null;
  const next = lines.slice();
  if (providerAt === -1) {
    next.splice(block.start + 1, 0, `  provider: ${JSON.stringify(provider)}`);
  } else if (current !== provider) {
    const indent = next[providerAt].match(/^[ \t]*/)?.[0] || '  ';
    next[providerAt] = `${indent}provider: ${JSON.stringify(provider)}`;
  }
  if (model && MODEL_RE.test(model)) {
    const end = providerAt === -1 ? block.end + 1 : block.end;
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
    if (defaultAt === -1) {
      const after = providerAt === -1 ? block.start + 2 : providerAt + 1;
      next.splice(after, 0, `  default: ${JSON.stringify(model)}`);
    } else if (replaceModel && currentModel !== model) {
      const indent = next[defaultAt].match(/^[ \t]*/)?.[0] || '  ';
      next[defaultAt] = `${indent}default: ${JSON.stringify(model)}`;
    }
  }
  const yaml = next.join('\n');
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
