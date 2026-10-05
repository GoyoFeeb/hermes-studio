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

const GOOD = `<!doctype html><html lang="es"><head><title>x</title>
<meta name="color-scheme" content="light dark"><meta name="supported-color-schemes" content="light dark">
<!--[if mso]><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml><![endif]-->
<style>@media (max-width:620px){.a{width:100%}} @media (prefers-color-scheme: dark){body{background:#111}}</style></head><body>
<div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">El primer viaje también es un descanso para ti</div>
<table><tr><td><img src="logo-marca.png" alt="Marca" width="120"><img src="https://studio.example.org/assets/marca/design-input/hermes/x/img-0123456789ab.jpg" alt="Hero" width="600">
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
  const html = GOOD.replace('https://studio.example.org/assets/marca/design-input/hermes/x/img-0123456789ab.jpg', 'https://no-existe.invalid/a.jpg')
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
  const html = GOOD.replace('https://studio.example.org/assets/marca/design-input/hermes/x/img-0123456789ab.jpg', `data:image/png;base64,${big}`);
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

test('darkModeCheck: como las 8 newsletters de la auditoría (content="light", sin @media dark) es error', () => {
  const html = `<head><meta name="color-scheme" content="light"><meta name="supported-color-schemes" content="light"></head><body>x</body>`;
  const r = run(`process.stdout.write(JSON.stringify(q.darkModeCheck(${JSON.stringify(html)})));`);
  assert.equal(r.status, 'error');
  assert.equal(r.errorCount, 2);
  assert.match(r.details[0], /ahora declara "light"/);
});

test('darkModeCheck: "light only" explícito es solo aviso; "light dark" + @media dark, correcto', () => {
  const only = run(`process.stdout.write(JSON.stringify(q.darkModeCheck('<meta name="color-scheme" content="light only">')));`);
  assert.equal(only.status, 'warning');
  const ok = run(`process.stdout.write(JSON.stringify(q.darkModeCheck(${JSON.stringify(GOOD)})));`);
  assert.equal(ok.status, 'ok');
});

test('outlookCheck: sin <!--[if mso]> (como Inglesina), flex en línea e imagen sin width son errores', () => {
  const html = `<body><div style="display:flex;gap:8px"><img src="https://x.es/a.jpg" alt="a"></div></body>`;
  const r = run(`process.stdout.write(JSON.stringify(q.outlookCheck(${JSON.stringify(html)})));`);
  assert.equal(r.status, 'error');
  assert.equal(r.errorCount, 3);
  assert.ok(r.details.some((d) => d.includes('<!--[if mso]>')));
  assert.ok(r.details.some((d) => d.includes('display:flex')));
  assert.ok(r.details.some((d) => d.includes('sin atributo width')));
});

test('outlookCheck: con mso pero sin 96 ppp, fondo CSS sin VML y fuente sin alternativa → solo avisos', () => {
  const html = `<!--[if mso]><table width="600"><tr><td><![endif]--><td style="background-image:url(https://x.es/b.jpg);font-family:'Work Sans'">x</td>`;
  const r = run(`process.stdout.write(JSON.stringify(q.outlookCheck(${JSON.stringify(html)})));`);
  assert.equal(r.status, 'warning');
  assert.equal(r.errorCount, 0);
  assert.equal(r.details.length, 3);
});

test('outlookCheck: la fuente declarada en @font-face no cuenta como tipografía sin alternativa (Nike)', () => {
  const html = `<!--[if mso]><xml><o:PixelsPerInch>96</o:PixelsPerInch></xml><![endif]--><style>@font-face { font-family: 'Inter'; src: url(https://x.es/i.woff2); }</style><td style="font-family:'Inter',Helvetica,Arial,sans-serif">x</td>`;
  const r = run(`process.stdout.write(JSON.stringify(q.outlookCheck(${JSON.stringify(html)})));`);
  assert.equal(r.status, 'ok', JSON.stringify(r.details));
});

test('collectUrls: ignora variables del ESP, mailto y rutas locales', () => {
  const html = `<a href="{{unsubscribe_url}}">b</a><a href="mailto:a@b.es">m</a><a href="https://a.es/x?a=1&amp;b=2">x</a>
    <img src="img/logo.png"><img src="https://c.es/i.png"><td background="https://c.es/bg.jpg">`;
  const r = run(`process.stdout.write(JSON.stringify(q.collectUrls(${JSON.stringify(html)})));`);
  assert.deepEqual(r.links, ['https://a.es/x?a=1&b=2']);
  assert.deepEqual(r.images, ['https://c.es/i.png', 'https://c.es/bg.jpg']);
});

// Norma del 2026-10-02: si el pie lleva logo, es exactamente el de la cabecera (archivo, versión y tamaño).
function logoPiece(head, foot) {
  return `<body>${head}<p>Titular de la pieza</p><img src="https://cdn.example.org/hero.jpg" alt="Hero" width="600">
<p>Texto largo de la pieza con la oferta.</p>${foot}<p>Aviso legal</p><a href="{{unsubscribe_url}}">Baja</a></body>`;
}
const logoCheck = (html) => run(`process.stdout.write(JSON.stringify(q.logoMatchCheck(${JSON.stringify(html)})));`);

test('logoMatchCheck: mismo archivo y tamaño arriba y abajo es correcto; sin logo en el pie, también', () => {
  const logo = '<img src="img/logo.png" alt="Marca" width="150" height="40" style="width:150px;height:40px">';
  assert.equal(logoCheck(logoPiece(logo, logo)).status, 'ok');
  const sinPie = logoCheck(logoPiece(logo, ''));
  assert.equal(sinPie.status, 'ok');
  assert.equal(sinPie.details[0], 'El pie no lleva logo.');
});

test('logoMatchCheck: logo más pequeño en el pie (Nike 120→96, con variante oscura) es error', () => {
  const pair = (w, h) =>
    `<img src="logo-nike.png" width="${w}" height="${h}" alt="Nike" class="logo-light" style="display:block;width:${w}px;height:${h}px">` +
    `<img src="logo-nike-white.png" width="${w}" height="${h}" alt="Nike" class="logo-dark" style="display:none;width:${w}px;height:${h}px">`;
  const r = logoCheck(logoPiece(pair(120, 42), pair(96, 34)));
  assert.equal(r.status, 'error');
  assert.equal(r.errorCount, 2);
  assert.ok(r.details[0].includes('arriba 120px × 42px, abajo 96px × 34px'));
  assert.ok(r.details[1].startsWith('La versión de modo oscuro'));
});

test('logoMatchCheck: otro archivo en el pie (Adidas: negro arriba, blanco abajo) es error, también ya publicado', () => {
  const r = logoCheck(logoPiece('<img src="logo-black.png" width="120" alt="adidas">', '<img src="logo-white.png" width="120" alt="adidas">'));
  assert.equal(r.status, 'error');
  assert.ok(r.details[0].includes('arriba logo-black.png, abajo logo-white.png'));
  // Publicada: Studio renombra a img-<hash>.png y se pierde "logo" del nombre; se reconoce por el alt.
  const pub = logoCheck(logoPiece(
    '<img src="https://s.example/assets/a/img-16d9c3c165a5.png" width="120" alt="adidas">',
    '<img src="https://s.example/assets/a/img-f34e24dc4289.png" width="120" alt="adidas">'
  ));
  assert.equal(pub.status, 'error');
  assert.ok(pub.details[0].includes('img-16d9c3c165a5.png'));
});

test('logoMatchCheck: si arriba cambia en modo oscuro, abajo tiene que cambiar igual', () => {
  const head = '<img src="logo.png" width="150" alt="M" class="logo-light"><img src="logo-white.png" width="150" alt="M" class="logo-dark" style="display:none">';
  const r = logoCheck(logoPiece(head, '<img src="logo.png" width="150" alt="M" class="logo-light">'));
  assert.equal(r.status, 'error');
  assert.ok(r.details[0].includes('en modo oscuro'));
  assert.equal(logoCheck(logoPiece(head, head)).status, 'ok');
});

// Tipografía y espacios (2026-10-05): la newsletter de Siroko salió entera en Arial, con el texto pegado a las
// fotos y 48 px de laterales en móvil.
const SIROKO_FONTS = `<html><head><style>.h1{font-size:30px}</style></head><body>
<!--[if mso]><v:roundrect><center style="font-family:Arial, sans-serif;">Botón</center></v:roundrect><![endif]-->
<p style="font-family:Arial, Helvetica, sans-serif;">Texto</p><h1 style="font-family:Arial, Helvetica, sans-serif;">Título</h1></body></html>`;

test('typographyCheck: todo en Arial (Siroko) es error; Arial dentro de <!--[if mso]> no cuenta', () => {
  const r = run(`process.stdout.write(JSON.stringify([
    q.typographyCheck(${JSON.stringify(SIROKO_FONTS)}),
    q.typographyCheck(${JSON.stringify(SIROKO_FONTS.replace('<p style="font-family:Arial', '<p style="font-family:\'Siroko Sans\', Arial'))}),
  ]));`);
  assert.equal(r[0].status, 'error');
  assert.match(r[0].details[0], /fuentes genéricas \(Arial\)/);
  assert.equal(r[1].status, 'ok');
  assert.match(r[1].details[0], /Siroko Sans/);
});

test('typographyCheck: Helvetica Neue (Zara) o una fuente de @font-face cuentan como de marca', () => {
  const r = run(`process.stdout.write(JSON.stringify([
    q.typographyCheck('<p style="font-family:Helvetica Neue, Helvetica, Arial, sans-serif">x</p>'),
    q.typographyCheck('<style>@font-face{font-family:\\'Toyota Type\\';src:url(x.woff2)} h1{font-family:\\'Toyota Type\\', Arial}</style>'),
  ]));`);
  assert.equal(r[0].status, 'ok');
  assert.equal(r[1].status, 'ok');
});

test('layoutFindings: texto pegado a la foto y 48 px de laterales en móvil (Siroko) son errores', () => {
  const r = run(`process.stdout.write(JSON.stringify([
    q.layoutFindings({ touching: [{ text: 'Siroko ONE × MadKat', gap: 0 }, { text: 'Un pie blanco. Un pie azul.', gap: 2 }], mobileLeft: [48, 48, 48, 48, 20] }),
    q.layoutFindings({ touching: [], mobileLeft: [24, 24, 24, 24] }),
  ]));`);
  assert.equal(r[0].length, 3);
  assert.match(r[0][0], /pegado a una imagen \(0 px\): «Siroko ONE × MadKat»/);
  assert.match(r[0][2], /48 px de margen lateral/);
  assert.deepEqual(r[1], []);
});

test('runQualityCheck: los problemas de espacios entran como error «Espacios y márgenes»', () => {
  const r = run(`process.stdout.write(JSON.stringify(await q.runQualityCheck(${JSON.stringify(GOOD)}, { fetcher: fakeFetcher({}), mobileProblem: null, layoutProblems: ['Texto pegado a una imagen (0 px): «x».'] })));`);
  const layout = r.checks.find((c) => c.id === 'layout');
  assert.equal(layout.status, 'error');
  assert.equal(r.errors, 1);
});

// Logo e imágenes de correo (2026-10-05, Calvin Klein): logo SVG enlazado desde calvinklein.us y fotos de
// media1.calvinklein.com que dan 403 (Akamai). La pieza salió sin logo ni fotos y el control no dijo nada.
test('logoPresenceCheck: sin logo arriba es error; con «logo» en el src o una primera imagen pequeña, correcto', () => {
  const r = run(`process.stdout.write(JSON.stringify([
    q.logoPresenceCheck('<body><img src="hero.jpg" alt="Jung Kook" width="600"><p>Feel Iconic.</p></body>'),
    q.logoPresenceCheck('<body><img src="ck-logo.png" alt="Calvin Klein" width="196"><img src="hero.jpg" width="600"></body>'),
    q.logoPresenceCheck('<body><img src="img-0123456789ab.png" alt="Calvin Klein" width="160"><img src="hero.jpg" width="600"></body>'),
  ]));`);
  assert.equal(r[0].status, 'error');
  assert.equal(r[1].status, 'ok');
  assert.equal(r[2].status, 'ok');
});

test('emailImagesCheck: logo SVG y fotos enlazadas al CDN de la marca (Calvin Klein) son errores; locales y de Studio, no', () => {
  const ck = '<body><img src="https://www.calvinklein.us/on/demandware.static/-/Sites-PVHCKUS-Library/default/dwa0e4bc21/logo/CK-logo-Dark.svg" alt="Calvin Klein" width="196">' +
    '<img src="https://media1.calvinklein.com/images/20260929/HP/HP_JK_Mobile.jpg" alt="Jung Kook" width="600"></body>';
  const r = run(`process.stdout.write(JSON.stringify([
    q.emailImagesCheck(${JSON.stringify(ck)}),
    q.emailImagesCheck('<body><img src="logo.png" width="196"><img src="https://hermes-studio.up.railway.app/assets/ck/design-input/hermes/x/img-8a93f6ec7aaa.jpg" width="600"></body>'),
  ]));`);
  assert.equal(r[0].status, 'error');
  assert.equal(r[0].errorCount, 2);
  assert.match(r[0].details[0], /SVG \(CK-logo-Dark\.svg\)/);
  assert.match(r[0].details[1], /enlazada desde fuera \(https:\/\/media1\.calvinklein\.com/);
  assert.equal(r[1].status, 'ok');
});

test('runQualityCheck: una imagen que da 403 es error (el proxy de Gmail tampoco la ve); un enlace con 403, aviso', () => {
  const html = GOOD.replace('https://www.marca.es/producto', 'https://www.calvinklein.us/en/jeans');
  const img = 'https://studio.example.org/assets/marca/design-input/hermes/x/img-0123456789ab.jpg';
  const r = run(`process.stdout.write(JSON.stringify(await q.runQualityCheck(${JSON.stringify(html)}, { fetcher: fakeFetcher({
    [${JSON.stringify(img)}]: 403, 'https://www.calvinklein.us/en/jeans': 403 }) })));`);
  assert.equal(r.checks.find((c) => c.id === 'images').status, 'error');
  assert.match(r.checks.find((c) => c.id === 'images').details[0], /la web bloquea la imagen/);
  assert.equal(r.checks.find((c) => c.id === 'links').status, 'warning');
});
