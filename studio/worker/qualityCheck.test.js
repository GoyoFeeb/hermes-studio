const test = require('node:test');
const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..', '..');
const TSX_BIN = path.join(ROOT, 'node_modules', '.bin', 'tsx');

// qualityCheck.ts es TypeScript sin CLI — se prueba vía tsx -e, mismo patrón que
// studio/server/rateLimit.test.js. La red se sustituye por un fetcher falso: los casos son los
// fallos reales de la auditoría del 2026-09-28 (404 del botón de Inglesina, sin preheader, 429 de
// Prozis, "potencia" en Talaria).
function run(code) {
  const wrapped = `
    const q = require(${JSON.stringify(path.join(__dirname, 'qualityCheck.ts'))});
    function fakeFetcher(table) {
      return async (url) => {
        const r = table[url];
        if (r === 'ENOTFOUND') { const e = new Error('fetch failed'); e.cause = { code: 'ENOTFOUND' }; throw e; }
        return { status: r ?? 200, body: null };
      };
    }
    (async () => { ${code} })().catch((e) => { console.error(e); process.exit(1); });
  `;
  return JSON.parse(execFileSync(TSX_BIN, ['-e', wrapped], { cwd: ROOT, encoding: 'utf-8' }));
}

const GOOD = `<!doctype html><html lang="es"><head><title>x</title><style>@media (max-width:620px){.a{width:100%}}</style></head><body>
<div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">El primer viaje también es un descanso para ti</div>
<table><tr><td><img src="https://cdn.example.org/hero.jpg" alt="Hero" width="600">
<p>Texto de la pieza.</p><a href="https://www.marca.es/producto">Descubre</a>
<a href="{{unsubscribe_url}}">Darse de baja</a></td></tr></table></body></html>`;

test('runQualityCheck: una pieza correcta no tiene errores', () => {
  const r = run(`process.stdout.write(JSON.stringify(await q.runQualityCheck(${JSON.stringify(GOOD)}, { fetcher: fakeFetcher({}), mobileProblem: null })));`);
  assert.equal(r.errors, 0, JSON.stringify(r.checks.filter((c) => c.status !== 'ok')));
  assert.equal(r.checks.find((c) => c.id === 'preheader').details[0], '«El primer viaje también es un descanso para ti»');
});

test('runQualityCheck: un 404 en el botón es error y un 429 solo aviso (Inglesina / Prozis)', () => {
  const html = GOOD.replace('https://www.marca.es/producto', 'https://www.inglesina.com/es-es/products/base-darwin-360-isize')
    .replace('Darse de baja</a>', 'Darse de baja</a><a href="https://www.prozis.com/es/es">Prozis</a>');
  const r = run(`
    const rep = await q.runQualityCheck(${JSON.stringify(html)}, { fetcher: fakeFetcher({
      'https://www.inglesina.com/es-es/products/base-darwin-360-isize': 404,
      'https://www.prozis.com/es/es': 429,
    }) });
    process.stdout.write(JSON.stringify({ rep, text: q.describeErrors(rep) }));
  `);
  const links = r.rep.checks.find((c) => c.id === 'links');
  assert.equal(links.status, 'error');
  assert.ok(links.details.some((d) => d.includes('base-darwin-360-isize') && d.includes('404')));
  assert.ok(links.details.some((d) => d.startsWith('No verificable') && d.includes('429')));
  assert.match(r.text, /base-darwin-360-isize/);
  assert.doesNotMatch(r.text, /prozis/i);
});

test('runQualityCheck: dominio inexistente y 5xx persistente son errores', () => {
  const html = GOOD.replace('https://cdn.example.org/hero.jpg', 'https://no-existe.invalid/a.jpg')
    .replace('https://www.marca.es/producto', 'https://www.marca.es/caido');
  const r = run(`process.stdout.write(JSON.stringify(await q.runQualityCheck(${JSON.stringify(html)}, { fetcher: fakeFetcher({
    'https://no-existe.invalid/a.jpg': 'ENOTFOUND', 'https://www.marca.es/caido': 503 }) })));`);
  assert.equal(r.checks.find((c) => c.id === 'images').status, 'error');
  assert.equal(r.checks.find((c) => c.id === 'links').status, 'error');
});

test('staticChecks: sin preheader, sin baja, sin alt, enlace a "#" y claim de riesgo', () => {
  const html = `<html><body><img src="https://x.es/a.jpg"><p>Potencia garantizada.</p><a href="#">Ver</a></body></html>`;
  const r = run(`process.stdout.write(JSON.stringify(q.staticChecks(${JSON.stringify(html)})));`);
  const byId = Object.fromEntries(r.map((c) => [c.id, c]));
  assert.equal(byId.preheader.status, 'error');
  assert.equal(byId.unsubscribe.status, 'error');
  assert.equal(byId.alt.status, 'error');
  assert.equal(byId['empty-links'].status, 'error');
  // Los claims se avisan pero no bloquean: la regla da falsos positivos ("potencia" en una moto).
  assert.equal(byId.claims.status, 'warning');
  assert.ok(byId.claims.details.some((d) => d.includes('garantizado')));
});

test('staticChecks: el peso se mide con las imágenes base64 ya sustituidas por URLs', () => {
  const big = 'A'.repeat(300 * 1024);
  const html = GOOD.replace('https://cdn.example.org/hero.jpg', `data:image/png;base64,${big}`);
  const r = run(`process.stdout.write(JSON.stringify(q.staticChecks(${JSON.stringify(html)})));`);
  assert.equal(r.find((c) => c.id === 'size').status, 'ok');
  const heavy = GOOD.replace('<p>Texto de la pieza.</p>', `<p>${'x'.repeat(110 * 1024)}</p>`);
  const r2 = run(`process.stdout.write(JSON.stringify(q.staticChecks(${JSON.stringify(heavy)})));`);
  assert.equal(r2.find((c) => c.id === 'size').status, 'error');
});

test('findPreheader: quita el relleno invisible (&zwnj;&nbsp;) del preheader real de Puma', () => {
  const html = `<body><div style="display:none;font-size:1px;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;mso-hide:all;">
  La nueva zapatilla de estabilidad de PUMA Running ya está aquí.&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;
</div><p>x</p></body>`;
  const r = run(`process.stdout.write(JSON.stringify(q.findPreheader(${JSON.stringify(html)})));`);
  assert.equal(r, 'La nueva zapatilla de estabilidad de PUMA Running ya está aquí.');
});

test('collectUrls: ignora variables del ESP, mailto y rutas locales', () => {
  const html = `<a href="{{unsubscribe_url}}">b</a><a href="mailto:a@b.es">m</a><a href="https://a.es/x?a=1&amp;b=2">x</a>
    <img src="img/logo.png"><img src="https://c.es/i.png"><td background="https://c.es/bg.jpg">`;
  const r = run(`process.stdout.write(JSON.stringify(q.collectUrls(${JSON.stringify(html)})));`);
  assert.deepEqual(r.links, ['https://a.es/x?a=1&b=2']);
  assert.deepEqual(r.images, ['https://c.es/i.png', 'https://c.es/bg.jpg']);
});
