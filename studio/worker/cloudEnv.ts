/**
 * cloudEnv.ts — lista blanca del servicio Railway `hermes-worker` (2026-10-16).
 *
 * El contenedor arranca como root solo para preparar el volumen y luego hace exec de
 * `setpriv` a uid/gid 1001 con el entorno vacío (`--reset-env`) más este subconjunto.
 * Hermes sigue recibiendo todavía menos: `hermesChildEnv` quita el token del worker.
 * Los secretos de Studio (contraseña, Supabase, Resend) no entran ni aunque estén
 * definidos en el servicio por error.
 */
export const CLOUD_UID = "1001";
export const CLOUD_GID = "1001";

/** Argumentos de setpriv, sin el programa. El entrypoint tiene que copiarlos tal cual. */
export const SETPRIV_ARGS = [
  "setpriv",
  `--reuid=${CLOUD_UID}`,
  `--regid=${CLOUD_GID}`,
  "--init-groups",
  "--inh-caps=-all",
  "--no-new-privs",
  "--reset-env",
] as const;

/** PATH fijo: no se hereda el del root (puede apuntar a directorios que 1001 no debe ver). */
export const CLOUD_PATH = "/home/hermes/.local/bin:/usr/local/bin:/usr/bin:/bin";

/**
 * Nombres que el proceso del worker puede ver. Los valores viven en Railway, no aquí.
 * Añadir un proveedor nuevo es añadir su nombre; no copies el entorno entero.
 */
export const CLOUD_ALLOWLIST = [
  "ANTHROPIC_API_KEY",
  "ANTHROPIC_BASE_URL",
  "BRAVE_SEARCH_API_KEY",
  "DEEPSEEK_API_KEY",
  "ELEVENLABS_API_KEY",
  "EXA_API_KEY",
  "FIRECRAWL_API_KEY",
  "FIREWORKS_API_KEY",
  "GEMINI_API_KEY",
  "GOOGLE_API_KEY",
  "GROQ_API_KEY",
  "HERMES_BIN",
  "HERMES_HOME",
  "HERMES_KEEP_RULES",
  "HERMES_MODEL_ART",
  "HERMES_MODEL_BRIEF",
  "HERMES_MODEL_DRAFT",
  "HERMES_MODEL_FIX",
  "HERMES_REASONING_DRAFT",
  "HERMES_STALL_MIN",
  "HERMES_TIMEOUT_MIN",
  "HERMES_WORKER_ENV_DIR",
  "HTTP_PROXY",
  "HTTPS_PROXY",
  "LANG",
  "LC_ALL",
  "MISTRAL_API_KEY",
  "NO_PROXY",
  "NODE_EXTRA_CA_CERTS",
  "NOUS_API_KEY",
  "OPENAI_API_KEY",
  "OPENAI_BASE_URL",
  "OPENROUTER_API_KEY",
  "PERPLEXITY_API_KEY",
  "PLAYWRIGHT_BROWSERS_PATH",
  "PORT",
  "RAILWAY_ENVIRONMENT",
  "RAILWAY_ENVIRONMENT_NAME",
  "RAILWAY_GIT_COMMIT_SHA",
  "RAILWAY_PRIVATE_DOMAIN",
  "RAILWAY_PUBLIC_DOMAIN",
  "RAILWAY_SERVICE_NAME",
  "RAILWAY_VOLUME_MOUNT_PATH",
  "RAILWAY_VOLUME_NAME",
  "SSL_CERT_FILE",
  "STUDIO_WORKER_URL",
  "TAVILY_API_KEY",
  "TERM",
  "TMPDIR",
  "TOOL_GATEWAY_DOMAIN",
  "TOOL_GATEWAY_SCHEME",
  "TOOL_GATEWAY_USER_TOKEN",
  "TZ",
  "WORKER_TOKEN",
  "XAI_API_KEY",
] as const;

/** Secretos de Studio: nunca cruzan al worker, aunque alguien los copie al servicio. */
export const CLOUD_DENY = [
  "ALLOW_NO_AUTH",
  "APP_ACCESS_PASSWORD",
  "MAIL_FROM",
  "RESEND_API_KEY",
  "SESSION_SECRET",
  "SUPABASE_SERVICE_ROLE_KEY",
  "SUPABASE_URL",
] as const;

const ALLOW = new Set<string>(CLOUD_ALLOWLIST);
const DENY = new Set<string>(CLOUD_DENY);

export function shellSingleQuote(value: string): string {
  return `'${value.replace(/'/g, `'\\''`)}'`;
}

export function filterCloudEnv(source: NodeJS.ProcessEnv): NodeJS.ProcessEnv {
  const out: NodeJS.ProcessEnv = {};
  for (const key of CLOUD_ALLOWLIST) {
    if (DENY.has(key)) continue;
    const value = source[key];
    if (value !== undefined) out[key] = value;
  }
  const data = source.RAILWAY_VOLUME_MOUNT_PATH || "/data";
  out.HOME = "/home/hermes";
  out.USER = "hermes";
  out.LOGNAME = "hermes";
  out.SHELL = "/bin/sh";
  out.HERMES_CLOUD = "1";
  out.PATH = CLOUD_PATH;
  out.NODE_ENV = source.NODE_ENV || "production";
  out.HERMES_HOME = out.HERMES_HOME || `${data}/hermes`;
  out.PLAYWRIGHT_BROWSERS_PATH = out.PLAYWRIGHT_BROWSERS_PATH || "/ms-playwright";
  out.LANG = out.LANG || "C.UTF-8";
  for (const key of CLOUD_DENY) delete out[key];
  for (const key of Object.keys(out)) {
    if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(key)) delete out[key];
  }
  return out;
}

/** Archivo que el proceso ya bajado a uid 1001 hace `source` y borra. Sin valores en los logs. */
export function renderEnvFile(env: NodeJS.ProcessEnv): string {
  return (
    Object.keys(env)
      .sort()
      .map((key) => `export ${key}=${shellSingleQuote(env[key] ?? "")}`)
      .join("\n") + "\n"
  );
}

export function cloudEnvKeys(source: NodeJS.ProcessEnv): string[] {
  return Object.keys(filterCloudEnv(source)).sort();
}

export function allowlistOverlapsDeny(): string[] {
  return CLOUD_ALLOWLIST.filter((key) => DENY.has(key) || !ALLOW.has(key));
}
