const test = require('node:test');
const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..', '..');
const TSX_BIN = path.join(ROOT, 'node_modules', '.bin', 'tsx');
const MOD = JSON.stringify(path.join(__dirname, 'improveLoop.ts'));

function run(code) {
  const out = execFileSync(
    TSX_BIN,
    ['-e', `(async () => { const m = require(${MOD}); ${code} })().catch((e) => { console.error(e); process.exit(1); });`],
    { cwd: ROOT, encoding: 'utf8', env: { ...process.env, HERMES_WORKER_ENV_DIR: '/nonexistent' } }
  );
  return JSON.parse(out);
}

function notas(over) {
  const base = {
    peticion: 4, texto_imagen: 4, identidad: 5, concepto: 3, jerarquia: 4,
    aire: 4, originalidad: 3, movil: 4, oscuro: 4, copy: 5,
  };
  return { ...base, ...over };
}

test('HERMES_IMPROVE_MAX_PASSES y HERMES_IMPROVE_TARGET: defectos y topes', () => {
  const r = run(`
    const read = (env) => m.improveSettings(env);
    process.stdout.write(JSON.stringify({
      def: read({}),
      blank: read({ HERMES_IMPROVE_MAX_PASSES: '', HERMES_IMPROVE_TARGET: '' }),
      zero: read({ HERMES_IMPROVE_MAX_PASSES: '0' }),
      junk: read({ HERMES_IMPROVE_MAX_PASSES: 'no', HERMES_IMPROVE_TARGET: 'no' }),
      three: read({ HERMES_IMPROVE_MAX_PASSES: '3', HERMES_IMPROVE_TARGET: '0.8' }),
      big: read({ HERMES_IMPROVE_MAX_PASSES: '99', HERMES_IMPROVE_TARGET: '2' }),
      low: read({ HERMES_IMPROVE_TARGET: '0.1' }),
      zeroTarget: read({ HERMES_IMPROVE_TARGET: '0' }),
    }));
  `);
  assert.deepEqual(r.def, { maxPasses: 3, target: 1 });
  assert.deepEqual(r.blank, { maxPasses: 3, target: 1 });
  assert.equal(r.zero.maxPasses, 0);
  assert.equal(r.junk.maxPasses, 3);
  assert.equal(r.junk.target, 1);
  assert.deepEqual(r.three, { maxPasses: 3, target: 0.8 });
  assert.deepEqual(r.big, { maxPasses: 6, target: 1 });
  assert.equal(r.low.target, 0.5);
  assert.equal(r.zeroTarget.target, 1);
});

test('arranca si un criterio no está en el máximo o hay un error de QC, y para en el objetivo', () => {
  const r = run(`
    const weak = m.snapshotOf({ notas: ${JSON.stringify(notas({}))}, qcLines: [] });
    const perfect = m.snapshotOf({ notas: ${JSON.stringify(notas({ peticion: 5, texto_imagen: 5, concepto: 5, jerarquia: 5, aire: 5, originalidad: 5, movil: 5, oscuro: 5 }))}, qcLines: [] });
    const qc = m.snapshotOf({ notas: ${JSON.stringify(notas({ peticion: 5, texto_imagen: 5, concepto: 5, jerarquia: 5, aire: 5, originalidad: 5, movil: 5, oscuro: 5 }))}, qcLines: ['preheader — Preheader: falta'] });
    const onlyQc = m.snapshotOf({ qcLines: ['peso — Peso: 180 KB'] });
    const clean = m.snapshotOf({ qcLines: [] });
    process.stdout.write(JSON.stringify({
      weak: m.shouldImprove(weak, 1, 3),
      weakBelow: m.criteriaBelowMax(weak),
      atMax: m.criteriaAtMax(weak),
      perfect: m.shouldImprove(perfect, 1, 3),
      reachedPerfect: m.reachedTarget(perfect, 1),
      qc: m.shouldImprove(qc, 1, 3),
      onlyQc: m.shouldImprove(onlyQc, 1, 3),
      clean: m.shouldImprove(clean, 1, 3),
      early: m.shouldImprove(weak, 0.8, 3),
      earlyReached: m.reachedTarget(weak, 0.8),
      noPasses: m.shouldImprove(weak, 1, 0),
      total: weak.total,
      max: weak.max,
    }));
  `);
  assert.equal(r.weak, true);
  assert.deepEqual(r.weakBelow.sort(), ['aire', 'concepto', 'jerarquia', 'movil', 'originalidad', 'oscuro', 'peticion', 'texto_imagen']);
  assert.ok(r.atMax.includes('identidad'));
  assert.ok(r.atMax.includes('copy'));
  assert.equal(r.perfect, false);
  assert.equal(r.reachedPerfect, true);
  assert.equal(r.qc, true);
  assert.equal(r.onlyQc, true);
  assert.equal(r.clean, false);
  // 40/50 = 0.8 exacto: el objetivo 0.8 ya está cumplido si no hay errores de QC.
  assert.equal(r.total, 40);
  assert.equal(r.max, 50);
  assert.equal(r.earlyReached, true);
  assert.equal(r.early, false);
  assert.equal(r.noPasses, false);
});

test('no se queda una revisión que baja la nota, un criterio en el máximo o no cambia nada', () => {
  const r = run(`
    const base = m.snapshotOf({ notas: ${JSON.stringify(notas({}))}, qcLines: ['a — A: x'] });
    const up = m.snapshotOf({ notas: ${JSON.stringify(notas({ concepto: 4, originalidad: 4 }))}, qcLines: ['a — A: x'] });
    const down = m.snapshotOf({ notas: ${JSON.stringify(notas({ concepto: 2 }))}, qcLines: [] });
    const same = m.snapshotOf({ notas: ${JSON.stringify(notas({}))}, qcLines: ['a — A: x'] });
    const fewerQc = m.snapshotOf({ notas: ${JSON.stringify(notas({}))}, qcLines: [] });
    const moreQc = m.snapshotOf({ notas: ${JSON.stringify(notas({ concepto: 5, originalidad: 5 }))}, qcLines: ['a — A: x', 'b — B: y'] });
    const dropped = m.snapshotOf({ notas: ${JSON.stringify(notas({ concepto: 5, identidad: 4 }))}, qcLines: [] });
    process.stdout.write(JSON.stringify({
      up: m.compareRevision(base, up, true),
      down: m.compareRevision(base, down, true),
      same: m.compareRevision(base, same, true),
      fewer: m.compareRevision(base, fewerQc, true),
      more: m.compareRevision(base, moreQc, true),
      dropped: m.compareRevision(base, dropped, true),
      still: m.compareRevision(base, up, false),
      unscored: m.compareRevision(base, null, true),
    }));
  `);
  assert.equal(r.up.keep, true);
  assert.match(r.up.reason, /nota sube/);
  assert.equal(r.down.keep, false);
  assert.match(r.down.reason, /bajó/);
  assert.equal(r.same.keep, false);
  assert.match(r.same.reason, /no subió/);
  assert.equal(r.fewer.keep, true);
  assert.match(r.fewer.reason, /menos errores/);
  assert.equal(r.more.keep, false);
  assert.match(r.more.reason, /errores de calidad/);
  assert.equal(r.dropped.keep, false);
  assert.match(r.dropped.reason, /identidad/);
  assert.equal(r.still.keep, false);
  assert.match(r.still.reason, /no cambió/);
  assert.equal(r.unscored.keep, false);
});

test('el encargo nombra los criterios flojos, las mejoras y los errores, y protege lo que ya está alto', () => {
  const r = run(`
    const snap = m.snapshotOf({
      notas: ${JSON.stringify(notas({}))},
      mejoras: ['concepto: un hilo que ate las tres escenas', 'originalidad: un módulo que no sea foto + botón'],
      problemas: ['las escenas no siguen el titular'],
      qcLines: ['preheader — Preheader: falta el texto oculto'],
    });
    const prompt = m.improvePrompt({
      filePath: 'newsletters/x/newsletter.html',
      brand: 'Mazda',
      snap,
      criteria: { concepto: 'una idea que ordena la pieza', originalidad: 'lejos de la plantilla' },
      checkCmd: 'npm run check-newsletter -- newsletters/x/newsletter.html',
    });
    const changes = m.parseChanges('Listo.\\n{"cambios": ["concepto: titular de la escena 2", "originalidad: cita a sangre"]}\\n');
    const bullets = m.parseChanges('- aire: 8 px más\\n- copy: el botón dice Ver el CX-60');
    const empty = m.parseChanges('{"cambios": []}');
    process.stdout.write(JSON.stringify({ prompt, changes, bullets, empty, constraints: prompt.includes('102 KB') && prompt.includes('Outlook') && prompt.includes('600 px') && prompt.includes('14 px') }));
  `);
  assert.match(r.prompt, /concepto 3\/5/);
  assert.match(r.prompt, /originalidad 3\/5/);
  assert.match(r.prompt, /una idea que ordena la pieza/);
  assert.match(r.prompt, /concepto: un hilo/);
  assert.match(r.prompt, /preheader — Preheader/);
  assert.match(r.prompt, /No toques estos criterios/);
  assert.match(r.prompt, /- identidad/);
  assert.match(r.prompt, /- copy/);
  assert.equal(r.constraints, true);
  assert.deepEqual(r.changes, ['concepto: titular de la escena 2', 'originalidad: cita a sangre']);
  assert.equal(r.bullets.length, 2);
  assert.deepEqual(r.empty, []);
});

test('el bucle sube 40/50 hasta el objetivo, descarta lo que empeora y para si no hay tiempo', async () => {
  const r = run(`
    const opening = m.snapshotOf({ notas: ${JSON.stringify(notas({}))}, mejoras: ['concepto: atar las escenas'], problemas: [], defectos: [], qcLines: [] });
    let html = 'v0';
    let clock = 0;
    const scores = [
      m.snapshotOf({ notas: ${JSON.stringify(notas({ concepto: 5, originalidad: 4, jerarquia: 5, aire: 5, movil: 5 }))}, qcLines: [] }),
      m.snapshotOf({ notas: ${JSON.stringify(notas({ concepto: 5, originalidad: 5, peticion: 5, texto_imagen: 5, jerarquia: 5, aire: 5, movil: 5, oscuro: 5 }))}, qcLines: [] }),
    ];
    const logs = [];
    const record = await m.runImproveLoop({
      opening, best: opening, maxPasses: 3, target: 1, minStartMs: 1000,
      timeLeftMs: () => 60_000,
      now: () => { clock += 1000; return clock; },
      readHtml: () => html,
      restoreHtml: (prev) => { html = prev; },
      revise: async (_prompt, pass) => { html = 'v' + pass; return JSON.stringify({ cambios: ['pasada ' + pass] }); },
      rescore: async () => scores.shift() || null,
      promptFor: (snap) => m.improvePrompt({ filePath: 'n.html', brand: 'Mazda', snap, checkCmd: 'npm run check-newsletter -- n.html' }),
      log: (line) => logs.push(line),
    });
    const worseHtml = 'base';
    const worse = await m.runImproveLoop({
      opening, best: opening, maxPasses: 3, target: 1, minStartMs: 0,
      timeLeftMs: () => 60_000,
      now: () => 5_000,
      readHtml: () => worseHtml,
      restoreHtml: (prev) => { /* el HTML de partida se recupera */ },
      revise: async () => { return '{"cambios":["peor"]}'; },
      rescore: async () => m.snapshotOf({ notas: ${JSON.stringify(notas({ concepto: 2, originalidad: 2 }))}, qcLines: [] }),
      promptFor: () => 'x',
    });
    // La revisión que baja no puede dejar el HTML nuevo: restoreHtml recibe el de antes.
    let restored = '';
    let live = 'base';
    await m.runImproveLoop({
      opening, best: opening, maxPasses: 2, target: 1, minStartMs: 0,
      timeLeftMs: () => 60_000,
      now: () => 9_000,
      readHtml: () => live,
      restoreHtml: (prev) => { restored = prev; live = prev; },
      revise: async () => { live = 'peor'; return '{"cambios":["peor"]}'; },
      rescore: async () => m.snapshotOf({ notas: ${JSON.stringify(notas({ concepto: 1 }))}, qcLines: [] }),
      promptFor: () => 'x',
    });
    const early = await m.runImproveLoop({
      opening, best: opening, maxPasses: 3, target: 0.9, minStartMs: 0,
      timeLeftMs: () => 60_000,
      now: () => 100,
      readHtml: () => html,
      restoreHtml: () => undefined,
      revise: async () => { html = html + '+'; return '{"cambios":["un poco"]}'; },
      rescore: async () => m.snapshotOf({ notas: ${JSON.stringify(notas({ concepto: 5, originalidad: 5, jerarquia: 5, aire: 5, movil: 5, texto_imagen: 5 }))}, qcLines: [] }),
      promptFor: () => 'x',
    });
    const timed = await m.runImproveLoop({
      opening, best: opening, maxPasses: 3, target: 1, minStartMs: 10_000,
      timeLeftMs: () => 1000,
      now: () => 1,
      readHtml: () => 'v0',
      restoreHtml: () => undefined,
      revise: async () => { throw new Error('no debía llamar al modelo'); },
      rescore: async () => null,
      promptFor: () => 'x',
      log: (line) => logs.push(line),
    });
    process.stdout.write(JSON.stringify({
      passes: record.passes.map((p) => ({ n: p.n, kept: p.kept, before: p.before.total, after: p.after && p.after.total, qcBefore: p.qcBefore, changed: p.changed, ms: p.durationMs })),
      final: record.final.total,
      initial: record.initial.total,
      reached: record.reached,
      below: record.belowMax,
      comment: m.formatImproveComment(record),
      worseKept: worse.passes.map((p) => p.kept),
      worseFinal: worse.final.total,
      worseComment: m.formatImproveComment(worse),
      restored,
      earlyPasses: early.passes.length,
      earlyReached: early.reached,
      earlyComment: m.formatImproveComment(early),
      timedPasses: timed.passes.length,
      logs,
    }));
  `);
  assert.equal(r.initial, 40);
  assert.equal(r.final, 50);
  assert.equal(r.reached, true);
  assert.deepEqual(r.below, []);
  assert.equal(r.passes.length, 2);
  assert.equal(r.passes[0].kept, true);
  assert.equal(r.passes[0].before, 40);
  assert.equal(r.passes[0].after, 46);
  assert.equal(r.passes[1].before, 46);
  assert.equal(r.passes[1].after, 50);
  assert.ok(r.passes[0].ms >= 1000);
  assert.deepEqual(r.passes[0].changed, ['pasada 1']);
  assert.equal(r.comment, 'nota visual 40/50 → 50/50 (2 pasadas)');
  assert.deepEqual(r.worseKept, [false]);
  assert.equal(r.worseFinal, 40);
  assert.match(r.worseComment, /40\/50 → 40\/50 \(1 pasada\)/);
  assert.match(r.worseComment, /concepto/);
  assert.match(r.worseComment, /originalidad/);
  assert.equal(r.restored, 'base');
  assert.equal(r.earlyPasses, 1);
  assert.equal(r.earlyReached, true);
  assert.match(r.earlyComment, /40\/50 → 48\/50 \(1 pasada\)/);
  assert.equal(r.timedPasses, 0);
  assert.match(r.logs.join('\n'), /sin tiempo/);
});

test('el comentario de ClickUp lista lo que sigue por debajo del máximo', () => {
  const r = run(`
    const imp = {
      initial: { notas: {}, total: 40, max: 50 },
      final: { notas: {}, total: 48, max: 50 },
      passes: [{ n: 1 }, { n: 2 }],
      reached: false,
      belowMax: ['concepto', 'originalidad'],
      qcErrors: 0,
    };
    const one = { ...imp, passes: [{ n: 1 }], final: { notas: {}, total: 44, max: 50 } };
    const qc = { ...imp, belowMax: [], qcErrors: 2, reached: false };
    process.stdout.write(JSON.stringify({
      two: m.formatImproveComment(imp),
      one: m.formatImproveComment(one),
      qc: m.formatImproveComment(qc),
    }));
  `);
  assert.equal(r.two, 'nota visual 40/50 → 48/50 (2 pasadas). Siguen por debajo del máximo: concepto, originalidad');
  assert.equal(r.one, 'nota visual 40/50 → 44/50 (1 pasada). Siguen por debajo del máximo: concepto, originalidad');
  assert.match(r.qc, /2 errores de calidad/);
});

test('el worker llama al bucle y el entorno de la nube deja pasar las dos variables', () => {
  const src = fs.readFileSync(path.join(__dirname, 'hermes-worker.ts'), 'utf8');
  assert.match(src, /runImproveLoop\(/);
  assert.match(src, /improveSettings\(/);
  assert.match(src, /backfillChannelBImproves\(/);
  assert.match(src, /channel-b\/improve/);
  assert.match(src, /shouldRunTasteRound\(review, budget\.artRevisePasses\)/);
  const allow = fs.readFileSync(path.join(__dirname, 'cloudEnv.ts'), 'utf8');
  assert.match(allow, /HERMES_IMPROVE_MAX_PASSES/);
  assert.match(allow, /HERMES_IMPROVE_TARGET/);
});
