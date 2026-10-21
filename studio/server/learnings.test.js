const test = require('node:test');
const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('os');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', '..');
const TSX_BIN = path.join(ROOT, 'node_modules', '.bin', 'tsx');
const MOD = JSON.stringify(path.join(__dirname, 'learnings.ts'));

function run(code) {
  const out = execFileSync(
    TSX_BIN,
    ['-e', `(async () => { const m = require(${MOD}); const fs = require('fs'); const os = require('os'); const path = require('path'); ${code} })().catch((e) => { console.error(e); process.exit(1); });`],
    { cwd: ROOT, encoding: 'utf8' }
  );
  return JSON.parse(out);
}

function improve(opts) {
  const base = {
    peticion: 5, texto_imagen: 2, identidad: 5, concepto: 3, jerarquia: 5,
    aire: 5, originalidad: 3, movil: 5, oscuro: 5, copy: 3,
  };
  const before = { ...base, ...(opts.before || {}) };
  const after = { ...before, concepto: Math.min(5, before.concepto + 1), ...(opts.after || {}) };
  const sum = (notes) => Object.values(notes).reduce((a, b) => a + b, 0);
  const beforeTotal = sum(before);
  const afterTotal = opts.kept === false ? beforeTotal - 4 : sum(after);
  return {
    target: 1,
    maxPasses: 3,
    initial: { notas: before, total: beforeTotal, max: 50 },
    final: { notas: opts.kept === false ? before : after, total: opts.kept === false ? beforeTotal : afterTotal, max: 50 },
    passes: [
      {
        n: 1,
        before: { notas: before, total: beforeTotal, max: 50 },
        after: {
          notas: opts.kept === false ? { ...before, texto_imagen: 1 } : after,
          total: afterTotal,
          max: 50,
        },
        qcBefore: 0,
        qcAfter: 0,
        kept: opts.kept !== false,
        changed: opts.changed || ['concepto: un hilo que ate las escenas'],
        reason: opts.kept === false ? 'la nota bajó' : 'se queda: la nota sube',
        durationMs: 1000,
      },
    ],
    reached: false,
    belowMax: ['concepto'],
    qcErrors: 0,
    ...(opts.qcFixed ? { qcFixed: opts.qcFixed } : {}),
  };
}

test('deduplica, separa marca y general, y el encargo lleva las dos sin repetir', () => {
  const r = run(`
    const make = (id, slug, record) => ({ jobId: id, clientSlug: slug, channel: 'a', at: '2026-10-21T12:00:00.000Z', improve: record });
    const hilo = ${JSON.stringify(improve({}))};
    const copy = ${JSON.stringify(improve({ changed: ['copy: el botón dice Ver el modelo'] }))};
    const drop = ${JSON.stringify(improve({ kept: false, changed: ['texto imagen: cambiar la foto de apertura'] }))};
    const qc = ${JSON.stringify(improve({ changed: ['preheader visible'], qcFixed: ['preheader — Preheader: falta el texto oculto'] }))};
    let bank = m.emptyBank();
    bank = m.absorbLearnings(bank, make('job1aaaa-aaaa', 'nike', hilo));
    const again = m.absorbLearnings(bank, make('job1aaaa-aaaa', 'nike', hilo));
    const sameRef = again === bank;
    bank = m.absorbLearnings(bank, make('job2bbbb-bbbb', 'nike', JSON.parse(JSON.stringify(hilo))));
    const raiseCount = bank.learnings.find((item) => item.scope === 'nike' && item.kind === 'raise').count;
    bank = m.absorbLearnings(bank, make('job3cccc-cccc', 'adidas', copy));
    bank = m.absorbLearnings(bank, make('job4dddd-dddd', 'nike', drop));
    bank = m.absorbLearnings(bank, make('job5eeee-eeee', 'nike', qc));
    const raise = bank.learnings.find((item) => item.scope === 'nike' && item.kind === 'raise' && item.text.includes('hilo'));
    const edited = m.editLearning(bank, raise.id, 'Texto que el equipo dejó a mano');
    const afterEdit = m.absorbLearnings(edited, make('job6ffff-ffff', 'nike', JSON.parse(JSON.stringify(hilo))));
    const still = afterEdit.learnings.find((item) => item.id === raise.id);
    const removed = m.deleteLearning(afterEdit, raise.id);
    const block = m.formatLearningBlock(afterEdit, 'nike');
    const applied = m.appliedLearnings(afterEdit, 'nike');
    process.stdout.write(JSON.stringify({
      same: sameRef,
      raiseCount: raise.count,
      general: bank.learnings.filter((item) => item.scope === 'general' && item.kind === 'raise').map((item) => item.text).sort(),
      weak: bank.learnings.filter((item) => item.scope === 'nike' && item.kind === 'weak').map((item) => item.criteria[0]).sort(),
      drop: bank.learnings.some((item) => item.kind === 'drop' && item.scope === 'nike'),
      qc: bank.learnings.some((item) => item.kind === 'qc' && /preheader/i.test(item.text)),
      editedText: still.text,
      editedCount: still.count,
      gone: removed.learnings.some((item) => item.id === raise.id),
      block,
      applied: applied.map((item) => item.scope + ':' + item.kind),
      emptyEdit: m.editLearning(bank, raise.id, '   '),
      password: m.canEditLearnings({ via: 'password' }),
      other: m.canEditLearnings({ via: 'google', email: 'a@gmail.com' }),
      feebbo: m.canEditLearnings({ via: 'google', email: 'Ana@Feebbo.com' }),
      trend: m.initialScoreTrend([
        ...Array.from({ length: 10 }, (_, i) => ({ jobId: 'o' + i, clientSlug: 'nike', channel: 'a', total: 30, max: 50, at: '2026-10-01T00:00:0' + i })),
        ...Array.from({ length: 10 }, (_, i) => ({ jobId: 'n' + i, clientSlug: 'nike', channel: 'a', total: 40, max: 50, at: '2026-10-02T00:00:0' + i })),
      ]),
    }));
  `);
  assert.equal(r.same, true);
  assert.equal(r.raiseCount, 2);
  assert.deepEqual(r.general, ['concepto: un hilo que ate las escenas', 'copy: el botón dice Ver el modelo', 'preheader visible']);
  assert.deepEqual(r.weak, ['concepto', 'copy', 'originalidad', 'texto_imagen']);
  assert.equal(r.drop, true);
  assert.equal(r.qc, true);
  assert.equal(r.editedText, 'Texto que el equipo dejó a mano');
  assert.equal(r.editedCount, 3);
  assert.equal(r.gone, false);
  assert.match(r.block, /De nike:[\s\S]*Texto que el equipo dejó a mano/);
  assert.match(r.block, /Generales:[\s\S]*Ver el modelo/);
  assert.match(r.block, /No repitas lo que ya hizo bajar la nota/);
  assert.ok(r.applied.some((item) => item.startsWith('nike:')));
  assert.ok(r.applied.some((item) => item.startsWith('general:')));
  assert.equal(r.emptyEdit, null);
  assert.equal(r.password, false);
  assert.equal(r.other, false);
  assert.equal(r.feebbo, true);
  assert.equal(r.trend.previousAvg, 60);
  assert.equal(r.trend.recentAvg, 80);
  assert.equal(r.trend.delta, 20);
});

test('el banco en disco se acota y sobrevive a guardarlo', () => {
  const r = run(`
    const file = path.join(os.tmpdir(), 'hermes-learnings-' + Date.now() + '.json');
    const repo = m.createFileLearningsRepository(file);
    let bank = m.emptyBank();
    for (let i = 0; i < 40; i++) {
      const improve = ${JSON.stringify(improve({ changed: ['PLACE'] }))};
      improve.passes[0].changed = ['cambio único ' + i];
      improve.initial.notas = { identidad: 5, peticion: 5, jerarquia: 5, aire: 5, movil: 5, oscuro: 5, texto_imagen: 5, concepto: 5, originalidad: 5, copy: 5 };
      improve.initial.total = 50;
      improve.final = { ...improve.initial, total: 50 };
      improve.passes[0].before = improve.initial;
      improve.passes[0].after = { notas: { ...improve.initial.notas, concepto: 5 }, total: 50, max: 50 };
      improve.passes[0].after.total = 50;
      improve.passes[0].before.total = 40;
      improve.passes[0].before.notas = { ...improve.initial.notas, concepto: 4 };
      bank = m.absorbLearnings(bank, { jobId: 'job' + i.toString(36).padStart(6, 'a') + '-abcd', clientSlug: 'nike', channel: 'a', at: '2026-10-21T12:00:00.000Z', improve });
    }
    repo.save(bank);
    const loaded = repo.load();
    fs.rmSync(file, { force: true });
    const general = loaded.learnings.filter((item) => item.scope === 'general').length;
    const client = loaded.learnings.filter((item) => item.scope === 'nike').length;
    const block = m.formatLearningBlock(loaded, 'nike');
    process.stdout.write(JSON.stringify({
      general, client,
      ids: loaded.learnings.length,
      lines: block.split('\\n').filter((line) => line.startsWith('- ')).length,
      score: loaded.scores.length,
    }));
  `);
  assert.ok(r.general <= 36);
  assert.ok(r.general > 8);
  assert.ok(r.client <= 24);
  assert.equal(r.ids, r.general + r.client);
  assert.ok(r.lines <= 12 + 8 + 6);
  assert.equal(r.score, 40);
});

test('el servidor guarda el banco al cerrar y la página lo lista detrás de @feebbo.com', () => {
  const index = fs.readFileSync(path.join(__dirname, 'index.ts'), 'utf8');
  const page = fs.readFileSync(path.join(__dirname, '../web/learnings.html'), 'utf8');
  const client = fs.readFileSync(path.join(__dirname, '../web/learnings.js'), 'utf8');
  const app = fs.readFileSync(path.join(__dirname, '../web/app.js'), 'utf8');
  assert.match(index, /rememberJob\(/);
  assert.match(index, /requireFeebbo/);
  assert.match(index, /withLearnings\(buildHermesPrompt/);
  assert.match(index, /withLearnings\(buildRevisionPrompt/);
  assert.match(index, /withLearnings\(buildBriefPrompt/);
  assert.match(page, /learnings\.js/);
  assert.match(page, /@feebbo\.com/);
  assert.match(client, /\/api\/learnings/);
  assert.match(client, /@feebbo\.com/);
  assert.match(app, /renderAppliedLearnings/);
  assert.match(app, /learnings\.html/);
});
