/**
 * clickup-webhook.ts — alta, listado y baja del webhook de ClickUp que abre trabajos en Studio.
 *
 *   CLICKUP_API_TOKEN=pk_… CLICKUP_TEAM_ID=… npx tsx studio/scripts/clickup-webhook.ts register
 *   CLICKUP_API_TOKEN=pk_… CLICKUP_TEAM_ID=… npx tsx studio/scripts/clickup-webhook.ts list
 *   CLICKUP_API_TOKEN=pk_… npx tsx studio/scripts/clickup-webhook.ts delete <webhook_id>
 *
 * El token se lee del entorno (o de .env, que no se versiona). No se imprime.
 * `register` escribe el secret una vez: va a Railway, servicio hermes-studio, como
 * CLICKUP_WEBHOOK_SECRET. No lo guardes en el repo. Ver studio/CLICKUP.md.
 */
import { loadEnv } from '../../scripts/lib/env';
import { ROOT, STUDIO_DIR } from '../server/paths';
import { DEFAULT_CLICKUP_LIST_ID, DEFAULT_CLICKUP_WEBHOOK_ENDPOINT, clickupWebhookCreateBody } from '../server/clickup';

loadEnv(ROOT);
loadEnv(STUDIO_DIR);

const API = 'https://api.clickup.com/api/v2';

function usage(): void {
  console.error('Uso: clickup-webhook.ts register | list | delete <webhook_id>');
  console.error('Requiere CLICKUP_API_TOKEN. register y list también CLICKUP_TEAM_ID (o un token con una sola workspace).');
}

function redact(message: string, token: string): string {
  return token ? message.split(token).join('(token)') : message;
}

async function api(token: string, method: string, path: string, body?: unknown): Promise<unknown> {
  const res = await fetch(`${API}${path}`, {
    method,
    headers: { Authorization: token, ...(body ? { 'Content-Type': 'application/json' } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let data: unknown = null;
  if (text) {
    try {
      data = JSON.parse(text) as unknown;
    } catch {
      data = text.slice(0, 300);
    }
  }
  if (!res.ok) {
    const err = data && typeof data === 'object' && 'err' in data ? String((data as { err?: unknown }).err) : text.slice(0, 300);
    throw new Error(`${method} ${path} → ${res.status} ${redact(err, token)}`);
  }
  return data;
}

async function resolveTeamId(token: string): Promise<string> {
  const given = (process.env.CLICKUP_TEAM_ID || '').trim();
  if (/^\d+$/.test(given)) return given;
  const data = (await api(token, 'GET', '/team')) as { teams?: { id?: number | string; name?: string }[] };
  const teams = Array.isArray(data?.teams) ? data.teams : [];
  if (teams.length === 1 && teams[0].id != null) return String(teams[0].id);
  console.error('Fija CLICKUP_TEAM_ID (id de la workspace, no de una persona). Workspaces que ve el token:');
  for (const team of teams) console.error(`- ${team.id} ${team.name || ''}`);
  if (!teams.length) console.error('(ninguna: el token no puede listar workspaces)');
  process.exit(1);
}

function publicWebhook(hook: Record<string, unknown>): Record<string, unknown> {
  const health = hook.health && typeof hook.health === 'object' ? (hook.health as { status?: unknown; fail_count?: unknown }) : undefined;
  return {
    id: hook.id,
    endpoint: hook.endpoint,
    events: hook.events,
    list_id: hook.list_id,
    health: health ? { status: health.status, fail_count: health.fail_count } : undefined,
  };
}

async function main(): Promise<void> {
  const [cmd, arg] = process.argv.slice(2);
  const token = (process.env.CLICKUP_API_TOKEN || '').trim();
  if (!cmd || cmd === '--help' || cmd === '-h') {
    usage();
    process.exit(cmd ? 0 : 1);
  }
  if (!token) {
    console.error('Falta CLICKUP_API_TOKEN en el entorno. No lo pongas en el repo.');
    process.exit(1);
  }

  if (cmd === 'register') {
    const endpoint = (process.env.CLICKUP_WEBHOOK_ENDPOINT || DEFAULT_CLICKUP_WEBHOOK_ENDPOINT).trim();
    const listId = (process.env.CLICKUP_LIST_ID || DEFAULT_CLICKUP_LIST_ID).trim();
    const body = clickupWebhookCreateBody(endpoint, listId);
    const teamId = await resolveTeamId(token);
    const data = (await api(token, 'POST', `/team/${encodeURIComponent(teamId)}/webhook`, body)) as {
      id?: string;
      webhook?: { id?: string; secret?: string };
    };
    const secret = data?.webhook?.secret;
    const id = data?.webhook?.id || data?.id;
    console.log(`Webhook ${id || '(sin id)'} creado.`);
    console.log(`Endpoint: ${body.endpoint}`);
    console.log(`Lista: ${body.list_id}`);
    console.log(`Eventos: ${body.events.join(', ')}`);
    if (!secret) {
      console.error('La respuesta no trajo webhook.secret. No se imprime el cuerpo entero.');
      process.exit(1);
    }
    console.log('');
    console.log('Copia este secret a Railway, servicio hermes-studio, variable CLICKUP_WEBHOOK_SECRET.');
    console.log('No lo commits, no lo pegues en el repo, no lo dejes en el historial del shell si puedes evitarlo.');
    console.log(secret);
    return;
  }

  if (cmd === 'list') {
    const teamId = await resolveTeamId(token);
    const data = (await api(token, 'GET', `/team/${encodeURIComponent(teamId)}/webhook`)) as { webhooks?: Record<string, unknown>[] };
    const hooks = Array.isArray(data?.webhooks) ? data.webhooks : [];
    console.log(JSON.stringify(hooks.map(publicWebhook), null, 2));
    return;
  }

  if (cmd === 'delete') {
    if (!arg || !/^[A-Za-z0-9-]{8,80}$/.test(arg)) {
      console.error('delete necesita el id del webhook (lo da `list`).');
      process.exit(1);
    }
    await api(token, 'DELETE', `/webhook/${encodeURIComponent(arg)}`);
    console.log(`Webhook ${arg} borrado.`);
    return;
  }

  usage();
  process.exit(1);
}

main().catch((err) => {
  const token = process.env.CLICKUP_API_TOKEN || '';
  console.error(redact((err as Error).message || String(err), token));
  process.exit(1);
});
