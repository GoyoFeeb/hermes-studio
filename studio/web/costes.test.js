const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const C = require('./costes.js');

const jobs = [
  {
    id: 'abc123-xy12',
    clientName: 'Nike',
    requester: 'Ana',
    startedAt: '2026-10-20T13:10:00.000Z',
    finishedAt: '2026-10-20T13:25:00.000Z',
    createdAt: '2026-10-20T13:00:00.000Z',
    status: 'completed',
    durationSec: 900,
    inputTokens: 1000,
    outputTokens: 200,
    cacheTokens: 50,
    costEur: 1.5,
  },
  {
    id: 'bbb222-zz99',
    clientName: 'Adidas',
    requester: 'Luis',
    createdAt: '2026-10-19T10:00:00.000Z',
    status: 'failed',
    inputTokens: 10,
    outputTokens: 0,
    cacheTokens: 0,
    costEur: 0.2,
  },
  {
    id: 'ccc333-aa11',
    clientName: 'Puma',
    createdAt: '2026-10-20T08:00:00.000Z',
    status: 'queued',
  },
];

test('filtra por fecha y por quien pidió, suma y exporta CSV', () => {
  assert.equal(C.formatTime('2026-10-20T13:10:00.000Z'), '15:10');
  assert.equal(C.dayKey(jobs[0]), '2026-10-20');
  assert.equal(C.dayKey(jobs[1]), '2026-10-19');
  const day = C.filterJobs(jobs, { from: '2026-10-20', to: '2026-10-20' });
  assert.deepEqual(day.map((j) => j.id), ['abc123-xy12', 'ccc333-aa11']);
  const ana = C.filterJobs(jobs, { requester: 'Ana' });
  assert.deepEqual(ana.map((j) => j.id), ['abc123-xy12']);
  const none = C.filterJobs(jobs, { requester: C.NONE });
  assert.deepEqual(none.map((j) => j.id), ['ccc333-aa11']);
  const totals = C.totals(ana);
  assert.equal(totals.jobs, 1);
  assert.equal(totals.inputTokens, 1000);
  assert.equal(totals.outputTokens, 200);
  assert.equal(totals.cacheTokens, 50);
  assert.equal(totals.costEur, 1.5);
  const csv = C.toCsv(ana, 'https://studio.example');
  assert.equal(csv.charCodeAt(0), 0xfeff);
  assert.match(csv, /;/);
  assert.match(csv, /15:10/);
  assert.match(csv, /1,5000/);
  assert.match(csv, /https:\/\/studio\.example\/\?job=abc123-xy12/);
  assert.match(csv, /;Total;/);
  const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
  const app = fs.readFileSync(path.join(__dirname, 'app.js'), 'utf8');
  assert.match(html, /id="view-costes"/);
  assert.match(html, />Costes</);
  assert.match(app, /\/api\/jobs\?fields=cost/);
  assert.equal(C.hasTokenData(jobs[0]), true);
  assert.equal(C.hasTokenData(jobs[2]), false);
  assert.match(app, /sin datos/);
});
