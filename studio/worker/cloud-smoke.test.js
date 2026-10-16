const test = require('node:test');
const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', '..');
const TSX_BIN = path.join(ROOT, 'node_modules', '.bin', 'tsx');
const WORKER = __dirname;

function tsxJson(file, args, env) {
  const out = execFileSync(TSX_BIN, [file, ...args], {
    cwd: ROOT,
    encoding: 'utf8',
    env: { ...process.env, HERMES_WORKER_ENV_DIR: '/nonexistent', ...env },
  });
  return JSON.parse(out);
}

test('la lista blanca no incluye secretos de Studio y el dry-run no imprime valores', () => {
  const secret = 'valor-que-no-puede-salir-en-el-dry-run';
  const token = 'token-de-worker-tampoco-en-stdout';
  const out = tsxJson(path.join(WORKER, 'cloud-launch.ts'), ['--dry-run'], {
    APP_ACCESS_PASSWORD: secret,
    SUPABASE_SERVICE_ROLE_KEY: secret,
    RESEND_API_KEY: secret,
    SESSION_SECRET: secret,
    WORKER_TOKEN: token,
    STUDIO_WORKER_URL: 'https://studio.example',
    OPENROUTER_API_KEY: secret,
    RAILWAY_VOLUME_MOUNT_PATH: '/data',
    PORT: '8080',
  });
  assert.deepEqual(out.setpriv, [
    'setpriv',
    '--reuid=1001',
    '--regid=1001',
    '--init-groups',
    '--inh-caps=-all',
    '--no-new-privs',
    '--reset-env',
  ]);
  assert.ok(out.keys.includes('WORKER_TOKEN'));
  assert.ok(out.keys.includes('HERMES_CLOUD'));
  assert.ok(out.keys.includes('HERMES_HOME'));
  assert.equal(out.keys.includes('APP_ACCESS_PASSWORD'), false);
  assert.equal(out.keys.includes('SUPABASE_SERVICE_ROLE_KEY'), false);
  assert.equal(out.keys.includes('RESEND_API_KEY'), false);
  assert.equal(out.keys.includes('SESSION_SECRET'), false);
  assert.equal(JSON.stringify(out).includes(secret), false);
  assert.equal(JSON.stringify(out).includes(token), false);
});

test('el archivo de entorno cita valores con comillas y niega los secretos de Studio', () => {
  const r = tsxJson(path.join(WORKER, 'cloud-launch.ts'), ['--dry-run'], {});
  assert.ok(r.keys.includes('PATH'));
  const quoted = execFileSync(
    TSX_BIN,
    [
      '-e',
      `const { filterCloudEnv, renderEnvFile, allowlistOverlapsDeny } = require(${JSON.stringify(path.join(WORKER, 'cloudEnv.ts'))});
       const env = filterCloudEnv({ WORKER_TOKEN: "a'b", APP_ACCESS_PASSWORD: 'no', PORT: '9' });
       process.stdout.write(JSON.stringify({ file: renderEnvFile(env), overlap: allowlistOverlapsDeny(), hasPassword: Object.prototype.hasOwnProperty.call(env, 'APP_ACCESS_PASSWORD') }));`,
    ],
    { cwd: ROOT, encoding: 'utf8', env: { ...process.env, HERMES_WORKER_ENV_DIR: '/nonexistent' } }
  );
  const parsed = JSON.parse(quoted);
  assert.deepEqual(parsed.overlap, []);
  assert.equal(parsed.hasPassword, false);
  assert.match(parsed.file, /export WORKER_TOKEN='a'\\''b'/);
  assert.doesNotMatch(parsed.file, /APP_ACCESS_PASSWORD/);
});

test('el entrypoint suelta privilegios con los mismos flags y la imagen no se queda en root', () => {
  const entry = fs.readFileSync(path.join(WORKER, 'cloud-entrypoint.sh'), 'utf8');
  const docker = fs.readFileSync(path.join(WORKER, 'Dockerfile'), 'utf8');
  for (const flag of ['setpriv', '--reuid=1001', '--regid=1001', '--init-groups', '--inh-caps=-all', '--no-new-privs', '--reset-env']) {
    assert.ok(entry.includes(flag), flag);
  }
  assert.match(entry, /exec setpriv/);
  assert.match(docker, /useradd --uid 1001 --gid 1001/);
  assert.match(docker, /ENTRYPOINT \["studio\/worker\/cloud-entrypoint\.sh"\]/);
  assert.match(docker, /\nUSER root\n/);
  assert.doesNotMatch(docker, /USER hermes\nENV NODE_ENV/);
});

test('railway.ts añade hermes-worker y su volumen sin quitar Studio', () => {
  const out = execFileSync(
    TSX_BIN,
    [
      '-e',
      `const program = require(${JSON.stringify(path.join(ROOT, '.railway', 'railway.ts'))}).default;
       const project = program();
       const resources = project.resources.map((r) => ({ type: r.type, name: r.name, build: r.build, deploy: r.deploy, source: r.source, mounts: r.volumeMounts || r.volumeAttachments }));
       process.stdout.write(JSON.stringify({ name: project.name, managed: project.variables, resources }));`,
    ],
    { cwd: ROOT, encoding: 'utf8' }
  );
  const project = JSON.parse(out);
  assert.equal(project.name, 'striking-luck');
  assert.deepEqual(project.managed, { managed: false });
  const names = project.resources.map((r) => r.name).sort();
  assert.deepEqual(names, ['hermes-studio', 'hermes-studio-volume', 'hermes-worker', 'hermes-worker-volume']);
  const studio = project.resources.find((r) => r.name === 'hermes-studio');
  const worker = project.resources.find((r) => r.name === 'hermes-worker');
  assert.equal(studio.build.dockerfilePath, 'studio/Dockerfile');
  assert.equal(studio.source.repo, 'Javifeebbo/hermes-studio');
  assert.equal(studio.deploy.restartPolicyMaxRetries, 3);
  assert.equal(studio.deploy.healthcheckPath, undefined);
  assert.equal(worker.build.dockerfilePath, 'studio/worker/Dockerfile');
  assert.equal(worker.source.repo, 'GoyoFeeb/hermes-studio');
  assert.equal(worker.source.branch, 'main');
  assert.equal(worker.deploy.healthcheckPath, '/heartbeat');
  assert.equal(worker.deploy.restartPolicyMaxRetries, 3);
  const workerVol = project.resources.find((r) => r.name === 'hermes-worker-volume');
  assert.equal(workerVol.type, 'volume');
});

test('GET /heartbeat responde y el resto no', async () => {
  const code = `
    const { startHeartbeat } = require(${JSON.stringify(path.join(WORKER, 'heartbeat.ts'))});
    const server = await startHeartbeat(0);
    const { port } = server.address();
    const beat = await fetch('http://127.0.0.1:' + port + '/heartbeat');
    const health = await fetch('http://127.0.0.1:' + port + '/health');
    const other = await fetch('http://127.0.0.1:' + port + '/api/worker/claim');
    process.stdout.write(JSON.stringify({ port, beat: beat.status, body: await beat.json(), health: health.status, other: other.status }));
    server.close();
  `;
  const out = execFileSync(TSX_BIN, ['-e', `(async () => { ${code} })().catch((e) => { console.error(e); process.exit(1); });`], {
    cwd: ROOT,
    encoding: 'utf8',
    env: { ...process.env, HERMES_WORKER_ENV_DIR: '/nonexistent' },
  });
  const body = JSON.parse(out);
  assert.equal(body.beat, 200);
  assert.deepEqual(body.body, { ok: true });
  assert.equal(body.health, 200);
  assert.equal(body.other, 404);
});

test('en el Mac la nota de navegador no cambia; en la nube no promete una IP española', () => {
  const read = (env) =>
    execFileSync(
      TSX_BIN,
      ['-e', `const { WEB_ACCESS_NOTE } = require(${JSON.stringify(path.join(WORKER, 'hermes-worker.ts'))}); process.stdout.write(WEB_ACCESS_NOTE);`],
      { cwd: ROOT, encoding: 'utf8', env: { ...process.env, HERMES_WORKER_ENV_DIR: '/nonexistent', ...env } }
    );
  const mac = read({ HERMES_CLOUD: '' });
  const cloud = read({ HERMES_CLOUD: '1' });
  assert.match(mac, /este Mac en España/);
  assert.doesNotMatch(cloud, /este Mac en España/);
  assert.match(cloud, /Railway/);
});

test('Hermes no hereda WORKER_TOKEN ni la URL de Studio', () => {
  const out = execFileSync(
    TSX_BIN,
    [
      '-e',
      `const { hermesChildEnv } = require(${JSON.stringify(path.join(WORKER, 'hermes-worker.ts'))});
       const env = hermesChildEnv({ PATH: '/bin', WORKER_TOKEN: 'sek', STUDIO_WORKER_URL: 'https://x', HERMES_WORKER_ENV_DIR: '/tmp', LANG: 'C' });
       process.stdout.write(JSON.stringify(env));`,
    ],
    { cwd: ROOT, encoding: 'utf8', env: { ...process.env, HERMES_WORKER_ENV_DIR: '/nonexistent' } }
  );
  const env = JSON.parse(out);
  assert.equal(env.PATH, '/bin');
  assert.equal(env.LANG, 'C');
  assert.equal('WORKER_TOKEN' in env, false);
  assert.equal('STUDIO_WORKER_URL' in env, false);
  assert.equal('HERMES_WORKER_ENV_DIR' in env, false);
});

test('el entrypoint del worker es ejecutable', () => {
  for (const name of ['cloud-entrypoint.sh', 'cloud-run.sh']) {
    const mode = fs.statSync(path.join(WORKER, name)).mode;
    assert.ok(mode & 0o111, name);
  }
});
