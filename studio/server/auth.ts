/**
 * auth.ts — cuentas del equipo con Google (fase 2 de la migración a Supabase, 2026-10-13).
 *
 * Google identifica a la persona a través de Supabase Auth; Studio solo comprueba el resultado una vez y, a
 * partir de ahí, lleva su propia sesión en una cookie firmada. Así las imágenes y las vistas previas
 * (<img>, <iframe>), que no pueden mandar cabeceras, siguen entrando como con la contraseña compartida.
 *
 * Se activa con SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY y AUTH_EMAIL_DOMAIN (p. ej. feebbo.com). Sin las
 * tres, Studio se comporta como antes: solo la contraseña compartida.
 */
import * as crypto from 'crypto';

export interface SessionUser {
  /** 'google': cuenta propia. 'password': entró con la contraseña compartida (sin identidad). */
  via: 'google' | 'password';
  email?: string;
  name?: string;
}

export const SESSION_COOKIE = 'hs_session';
const SESSION_DAYS = 30;

export interface AuthConfig {
  supabaseUrl: string;
  supabaseKey: string;
  /** Dominios de correo admitidos, en minúsculas y sin @. */
  domains: string[];
  secret: string;
}

/** null: las cuentas con Google no están configuradas. */
export function authConfigFromEnv(env: NodeJS.ProcessEnv = process.env): AuthConfig | null {
  const supabaseUrl = (env.SUPABASE_URL ?? '').replace(/\/+$/, '');
  const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY ?? '';
  const domains = (env.AUTH_EMAIL_DOMAIN ?? '').toLowerCase().split(/[\s,]+/).map((d) => d.replace(/^@/, '')).filter(Boolean);
  if (!supabaseUrl || !supabaseKey || !domains.length) return null;
  // Sin SESSION_SECRET, la firma sale de la clave de Supabase: no hay otro secreto que guardar. Cambiar
  // cualquiera de los dos cierra todas las sesiones.
  const secret = env.SESSION_SECRET || crypto.createHmac('sha256', supabaseKey).update('hermes-studio-session').digest('hex');
  return { supabaseUrl, supabaseKey, domains, secret };
}

export function emailAllowed(email: unknown, domains: string[]): email is string {
  if (typeof email !== 'string') return false;
  const m = email.trim().toLowerCase().match(/^[^@\s]+@([^@\s]+)$/);
  return !!m && domains.includes(m[1]);
}

function sign(payload: string, secret: string): string {
  return crypto.createHmac('sha256', secret).update(payload).digest('base64url');
}

export function createSessionToken(user: SessionUser, secret: string, now = Date.now()): string {
  const payload = Buffer.from(JSON.stringify({ ...user, exp: now + SESSION_DAYS * 24 * 60 * 60 * 1000 })).toString('base64url');
  return `${payload}.${sign(payload, secret)}`;
}

export function readSessionToken(token: unknown, secret: string, now = Date.now()): SessionUser | null {
  if (typeof token !== 'string') return null;
  const [payload, mac, extra] = token.split('.');
  if (!payload || !mac || extra !== undefined) return null;
  const expected = Buffer.from(sign(payload, secret));
  const given = Buffer.from(mac);
  if (expected.length !== given.length || !crypto.timingSafeEqual(expected, given)) return null;
  try {
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    if (typeof data.exp !== 'number' || data.exp < now) return null;
    if (data.via !== 'google' && data.via !== 'password') return null;
    return { via: data.via, email: typeof data.email === 'string' ? data.email : undefined, name: typeof data.name === 'string' ? data.name : undefined };
  } catch {
    return null;
  }
}

export function readCookie(header: string | undefined, name: string): string | null {
  for (const part of (header ?? '').split(';')) {
    const i = part.indexOf('=');
    if (i > 0 && part.slice(0, i).trim() === name) return part.slice(i + 1).trim();
  }
  return null;
}

export function sessionCookie(token: string, secure: boolean): string {
  return `${SESSION_COOKIE}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${SESSION_DAYS * 24 * 60 * 60}${secure ? '; Secure' : ''}`;
}

export function clearedCookie(secure: boolean): string {
  return `${SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${secure ? '; Secure' : ''}`;
}

/** Dónde manda la web a quien pulsa «Entrar con Google»; la web le añade su propia dirección de vuelta
 *  (redirect_to), que Supabase solo acepta si está en su lista de URL permitidas. */
export function googleLoginUrl(cfg: AuthConfig): string {
  return `${cfg.supabaseUrl}/auth/v1/authorize?provider=google`;
}

/** Pregunta a Supabase de quién es el token que trae el navegador tras pasar por Google. Solo vale una
 *  cuenta de Google (no otro proveedor que alguien active después) con un correo de los dominios admitidos.
 *  Lanza un error con el motivo, pensado para enseñárselo a la persona. */
export async function userFromSupabaseToken(accessToken: unknown, cfg: AuthConfig, doFetch: typeof fetch = fetch): Promise<SessionUser> {
  if (typeof accessToken !== 'string' || accessToken.length < 20 || accessToken.length > 4096) throw new Error('Falta el resultado del inicio de sesión.');
  const res = await doFetch(`${cfg.supabaseUrl}/auth/v1/user`, { headers: { apikey: cfg.supabaseKey, Authorization: `Bearer ${accessToken}` } });
  if (!res.ok) throw new Error('El inicio de sesión ha caducado o no es válido. Vuelve a intentarlo.');
  const u = (await res.json()) as {
    email?: string;
    email_confirmed_at?: string | null;
    app_metadata?: { provider?: string; providers?: string[] };
    user_metadata?: { full_name?: string; name?: string };
  };
  const viaGoogle = u.app_metadata?.provider === 'google' || (u.app_metadata?.providers ?? []).includes('google');
  if (!viaGoogle || !u.email_confirmed_at) throw new Error('Esa cuenta no ha entrado con Google.');
  if (!emailAllowed(u.email, cfg.domains)) throw new Error(`Solo pueden entrar cuentas de ${cfg.domains.map((d) => `@${d}`).join(' o ')}.`);
  const email = u.email.trim().toLowerCase();
  const name = (u.user_metadata?.full_name || u.user_metadata?.name || email.split('@')[0]).trim().slice(0, 80);
  return { via: 'google', email, name };
}
