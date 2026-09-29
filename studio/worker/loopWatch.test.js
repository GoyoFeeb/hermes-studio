const test = require('node:test');
const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..', '..');
const TSX_BIN = path.join(ROOT, 'node_modules', '.bin', 'tsx');

// loopWatch.ts es TypeScript: se prueba vía tsx -e (mismo patrón que qualityCheck.test.js).
function run(code) {
  const wrapped = `
    const { LoopWatch } = require(${JSON.stringify(path.join(__dirname, 'loopWatch.ts'))});
    const call = (name, target, args) => ({ name, target: target || '', key: name + ':' + JSON.stringify(args || { path: target }) });
    (async () => { ${code} })().catch((e) => { console.error(e); process.exit(1); });
  `;
  return JSON.parse(execFileSync(TSX_BIN, ['-e', wrapped], { cwd: ROOT, encoding: 'utf8' }));
}

test('Lacoste 2026-09-29: lecturas repetidas del intento de ayer → bucle', () => {
  const r = run(`
    const w = new LoopWatch(0);
    const calls = [call('todo', '', { todos: 1 }), call('search_files', 'brands/lacoste'), call('read_file', 'brief.md')];
    const old = ['newsletters/2026/lacoste/hermes/2026-09-28-flgi3r/notas.md', 'newsletters/2026/lacoste/hermes/2026-09-28-flgi3r/newsletter.html'];
    calls.push(call('read_file', old[0]), call('read_file', old[1]));
    w.update(calls, 1000);
    const before = w.looping(1000);
    for (let i = 0; i < 6; i++) calls.push(call('read_file', old[i % 2]));
    w.update(calls, 60000);
    process.stdout.write(JSON.stringify({ before, after: w.looping(60000) }));
  `);
  assert.equal(r.before, null);
  assert.match(r.after, /repite 6 veces seguidas/);
  assert.match(r.after, /2026-09-28-flgi3r\/notas\.md/);
});

test('trabajo normal: leer, buscar en la web y navegar no es bucle, aunque se mire la página varias veces', () => {
  const r = run(`
    const w = new LoopWatch(0);
    const calls = [];
    for (let i = 0; i < 5; i++) {
      calls.push(call('web_search', '', { query: 'lacoste rebajas ' + i }));
      calls.push(call('browser_navigate', '', { url: 'https://www.lacoste.com/es/' + i }));
      calls.push(call('browser_snapshot', '', {}));
      calls.push(call('browser_snapshot', '', {}));
    }
    calls.push(call('read_file', 'a.md'), call('write_file', 'newsletter.html', { path: 'newsletter.html', content: 'x' }));
    w.update(calls, 5 * 60000);
    process.stdout.write(JSON.stringify(w.looping(5 * 60000)));
  `);
  assert.equal(r, null);
});

test('10 min sin nada nuevo (aunque no sean 6 seguidas iguales) también es bucle; una llamada al modelo larga, no', () => {
  const r = run(`
    const w = new LoopWatch(0);
    const calls = [call('read_file', 'a.md'), call('read_file', 'b.md')];
    w.update(calls, 0);
    // Solo espera al modelo 11 min: no hay acciones, no es bucle (eso lo corta el vigilante de inactividad).
    const waiting = w.looping(11 * 60000);
    calls.push(call('read_file', 'a.md'), call('read_file', 'b.md'), call('read_file', 'a.md'), call('read_file', 'b.md'));
    w.update(calls, 11 * 60000);
    const repeating = w.looping(11 * 60000);
    process.stdout.write(JSON.stringify({ waiting, repeating }));
  `);
  assert.equal(r.waiting, null);
  assert.match(r.repeating, /min sin hacer nada nuevo/);
});

test('reset: tras avisar a Hermes, cuenta desde cero; una acción nueva corta la racha', () => {
  const r = run(`
    const w = new LoopWatch(0);
    const calls = [call('read_file', 'a.md')];
    for (let i = 0; i < 6; i++) calls.push(call('read_file', 'a.md'));
    w.update(calls, 1000);
    const first = w.looping(1000);
    w.reset(2000);
    const afterReset = w.looping(2000);
    calls.push(call('read_file', 'a.md'), call('write_file', 'newsletter.html', { path: 'newsletter.html', content: 'y' }), call('read_file', 'a.md'));
    w.update(calls, 3000);
    process.stdout.write(JSON.stringify({ first: !!first, afterReset, later: w.looping(3000) }));
  `);
  assert.equal(r.first, true);
  assert.equal(r.afterReset, null);
  assert.equal(r.later, null);
});

test('Lacoste 2026-09-29 (2.º intento): el brief escrito 14 veces seguidas → bucle de reescritura', () => {
  const r = run(`
    const w = new LoopWatch(0);
    const brief = 'newsletters/2026/lacoste/hermes/2026-09-29-n8blc7/brief.md';
    const calls = [call('web_search', '', { query: 'lacoste rebajas' }), call('browser_navigate', '', { url: 'https://www.lacoste.es' })];
    const seen = [];
    for (let i = 0; i < 4; i++) {
      calls.push(call('write_file', brief, { path: brief, content: 'versión ' + i }));
      w.update(calls, (i + 1) * 90000);
      seen.push(w.check((i + 1) * 90000));
    }
    process.stdout.write(JSON.stringify(seen));
  `);
  assert.equal(r[2], null); // 3 reescrituras todavía no
  assert.equal(r[3].kind, 'rewrite');
  assert.match(r[3].text, /reescribe 4 veces seguidas .*brief\.md/);
});

test('escribir, renderizar y corregir el mismo HTML no es bucle; varios patch seguidos tampoco', () => {
  const r = run(`
    const w = new LoopWatch(0);
    const html = 'newsletters/2026/x/hermes/y/newsletter.html';
    const calls = [];
    for (let i = 0; i < 6; i++) {
      calls.push(call('write_file', html, { path: html, content: 'v' + i }));
      calls.push(call('terminal', '', { command: 'node render.js ' + i }));
      calls.push(call('vision_analyze', '', { image: 'shot' + i + '.png' }));
    }
    for (let i = 0; i < 6; i++) calls.push(call('patch', html, { path: html, old: 'a' + i, new: 'b' + i }));
    w.update(calls, 60000);
    process.stdout.write(JSON.stringify(w.check(60000)));
  `);
  assert.equal(r, null);
});

test('setAsideFolder: el intento que no terminó pasa a _fallido-/_cancelado- sin borrar nada, y no pisa otro', () => {
  const stdout = (
    execFileSync(
      TSX_BIN,
      [
        '-e',
        `
        const fs = require('fs'); const os = require('os'); const path = require('path');
        const { setAsideFolder } = require(${JSON.stringify(path.join(__dirname, 'hermes-worker.ts'))});
        const base = fs.mkdtempSync(path.join(os.tmpdir(), 'aside-'));
        const make = (n) => { const d = path.join(base, n); fs.mkdirSync(d); fs.writeFileSync(path.join(d, 'notas.md'), 'x'); return d; };
        const a = setAsideFolder(make('2026-09-28-flgi3r'), 'fallido');
        const b = setAsideFolder(make('2026-09-28-flgi3r'), 'fallido');
        const c = setAsideFolder(path.join(base, 'no-existe'), 'cancelado');
        const d = setAsideFolder(a, 'fallido');
        const out = { a: path.basename(a), b: path.basename(b), c, d, kept: fs.existsSync(path.join(a, 'notas.md')), list: fs.readdirSync(base).sort() };
        fs.rmSync(base, { recursive: true, force: true });
        process.stdout.write(JSON.stringify(out));
      `,
      ],
      { cwd: ROOT, encoding: 'utf8', env: { ...process.env, HERMES_WORKER_ENV_DIR: '/nonexistent' } }
    )
  );
  // El worker deja una línea en el registro por cada carpeta apartada; el resultado va en la última.
  const r = JSON.parse(stdout.trim().split('\n').pop());
  assert.equal(r.a, '_fallido-2026-09-28-flgi3r');
  assert.equal(r.b, '_fallido-2026-09-28-flgi3r-2');
  assert.equal(r.c, null);
  assert.equal(r.d, null); // ya apartada: no se vuelve a renombrar
  assert.equal(r.kept, true);
  assert.deepEqual(r.list, ['_fallido-2026-09-28-flgi3r', '_fallido-2026-09-28-flgi3r-2']);
});
