const test = require('node:test');
const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', '..');
const TSX_BIN = path.join(ROOT, 'node_modules', '.bin', 'tsx');

function run(code) {
  const out = execFileSync(TSX_BIN, ['-e', `(async () => { ${code} })().catch((e) => { console.error(e); process.exit(1); });`], {
    cwd: ROOT,
    encoding: 'utf8',
    env: { ...process.env, HERMES_WORKER_ENV_DIR: '/nonexistent' },
  });
  return JSON.parse(out);
}

const here = (name) => JSON.stringify(path.join(__dirname, name));

test('topes del trabajo: defectos, variables y tope de fase dentro del tope total', async () => {
  const r = run(`
    const { jobBudgetFromEnv, JobClock, deliveryOnTimeout, timeoutFailMessage, canTakeScreenshot } = require(${here('jobBudget.ts')});
    const d = jobBudgetFromEnv({});
    const custom = jobBudgetFromEnv({
      HERMES_JOB_TIMEOUT_MIN: '30',
      HERMES_ART_COMPARES: '0',
      HERMES_FIX_ROUNDS: '9',
      HERMES_PHASE_DRAFT_MIN: 'no',
    });
    const clock = new JobClock(0, d, () => 0);
    const late = new JobClock(0, d, () => 15 * 60 * 1000);
    const done = new JobClock(0, d, () => 20 * 60 * 1000);
    process.stdout.write(JSON.stringify({
      job: d.jobMs,
      draft: d.phases.draft,
      fix: d.phases.fix,
      art: d.phases.art,
      revise: d.phases.artRevise,
      rounds: d.fixRounds,
      passes: d.artRevisePasses,
      repairs: d.artRepairRetries,
      shots: d.artScreenshots,
      compares: d.artCompares,
      continues: d.maxContinues,
      customJob: custom.jobMs,
      customCompares: custom.artCompares,
      customRounds: custom.fixRounds,
      customDraft: custom.phases.draft,
      phase: clock.phaseMs('draft'),
      capped: late.phaseMs('draft'),
      left: late.remainingMs(),
      expired: done.expired(),
      deliver: deliveryOnTimeout({ hasHtml: true, errors: 0 }),
      failErrors: deliveryOnTimeout({ hasHtml: true, errors: 2 }),
      failNone: deliveryOnTimeout({ hasHtml: false, errors: 0 }),
      failUnchecked: deliveryOnTimeout({ hasHtml: true, errors: null }),
      msg: timeoutFailMessage({ minutes: 20, phase: 'Revisión visual', errors: ['móvil', 'enlaces'] }),
      msgEmpty: timeoutFailMessage({ minutes: 20, phase: '', errors: [] }),
      shot: canTakeScreenshot(2, d),
      noShot: canTakeScreenshot(3, d),
    }));
  `);
  assert.equal(r.job, 20 * 60 * 1000);
  assert.equal(r.draft, 12 * 60 * 1000);
  assert.equal(r.fix, 4 * 60 * 1000);
  assert.equal(r.art, 5 * 60 * 1000);
  assert.equal(r.revise, 6 * 60 * 1000);
  assert.equal(r.rounds, 2);
  assert.equal(r.passes, 1);
  assert.equal(r.repairs, 1);
  assert.equal(r.shots, 3);
  assert.equal(r.compares, 1);
  assert.equal(r.continues, 2);
  assert.equal(r.customJob, 30 * 60 * 1000);
  assert.equal(r.customCompares, 0);
  assert.equal(r.customRounds, 4);
  assert.equal(r.customDraft, 12 * 60 * 1000);
  assert.equal(r.phase, 12 * 60 * 1000);
  assert.equal(r.capped, 5 * 60 * 1000);
  assert.equal(r.left, 5 * 60 * 1000);
  assert.equal(r.expired, true);
  assert.equal(r.deliver, 'deliver');
  assert.equal(r.failErrors, 'fail');
  assert.equal(r.failNone, 'fail');
  assert.equal(r.failUnchecked, 'fail');
  assert.match(r.msg, /20 min/);
  assert.match(r.msg, /Revisión visual/);
  assert.match(r.msg, /móvil, enlaces/);
  assert.match(r.msgEmpty, /No hay un HTML/);
  assert.equal(r.shot, true);
  assert.equal(r.noShot, false);
});

test('cada fase deja en el log su inicio, su fin y el resumen', async () => {
  const r = run(`
    const { Timeline, summarize } = require(${here('timeline.ts')});
    let now = 0;
    const lines = [];
    const t = new Timeline(() => now, (m) => lines.push(m));
    t.start('measure', 'Identidad medida en la web');
    now = 45_000;
    t.end();
    t.start('draft', 'Primera versión');
    now = 45_000 + 8 * 60 * 1000;
    t.end();
    const summary = summarize(t.toJSON());
    process.stdout.write(JSON.stringify({ lines, summary }));
  `);
  assert.deepEqual(r.lines, [
    'fase «Identidad medida en la web» empieza',
    'fase «Identidad medida en la web» termina en 0:45',
    'fase «Primera versión» empieza',
    'fase «Primera versión» termina en 8:00',
  ]);
  assert.match(r.summary, /identidad medida en la web 0:45/);
  assert.match(r.summary, /primera versión 8:00/);
  assert.match(r.summary, /total 8:45/);
});

test('el home de cada hueco no comparte state.db ni sesiones', async () => {
  const r = run(`
    const fs = require('fs');
    const os = require('os');
    const path = require('path');
    const { isolateHermesHome, shouldIsolateHome, slotHomeDir } = require(${here('hermesHome.ts')});
    const base = fs.mkdtempSync(path.join(os.tmpdir(), 'hermes-home-'));
    fs.writeFileSync(path.join(base, 'config.yaml'), 'provider: custom:nous-api\\n');
    fs.writeFileSync(path.join(base, 'state.db'), 'secret-session');
    fs.mkdirSync(path.join(base, 'sessions'));
    fs.writeFileSync(path.join(base, 'sessions', 'a.json'), '{}');
    fs.mkdirSync(path.join(base, 'skills'));
    fs.writeFileSync(path.join(base, 'skills', 'x.md'), 'skill');
    const slot = slotHomeDir(base, 'replica/1', 1);
    isolateHermesHome(base, slot);
    const skill = fs.lstatSync(path.join(slot, 'skills'));
    process.stdout.write(JSON.stringify({
      slot,
      config: fs.readFileSync(path.join(slot, 'config.yaml'), 'utf8'),
      db: fs.existsSync(path.join(slot, 'state.db')),
      sessions: fs.existsSync(path.join(slot, 'sessions')),
      link: skill.isSymbolicLink(),
      cloud: shouldIsolateHome({ HERMES_CLOUD: '1' }, 1),
      replica: shouldIsolateHome({ RAILWAY_REPLICA_ID: 'abc' }, 1),
      mac: shouldIsolateHome({}, 1),
      many: shouldIsolateHome({}, 2),
    }));
  `);
  assert.match(r.slot, /workers\/replica1\/slot-1$/);
  assert.match(r.config, /custom:nous-api/);
  assert.equal(r.db, false);
  assert.equal(r.sessions, false);
  assert.equal(r.link, true);
  assert.equal(r.cloud, true);
  assert.equal(r.replica, true);
  assert.equal(r.mac, false);
  assert.equal(r.many, true);
});
