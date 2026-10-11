const test = require('node:test');
const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..', '..');
const TSX_BIN = path.join(ROOT, 'node_modules', '.bin', 'tsx');

// Mismo patrón que rateLimit.test.js: supabase.ts se prueba con un one-liner de tsx y un fetch falso
// que apunta cada llamada y responde lo que el test le diga.
function run(code) {
  const wrapped = `
    const { createSupabase } = require(${JSON.stringify(path.join(__dirname, 'supabase.ts'))});
    const calls = [];
    function fakeFetch(responses) {
      return async (url, init = {}) => {
        calls.push({ url, method: init.method || 'GET', headers: init.headers || {}, body: init.body });
        const r = responses.length ? responses.shift() : { status: 201 };
        return { ok: r.status >= 200 && r.status < 300, status: r.status, text: async () => r.body || '', arrayBuffer: async () => Buffer.from(r.body || '') };
      };
    }
    const job = { id: 'abc123-xy12', createdAt: '2026-10-12T10:00:00.000Z', updatedAt: '2026-10-12T10:01:00.000Z', status: 'queued', currentPhase: null, input: { clientSlug: 'nike', clientName: 'Nike', brandMode: 'existing', briefText: '', requesterName: 'javi c' } };
    (async () => { ${code} })().catch((e) => { console.error(e); process.exit(1); });
  `;
  return JSON.parse(execFileSync(TSX_BIN, ['-e', wrapped], { cwd: ROOT, encoding: 'utf-8' }));
}

test('sin variables no hace nada', () => {
  const out = run(`
    const sb = createSupabase({ url: '', key: '', fetch: fakeFetch([]) });
    sb.saveJob(job);
    sb.saveFile('assets', 'nike/hero.png', 'x', 'image/png');
    const left = await sb.flush(100);
    console.log(JSON.stringify({ enabled: sb.enabled, calls: calls.length, left, read: await sb.readFile('assets', 'a.png') }));
  `);
  assert.deepEqual(out, { enabled: false, calls: 0, left: 0, read: null });
});

test('el trabajo se envía entero, con sus columnas de filtro y la clave en las cabeceras', () => {
  const out = run(`
    const sb = createSupabase({ url: 'https://x.supabase.co/', key: 'secreta', fetch: fakeFetch([]) });
    sb.saveJob(job);
    await sb.flush(1000);
    const c = calls[0];
    console.log(JSON.stringify({ url: c.url, method: c.method, apikey: c.headers.apikey, auth: c.headers.Authorization, prefer: c.headers.Prefer, row: JSON.parse(c.body) }));
  `);
  assert.equal(out.url, 'https://x.supabase.co/rest/v1/jobs?on_conflict=id');
  assert.equal(out.method, 'POST');
  assert.equal(out.apikey, 'secreta');
  assert.equal(out.auth, 'Bearer secreta');
  assert.match(out.prefer, /merge-duplicates/);
  assert.equal(out.row.client_slug, 'nike');
  assert.equal(out.row.requester, 'javi c');
  assert.equal(out.row.archived_at, null);
  assert.equal(out.row.data.id, 'abc123-xy12');
});

test('los envíos salen en el orden en que se encolaron, aunque el primero falle y se reintente', () => {
  const out = run(`
    const sb = createSupabase({ url: 'https://x.supabase.co', key: 'k', fetch: fakeFetch([{ status: 503 }, { status: 201 }]), retryDelaysMs: [5] });
    sb.saveJob(job);
    sb.saveEvent(job.id, { ts: '2026-10-12T10:02:00.000Z', phase: 'brief', level: 'info', message: 'hola' });
    const left = await sb.flush(1000);
    console.log(JSON.stringify({ left, order: calls.map((c) => c.url.split('/rest/v1/')[1].split('?')[0]) }));
  `);
  assert.deepEqual(out, { left: 0, order: ['jobs', 'jobs', 'job_events'] });
});

test('agotados los reintentos, el envío se descarta, se avisa y la cola sigue', () => {
  const out = run(`
    const errors = [];
    const sb = createSupabase({ url: 'https://x.supabase.co', key: 'k', fetch: fakeFetch([{ status: 500, body: 'boom' }, { status: 500, body: 'boom' }]), retryDelaysMs: [5], onError: (m) => errors.push(m) });
    sb.saveJob(job);
    sb.saveBrandCard('nike', { a: 1 });
    const left = await sb.flush(1000);
    console.log(JSON.stringify({ left, calls: calls.length, errors, last: calls[2].url }));
  `);
  assert.equal(out.left, 0);
  assert.equal(out.calls, 3);
  assert.equal(out.errors.length, 1);
  assert.match(out.errors[0], /trabajo abc123-xy12: descartado tras 2 intentos .* 500 boom/);
  assert.match(out.last, /brand_cards\?on_conflict=slug$/);
});

test('archivos: la ruta se codifica por tramos, se sobrescribe y un 404 al leer es null', () => {
  const out = run(`
    const sb = createSupabase({ url: 'https://x.supabase.co', key: 'k', fetch: fakeFetch([{ status: 200 }, { status: 404 }, { status: 200, body: 'hola' }]) });
    sb.saveFile('newsletters', 'newsletters/2026/el corte inglés/newsletter.html', '<p>', 'text/html');
    await sb.flush(1000);
    const missing = await sb.readFile('newsletters', 'no/esta.html');
    const found = await sb.readFile('newsletters', 'si/esta.html');
    console.log(JSON.stringify({ url: calls[0].url, upsert: calls[0].headers['x-upsert'], type: calls[0].headers['Content-Type'], missing, found: found.toString() }));
  `);
  assert.equal(out.url, 'https://x.supabase.co/storage/v1/object/newsletters/newsletters/2026/el%20corte%20ingl%C3%A9s/newsletter.html');
  assert.equal(out.upsert, 'true');
  assert.equal(out.type, 'text/html');
  assert.equal(out.missing, null);
  assert.equal(out.found, 'hola');
});

test('flush no espera más de lo que se le pide y dice cuánto queda', () => {
  const out = run(`
    const slow = async () => new Promise(() => {});
    const sb = createSupabase({ url: 'https://x.supabase.co', key: 'k', fetch: slow });
    sb.saveJob(job);
    sb.saveBrandCard('nike', {});
    const t = Date.now();
    const left = await sb.flush(50);
    console.log(JSON.stringify({ left, quick: Date.now() - t < 1000 }));
    process.exit(0);
  `);
  assert.deepEqual(out, { left: 2, quick: true });
});

test('varios cambios seguidos del mismo trabajo salen como un envío con la última versión', () => {
  const out = run(`
    const sb = createSupabase({ url: 'https://x.supabase.co', key: 'k', fetch: fakeFetch([]) });
    sb.saveJob({ ...job, status: 'queued' });
    sb.saveJob({ ...job, status: 'running' });
    sb.saveJob({ ...job, status: 'completed' });
    await sb.flush(1000);
    sb.saveJob({ ...job, status: 'cancelled' });
    await sb.flush(1000);
    console.log(JSON.stringify(calls.map((c) => JSON.parse(c.body).status)));
  `);
  assert.deepEqual(out, ['completed', 'cancelled']);
});

test('un trabajo descartado no bloquea sus cambios posteriores, y el reintento manda lo más nuevo', () => {
  const out = run(`
    const sb = createSupabase({ url: 'https://x.supabase.co', key: 'k', fetch: fakeFetch([{ status: 500 }, { status: 500 }, { status: 500 }]), retryDelaysMs: [20], onError: () => {} });
    sb.saveJob({ ...job, status: 'queued' });
    await new Promise((r) => setTimeout(r, 5));
    sb.saveJob({ ...job, status: 'running' });
    await sb.flush(1000);
    sb.saveJob({ ...job, status: 'completed' });
    await sb.flush(1000);
    console.log(JSON.stringify(calls.map((c) => JSON.parse(c.body).status)));
  `);
  // 1.º falla con 'queued'; su reintento ya lleva 'running' y falla (descartado); el envío que encoló 'running'
  // no tiene nada nuevo y no llama; 'completed' sale aparte (falla una vez con el tercer 500 y entra al reintentar).
  assert.deepEqual(out, ['queued', 'running', 'completed', 'completed']);
});
