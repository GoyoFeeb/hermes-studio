const test = require('node:test');
const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', '..');
const TSX_BIN = path.join(ROOT, 'node_modules', '.bin', 'tsx');

function run(code) {
  const wrapped = `
    const results = require(${JSON.stringify(path.join(__dirname, 'results.ts'))});
    function job(partial) {
      return {
        id: partial.id,
        createdAt: partial.createdAt,
        finishedAt: partial.finishedAt || null,
        startedAt: partial.startedAt || null,
        status: partial.status || 'completed',
        title: partial.title || null,
        input: {
          mode: 'standalone',
          clientName: partial.clientName,
          clientSlug: partial.clientSlug || 'marca',
          campaignName: partial.campaignName,
          requesterName: partial.requesterName,
          clickupUrl: partial.clickupUrl,
          clickupTaskId: partial.clickupTaskId,
          briefText: '',
          brandMode: 'existing',
        },
        quality: partial.quality,
        artReview: partial.artReview,
        improve: partial.improve,
        channelB: partial.channelB,
        inputTokens: partial.inputTokens,
        outputTokens: partial.outputTokens,
        cacheTokens: partial.cacheTokens,
        costEur: partial.costEur,
        usageSteps: partial.usageSteps,
        briefWaitSec: partial.briefWaitSec,
      };
    }
    ${code}
  `;
  const out = execFileSync(TSX_BIN, ['-e', wrapped], {
    cwd: ROOT,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  return JSON.parse(out);
}

test('los resultados van de uno en uno, el más nuevo primero, con cursor, offset y ?job=', () => {
  const out = run(`
    const notes = { peticion: 4, texto_imagen: 5, identidad: 4, concepto: 3, jerarquia: 4, aire: 4, originalidad: 3, movil: 4, oscuro: 5, copy: 4 };
    const quality = { checkedAt: '2026-10-21T10:00:00.000Z', errors: 1, warnings: 2, checks: [
      { id: 'links', label: 'Enlaces', status: 'error', details: ['roto'], errorCount: 1 },
      { id: 'preheader', label: 'Preheader', status: 'ok', details: [], errorCount: 0 },
    ] };
    const jobs = [
      job({ id: 'old111-aaaa', createdAt: '2026-10-19T10:00:00.000Z', clientName: 'Vieja', status: 'completed' }),
      job({ id: 'run222-bbbb', createdAt: '2026-10-21T12:00:00.000Z', clientName: 'En curso', status: 'running' }),
      job({
        id: 'new333-cccc',
        createdAt: '2026-10-21T09:00:00.000Z',
        finishedAt: '2026-10-21T09:16:00.000Z',
        startedAt: '2026-10-21T09:01:00.000Z',
        clientName: 'Novo Resort Deluxe',
        campaignName: 'Últimos días',
        requesterName: 'Goyo',
        clickupTaskId: 'abc1234',
        clickupUrl: 'https://app.clickup.com/t/abc1234',
        quality,
        artReview: { before: notes, web: true, problemas: [], mejoras: [] },
        channelB: { status: 'ready', attachedAt: '2026-10-21T09:20:00.000Z', channel: 'creas-it', subject: null, preheader: null, hasText: false, bytes: 10, resultRelPath: 'b.html', quality: { checkedAt: '2026-10-21T09:20:00.000Z', errors: 0, warnings: 1, checks: [{ id: 'size', label: 'Peso', status: 'warning', details: [], errorCount: 0 }] } },
      }),
      job({ id: 'mid444-dddd', createdAt: '2026-10-20T10:00:00.000Z', clientName: 'Media', status: 'completed' }),
      job({ id: 'pipe555-eeee', createdAt: '2026-10-22T10:00:00.000Z', clientName: 'Pipeline', status: 'completed', clientSlug: 'x' }),
    ];
    jobs[4].input.mode = 'pipeline';
    const first = results.paginateResults(jobs, { limit: '1' });
    const byOffset = results.paginateResults(jobs, { offset: '1', limit: 1 });
    const cursor = first.page.nextCursor;
    const byCursor = results.paginateResults(jobs, { cursor, offset: '0' });
    const byJob = results.paginateResults(jobs, { job: 'old111-aaaa' });
    const missing = results.paginateResults(jobs, { job: 'run222-bbbb' });
    const junk = results.paginateResults(jobs, { cursor: 'no-es-un-cursor' });
    const item = first.page.items[0];
    console.log(JSON.stringify({
      order: first.page.items.map((row) => row.id),
      total: first.page.total,
      offset: first.page.offset,
      next: first.page.nextJob,
      prev: first.page.prevJob,
      cursorNext: byCursor.ok && byCursor.page.items[0].id,
      offsetId: byOffset.page.items[0].id,
      jobOffset: byJob.ok && byJob.page.offset,
      jobPrev: byJob.ok && byJob.page.prevJob,
      missing: missing.ok ? 'ok' : missing.status,
      junkId: junk.page.items[0].id,
      client: item.clientName,
      campaign: item.campaignName,
      who: item.requesterName,
      task: item.clickupUrl,
      duration: item.durationSec,
      art: item.art && { score: item.art.score, max: item.art.max, first: item.art.criteria[0] },
      qc: item.quality && { errors: item.quality.errors, checks: item.quality.checks.length },
      previewA: item.previewA,
      previewB: item.previewB,
      bScore: item.versions.b && item.versions.b.quality && item.versions.b.quality.warnings,
      improve: item.improve,
    }));
  `);
  assert.deepEqual(out.order, ['new333-cccc']);
  assert.equal(out.total, 3);
  assert.equal(out.offset, 0);
  assert.equal(out.next, 'mid444-dddd');
  assert.equal(out.prev, null);
  assert.equal(out.cursorNext, 'mid444-dddd');
  assert.equal(out.offsetId, 'mid444-dddd');
  assert.equal(out.jobOffset, 2);
  assert.equal(out.jobPrev, 'mid444-dddd');
  assert.equal(out.missing, 404);
  assert.equal(out.junkId, 'new333-cccc');
  assert.equal(out.client, 'Novo Resort Deluxe');
  assert.equal(out.campaign, 'Últimos días');
  assert.equal(out.who, 'Goyo');
  assert.equal(out.task, 'https://app.clickup.com/t/abc1234');
  assert.equal(out.duration, 15 * 60);
  assert.equal(out.art.score, 40);
  assert.equal(out.art.max, 50);
  assert.deepEqual(out.art.first, { id: 'peticion', label: 'Petición', score: 4 });
  assert.equal(out.qc.errors, 1);
  assert.equal(out.qc.checks, 2);
  assert.equal(out.previewA, '/api/jobs/new333-cccc/result');
  assert.equal(out.previewB, '/api/jobs/new333-cccc/channel-b');
  assert.equal(out.bScore, 1);
  assert.equal(out.improve, null);
});

test('los resultados incluyen las iteraciones de mejora de Hermes y de la versión B', () => {
  const out = run(`
    const pass = (n, before, after, kept) => ({
      n,
      before: { notas: { concepto: before === 40 ? 3 : 4, identidad: 5 }, total: before, max: 50 },
      after: { notas: { concepto: after === 48 ? 5 : 4, identidad: 5 }, total: after, max: 50 },
      qcBefore: 1,
      qcAfter: 0,
      kept,
      changed: ['Sube el concepto'],
      reason: kept ? 'se queda: la nota sube' : 'la nota bajó',
      durationMs: 90000,
    });
    const improve = {
      target: 1,
      maxPasses: 3,
      initial: { notas: { concepto: 3, identidad: 5 }, total: 40, max: 50 },
      final: { notas: { concepto: 5, identidad: 5 }, total: 48, max: 50 },
      passes: [pass(1, 40, 48, true)],
      reached: false,
      belowMax: ['concepto'],
      qcErrors: 0,
    };
    const item = results.resultItem(job({
      id: 'imp666-ffff',
      createdAt: '2026-10-21T11:00:00.000Z',
      clientName: 'Mejora',
      improve,
      channelB: {
        status: 'ready',
        attachedAt: '2026-10-21T11:10:00.000Z',
        channel: 'creas-it',
        subject: null,
        preheader: null,
        hasText: false,
        bytes: 10,
        resultRelPath: 'b.html',
        improve: { ...improve, passes: [pass(1, 40, 46, true), pass(2, 46, 44, false)], final: { notas: { concepto: 4 }, total: 46, max: 50 } },
      },
    }));
    console.log(JSON.stringify({
      arrow: item.improve && item.improve.initial + '→' + item.improve.final,
      passes: item.improve && item.improve.passCount,
      below: item.improve && item.improve.belowMax,
      kept: item.improve && item.improve.passes[0].kept,
      changed: item.improve && item.improve.passes[0].changed,
      duration: item.improve && item.improve.durationSec,
      stable: item.improve && item.improve.passes[0].criteria.map((row) => row.id),
      bPasses: item.versions.b && item.versions.b.improve && item.versions.b.improve.passCount,
    }));
  `);
  assert.equal(out.arrow, '40/50→48/50');
  assert.equal(out.passes, 1);
  assert.deepEqual(out.below, ['Concepto']);
  assert.equal(out.kept, true);
  assert.deepEqual(out.changed, ['Sube el concepto']);
  assert.equal(out.duration, 90);
  assert.deepEqual(out.stable, ['concepto']);
  assert.equal(out.bPasses, 2);
});

test('GET /api/results incluye tiempo, tokens y coste, y «sin datos» si no hay', () => {
  const out = run(`
    const known = results.resultItem(job({
      id: 'tok111-aaaa',
      createdAt: '2026-10-21T10:00:00.000Z',
      startedAt: '2026-10-21T10:00:00.000Z',
      finishedAt: '2026-10-21T10:06:00.000Z',
      clientName: 'Nike',
      inputTokens: 100000,
      outputTokens: 80000,
      cacheTokens: 2000,
      costEur: 0.94,
      usageSteps: [{ id: 'draft', label: 'Generación', model: 'claude-sonnet-5-5', provider: 'anthropic', inputTokens: 100000, outputTokens: 80000, cacheReadTokens: 0, cacheWriteTokens: 2000, cacheTokens: 2000, costUsd: 1, costEur: 0.94, durationSec: 120 }],
    }));
    const old = results.resultItem(job({ id: 'old222-bbbb', createdAt: '2026-10-01T10:00:00.000Z', clientName: 'Viejo' }));
    console.log(JSON.stringify({
      known: known.usage.known,
      sec: known.usage.durationSec,
      tokens: known.usage.tokens,
      eur: known.usage.costEur,
      step: known.usage.steps[0] && known.usage.steps[0].label,
      old: old.usage.known,
      oldTokens: old.usage.tokens,
    }));
  `);
  assert.equal(out.known, true);
  assert.equal(out.sec, 360);
  assert.equal(out.tokens, 182000);
  assert.equal(out.eur, 0.94);
  assert.equal(out.step, 'Generación');
  assert.equal(out.old, false);
  assert.equal(out.oldTokens, null);
});

test('GET /api/results queda detrás del acceso de las cuentas', () => {
  const src = fs.readFileSync(path.join(__dirname, 'index.ts'), 'utf8');
  const auth = src.indexOf('Necesitas iniciar sesión.');
  const route = src.indexOf("app.get('/api/results'");
  const hook = src.indexOf("app.post('/api/integrations/clickup'");
  assert.ok(auth > 0);
  assert.ok(route > auth);
  assert.ok(hook > 0 && hook < auth);
});
