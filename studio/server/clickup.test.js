const test = require('node:test');
const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..', '..');
const TSX_BIN = path.join(ROOT, 'node_modules', '.bin', 'tsx');

// clickup.ts no arranca el servidor. Cada caso corre en un proceso de tsx, como auth.test.js.
function run(code) {
  const wrapped = `
    const clickup = require(${JSON.stringify(path.join(__dirname, 'clickup.ts'))});
    const secret = 'test-secret';
    const listId = '901223474074';
    function sign(body) { return clickup.signClickupBody(body, secret); }
    function memory() {
      const jobs = [];
      let n = 0;
      const deps = {
        secret, listId, apiToken: 'pk_test', comment: false,
        webBase: 'https://hermes-studio-beta.vercel.app',
        findJob: (id) => jobs.find((j) => j.input.clickupTaskId === id) || null,
        createJob: (input) => {
          const job = { id: 'm1h2k3-' + String(++n).padStart(4, 'a'), createdAt: new Date().toISOString(), status: 'queued', input, createdPending: !!input.clickupPending };
          jobs.push(job);
          return job;
        },
        getJob: (id) => jobs.find((j) => j.id === id) || null,
        updateJob: (id, patch) => {
          const job = jobs.find((j) => j.id === id);
          if (!job) throw new Error('missing');
          if (patch.input) job.input = patch.input;
          if (patch.status) job.status = patch.status;
          if (patch.error) job.error = patch.error;
          if (patch.title) job.title = patch.title;
        },
        fetchTask: async () => null,
        postComment: async () => {},
        knownBrand: () => false,
        log: () => {},
      };
      return { jobs, deps };
    }
    function createdPayload(taskId = 'abc1234') {
      return JSON.stringify({
        event: 'taskCreated',
        task_id: taskId,
        history_items: [{ field: 'task_creation', parent_id: listId, user: { username: 'Ana', email: 'ana@feebbo.com' } }],
      });
    }
    (async () => { ${code} })().catch((err) => { console.error(err); process.exit(1); });
  `;
  return JSON.parse(execFileSync(TSX_BIN, ['-e', wrapped], { cwd: ROOT, encoding: 'utf8' }));
}

test('firma válida acepta el cuerpo en bruto; otra firma, otro cuerpo o sin cabecera, no', () => {
  const out = run(`
    const body = createdPayload();
    const raw = Buffer.from(body);
    const { jobs, deps } = memory();
    deps.fetchTask = async () => ({ id: 'abc1234', name: 'Nike', list: { id: listId }, text_content: 'Hola' });
    const ok = await clickup.handleClickupWebhook(raw, sign(body), deps);
    await ok.after;
    const bad = await clickup.handleClickupWebhook(raw, 'ab'.repeat(32), deps);
    const missing = await clickup.handleClickupWebhook(raw, undefined, deps);
    const prefixed = await clickup.handleClickupWebhook(raw, 'sha256=' + sign(body), memory().deps);
    const tampered = await clickup.handleClickupWebhook(Buffer.from(body + ' '), sign(body), memory().deps);
    const junk = Buffer.from('{');
    const notJson = await clickup.handleClickupWebhook(junk, sign(junk), memory().deps);
    console.log(JSON.stringify({
      ok: ok.status, jobs: jobs.length,
      bad: bad.status, missing: missing.status, prefixed: prefixed.status, tampered: tampered.status,
      notJson: notJson.status, short: clickup.verifyClickupSignature(raw, 'abcd', secret),
      match: clickup.verifyClickupSignature(raw, sign(body), secret),
    }));
  `);
  assert.equal(out.ok, 201);
  assert.equal(out.jobs, 1);
  assert.equal(out.bad, 401);
  assert.equal(out.missing, 401);
  assert.equal(out.prefixed, 201);
  assert.equal(out.tampered, 401);
  assert.equal(out.notJson, 400);
  assert.equal(out.short, false);
  assert.equal(out.match, true);
});

test('sin CLICKUP_WEBHOOK_SECRET la ruta responde 401 y no crea', () => {
  const out = run(`
    const body = createdPayload();
    const { jobs, deps } = memory();
    deps.secret = '';
    deps.fetchTask = async () => { throw new Error('no debería leer la tarea'); };
    const res = await clickup.handleClickupWebhook(Buffer.from(body), sign(body), deps);
    const cfg = clickup.clickupConfigFromEnv({ CLICKUP_COMMENT: '0', CLICKUP_LIST_ID: '  ' });
    console.log(JSON.stringify({ status: res.status, error: res.body.error, jobs: jobs.length, after: !!res.after, comment: cfg.comment, listId: cfg.listId }));
  `);
  assert.equal(out.status, 401);
  assert.match(out.error, /desactivada/);
  assert.equal(out.jobs, 0);
  assert.equal(out.after, false);
  assert.equal(out.comment, false);
  assert.equal(out.listId, '901223474074');
});

test('solo crea si la tarea es de la lista configurada', () => {
  const out = run(`
    const { jobs, deps } = memory();
    const other = JSON.stringify({ event: 'taskCreated', task_id: 'other12', history_items: [{ field: 'task_creation', parent_id: '111' }] });
    const ignored = await clickup.handleClickupWebhook(Buffer.from(other), sign(other), deps);
    const statusUpdate = JSON.stringify({ event: 'taskUpdated', task_id: 'other12', history_items: [{ field: 'status', parent_id: listId }] });
    const notEnter = await clickup.handleClickupWebhook(Buffer.from(statusUpdate), sign(statusUpdate), deps);
    const alien = JSON.stringify({ event: 'listUpdated', list_id: listId });
    const otherEvent = await clickup.handleClickupWebhook(Buffer.from(alien), sign(alien), deps);
    const moved = JSON.stringify({
      event: 'taskMoved',
      task_id: 'move123',
      history_items: [{ field: 'section_moved', parent_id: listId, before: { id: '111' }, after: { id: listId }, user: { username: 'Ana' } }],
    });
    deps.fetchTask = async () => ({ id: 'move123', name: 'Nike — Verano', list: { id: listId }, markdown_description: 'Hola' });
    const entered = await clickup.handleClickupWebhook(Buffer.from(moved), sign(moved), deps);
    await entered.after;
    const unknown = JSON.stringify({ event: 'taskCreated', task_id: 'unk1234' });
    deps.apiToken = '';
    const noToken = await clickup.handleClickupWebhook(Buffer.from(unknown), sign(unknown), deps);
    const mismatchBody = createdPayload('bad1234');
    deps.apiToken = 'pk_test';
    deps.fetchTask = async () => ({ id: 'bad1234', name: 'Otra marca', list: { id: '999' } });
    const mismatch = await clickup.handleClickupWebhook(Buffer.from(mismatchBody), sign(mismatchBody), deps);
    await mismatch.after;
    const cancelled = jobs.find((j) => j.input.clickupTaskId === 'bad1234');
    console.log(JSON.stringify({
      ignored: ignored.body, notEnter: notEnter.body, otherEvent: otherEvent.body,
      entered: entered.status, client: jobs.find((j) => j.input.clickupTaskId === 'move123').input.clientName,
      noToken: noToken.body, cancelled: cancelled && cancelled.status, n: jobs.length,
    }));
  `);
  assert.equal(out.ignored.reason, 'list');
  assert.equal(out.ignored.ignored, true);
  assert.equal(out.notEnter.reason, 'list');
  assert.equal(out.otherEvent.reason, 'event');
  assert.equal(out.entered, 201);
  assert.equal(out.client, 'Nike');
  assert.equal(out.noToken.reason, 'list');
  assert.equal(out.cancelled, 'cancelled');
  assert.equal(out.n, 2);
});

test('un reintento con el mismo task id devuelve el trabajo ya creado', () => {
  const out = run(`
    const task = {
      id: 'abc1234',
      name: 'Nike — Verano',
      url: 'https://app.clickup.com/t/abc1234',
      markdown_description: 'Pieza. Web: https://www.nike.com/es y https://app.clickup.com/t/abc1234',
      list: { id: listId },
      creator: { username: 'Ana', email: 'ana@feebbo.com' },
      attachments: [{ title: 'brief.pdf', url: 'https://files.example.com/brief.pdf' }],
      custom_fields: [
        { name: 'Cliente', value: 'Nike' },
        { name: 'Campaña', value: 0, type_config: { options: [{ name: 'Verano', orderindex: 0 }] } },
      ],
    };
    const { jobs, deps } = memory();
    const comments = [];
    deps.comment = true;
    deps.fetchTask = async () => task;
    deps.postComment = async (id, token, text) => { comments.push({ id, token, text }); };
    const body = createdPayload();
    const first = await clickup.handleClickupWebhook(Buffer.from(body), sign(body), deps);
    const pending = jobs[0].createdPending;
    await first.after;
    const second = await clickup.handleClickupWebhook(Buffer.from(body), sign(body), deps);
    const job = jobs[0];
    const parallelBody = JSON.stringify({ event: 'taskCreated', task_id: 'par1234' });
    let fetches = 0;
    deps.comment = false;
    deps.fetchTask = async () => {
      fetches++;
      await new Promise((r) => setTimeout(r, 20));
      return { id: 'par1234', name: 'Adidas', list: { id: listId }, text_content: 'Hola' };
    };
    const pair = await Promise.all([
      clickup.handleClickupWebhook(Buffer.from(parallelBody), sign(parallelBody), deps),
      clickup.handleClickupWebhook(Buffer.from(parallelBody), sign(parallelBody), deps),
    ]);
    console.log(JSON.stringify({
      first: first.status, second: second.status, same: second.body.id === first.body.id, deduped: second.body.deduped,
      n: jobs.length, pending, pendingAfter: job.input.clickupPending,
      client: job.input.clientName, slug: job.input.clientSlug, campaign: job.input.campaignName,
      brandUrl: job.input.brandUrl, taskId: job.input.clickupTaskId, url: job.input.clickupUrl,
      requester: job.input.requesterName, mode: job.input.mode, imageMode: job.input.imageMode, art: job.input.artReview,
      mentionsFile: job.input.instruction.includes('https://files.example.com/brief.pdf'),
      mentionsWeb: job.input.instruction.includes('https://www.nike.com/es'),
      email: JSON.stringify(job).includes('ana@feebbo.com'),
      comment: comments[0] && comments[0].text, commentToken: comments[0] && comments[0].token, commentCount: comments.length,
      reserved: { clientId: job.input.clientId == null, campaignId: job.input.campaignId == null },
      parallel: { statuses: pair.map((r) => r.status).sort(), ids: pair.map((r) => r.body.id), fetches },
    }));
  `);
  assert.equal(out.first, 201);
  assert.equal(out.second, 200);
  assert.equal(out.same, true);
  assert.equal(out.deduped, true);
  assert.equal(out.pending, true);
  assert.equal(out.pendingAfter, false);
  assert.equal(out.client, 'Nike');
  assert.equal(out.slug, 'nike');
  assert.equal(out.campaign, 'Verano');
  assert.equal(out.brandUrl, 'https://www.nike.com/es');
  assert.equal(out.taskId, 'abc1234');
  assert.equal(out.url, 'https://app.clickup.com/t/abc1234');
  assert.equal(out.requester, 'Ana');
  assert.equal(out.mode, 'standalone');
  assert.equal(out.imageMode, 'official');
  assert.equal(out.art, true);
  assert.equal(out.mentionsFile, true);
  assert.equal(out.mentionsWeb, true);
  assert.equal(out.email, false);
  assert.equal(out.commentCount, 1);
  assert.match(out.comment, /^Hermes Studio ha creado un trabajo para esta tarea:\nhttps:\/\/hermes-studio-beta\.vercel\.app\/\?job=m1h2k3-/);
  assert.equal(out.commentToken, 'pk_test');
  assert.deepEqual(out.reserved, { clientId: true, campaignId: true });
  assert.deepEqual(out.parallel.statuses, [200, 201]);
  assert.equal(out.parallel.ids[0], out.parallel.ids[1]);
  assert.equal(out.parallel.fetches, 1);
  assert.equal(out.n, 2);
});

test('el cupo es el de POST /api/jobs y el webhook no entra en el worker', () => {
  const out = run(`
    const body = clickup.clickupWebhookCreateBody(clickup.DEFAULT_CLICKUP_WEBHOOK_ENDPOINT, clickup.DEFAULT_CLICKUP_LIST_ID);
    const fresh = { input: { clickupPending: true }, createdAt: new Date().toISOString() };
    const stale = { input: { clickupPending: true }, createdAt: new Date(Date.now() - clickup.CLICKUP_ENRICH_MS - 1000).toISOString() };
    const web = clickup.clickupConfigFromEnv({ STUDIO_WEB_URL: 'https://hermes.example.com/panel', CLICKUP_COMMENT: '1' });
    const blocked = clickup.clickupConfigFromEnv({ STUDIO_WEB_URL: 'http://evil.test' });
    console.log(JSON.stringify({
      max: clickup.CLICKUP_RATE_LIMIT.max,
      windowMs: clickup.CLICKUP_RATE_LIMIT.windowMs,
      body,
      fresh: clickup.clickupReadyForClaim(fresh),
      stale: clickup.clickupReadyForClaim(stale),
      plain: clickup.clickupReadyForClaim({ input: {}, createdAt: fresh.createdAt }),
      web: web.webBase, comment: web.comment, blocked: blocked.webBase,
    }));
  `);
  assert.equal(out.max, 5);
  assert.equal(out.windowMs, 10 * 60 * 1000);
  assert.deepEqual(out.body, {
    endpoint: 'https://hermes-studio-production-761e.up.railway.app/api/integrations/clickup',
    events: ['taskCreated'],
    list_id: 901223474074,
  });
  assert.equal(out.fresh, false);
  assert.equal(out.stale, true);
  assert.equal(out.plain, true);
  assert.equal(out.web, 'https://hermes.example.com');
  assert.equal(out.comment, true);
  assert.equal(out.blocked, 'https://hermes-studio-beta.vercel.app');

  const index = fs.readFileSync(path.join(__dirname, 'index.ts'), 'utf8');
  const cloud = fs.readFileSync(path.join(__dirname, '..', 'worker', 'cloudEnv.ts'), 'utf8');
  assert.match(index, /app\.post\('\/api\/integrations\/clickup'/);
  assert.match(index, /express\.raw\(\{ type: \(\) => true/);
  assert.match(index, /CLICKUP_RATE_LIMIT/);
  assert.match(index, /enqueueStandaloneJob\(/);
  assert.equal(cloud.includes('CLICKUP'), false);
});
