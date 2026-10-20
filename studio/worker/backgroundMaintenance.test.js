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
  });
  return JSON.parse(out);
}

const here = (name) => JSON.stringify(path.join(__dirname, name));

test('el mantenimiento no ocupa hueco y se deja parar entre tareas', async () => {
  const r = run(`
    const { BackgroundMaintenance, idleSlotPlan } = require(${here('backgroundMaintenance.ts')});
    const { freeSlots } = require(${JSON.stringify(path.join(__dirname, '..', 'server', 'claimQueue.ts'))});
    const m = new BackgroundMaintenance();
    let release;
    const gate = new Promise((resolve) => { release = resolve; });
    let steps = 0;
    const started = m.kick(async () => {
      steps += 1;
      await gate;
      if (!m.shouldContinue()) return;
      steps += 1;
    });
    const again = m.kick(async () => { steps += 10; });
    const busy = m.occupiesSlot() ? [0] : [];
    m.requestStop();
    release();
    await new Promise((resolve) => setTimeout(resolve, 20));
    process.stdout.write(JSON.stringify({
      started,
      again,
      occupies: m.occupiesSlot(),
      running: m.running(),
      steps,
      free: freeSlots(2, busy),
      planBusy: idleSlotPlan(0, true),
      planIdle: idleSlotPlan(0, false),
      planOther: idleSlotPlan(1, false),
    }));
  `);
  assert.equal(r.started, true);
  assert.equal(r.again, false);
  assert.equal(r.occupies, false);
  assert.equal(r.running, false);
  assert.equal(r.steps, 1);
  assert.deepEqual(r.free, [0, 1]);
  assert.equal(r.planBusy.blockSlot, false);
  assert.equal(r.planBusy.kickMaintenance, false);
  assert.equal(r.planIdle.blockSlot, false);
  assert.equal(r.planIdle.kickMaintenance, true);
  assert.equal(r.planOther.kickMaintenance, false);
});
