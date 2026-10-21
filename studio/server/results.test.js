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
        channelB: partial.channelB,
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
