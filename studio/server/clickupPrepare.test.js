const test = require('node:test');
const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', '..');
const TSX_BIN = path.join(ROOT, 'node_modules', '.bin', 'tsx');

function run(code) {
  const wrapped = `
    const prep = require(${JSON.stringify(path.join(__dirname, 'clickupPrepare.ts'))});
    const structured = [
      'Cliente/Marca: Novo Resort Deluxe',
      'URL de la marca: https://novoresortdeluxe.com',
      'Producto/servicio: alquiler de apartamentos',
      'Objetivo: promocionar los últimos días de alquiler',
      'Formato: email newsletter HTML',
      'CTA: "Reserva ahora" → https://novoresortdeluxe.com',
      'Idioma: español',
      'Tono: el look and feel de la marca',
      'Público: No indicado',
      'Mensajes clave: últimos días a precios ridículos',
      'Imágenes: de la web de la marca',
    ].join('\\n');
    const vague = 'vamos a crear una creatividad para email marketing de la página web novoresortdeluxe.com, donde vamos a promocionar los últimos días de alquiler de apartamentos a precios ridículos con el look and feel de novoresortdeluxe.com y con imágenes que obtenías de la web.';
    (async () => { ${code} })().catch((err) => { console.error(err); process.exit(1); });
  `;
  const out = execFileSync(TSX_BIN, ['-e', wrapped], {
    cwd: ROOT,
    env: { ...process.env, CLICKUP_DEFAULT_ASSIGNEE_ID: '', CLICKUP_TEAM_ID: '' },
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  return JSON.parse(out);
}

test('sin asignado lo pone a Javier Condado y, sin estado, a BACKLOG', () => {
  const out = run(`
    prep.clearAssigneeCache();
    const calls = [];
    const doFetch = async (url, init) => {
      const body = init && init.body ? JSON.parse(init.body) : null;
      calls.push({ url: String(url), method: (init && init.method) || 'GET', body });
      if (String(url).endsWith('/team')) {
        return { ok: true, json: async () => ({ teams: [{ id: '9', members: [
          { user: { id: 111, username: 'Ana López' } },
          { user: { id: 555, username: 'Javier Condado' } },
        ] }] }) };
      }
      if (String(url).includes('/list/')) return { ok: true, json: async () => ({ statuses: [{ status: 'backlog' }, { status: 'en curso' }] }) };
      return { ok: true, json: async () => ({}) };
    };
    const fresh = await prep.prepareClickupTask(
      { name: 'Novo', markdown_description: structured, assignees: [], status: null },
      'task1',
      { token: 'pk_test', comment: false, listId: '901223474074', doFetch, env: {} }
    );
    const taken = await prep.prepareClickupTask(
      { name: 'Novo', markdown_description: structured, assignees: [{ id: 42, username: 'Ana' }], status: { status: 'en curso' } },
      'task2',
      { token: 'pk_test', comment: false, listId: '901223474074', doFetch, env: {} }
    );
    const named = prep.memberIdByName([
      { id: '1', username: 'Javier', teamId: '9' },
      { id: '555', username: 'Javier Condado', teamId: '9' },
    ], 'Javier Condado', '9');
    console.log(JSON.stringify({
      put: calls.find((call) => call.method === 'PUT'),
      puts: calls.filter((call) => call.method === 'PUT').length,
      team: calls.filter((call) => String(call.url).endsWith('/team')).length,
      note: fresh.notes.map((row) => row.message),
      named,
      other: prep.memberIdByName([{ id: '1', username: 'Javier Condado López', teamId: '9' }], 'Javier Condado'),
    }));
  `);
  assert.equal(out.puts, 1);
  assert.equal(out.team, 1);
  assert.deepEqual(out.put.body.assignees, { add: [555], rem: [] });
  assert.equal(out.put.body.status, 'backlog');
  assert.equal(out.put.body.markdown_description, undefined);
  assert.equal(out.named, '555');
  assert.equal(out.other, null);
  assert.match(out.note.join('\n'), /Javier Condado \(555\)/);
  assert.match(out.note.join('\n'), /backlog/);
});

test('CLICKUP_DEFAULT_ASSIGNEE_ID no consulta los miembros', () => {
  const out = run(`
    prep.clearAssigneeCache();
    const calls = [];
    const doFetch = async (url, init) => {
      calls.push({ url: String(url), method: (init && init.method) || 'GET', body: init && init.body ? JSON.parse(init.body) : null });
      return { ok: true, json: async () => ({ statuses: [] }) };
    };
    await prep.prepareClickupTask(
      { name: 'Novo', markdown_description: structured, status: { status: 'en curso' } },
      'task1',
      { token: 'pk_test', comment: false, listId: '901223474074', doFetch, env: { CLICKUP_DEFAULT_ASSIGNEE_ID: '183' } }
    );
    console.log(JSON.stringify({
      team: calls.some((call) => String(call.url).endsWith('/team')),
      list: calls.some((call) => String(call.url).includes('/list/')),
      put: calls.find((call) => call.method === 'PUT').body,
    }));
  `);
  assert.equal(out.team, false);
  assert.equal(out.list, false);
  assert.deepEqual(out.put.assignees, { add: [183], rem: [] });
  assert.equal(out.put.status, undefined);
});

test('un brief vago se reescribe, se guarda y se comenta; uno ya estructurado no', () => {
  const out = run(`
    prep.clearAssigneeCache();
    const calls = [];
    let completes = 0;
    const doFetch = async (url, init) => {
      calls.push({ url: String(url), method: (init && init.method) || 'GET', body: init && init.body ? JSON.parse(init.body) : null });
      if (String(url).endsWith('/team')) {
        return { ok: true, json: async () => ({ teams: [{ id: '9', members: [{ user: { id: 555, username: 'Javier Condado' } }] }] }) };
      }
      return { ok: true, json: async () => ({}) };
    };
    const complete = async (prompt) => {
      completes++;
      return structured;
    };
    const task = { name: 'Creatividad Novo', markdown_description: vague, assignees: [{ id: 7 }], status: { status: 'to do' } };
    const first = await prep.prepareClickupTask(task, 'task1', {
      token: 'pk_test', comment: true, listId: '901223474074', doFetch, env: {}, complete,
    });
    const again = await prep.prepareClickupTask(first.task, 'task1', {
      token: 'pk_test', comment: true, listId: '901223474074', doFetch, env: {}, complete,
    });
    const labeled = await prep.prepareClickupTask(
      { name: 'Ya', markdown_description: structured, assignees: [{ id: 7 }], status: { status: 'to do' } },
      'task2',
      { token: 'pk_test', comment: true, listId: '901223474074', doFetch, env: {}, complete }
    );
    const put = calls.find((call) => call.method === 'PUT');
    const comment = calls.find((call) => call.method === 'POST' && String(call.url).endsWith('/comment'));
    console.log(JSON.stringify({
      completes,
      marker: first.task.markdown_description.includes(prep.BRIEF_MARKER),
      original: first.task.markdown_description.includes('Descripción original:') && first.task.markdown_description.includes('novoresortdeluxe.com'),
      fields: prep.briefIsStructured(first.task.markdown_description),
      putDesc: put && put.body.markdown_description.includes(prep.BRIEF_MARKER),
      noAssignee: put && put.body.assignees == null,
      noStatus: put && put.body.status == null,
      comment: comment && comment.body.comment_text,
      secondPuts: calls.filter((call) => call.method === 'PUT').length,
      againStructured: prep.briefIsStructured(again.task.markdown_description),
      labeledPuts: labeled.task.markdown_description === structured,
    }));
  `);
  assert.equal(out.completes, 1);
  assert.equal(out.marker, true);
  assert.equal(out.original, true);
  assert.equal(out.fields, true);
  assert.equal(out.putDesc, true);
  assert.equal(out.noAssignee, true);
  assert.equal(out.noStatus, true);
  assert.match(out.comment, /reestructurado/i);
  assert.equal(out.secondPuts, 1);
  assert.equal(out.againStructured, true);
  assert.equal(out.labeledPuts, true);
});

test('si el modelo falla, el trabajo sigue con el texto original y el asignado sí se guarda', () => {
  const out = run(`
    prep.clearAssigneeCache();
    const calls = [];
    const doFetch = async (url, init) => {
      calls.push({ url: String(url), method: (init && init.method) || 'GET', body: init && init.body ? JSON.parse(init.body) : null });
      return { ok: true, json: async () => ({}) };
    };
    const result = await prep.prepareClickupTask(
      { name: 'Novo', markdown_description: vague, status: { status: 'to do' } },
      'task1',
      {
        token: 'pk_test',
        comment: true,
        doFetch,
        env: { CLICKUP_DEFAULT_ASSIGNEE_ID: '183' },
        complete: async () => { throw new Error('modelo caído'); },
      }
    );
    const put = calls.find((call) => call.method === 'PUT');
    console.log(JSON.stringify({
      text: result.task.markdown_description,
      comment: calls.some((call) => String(call.url).endsWith('/comment')),
      assignees: put && put.body.assignees,
      description: put && put.body.markdown_description || null,
      error: result.notes.some((row) => row.level === 'error' && /modelo caído/.test(row.message)),
    }));
  `);
  assert.equal(out.text, 'vamos a crear una creatividad para email marketing de la página web novoresortdeluxe.com, donde vamos a promocionar los últimos días de alquiler de apartamentos a precios ridículos con el look and feel de novoresortdeluxe.com y con imágenes que obtenías de la web.');
  assert.equal(out.comment, false);
  assert.deepEqual(out.assignees, { add: [183], rem: [] });
  assert.equal(out.description, null);
  assert.equal(out.error, true);
});

test('el proveedor del brief sale de HERMES_PROVIDER y, si no, de Anthropic Sonnet', () => {
  const out = run(`
    const anthropic = prep.briefModelConfigFromEnv({ ANTHROPIC_API_KEY: 'sk-ant', HERMES_INFERENCE_MODEL: 'claude-sonnet-5-5' });
    const explicit = prep.briefModelConfigFromEnv({ HERMES_PROVIDER: 'anthropic', ANTHROPIC_API_KEY: 'sk-ant', HERMES_MODEL_BRIEF: 'claude-sonnet-5-5' });
    const nous = prep.briefModelConfigFromEnv({ HERMES_PROVIDER: 'nous-api', NOUS_API_KEY: 'nk' });
    const none = prep.briefModelConfigFromEnv({});
    const calls = [];
    const doFetch = async (url, init) => {
      calls.push({ url: String(url), key: init.headers['x-api-key'], body: JSON.parse(init.body) });
      return { ok: true, json: async () => ({ content: [{ type: 'text', text: structured }] }) };
    };
    const text = await prep.completeBrief('prompt', { ANTHROPIC_API_KEY: 'sk-ant' }, doFetch);
    const bad = prep.acceptBriefReply('solo un párrafo');
    console.log(JSON.stringify({
      anthropic: anthropic && { provider: anthropic.provider, model: anthropic.model, url: anthropic.url },
      explicit: explicit && explicit.model,
      nous: nous && { provider: nous.provider, url: nous.url },
      none: none,
      textOk: prep.briefIsStructured(text),
      bad,
      call: calls[0] && { url: calls[0].url, key: calls[0].key, model: calls[0].body.model },
    }));
  `);
  assert.deepEqual(out.anthropic, {
    provider: 'anthropic',
    model: 'claude-sonnet-5-5',
    url: 'https://api.anthropic.com/v1/messages',
  });
  assert.equal(out.explicit, 'claude-sonnet-5-5');
  assert.equal(out.nous.provider, 'openai');
  assert.match(out.nous.url, /inference-api\.nousresearch\.com/);
  assert.equal(out.none, null);
  assert.equal(out.textOk, true);
  assert.equal(out.bad, null);
  assert.equal(out.call.url, 'https://api.anthropic.com/v1/messages');
  assert.equal(out.call.key, 'sk-ant');
  assert.equal(out.call.model, 'claude-sonnet-5-5');
});

test('la reescritura del brief guarda entrada, salida y caché', () => {
  const out = run(`
    const doFetch = async () => ({
      ok: true,
      json: async () => ({
        content: [{ type: 'text', text: structured }],
        usage: { input_tokens: 1000, output_tokens: 200, cache_read_input_tokens: 10, cache_creation_input_tokens: 4 },
      }),
    });
    const call = await prep.completeBriefCall('prompt', { ANTHROPIC_API_KEY: 'sk-ant', HERMES_USD_EUR: '1' }, doFetch);
    const result = await prep.prepareClickupTask(
      { name: 'Pieza', description: vague, assignees: [{ id: 1 }], status: { status: 'BACKLOG' } },
      'task1',
      { token: '', comment: false, env: { ANTHROPIC_API_KEY: 'sk-ant', HERMES_USD_EUR: '1' }, doFetch }
    );
    console.log(JSON.stringify({
      text: prep.briefIsStructured(call.text),
      input: call.usage && call.usage.inputTokens,
      output: call.usage && call.usage.outputTokens,
      read: call.usage && call.usage.cacheReadTokens,
      write: call.usage && call.usage.cacheWriteTokens,
      id: call.usage && call.usage.usageSteps[0].id,
      usd: call.usage && call.usage.costUsd,
      kept: result.usage && result.usage.inputTokens,
    }));
  `);
  assert.equal(out.text, true);
  assert.equal(out.input, 1000);
  assert.equal(out.output, 200);
  assert.equal(out.read, 10);
  assert.equal(out.write, 4);
  assert.equal(out.id, 'brief-normalizado');
  assert.equal(out.usd, 0.004011);
  assert.equal(out.kept, 1000);
});
