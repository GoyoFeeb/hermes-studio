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

test('sin salida se dice, y el perfil de la nube usa custom:nous-api sin imprimir la clave', () => {
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
       const alias = cloud.cloudHermesSettings({ HERMES_CLOUD: '1', HERMES_PROVIDER: 'nous-api', NOUS_API_KEY: env.NOUS_API_KEY }, { hasAuth: false });
       const other = cloud.cloudHermesSettings({ HERMES_CLOUD: '1', HERMES_PROVIDER: 'openrouter', NOUS_API_KEY: env.NOUS_API_KEY, HERMES_INFERENCE_MODEL: 'otro/modelo' }, { hasAuth: false });
       const modelOnly = cloud.cloudHermesSettings({ HERMES_CLOUD: '1', NOUS_API_KEY: env.NOUS_API_KEY, HERMES_INFERENCE_MODEL: 'deepseek/deepseek-v4-pro' }, { hasAuth: false });
       const oldFile = cloud.retargetCloudConfig('model:\\n  provider: "nous-api"\\n  default: "deepseek/deepseek-v4-flash"\\n', 'custom:nous-api', 'deepseek/deepseek-v4-flash', false);
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
         alias: alias.provider,
         aliasKey: alias.writeNousKey,
         aliasLog: alias.log,
         other: other.provider,
         otherKey: other.writeNousKey,
         otherModel: other.model,
         modelOnly: modelOnly.model,
         oldFile,
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
    assert.match(body.yaml, /provider: "custom:nous-api"/);
    assert.match(body.yaml, /nous-api:/);
    assert.match(body.yaml, /key_env: NOUS_API_KEY/);
    assert.equal(body.yaml.includes(secret), false);
    assert.match(body.yaml, /deepseek\/deepseek-v4-flash/);
    assert.match(body.yaml, /inference-api\.nousresearch\.com/);
    assert.match(body.dotenv, new RegExp(`NOUS_API_KEY='${secret}'`));
    assert.equal(body.macProvider, '');
    assert.match(body.authed, /auth\.json/);
    assert.equal(body.authedConfig, 'keep');
    assert.equal(body.forced, null);
    assert.match(body.patched, /provider: "custom:nous-api"/);
    assert.match(body.patched, /key_env: NOUS_API_KEY/);
    assert.match(body.patched, /deepseek\/deepseek-v4-flash/);
    assert.equal(fs.readFileSync(path.join(dir, 'config.yaml'), 'utf8').includes('openrouter'), false);
    assert.equal(body.alias, 'custom:nous-api');
    assert.equal(body.aliasKey, true);
    assert.match(body.aliasLog, /HERMES_PROVIDER=nous-api/);
    assert.equal(body.other, 'openrouter');
    assert.equal(body.otherKey, false);
    assert.equal(body.otherModel, 'otro/modelo');
    assert.equal(body.modelOnly, 'deepseek/deepseek-v4-pro');
    assert.match(body.oldFile, /provider: "custom:nous-api"/);
    assert.match(body.oldFile, /providers:\n {2}nous-api:/);
    assert.match(body.oldFile, /key_env: NOUS_API_KEY/);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('la comprobación de arranque distingue un proveedor rechazado de uno aceptado y quita la clave', () => {
  const out = tsx(
    `const cloud = require(${JSON.stringify(path.join(__dirname, 'hermesCloudProfile.ts'))});
     const secret = 'nous-test-key-0123456789';
     const bad = cloud.interpretHermesProviderProbe(2, '', "Unknown provider 'nous-api'. key=" + secret, 'custom:nous-api', [secret]);
     const good = cloud.interpretHermesProviderProbe(0, JSON.stringify({
       ok: true, provider: 'custom', requested: 'custom:nous-api',
       base_url: 'https://inference-api.nousresearch.com/v1', api_mode: 'chat_completions', has_key: true,
     }), '', 'custom:nous-api', [secret]);
     const mismatch = cloud.interpretHermesProviderProbe(0, JSON.stringify({
       ok: true, provider: 'openrouter', requested: 'openrouter', base_url: 'https://openrouter.ai/api/v1', api_mode: 'chat_completions', has_key: true,
     }), '', 'custom:nous-api', []);
     const missing = cloud.probeInstalledHermes({ home: '/tmp', bin: 'hermes-que-no-esta', expected: 'custom:nous-api', env: { PATH: '/nonexistent', NOUS_API_KEY: secret } });
     process.stdout.write(JSON.stringify({ bad, good, mismatch, missing }));`
  );
  const body = JSON.parse(out);
  assert.equal(body.bad.ok, false);
  assert.match(body.bad.log, /proveedor no aceptado/);
  assert.match(body.bad.log, /Unknown provider/);
  assert.equal(body.bad.log.includes('nous-test-key-0123456789'), false);
  assert.equal(body.good.ok, true);
  assert.match(body.good.log, /custom:nous-api aceptado/);
  assert.equal(body.mismatch.ok, false);
  assert.match(body.mismatch.log, /openrouter/);
  assert.equal(body.missing.skipped, true);
  assert.match(body.missing.log, /omitida/);
});
