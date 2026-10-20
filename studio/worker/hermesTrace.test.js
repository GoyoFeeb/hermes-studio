const test = require('node:test');
const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..', '..');
const TSX_BIN = path.join(ROOT, 'node_modules', '.bin', 'tsx');

function tsx(code, env = {}) {
  return execFileSync(TSX_BIN, ['-e', code], {
    cwd: ROOT,
    encoding: 'utf8',
    env: { ...process.env, HERMES_WORKER_ENV_DIR: '/nonexistent', ...env },
  });
}

test('la traza junta stdout y stderr, se queda en 50 líneas y quita secretos', () => {
  const secret = 'nous-super-secret-value';
  const out = tsx(
    `const { hermesTraceExcerpt, secretValues, HERMES_TRACE_LINES } = require(${JSON.stringify(path.join(__dirname, 'hermesTrace.ts'))});
     const secrets = secretValues({ NOUS_API_KEY: process.env.NOUS_API_KEY, HERMES_PROVIDER: 'nous-api', PATH: '/bin' });
     const stdout = Array.from({ length: 40 }, (_, i) => 'linea stdout ' + i).join('\\n');
     const stderr = Array.from({ length: 30 }, (_, i) => 'linea stderr ' + i + ' key=' + process.env.NOUS_API_KEY).join('\\n');
     const text = hermesTraceExcerpt(stdout, stderr + '\\nAuthorization: Bearer ' + process.env.NOUS_API_KEY + '\\npk_live_abcdefghij', secrets);
     process.stdout.write(JSON.stringify({ lines: text.split('\\n').length, text, secrets: secrets.length, max: HERMES_TRACE_LINES }));`
    ,
    { NOUS_API_KEY: secret }
  );
  const body = JSON.parse(out);
  assert.equal(body.secrets, 1);
  assert.ok(body.lines <= body.max + 1);
  assert.match(body.text, /stderr:/);
  assert.match(body.text, /líneas anteriores omitidas/);
  assert.match(body.text, /linea stdout 39/);
  assert.match(body.text, /linea stderr 29/);
  assert.doesNotMatch(body.text, /linea stdout 0/);
  assert.equal(body.text.includes(secret), false);
  assert.match(body.text, /\[redactado\]/);
  assert.doesNotMatch(body.text, /pk_live_abcdefghij/);
  assert.doesNotMatch(body.text, /Bearer nous/);
});

test('sin salida se dice, y el perfil de la nube usa nous-api sin imprimir la clave', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'hermes-cloud-'));
  const secret = 'nous-test-key-0123456789';
  try {
    const out = tsx(
      `const trace = require(${JSON.stringify(path.join(__dirname, 'hermesTrace.ts'))});
       const cloud = require(${JSON.stringify(path.join(__dirname, 'hermesCloudProfile.ts'))});
       const dir = ${JSON.stringify(dir)};
       const env = { HERMES_CLOUD: '1', NOUS_API_KEY: ${JSON.stringify(secret)} };
       const fresh = cloud.seedHermesCloudProfile(env, dir);
       const again = cloud.seedHermesCloudProfile(env, dir);
       const yaml = require('fs').readFileSync(dir + '/config.yaml', 'utf8');
       const dotenv = require('fs').readFileSync(dir + '/.env', 'utf8');
       const mac = cloud.cloudHermesSettings({ NOUS_API_KEY: env.NOUS_API_KEY }, { hasAuth: false });
       const authed = cloud.seedHermesCloudProfile({ ...env, HERMES_HOME: dir }, dir, { hasAuth: true });
       const forced = cloud.retargetCloudConfig('model:\\n  provider: openrouter\\n  default: "otro/modelo"\\n', 'nous-api', 'deepseek/deepseek-v4-flash', false);
       const patched = cloud.retargetCloudConfig('model:\\n  provider: nous\\n', 'nous-api', 'deepseek/deepseek-v4-flash', false);
       process.stdout.write(JSON.stringify({
         empty: trace.hermesTraceExcerpt('', '   '),
         fresh: fresh.log,
         freshConfig: fresh.config,
         again: again.config,
         yaml,
         dotenv,
         macProvider: mac.provider,
         authed: authed.log,
         authedConfig: authed.config,
         forced,
         patched,
       }));`,
      {}
    );
    const body = JSON.parse(out);
    assert.match(body.empty, /no escribió/);
    assert.match(body.fresh, /nous-api/);
    assert.match(body.fresh, /deepseek\/deepseek-v4-flash/);
    assert.equal(body.fresh.includes(secret), false);
    assert.equal(body.freshConfig, 'create');
    assert.equal(body.again, 'keep');
    assert.match(body.yaml, /provider: "nous-api"/);
    assert.match(body.yaml, /deepseek\/deepseek-v4-flash/);
    assert.match(body.yaml, /inference-api\.nousresearch\.com/);
    assert.match(body.dotenv, new RegExp(`NOUS_API_KEY='${secret}'`));
    assert.equal(body.macProvider, '');
    assert.match(body.authed, /auth\.json/);
    assert.equal(body.authedConfig, 'keep');
    assert.equal(body.forced, null);
    assert.match(body.patched, /nous-api/);
    assert.match(body.patched, /deepseek\/deepseek-v4-flash/);
    assert.equal(fs.readFileSync(path.join(dir, 'config.yaml'), 'utf8').includes('openrouter'), false);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});
