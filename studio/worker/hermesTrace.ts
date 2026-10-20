/**
 * hermesTrace.ts — últimas líneas de un turno de Hermes, sin secretos.
 *
 * El CLI sale a veces en segundos (código 1) y el log solo decía «terminó sin
 * dejar el HTML». Aquí se guardan stdout y stderr para el log del worker y
 * para el error del trabajo. Los valores de variables *KEY/*TOKEN/*SECRET y
 * los formatos habituales de clave se sustituyen antes de escribir nada.
 */

export const HERMES_TRACE_LINES = 50;

const ASSIGNMENT =
  /((?:^|[^A-Za-z0-9_])(?:[A-Za-z0-9_]*(?:KEY|TOKEN|SECRET|PASSWORD)|authorization|api[_-]?key))\s*([=:])\s*(["']?)([^\s"'\\]{6,}|[^\s"']{6,}?)(\3|(?=\s|$))/gi;

const BEARER = /\b(Bearer\s+)([A-Za-z0-9._\-]{8,})/gi;
const VENDOR = /\b((?:sk|pk|ghp|github_pat|xox[baprs])[_-][A-Za-z0-9_\-]{6,})/g;

export function secretValues(env: NodeJS.ProcessEnv): string[] {
  const found: string[] = [];
  for (const [key, value] of Object.entries(env)) {
    if (!value || value.length < 8 || /[\r\n]/.test(value)) continue;
    if (!/KEY|TOKEN|SECRET|PASSWORD|AUTHORIZATION/i.test(key)) continue;
    found.push(value);
  }
  found.sort((a, b) => b.length - a.length);
  return found;
}

export function redactSecrets(text: string, secrets: string[] = []): string {
  let out = text;
  for (const secret of secrets) {
    if (secret.length < 8) continue;
    out = out.split(secret).join('[redactado]');
  }
  out = out.replace(ASSIGNMENT, (_m, name, sep) => `${name}${sep}[redactado]`);
  out = out.replace(BEARER, '$1[redactado]');
  out = out.replace(VENDOR, '[redactado]');
  return out;
}

function tail(text: string): string {
  return text.length > 32_000 ? text.slice(-32_000) : text;
}

/** stdout y stderr, las últimas `maxLines` líneas, ya redactado. */
export function hermesTraceExcerpt(stdout: string, stderr: string, secrets: string[] = [], maxLines = HERMES_TRACE_LINES): string {
  const blocks: string[] = [];
  const out = tail(stdout).trim();
  const err = tail(stderr).trim();
  if (out) blocks.push(`stdout:\n${out}`);
  if (err) blocks.push(`stderr:\n${err}`);
  if (!blocks.length) return '(Hermes no escribió en stdout ni en stderr)';
  const redacted = redactSecrets(blocks.join('\n\n'), secrets);
  const lines = redacted.split(/\r?\n/);
  const kept = lines.slice(-maxLines);
  const note = lines.length > kept.length ? `… ${lines.length - kept.length} líneas anteriores omitidas\n` : '';
  return note + kept.join('\n');
}
