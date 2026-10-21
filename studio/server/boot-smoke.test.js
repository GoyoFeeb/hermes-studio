/**
 * Arranque real del servidor y del worker (2026-10-21).
 *
 * `npm test` ejecuta los *.test.js pero no compila studio/server/index.ts. Por eso
 * un import sin coma (usagePatch en c91e615) pasó la suite y tiró Studio al
 * desplegar. Este smoke carga los dos entrypoints con tsx: si no parsean, falla.
 */
const test = require('node:test');
const assert = require('node:assert/strict');
const { spawn } = require('node:child_process');
const fs = require('node:fs');
const net = require('node:net');
const os = require('node:os');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', '..');
const TSX = path.join(ROOT, 'node_modules', '.bin', 'tsx');

function freePort() {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const { port } = server.address();
      server.close(() => resolve(port));
    });
  });
}

/** Arranca tsx hasta que `ready` ve la salida, o hasta que el proceso sale. */
function runUntil(args, env, ready, timeoutMs) {
  return new Promise((resolve, reject) => {
    const child = spawn(TSX, args, {
      cwd: ROOT,
      env,
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    let out = '';
    let settled = false;
    const finish = (result) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolve(result);
    };
    const timer = setTimeout(() => {
      child.kill('SIGTERM');
      setTimeout(() => child.kill('SIGKILL'), 3000).unref();
      if (!settled) {
        settled = true;
        reject(new Error(`el proceso no arrancó a tiempo\n${out.slice(-2000)}`));
      }
    }, timeoutMs);
    const onData = (buf) => {
      out += buf.toString();
      if (ready(out)) finish({ child, out, code: null });
    };
    child.stdout.on('data', onData);
    child.stderr.on('data', onData);
    child.on('error', (err) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      reject(err);
    });
    child.on('exit', (code) => finish({ child, out, code }));
  });
}

async function stop(child) {
  if (!child || child.exitCode != null || child.killed) return;
  child.kill('SIGTERM');
  await new Promise((resolve) => {
    const kill = setTimeout(() => child.kill('SIGKILL'), 5000);
    child.once('exit', () => {
      clearTimeout(kill);
      resolve();
    });
  });
}

test('el servidor arranca y /api/status responde', async () => {
  const port = await freePort();
  const started = await runUntil(
    ['studio/server/index.ts'],
    {
      ...process.env,
      PORT: String(port),
      ALLOW_NO_AUTH: 'true',
      APP_ACCESS_PASSWORD: '',
      SUPABASE_URL: '',
      SUPABASE_SERVICE_ROLE_KEY: '',
      AUTH_EMAIL_DOMAIN: '',
      SESSION_SECRET: '',
    },
    (out) => out.includes(`Hermes Studio escuchando en http://localhost:${port}`),
    45000
  );
  try {
    assert.equal(started.code, null, started.out.slice(-2000));
    const res = await fetch(`http://127.0.0.1:${port}/api/status`);
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(typeof body.hermesOnline, 'boolean');
    assert.equal(typeof body.queued, 'number');
  } finally {
    await stop(started.child);
  }
});

test('el worker arranca y sale si faltan las credenciales de Studio', async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'hermes-boot-'));
  // Credenciales vacías y un directorio de entorno vacío: no se lee ~/.config ni se llama a Studio.
  const done = await runUntil(
    ['studio/worker/hermes-worker.ts'],
    {
      ...process.env,
      HERMES_WORKER_ENV_DIR: dir,
      HERMES_CLOUD: '',
      STUDIO_WORKER_URL: '',
      WORKER_TOKEN: '',
    },
    () => false,
    45000
  );
  assert.equal(done.code, 1, done.out.slice(-2000));
  assert.match(done.out, /Faltan STUDIO_WORKER_URL y\/o WORKER_TOKEN/);
});
