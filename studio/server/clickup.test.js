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

test('el aviso solo trae el id: el brief es nombre, descripción, adjuntos y enlaces', () => {
  const out = run(`
    const calls = [];
    const fetched = await clickup.fetchClickupTask('abc1234', 'pk_test_token', async (url, init) => {
      calls.push({ url: String(url), authorization: init.headers.Authorization, method: init.method || 'GET' });
      return { ok: true, json: async () => ({ name: 'Porsche', markdown_description: 'Cuerpo en markdown', description: '<p>html</p>', text_content: 'plano' }) };
    });
    const htmlOnly = clickup.briefFromClickupTask({
      name: 'Solo html',
      description: '<p>Mira <a href="https://www.porsche.com/spain/">la web</a> y <a href="https://app.clickup.com/t/abc1234">la tarea</a></p>',
    });
    const textOnly = clickup.briefFromClickupTask({ name: 'Solo texto', text_content: 'Descripción plana', description: '<p>no esta</p>' });
    const markdown = clickup.briefFromClickupTask({
      name: 'Nike — Verano',
      markdown_description: 'Pieza de verano. Ficha: https://www.nike.com/es/producto',
      text_content: 'no usar',
      attachments: [{ title: 'brief.pdf', url: 'https://files.example.com/brief.pdf' }, { title: 'mal', url: 'http://inseguro.example/x' }],
    });
    const { jobs, deps } = memory();
    deps.fetchTask = async (id, token) => {
      calls.push({ task: id, token });
      return {
        id,
        name: 'Porsche 911',
        list: { id: listId },
        markdown_description: 'Newsletter del 911. https://www.porsche.com/spain/',
        attachments: [{ name: 'foto.jpg', url: 'https://cdn.example.com/foto.jpg' }],
      };
    };
    const body = createdPayload('task911');
    const res = await clickup.handleClickupWebhook(Buffer.from(body), sign(body), deps);
    await res.after;
    const job = jobs[0];
    const empty = clickup.briefFromClickupTask({ id: 'x' });
    console.log(JSON.stringify({
      fetchUrl: calls[0].url,
      fetchAuth: calls[0].authorization,
      fetchMethod: calls[0].method,
      fetchedName: fetched.name,
      fetchedKeepsMarkdown: fetched.markdown_description,
      htmlHasLink: htmlOnly.includes('https://www.porsche.com/spain/'),
      htmlDropsClickup: !htmlOnly.includes('app.clickup.com'),
      textUsesPlain: textOnly.includes('Descripción plana') && !textOnly.includes('no esta'),
      markdownName: markdown.startsWith('# Nike — Verano'),
      markdownBody: markdown.includes('Pieza de verano'),
      markdownSkipsText: !markdown.includes('no usar'),
      markdownFile: markdown.includes('https://files.example.com/brief.pdf'),
      markdownLink: markdown.includes('https://www.nike.com/es/producto'),
      markdownDropsHttp: !markdown.includes('http://inseguro.example'),
      status: res.status,
      payloadHadNoName: !body.includes('Porsche'),
      webhookFetch: calls.some((c) => c.task === 'task911' && c.token === 'pk_test'),
      brief: job.input.briefText,
      reused: job.input.briefReused,
      pending: job.input.clickupPending,
      empty,
    }));
  `);
  assert.equal(out.fetchUrl, 'https://api.clickup.com/api/v2/task/abc1234?include_markdown_description=true');
  assert.equal(out.fetchAuth, 'pk_test_token');
  assert.equal(out.fetchMethod, 'GET');
  assert.equal(out.fetchedName, 'Porsche');
  assert.equal(out.fetchedKeepsMarkdown, 'Cuerpo en markdown');
  assert.equal(out.htmlHasLink, true);
  assert.equal(out.htmlDropsClickup, true);
  assert.equal(out.textUsesPlain, true);
  assert.equal(out.markdownName, true);
  assert.equal(out.markdownBody, true);
  assert.equal(out.markdownSkipsText, true);
  assert.equal(out.markdownFile, true);
  assert.equal(out.markdownLink, true);
  assert.equal(out.markdownDropsHttp, true);
  assert.equal(out.status, 201);
  assert.equal(out.payloadHadNoName, true);
  assert.equal(out.webhookFetch, true);
  assert.match(out.brief, /^# Porsche 911\n\nNewsletter del 911/);
  assert.match(out.brief, /https:\/\/cdn\.example\.com\/foto\.jpg/);
  assert.match(out.brief, /https:\/\/www\.porsche\.com\/spain\//);
  assert.equal(out.reused, true);
  assert.equal(out.pending, false);
  assert.equal(out.empty, '');
});

test('la marca no es el prefijo de prueba: sale de la ficha, del campo o del texto tras newsletter', () => {
  const out = run(`
    const description = 'Newsletter de Feebbo para presentar la marca. Web: https://feebbo.com';
    const title = 'PRUEBA E2E Studio – newsletter Feebbo';
    const plain = clickup.deriveClientName(title, description);
    const known = clickup.deriveClient('PRUEBA E2E Studio', description, '', [{ slug: 'feebbo', name: 'Feebbo' }]);
    const field = clickup.deriveClient(title, description, 'Nike', [{ slug: 'feebbo', name: 'Feebbo' }]);
    const nike = clickup.deriveClientName('Nike — Verano', 'Hola');
    const adeslas = clickup.deriveClientName('TEST newsletter Adeslas', '');
    const label = clickup.deriveClientName('PRUEBA', 'Marca: Feebbo\\ntexto');
    const verano = clickup.deriveClient('Nike — Verano', '', '', [{ slug: 'verano', name: 'Verano' }, { slug: 'nike', name: 'Nike' }]);
    const { jobs, deps } = memory();
    deps.brandRecords = () => [{ slug: 'feebbo', name: 'Feebbo' }];
    deps.knownBrand = (slug) => slug === 'feebbo';
    deps.fetchTask = async () => ({ id: 'fee1234', name: title, list: { id: listId }, markdown_description: description });
    const body = createdPayload('fee1234');
    const res = await clickup.handleClickupWebhook(Buffer.from(body), sign(body), deps);
    await res.after;
    const job = jobs[0];
    console.log(JSON.stringify({
      plain, known, field, nike, adeslas, label, verano,
      client: job.input.clientName, slug: job.input.clientSlug, mode: job.input.brandMode,
    }));
  `);
  assert.equal(out.plain, 'Feebbo');
  assert.deepEqual(out.known, { name: 'Feebbo', slug: 'feebbo' });
  assert.deepEqual(out.field, { name: 'Nike' });
  assert.equal(out.nike, 'Nike');
  assert.equal(out.adeslas, 'Adeslas');
  assert.equal(out.label, 'Feebbo');
  assert.deepEqual(out.verano, { name: 'Nike', slug: 'nike' });
  assert.equal(out.client, 'Feebbo');
  assert.equal(out.slug, 'feebbo');
  assert.equal(out.mode, 'existing');
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

test('el requester es creator.username, no el usuario del historial del webhook', () => {
  const out = run(`
    const { jobs, deps } = memory();
    deps.fetchTask = async () => ({
      id: 'abc1234', name: 'Nike', list: { id: listId }, text_content: 'Hola',
      creator: { username: 'Laura' },
    });
    const body = JSON.stringify({
      event: 'taskCreated', task_id: 'abc1234',
      history_items: [{ field: 'task_creation', parent_id: listId, user: { username: 'Bot' } }],
    });
    const res = await clickup.handleClickupWebhook(Buffer.from(body), sign(body), deps);
    await res.after;
    console.log(JSON.stringify({ status: res.status, requester: jobs[0].input.requesterName }));
  `);
  assert.equal(out.status, 201);
  assert.equal(out.requester, 'Laura');
});

test('a los 30 s, si el trabajo sigue en cola, ClickUp recibe «En cola…»', () => {
  const out = run(`
    clickup.resetQueueNotices();
    const comments = [];
    const timers = [];
    const { jobs, deps } = memory();
    deps.comment = true;
    deps.postComment = async (taskId, _token, text) => { comments.push({ taskId, text }); };
    deps.schedule = (fn, ms) => { timers.push({ fn, ms }); };
    deps.fetchTask = async () => ({ id: 'task111', name: 'Nike', list: { id: listId }, text_content: 'Hola' });
    deps.queueFor = () => null;
    const body = createdPayload('task111');
    const res = await clickup.handleClickupWebhook(Buffer.from(body), sign(body), deps);
    await res.after;
    const waiting = jobs[0].id;
    await timers[0].fn();
    jobs[0].status = 'running';
    const second = createdPayload('task222');
    deps.fetchTask = async () => ({ id: 'task222', name: 'Adidas', list: { id: listId }, text_content: 'Hola' });
    const res2 = await clickup.handleClickupWebhook(Buffer.from(second), sign(second), deps);
    await res2.after;
    jobs[1].status = 'running';
    const before = comments.length;
    await timers[1].fn();
    const long = clickup.queueWaitComment({ ahead: 1, startsInSec: 90 });
    const soon = clickup.queueWaitComment({ ahead: 0, startsInSec: 5 });
    const none = clickup.queueWaitComment(null);
    console.log(JSON.stringify({
      delay: timers.map((t) => t.ms),
      constant: clickup.QUEUE_NOTICE_DELAY_MS,
      queuedText: comments.find((c) => c.taskId === 'task111' && c.text.startsWith('En cola'))?.text || '',
      creationHasQueue: comments.some((c) => c.text.includes('ha creado un trabajo') && c.text.includes('En cola')),
      afterClaim: comments.length - before,
      started: clickup.clickupStartedComment(),
      long, soon, none,
      waiting,
    }));
  `);
  assert.deepEqual(out.delay, [30_000, 30_000]);
  assert.equal(out.constant, 30_000);
  assert.match(out.queuedText, /^En cola/);
  assert.equal(out.creationHasQueue, false);
  assert.equal(out.afterClaim, 0);
  assert.equal(out.started, 'Hermes ha empezado este trabajo.');
  assert.match(out.long, /^En cola: 1 trabajo delante/);
  assert.match(out.soon, /^En cola/);
  assert.match(out.none, /^En cola/);
});

test('si el primer comentario ya lleva la cola, el aviso de los 30 s no se repite', () => {
  const out = run(`
    clickup.resetQueueNotices();
    const comments = [];
    const timers = [];
    const { jobs, deps } = memory();
    deps.comment = true;
    deps.postComment = async (taskId, _token, text) => { comments.push(text); };
    deps.schedule = (fn, ms) => { timers.push(fn); };
    deps.fetchTask = async () => ({ id: 'task111', name: 'Nike', list: { id: listId }, text_content: 'Hola' });
    deps.queueFor = () => ({ ahead: 2, startsInSec: 120 });
    const body = createdPayload('task111');
    const res = await clickup.handleClickupWebhook(Buffer.from(body), sign(body), deps);
    await res.after;
    const before = comments.length;
    await timers[0]();
    console.log(JSON.stringify({
      before,
      after: comments.length,
      first: comments[0],
      stillQueued: jobs[0].status,
    }));
  `);
  assert.equal(out.before, 1);
  assert.equal(out.after, 1);
  assert.match(out.first, /En cola: 2 trabajos delante/);
  assert.equal(out.stillQueued, 'queued');
});
