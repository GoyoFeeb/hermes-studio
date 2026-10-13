const test = require('node:test');
const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..', '..');
const TSX_BIN = path.join(ROOT, 'node_modules', '.bin', 'tsx');

// Mismo patrón que supabase.test.js: auth.ts se prueba con un one-liner de tsx y un Supabase falso.
function run(code) {
  const wrapped = `
    const auth = require(${JSON.stringify(path.join(__dirname, 'auth.ts'))});
    const cfg = { supabaseUrl: 'https://x.supabase.co', supabaseKey: 'secreta', domains: ['feebbo.com'], secret: 's3creto' };
    const calls = [];
    const supabaseSays = (status, user) => async (url, init) => { calls.push({ url, headers: init.headers }); return { ok: status === 200, status, json: async () => user }; };
    const google = (email, extra = {}) => ({ email, email_confirmed_at: '2026-10-13T08:00:00Z', app_metadata: { provider: 'google', providers: ['google'] }, user_metadata: { full_name: 'Ana Pérez' }, ...extra });
    const reason = async (p) => { try { await p; return null; } catch (e) { return e.message; } };
    (async () => { ${code} })().catch((e) => { console.error(e); process.exit(1); });
  `;
  return JSON.parse(execFileSync(TSX_BIN, ['-e', wrapped], { cwd: ROOT, encoding: 'utf-8' }));
}

test('sin dominio o sin Supabase, las cuentas no están configuradas', () => {
  const out = run(`
    const env = { SUPABASE_URL: 'https://x.supabase.co/', SUPABASE_SERVICE_ROLE_KEY: 'k', AUTH_EMAIL_DOMAIN: ' @Feebbo.com, otra.es ' };
    const full = auth.authConfigFromEnv(env);
    console.log(JSON.stringify({
      none: auth.authConfigFromEnv({ ...env, AUTH_EMAIL_DOMAIN: '' }), noKey: auth.authConfigFromEnv({ ...env, SUPABASE_SERVICE_ROLE_KEY: '' }),
      url: full.supabaseUrl, domains: full.domains, derived: full.secret.length === 64 && full.secret !== 'k',
      own: auth.authConfigFromEnv({ ...env, SESSION_SECRET: 'mio' }).secret,
    }));
  `);
  assert.deepEqual(out, { none: null, noKey: null, url: 'https://x.supabase.co', domains: ['feebbo.com', 'otra.es'], derived: true, own: 'mio' });
});

test('solo entran correos del dominio exacto', () => {
  const out = run(`
    console.log(JSON.stringify(['ana@feebbo.com', ' Ana@FEEBBO.com ', 'ana@feebbo.com.evil.es', 'ana@evilfeebbo.com', 'ana@sub.feebbo.com', 'ana@gmail.com', 'feebbo.com', 'a@b@feebbo.com', null]
      .map((e) => auth.emailAllowed(e, cfg.domains))));
  `);
  assert.deepEqual(out, [true, true, false, false, false, false, false, false, false]);
});

test('la sesión firmada se lee de vuelta; manipulada, de otra clave o caducada, no', () => {
  const out = run(`
    const now = Date.UTC(2026, 9, 13);
    const token = auth.createSessionToken({ via: 'google', email: 'ana@feebbo.com', name: 'Ana Pérez' }, cfg.secret, now);
    const [payload, mac] = token.split('.');
    const forged = Buffer.from(JSON.stringify({ via: 'google', email: 'otro@feebbo.com', name: 'Otro', exp: now + 1e9 })).toString('base64url') + '.' + mac;
    console.log(JSON.stringify({
      ok: auth.readSessionToken(token, cfg.secret, now + 1000),
      forged: auth.readSessionToken(forged, cfg.secret, now), otherKey: auth.readSessionToken(token, 'otra', now),
      day29: !!auth.readSessionToken(token, cfg.secret, now + 29 * 864e5), day31: auth.readSessionToken(token, cfg.secret, now + 31 * 864e5),
      junk: [undefined, '', 'a', 'a.b.c', payload + '.'].map((t) => auth.readSessionToken(t, cfg.secret, now)),
    }));
  `);
  assert.deepEqual(out.ok, { via: 'google', email: 'ana@feebbo.com', name: 'Ana Pérez' });
  assert.deepEqual([out.forged, out.otherKey, out.day29, out.day31], [null, null, true, null]);
  assert.deepEqual(out.junk, [null, null, null, null, null]);
});

test('la cookie se encuentra entre otras, y se emite cerrada a scripts y a otros sitios', () => {
  const out = run(`
    console.log(JSON.stringify({
      found: auth.readCookie('a=1; hs_session=abc.def; b=2', 'hs_session'), missing: auth.readCookie('a=1; xhs_session=no', 'hs_session'), none: auth.readCookie(undefined, 'hs_session'),
      set: auth.sessionCookie('abc.def', true), local: auth.sessionCookie('abc.def', false), cleared: auth.clearedCookie(true),
    }));
  `);
  assert.deepEqual([out.found, out.missing, out.none], ['abc.def', null, null]);
  assert.equal(out.set, 'hs_session=abc.def; Path=/; HttpOnly; SameSite=Lax; Max-Age=2592000; Secure');
  assert.ok(!out.local.includes('Secure'));
  assert.match(out.cleared, /^hs_session=; .*Max-Age=0; Secure$/);
});

test('una cuenta de Google del dominio entra, con su nombre; se pregunta a Supabase con el token del navegador', () => {
  const out = run(`
    const user = await auth.userFromSupabaseToken('t'.repeat(40), cfg, supabaseSays(200, google('Ana@Feebbo.com')));
    const noName = await auth.userFromSupabaseToken('t'.repeat(40), cfg, supabaseSays(200, google('luis.gil@feebbo.com', { user_metadata: {} })));
    console.log(JSON.stringify({ user, noName: noName.name, url: calls[0].url, headers: calls[0].headers }));
  `);
  assert.deepEqual(out.user, { via: 'google', email: 'ana@feebbo.com', name: 'Ana Pérez' });
  assert.equal(out.noName, 'luis.gil');
  assert.equal(out.url, 'https://x.supabase.co/auth/v1/user');
  assert.deepEqual(out.headers, { apikey: 'secreta', Authorization: `Bearer ${'t'.repeat(40)}` });
});

test('no entra: otro dominio, otro proveedor, correo sin confirmar, token rechazado o ausente', () => {
  const out = run(`
    const t = 't'.repeat(40);
    console.log(JSON.stringify([
      await reason(auth.userFromSupabaseToken(t, cfg, supabaseSays(200, google('ana@gmail.com')))),
      await reason(auth.userFromSupabaseToken(t, cfg, supabaseSays(200, google('ana@feebbo.com', { app_metadata: { provider: 'email', providers: ['email'] } })))),
      await reason(auth.userFromSupabaseToken(t, cfg, supabaseSays(200, google('ana@feebbo.com', { email_confirmed_at: null })))),
      await reason(auth.userFromSupabaseToken(t, cfg, supabaseSays(401, {}))),
      await reason(auth.userFromSupabaseToken(undefined, cfg, supabaseSays(200, google('ana@feebbo.com')))),
      calls.length,
    ]));
  `);
  assert.match(out[0], /Solo pueden entrar cuentas de @feebbo\.com/);
  assert.match(out[1], /no ha entrado con Google/);
  assert.match(out[2], /no ha entrado con Google/);
  assert.match(out[3], /caducado o no es válido/);
  assert.match(out[4], /Falta el resultado/);
  assert.equal(out[5], 4); // sin token no se llega a preguntar a Supabase
});
