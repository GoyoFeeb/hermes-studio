const test = require('node:test');
const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..', '..');
const TSX_BIN = path.join(ROOT, 'node_modules', '.bin', 'tsx');

// Mejoras de la auditoría de agentes (2026-10-05): arreglos automáticos, inspectores nuevos, registro de tiempos,
// identidad medida, encargos sin la skill y marcadores sin rellenar. Vía tsx -e, como qualityCheck.test.js.
function run(code) {
  const out = execFileSync(TSX_BIN, ['-e', `(async () => { ${code} })().catch((e) => { console.error(e); process.exit(1); });`], {
    cwd: ROOT,
    encoding: 'utf-8',
    env: { ...process.env, HERMES_WORKER_ENV_DIR: '/nonexistent' },
  });
  return JSON.parse(out);
}
const mod = (name) => JSON.stringify(path.join(__dirname, name));

// ---------------------------------------------------------------- autoFix.ts

test('autoFix: declara el modo oscuro solo si la pieza ya tiene sus estilos oscuros', () => {
  const r = run(`
    const { autoFix } = require(${mod('autoFix.ts')});
    const withDark = autoFix('<html><head><style>@media (prefers-color-scheme: dark){.a{color:#fff}}</style></head><body></body></html>');
    const without = autoFix('<html><head></head><body></body></html>');
    process.stdout.write(JSON.stringify({ a: withDark.html, b: without.html }));
  `);
  assert.match(r.a, /<meta name="color-scheme" content="light dark">/);
  assert.match(r.a, /supported-color-schemes/);
  assert.doesNotMatch(r.b, /color-scheme/);
});

test('autoFix: 96 ppp de Outlook con sus espacios de nombres', () => {
  const r = run(`
    const { autoFix } = require(${mod('autoFix.ts')});
    process.stdout.write(JSON.stringify(autoFix('<html lang="es"><head><title>x</title></head><body></body></html>')));
  `);
  assert.match(r.html, /<o:PixelsPerInch>96<\/o:PixelsPerInch>/);
  assert.match(r.html, /<html lang="es" xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:v="urn:schemas-microsoft-com:vml">/);
  assert.ok(r.applied.some((a) => /96 ppp/.test(a)));
});

test('autoFix: width en las imágenes que no lo tienen, sin confundirlo con el width de un SVG incrustado', () => {
  const r = run(`
    const { autoFix, hasAttr } = require(${mod('autoFix.ts')});
    const html = '<body><img src="a.png" alt=""><img src="data:image/svg+xml;utf8,<svg width=%22600%22></svg>" alt=""><img src="c.png" width="80" alt=""><img src="d.png" style="width:240px" alt=""></body>';
    const fixed = autoFix(html, [600, 300, 80, 0]);
    process.stdout.write(JSON.stringify({ html: fixed.html, svgHas: hasAttr('<img src="x" style="width:10px" alt="width=3">', 'width') }));
  `);
  assert.match(r.html, /<img width="600" src="a.png"/);
  assert.match(r.html, /<img width="300" src="data:image\/svg/);
  assert.match(r.html, /<img src="c.png" width="80"/);
  assert.match(r.html, /<img width="240" src="d.png"/);
  assert.equal(r.svgHas, false);
});

test('autoFix: box-sizing en celdas con width:100% y padding (se salían en móvil)', () => {
  const r = run(`
    const { autoFix } = require(${mod('autoFix.ts')});
    process.stdout.write(JSON.stringify(autoFix('<td style="width:100%; padding:0 28px">a</td><td style="width:100%">b</td><td style="width:100%;padding:0 20px;box-sizing:border-box">c</td>')));
  `);
  assert.match(r.html, /style="width:100%; padding:0 28px;box-sizing:border-box;"/);
  assert.match(r.html, /<td style="width:100%">b/);
  assert.equal((r.html.match(/box-sizing/g) || []).length, 2);
});

test('autoFix: el enlace «Darse de baja» pasa a {{unsubscribe_url}}', () => {
  const r = run(`
    const { autoFix } = require(${mod('autoFix.ts')});
    process.stdout.write(JSON.stringify(autoFix('<a href="https://marca.es/legal">Aviso legal</a> <a href="https://marca.es/baja"><span>Darse de baja</span></a>')));
  `);
  assert.match(r.html, /<a href="https:\/\/marca.es\/legal">Aviso legal/);
  assert.match(r.html, /<a href="\{\{unsubscribe_url\}\}"><span>Darse de baja/);
});

// ---------------------------------------------------------------- renderChecks.ts (partes sin navegador)

test('Contraste WCAG: negro sobre blanco 21:1, #999 sobre blanco por debajo de 3', () => {
  const r = run(`
    const { contrastRatio } = require(${mod('renderChecks.ts')});
    process.stdout.write(JSON.stringify([contrastRatio('#000000', '#ffffff'), contrastRatio('#999999', '#ffffff')]));
  `);
  assert.equal(Math.round(r[0]), 21);
  assert.ok(r[1] < 3);
});

const BASE_METRICS = { contrast: [], columns: 1, coloredText: false, fullImgs: 1, areas: [] };

test('Legibilidad: contraste bajo en el cuerpo es error; en el pie legal o un pie de foto, aviso', () => {
  const r = run(`
    const { designFindings } = require(${mod('renderChecks.ts')});
    const m = ${JSON.stringify(BASE_METRICS)};
    m.contrast = [
      { text: 'Texto del cuerpo', fg: '#aaaaaa', bg: '#ffffff', size: 16, bold: false, at: 0.4 },
      { text: 'Recibes este correo', fg: '#a0a0a0', bg: '#ffffff', size: 12, bold: false, at: 0.95 },
      { text: 'Foto: © Autor', fg: '#9b9b9b', bg: '#ffffff', size: 12, bold: false, at: 0.5 },
    ];
    process.stdout.write(JSON.stringify(designFindings(m, [])));
  `);
  assert.equal(r.errors.length, 1);
  assert.match(r.errors[0], /Texto del cuerpo/);
  assert.equal(r.warnings.length, 2);
});

test('Legibilidad: texto de menos de 12 px en móvil es error; de 12-13, aviso; el pie no cuenta', () => {
  const r = run(`
    const { designFindings } = require(${mod('renderChecks.ts')});
    process.stdout.write(JSON.stringify(designFindings(${JSON.stringify(BASE_METRICS)}, [
      { text: 'diminuto', size: 10, at: 0.3 }, { text: 'pie de foto', size: 12, at: 0.4 }, { text: 'legal', size: 10, at: 0.9 },
    ])));
  `);
  assert.equal(r.errors.length, 1);
  assert.match(r.errors[0], /diminuto/);
  assert.equal(r.warnings.length, 1);
});

test('Estructura repetida (Siroko): 3 fotos a todo el ancho y ningún otro módulo es error', () => {
  const r = run(`
    const { designFindings } = require(${mod('renderChecks.ts')});
    const siroko = { contrast: [], columns: 0, coloredText: false, fullImgs: 3, areas: [] };
    const conColumnas = { ...siroko, columns: 2 };
    const conColor = { ...siroko, coloredText: true };
    process.stdout.write(JSON.stringify([designFindings(siroko, []), designFindings(conColumnas, []), designFindings(conColor, [])]));
  `);
  assert.match(r[0].errors.join(' '), /Estructura repetida/);
  assert.equal(r[1].errors.length, 0);
  assert.equal(r[2].errors.length, 0);
});

test('Paleta: un botón con un color que no es de la marca es aviso; los neutros y los cercanos, no', () => {
  const r = run(`
    const { designFindings } = require(${mod('renderChecks.ts')});
    const m = { contrast: [], columns: 1, coloredText: true, fullImgs: 1, areas: [
      { hex: '#e4002b', area: 12000, button: true }, { hex: '#f4f4f4', area: 900000, button: false }, { hex: '#00a0e1', area: 40000, button: false },
    ] };
    process.stdout.write(JSON.stringify([designFindings(m, [], ['#00a3e0', '#ffffff']), designFindings(m, [], [])]));
  `);
  assert.equal(r[0].warnings.length, 1);
  assert.match(r[0].warnings[0], /#e4002b \(botón\)/);
  assert.doesNotMatch(r[0].warnings[0], /#00a0e1|#f4f4f4/);
  assert.equal(r[1].warnings.length, 0, 'sin paleta de la marca no se compara');
});

test('Imágenes: una foto con más del 45 % de fondo liso es error (la zapatilla de Nike)', async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'img-'));
  const r = run(`
    const sharp = require('sharp');
    const fs = require('fs');
    const dir = ${JSON.stringify(dir)};
    // 1000×1000 blanco con el «producto» (gris) en una franja de 300 px en el centro.
    const product = await sharp({ create: { width: 800, height: 300, channels: 3, background: '#556677' } }).png().toBuffer();
    await sharp({ create: { width: 1000, height: 1000, channels: 3, background: '#ffffff' } }).composite([{ input: product, top: 350, left: 100 }]).jpeg().toFile(dir + '/zapatilla.jpg');
    await sharp({ create: { width: 1000, height: 600, channels: 3, background: '#334455' } }).jpeg().toFile(dir + '/llena.jpg');
    const { imageFindings } = require(${mod('renderChecks.ts')});
    const html = '<img src="zapatilla.jpg" width="600" alt=""><img src="llena.jpg" width="600" alt="">';
    process.stdout.write(JSON.stringify(await imageFindings(html, dir, dir, [600, 600])));
  `);
  fs.rmSync(dir, { recursive: true, force: true });
  assert.equal(r.errors.length, 1);
  assert.match(r.errors[0], /zapatilla\.jpg: el 70 %/);
});

// ---------------------------------------------------------------- qualityCheck.ts

test('Marcadores de la base técnica sin rellenar son error; los comentarios de ayuda no cuentan', () => {
  const r = run(`
    const { staticChecks } = require(${mod('qualityCheck.ts')});
    const bad = staticChecks('<html><head><!-- Sustituye [CORCHETES] --></head><body><a href="[URL]">x</a><img src="[logo.png]" alt="[MARCA]"></body></html>');
    const good = staticChecks('<html><head><!-- [AYUDA] --><!--[if mso]><x><![endif]--></head><body><p>Precio [desde 99 €]</p></body></html>');
    process.stdout.write(JSON.stringify([bad.find((c) => c.id === 'placeholders'), good.find((c) => c.id === 'placeholders')]));
  `);
  assert.equal(r[0].status, 'error');
  assert.deepEqual(r[0].details, ['Marcador sin rellenar: [URL]', 'Marcador sin rellenar: [logo.png]', 'Marcador sin rellenar: [MARCA]']);
  assert.equal(r[1].status, 'ok');
});

test('La base técnica de email pasa la parte estática del control salvo sus marcadores', () => {
  const r = run(`
    const fs = require('fs');
    const { staticChecks } = require(${mod('qualityCheck.ts')});
    const html = fs.readFileSync(${JSON.stringify(path.join(ROOT, 'studio', 'hermes', 'email-base.html'))}, 'utf8');
    process.stdout.write(JSON.stringify(staticChecks(html).filter((c) => c.status === 'error').map((c) => c.id)));
  `);
  // Sin rellenar: marcadores (y el logo de marcador, que no es una imagen real). Lo técnico ya cumple.
  for (const id of ['dark-mode', 'outlook', 'preheader', 'unsubscribe']) assert.ok(!r.includes(id), `${id} no debería fallar en la base`);
  assert.ok(r.includes('placeholders'));
});

// ---------------------------------------------------------------- timeline.ts

test('Timeline: fases, esperas cortadas, rondas y resumen', () => {
  const r = run(`
    const { Timeline, summarize } = require(${mod('timeline.ts')});
    let now = 0;
    const t = new Timeline(() => now);
    t.start('brief', 'Brief'); now = 90000; t.end(12);
    t.start('draft', 'Primera versión'); now = 900000; t.hang(480);
    t.round(); t.start('fix-1', 'Corrección 1'); now = 1020000;
    const json = t.toJSON();
    process.stdout.write(JSON.stringify({ json, line: summarize(json) }));
  `);
  assert.deepEqual(r.json.phases.map((p) => [p.id, p.sec]), [['brief', 90], ['draft', 810], ['fix-1', 120]]);
  assert.equal(r.json.phases[0].actions, 12);
  assert.deepEqual(r.json.hangs, { count: 1, sec: 480 });
  assert.equal(r.json.rounds, 1);
  assert.equal(r.json.totalSec, 1020);
  assert.match(r.line, /brief 1:30 · primera versión 13:30 · corrección 1 2:00 · esperas cortadas 1 \(8:00\) — total 17:00/);
});

// Desglose de la primera versión (2026-10-15, Volkswagen 7uxqfr: «Pieza 16:50» = 6:34 + 1:45 + 8:31).
test('Primera versión: investigación, escritura y autorrevisión por la hora de cada mensaje', () => {
  const r = run(`
    const w = require(${mod('hermes-worker.ts')});
    const { Timeline } = require(${mod('timeline.ts')});
    const call = (name, p) => ({ function: { name, arguments: JSON.stringify({ path: p }) } });
    const msg = (sec, role, calls) => ({ role, timestamp: String(1000 + sec), ...(calls ? { tool_calls: calls } : {}) });
    const session = { messages: [
      msg(-30, 'user'),                                           // de otra fase: no cuenta
      msg(10, 'assistant', [call('browser_exec', '')]),
      msg(394, 'tool'),                                           // última acción antes de escribir
      msg(499, 'assistant', [call('write_file', 'x/newsletter.html')]),
      msg(800, 'assistant', JSON.stringify([call('patch', 'x/newsletter.html')])),
    ] };
    const parts = w.draftParts(session, 1000000, 1000000 + 1005000);
    const noHtml = w.draftParts({ messages: [msg(10, 'assistant', [call('write_file', 'x/notas.md')])] }, 1000000, 1100000);
    let now = 0;
    const t = new Timeline(() => now);
    t.start('draft', 'Primera versión'); now = 1010000; t.end(30);
    t.splitLast(parts);
    const over = new Timeline(() => now);
    over.start('draft', 'Primera versión'); now += 60000; over.end();
    over.splitLast(parts);
    process.stdout.write(JSON.stringify({ parts, noHtml, split: t.toJSON().phases[0].parts, over: over.toJSON().phases[0].parts }));
  `);
  assert.deepEqual(r.parts.map((p) => [p.id, p.sec]), [['research', 394], ['write', 105], ['selfreview', 506]]);
  assert.deepEqual(r.noHtml, []);
  // La autorrevisión absorbe el margen del worker: las partes suman lo que midió la fase (1010 s).
  assert.deepEqual(r.split.map((p) => p.sec), [394, 105, 511]);
  // Fase más corta que las partes: se recortan y siguen sumando la fase (60 s).
  assert.deepEqual(r.over.map((p) => p.sec), [60, 0, 0]);
});

test('sanitizeTimings deja pasar el desglose de la primera versión, acotado', () => {
  const r = run(`
    const m = await import(${JSON.stringify(path.join(__dirname, '..', 'server', 'standalone.ts'))});
    const { sanitizeTimings } = m.default ?? m;
    const parts = [1, 2, 3, 4].map((i) => ({ id: 'p' + i, label: 'x'.repeat(80), sec: '12' }));
    const t = sanitizeTimings({ phases: [{ id: 'draft', label: 'Primera versión', sec: 40, parts }, { id: 'check', label: 'C', sec: 5 }], hangs: {}, rounds: 0, totalSec: 45 });
    process.stdout.write(JSON.stringify(t));
  `);
  assert.equal(r.phases[0].parts.length, 3);
  assert.equal(r.phases[0].parts[0].label.length, 40);
  assert.equal(r.phases[0].parts[0].sec, 12);
  assert.equal(r.phases[1].parts, undefined);
});

// ---------------------------------------------------------------- measureBrand.ts

test('Identidad medida: webs candidatas, comprobación de que es la marca y nota para Hermes', () => {
  const r = run(`
    const m = require(${mod('measureBrand.ts')});
    const note = m.identityNote({
      version: 1, measuredAt: '2026-10-05T10:00:00Z', url: 'https://www.siroko.com/es/', title: 'Siroko',
      headings: { family: '"Barlow Condensed", sans-serif', weight: '700', transform: 'uppercase', letterSpacing: 'normal', color: '#111111' },
      body: { family: 'Barlow, sans-serif', size: '16px', color: '#333333' },
      fonts: [{ family: 'Barlow', googleFonts: true }], fontLinks: ['https://fonts.googleapis.com/css2?family=Barlow'],
      background: '#ffffff', text: '#333333', button: { background: '#00a3e0', color: '#ffffff', radius: '0px', transform: 'uppercase' },
      palette: ['#00a3e0', '#ff5a00'], logo: 'brands/siroko/design-input/logo-medido.png',
    });
    process.stdout.write(JSON.stringify({
      urls: m.candidateUrls('calvin-klein'),
      given: m.candidateUrls('nike', 'https://www.nike.com/es/')[0],
      ok: m.looksLikeBrand('Calvin Klein', 'calvin-klein', 'https://www.calvinklein.es/', 'Calvin Klein España'),
      notOk: m.looksLikeBrand('Siroko', 'siroko', 'https://www.dominio-en-venta.com/', 'Domain for sale'),
      note,
    }));
  `);
  // H-04 (2026-10-15): sin web oficial no se adivina el dominio («Feebbo» → feebbo.com era Feebbo Encuestas).
  assert.deepEqual(r.urls, []);
  assert.equal(r.given, 'https://www.nike.com/es/');
  assert.equal(r.ok, true);
  assert.equal(r.notOk, false);
  assert.match(r.note, /Titulares: Barlow Condensed \(peso 700, uppercase/);
  assert.match(r.note, /Google Fonts\): Barlow/);
  assert.match(r.note, /logo-medido\.png/);
});

test('H-04 (2026-10-15): sin web oficial no se mide; con título de otra marca tampoco; sin logo nuevo, fuera el viejo', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'brand-h04-'));
  const old = path.join(root, 'brands', 'feebbo', 'design-input', 'logo-medido.png');
  fs.mkdirSync(path.dirname(old), { recursive: true });
  fs.writeFileSync(old, 'logo de otra empresa');
  const r = run(`
    const http = require('http');
    const fs = require('fs');
    const m = require(${mod('measureBrand.ts')});
    const pages = {
      '/otra': '<html><head><title>Feebbo Encuestas</title></head><body><h1>Encuestas pagadas</h1></body></html>',
      '/buena': '<html><head><title>Feebbo Digital</title></head><body><h1>Consultoría digital</h1><p>Texto de la web de la marca, sin logo en la cabecera.</p></body></html>',
    };
    const server = http.createServer((req, res) => { res.writeHead(200, { 'Content-Type': 'text/html' }); res.end(pages[req.url] || ''); });
    await new Promise((ok) => server.listen(0, '127.0.0.1', ok));
    const base = 'http://127.0.0.1:' + server.address().port;
    const root = ${JSON.stringify(root)};
    const none = await m.measureBrand(root, 'feebbo', 'Feebbo Digital');
    const other = await m.measureBrand(root, 'feebbo', 'Feebbo Digital', base + '/otra');
    const keptAfterOther = fs.existsSync(${JSON.stringify(old)});
    const good = await m.measureBrand(root, 'feebbo', 'Feebbo Digital', base + '/buena');
    server.close();
    process.stdout.write(JSON.stringify({ none, other, keptAfterOther, goodUrl: good.url, goodSource: good.urlSource, goodLogo: good.logo, oldLeft: fs.existsSync(${JSON.stringify(old)}) }));
  `);
  fs.rmSync(root, { recursive: true, force: true });
  assert.match(r.none.reason, /No hay web oficial/);
  assert.match(r.other.reason, /se titula «Feebbo Encuestas» y no nombra a Feebbo Digital/);
  assert.equal(r.keptAfterOther, true, 'si no se mide, no se toca nada');
  assert.match(r.goodUrl, /\/buena$/);
  assert.equal(r.goodLogo, null);
  assert.equal(r.goodSource, 'equipo', 'la web medida queda marcada como dada por el equipo');
  assert.equal(r.oldLeft, false, 'el logo de la medición anterior no se queda como «oficial»');
});

test('Tesla (2026-10-15): una web adivinada no se da por buena; la nota de identidad pide comprobarla', () => {
  const base = {
    version: 2, measuredAt: '2026-10-15T13:33:55Z', url: 'https://www.tesla.es/', title: 'Tesla: Instalaciones Integrales en Barcelona',
    headings: null, body: null, fonts: [], fontLinks: [], background: '#ffffff', text: '#1d1d1d', button: null,
    palette: ['#128c3c'], logo: 'brands/tesla/design-input/logo-medido.png',
  };
  const r = run(`
    const m = require(${mod('measureBrand.ts')});
    const w = require(${mod('hermes-worker.ts')});
    const legacy = ${JSON.stringify(base)};
    const team = { ...legacy, url: 'https://www.tesla.com/es_ES', urlSource: 'equipo' };
    process.stdout.write(JSON.stringify({
      legacyOk: m.hasConfirmedUrl(legacy), teamOk: m.hasConfirmedUrl(team), none: m.hasConfirmedUrl(null),
      same: [m.sameSite('https://tesla.com/es_ES', 'https://www.tesla.com/'), m.sameSite('https://www.tesla.es/', 'https://www.tesla.com/')],
      legacyNote: m.identityNote(legacy), teamNote: m.identityNote(team),
      legal: w.legalNote('/nonexistent', 'tesla'),
    }));
  `);
  assert.deepEqual([r.legacyOk, r.teamOk, r.none], [false, true, false]);
  assert.deepEqual(r.same, [true, false]);
  assert.match(r.legacyNote, /NO la confirmó el equipo/);
  assert.match(r.teamNote, /web oficial que indicó el equipo/);
  for (const note of [r.legacyNote, r.teamNote]) {
    assert.doesNotMatch(note, /tal cual; no la vuelvas a medir/);
    assert.match(note, /NO uses nada de esta sección/);
    assert.match(note, /^\n## Identidad/, 'el título empieza en su propia línea');
    assert.match(note, /\n$/);
  }
  assert.match(r.legal, /\n$/, 'la nota legal acaba en salto de línea');
});

test('Identidad medida: no se mide si hay brand pack o una medición reciente', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'brand-'));
  fs.mkdirSync(path.join(root, 'brands', 'con-pack', 'tokens'), { recursive: true });
  fs.writeFileSync(path.join(root, 'brands', 'con-pack', 'tokens', 'brand-tokens.json'), '{}');
  fs.mkdirSync(path.join(root, 'brands', 'medida', 'tokens'), { recursive: true });
  fs.writeFileSync(path.join(root, 'brands', 'medida', 'tokens', 'identidad-medida.json'), JSON.stringify({ version: 2, measuredAt: new Date().toISOString(), palette: ['#ff0000'] }));
  // Reciente pero de la versión 1 (botón medido sobre muestras de color): se vuelve a medir.
  fs.mkdirSync(path.join(root, 'brands', 'v1', 'tokens'), { recursive: true });
  fs.writeFileSync(path.join(root, 'brands', 'v1', 'tokens', 'identidad-medida.json'), JSON.stringify({ version: 1, measuredAt: new Date().toISOString() }));
  fs.mkdirSync(path.join(root, 'brands', 'vieja', 'tokens'), { recursive: true });
  fs.writeFileSync(path.join(root, 'brands', 'vieja', 'tokens', 'identidad-medida.json'), JSON.stringify({ version: 2, measuredAt: '2026-01-01T00:00:00Z' }));
  const r = run(`
    const m = require(${mod('measureBrand.ts')});
    const root = ${JSON.stringify(root)};
    process.stdout.write(JSON.stringify(['con-pack', 'medida', 'v1', 'vieja', 'nueva'].map((s) => m.needsMeasure(root, s))));
  `);
  fs.rmSync(root, { recursive: true, force: true });
  assert.deepEqual(r, [false, false, true, true, true]);
});

// ---------------------------------------------------------------- encargos (studio/server/standalone.ts)

function prompts(input) {
  return run(`
    const s = require(${JSON.stringify(path.join(ROOT, 'studio', 'server', 'standalone.ts'))});
    const job = { id: 'muvx00-abc123', createdAt: '2026-10-05T10:00:00Z', input: ${JSON.stringify(input)} };
    process.stdout.write(JSON.stringify({ brief: job.input.instruction ? s.buildBriefPrompt(job) : '', hermes: s.buildHermesPrompt(job), revision: s.buildRevisionPrompt({ ...job, input: { ...job.input, changeRequest: 'cambia el titular' } }) }));
  `);
}

test('Brief propio de Studio: sin skill, secciones fijas, tope de palabras y la identidad medida', () => {
  const r = prompts({ clientSlug: 'siroko', clientName: 'Siroko', brandMode: 'new', briefText: '', instruction: 'Newsletter de las gafas nuevas', imageMode: 'official', mode: 'standalone' });
  assert.match(r.brief, /NO cargues skills/);
  assert.doesNotMatch(r.brief, /skill_view/);
  for (const h of ['## 1. Concepto', '## 2. Identidad de marca', '## 3. Datos verificados', '## 4. Asunto y preheader', '## 5. Escenas', '## 6. Imágenes', '## 7. Prohibido', '## 8. Autoauditoría']) {
    assert.ok(r.brief.includes(h), h);
  }
  assert.match(r.brief, /como mucho 1200 palabras/);
  assert.match(r.brief, /Identidad de la marca ya medida/);
});

test('Encargo: base técnica, ayudante de imágenes y la comprobación de Studio antes de entregar', () => {
  const r = prompts({ clientSlug: 'siroko', clientName: 'Siroko', brandMode: 'new', briefText: '# Brief', imageMode: 'official', mode: 'standalone' });
  assert.match(r.hermes, /studio\/hermes\/email-base\.html/);
  assert.match(r.hermes, /npm run fetch-image -- <url> newsletters\/2026\/siroko\/hermes\/2026-10-05-abc123/);
  assert.match(r.hermes, /npm run check-newsletter -- newsletters\/2026\/siroko\/hermes\/2026-10-05-abc123\/newsletter\.html/);
  assert.match(r.revision, /check-newsletter -- .*--retoque/);
});

// ------------------------------------------- ronda de tiempos (2026-10-06): encargo autocontenido, ficha, revisión

test('Encargo: no comprueba enlaces con el navegador, revisa con render-newsletter y no investiga lo pendiente', () => {
  const r = prompts({ clientSlug: 'paredes', clientName: 'Paredes', brandMode: 'new', briefText: '# Brief', imageMode: 'official', mode: 'standalone' });
  assert.doesNotMatch(r.hermes, /compruébalo con el navegador/);
  assert.match(r.hermes, /npm run render-newsletter -- newsletters\/2026\/paredes\/hermes\/2026-10-05-abc123\/newsletter\.html/);
  // Sin instrucción es un «Prompt completo»: investiga él (Nike, 2026-10-08). Con instrucción hubo brief: no investiga.
  assert.match(r.hermes, /haz tú la investigación que pide/);
  assert.match(r.hermes, /no los leas del disco/);
  const b = prompts({ clientSlug: 'paredes', clientName: 'Paredes', brandMode: 'new', briefText: '', instruction: 'Newsletter de la Eden', imageMode: 'official', mode: 'standalone' });
  assert.match(b.hermes, /NO se investiga aquí y NO entra en la pieza/);
  assert.match(b.brief, /URL EXACTA de la ficha/);
  assert.match(b.brief, /Fuera de la pieza/);
});

test('Encargo autocontenido: la base técnica y los módulos van dentro, con la orden de no releer', () => {
  const r = run(`
    const w = require(${mod('hermes-worker.ts')});
    process.stdout.write(JSON.stringify(w.selfContainedNote('newsletters/2026/paredes/hermes/x')));
  `);
  assert.match(r, /brief\.md es una copia del brief:\n  no lo leas/);
  assert.match(r, /<!-- \[if mso\]>|<!--\[if mso\]>/);
  assert.match(r, /email-modulos\.md \(contenido completo\)/);
});

test('Brief terminado: 8 secciones y 60 s sin cambios cierran el turno; incompleto o recién escrito, no', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'brief-'));
  const full = path.join(dir, 'full.md');
  const half = path.join(dir, 'half.md');
  fs.writeFileSync(full, [1, 2, 3, 4, 5, 6, 7, 8].map((n) => `## ${n}. Sección\ntexto`).join('\n'));
  fs.writeFileSync(half, [1, 2, 3].map((n) => `## ${n}. Sección`).join('\n'));
  const r = run(`
    const w = require(${mod('hermes-worker.ts')});
    const now = Date.now();
    process.stdout.write(JSON.stringify({
      settled: w.briefDone(${JSON.stringify(full)}, now - 600000, now + 61000),
      fresh: w.briefDone(${JSON.stringify(full)}, now - 600000, now + 5000),
      half: w.briefDone(${JSON.stringify(half)}, now - 600000, now + 61000),
      old: w.briefDone(${JSON.stringify(full)}, now + 1000, now + 61000),
    }));
  `);
  assert.deepEqual(r, { settled: true, fresh: false, half: false, old: false });
});

test('Revisión de arte: notas en JSON, las de menos de 4 abren corrección; respuesta sin notas, nada', () => {
  const r = run(`
    const w = require(${mod('hermes-worker.ts')});
    const notas = Object.fromEntries(Object.keys(w.ART_CRITERIA).map((k) => [k, 4]));
    const ok = w.parseArtReview('Aquí va: ' + JSON.stringify({ notas, problemas: [] }) + ' fin');
    const bad = w.parseArtReview(JSON.stringify({ notas: { ...notas, oscuro: 2, texto_imagen: 3 }, problemas: ['texto blanco sobre blanco en oscuro'] }));
    const partial = w.parseArtReview(JSON.stringify({ notas: { peticion: 5 } }));
    const q = w.artReviewQuery('pre-black friday', '# Brief X\\n\\n## Instrucciones de entrega\\nno', '<html><head><style>.a{}</style></head><body><h1>Hola&nbsp;mundo&#847;&zwnj;</h1></body></html>', '/tmp/hoja.jpg', { width: 1246, height: 2000 });
    const blind = w.parseArtReview('{"sin_imagen": true}');
    process.stdout.write(JSON.stringify({ okLow: w.lowScores(ok), badLow: w.lowScores(bad), problemas: bad.problemas, partial, q, blind }));
  `);
  assert.deepEqual(r.okLow, []);
  assert.deepEqual(r.badLow.sort(), ['oscuro', 'texto_imagen']);
  assert.deepEqual(r.problemas, ['texto blanco sobre blanco en oscuro']);
  assert.equal(r.partial, null);
  // GPT-6 Luna rellena region con [0, 0, 0, 0] si no se le da: se le pasa la hoja entera.
  assert.match(r.q, /vision_analyze con image_url \/tmp\/hoja\.jpg y region \[0, 0, 1246, 2000\]/);
  assert.match(r.q, /reintenta UNA vez/);
  assert.match(r.q, /\{"sin_imagen": true\}: nunca puntúes sin haberla visto/);
  assert.equal(r.blind, null);
  assert.match(r.q, /«Hola mundo»/);
  assert.match(r.q, /pre-black friday/);
  assert.doesNotMatch(r.q, /Instrucciones de entrega/);
});

test('Revisión de arte exigente: escala, mejoras de 4 a 5, web de la marca y red de seguridad', () => {
  const r = run(`
    const w = require(${mod('hermes-worker.ts')});
    const all = (n) => Object.fromEntries(Object.keys(w.ART_CRITERIA).map((k) => [k, n]));
    const fours = w.parseArtReview(JSON.stringify({ notas: all(4), problemas: [], mejoras: ['Texto secundario de 13 a 16 px en la apertura'] }));
    const fives = w.parseArtReview(JSON.stringify({ notas: all(5), problemas: [], mejoras: [] }));
    const foursNoIdeas = w.parseArtReview(JSON.stringify({ notas: all(4), problemas: [] }));
    const proofs = Object.fromEntries(Object.keys(w.ART_CRITERIA).map((k) => [k, 'se ve bien en las tres columnas']));
    const capped = w.parseArtReview(JSON.stringify({ notas: all(5), pruebas: { ...proofs, copy: '' }, problemas: [], mejoras: ['aire: 8 px más entre la escena 2 y la 3', '- jerarquia: titular de la escena 3 más grande'] }));
    const withProof = w.parseArtReview(JSON.stringify({ notas: all(3), pruebas: { peticion: 'Sin cifra de descuento en la primera pantalla', aire: '  ', otro: 'x' }, problemas: [] }));
    const better = w.parseArtReview(JSON.stringify({ notas: { ...all(4), jerarquia: 5, aire: 5 }, problemas: [], mejoras: [] }));
    const worse = w.parseArtReview(JSON.stringify({ notas: { ...all(5), oscuro: 3 }, problemas: [], mejoras: [] }));
    const q = w.artReviewQuery(undefined, '# Brief', '<p>Hola</p>', '/tmp/hoja.jpg', { width: 1246, height: 2000 }, { path: '/tmp/web-marca.jpg', size: { width: 1280, height: 900 } });
    const qNoWeb = w.artReviewQuery(undefined, '# Brief', '<p>Hola</p>', '/tmp/hoja.jpg');
    process.stdout.write(JSON.stringify({
      mejoras: fours.mejoras, legacy: foursNoIdeas.mejoras,
      improve: [w.needsImprovement(fours), w.needsImprovement(fives), w.needsImprovement(foursNoIdeas)],
      keep: [w.keepImproved(fours, better), w.keepImproved(fours, worse), w.keepImproved(fours, null), w.keepImproved(fours, fours)],
      total: w.scoreTotal(fours), q, qNoWeb, withProof, capped: capped.notas,
    }));
  `);
  assert.deepEqual(r.mejoras, ['Texto secundario de 13 a 16 px en la apertura']);
  assert.deepEqual(r.legacy, []);
  assert.deepEqual(r.improve, [true, false, false]);
  // Peor: más total (48 > 40) pero oscuro cae a 3 desde 4 → se descarta.
  assert.deepEqual(r.keep, [true, false, true, true]);
  assert.equal(r.total, 40);
  // Q3 (2026-10-07, recuperada el 08-10): anclas por criterio, se parte de 3 y cada nota lleva su prueba.
  assert.match(r.q, /empieza cada criterio en 3/);
  assert.match(r.q, /oferta con su cifra \(%, precio o fecha\)/);
  assert.match(r.q, /"pruebas"/);
  assert.deepEqual(r.withProof.pruebas, { peticion: 'Sin cifra de descuento en la primera pantalla' });
  // Un 5 con una mejora de su criterio, o sin prueba, cuenta como 4; los demás 5 se quedan.
  assert.deepEqual([r.capped.aire, r.capped.jerarquia, r.capped.copy, r.capped.oscuro, r.capped.concepto], [4, 4, 4, 5, 5]);
  assert.match(r.q, /"mejoras"/);
  assert.match(r.q, /2\. Llama a vision_analyze con image_url \/tmp\/web-marca\.jpg y region \[0, 0, 1280, 900\]/);
  assert.match(r.q, /3\. Con lo que te devuelvan, responde SOLO con un JSON/);
  assert.doesNotMatch(r.qNoWeb, /web-marca/);
  assert.match(r.qNoWeb, /2\. Con lo que te devuelva, responde SOLO/);
});

test('Copy concreto: muletillas en titulares y texto, botones genéricos; aviso en el control y reglas en los encargos', () => {
  const html = `<html><head><style>.x{}</style></head><body>
    <h1>Descubre la nueva W3 Shiga</h1><p>Tres capas para la nieve, en tu día a día también.</p>
    <a href="https://x.es/a" class="btn">Descubre más</a><a href="https://x.es/b">Elige tu talla</a>
    <!--[if mso]><v:roundrect><center>Descubre más</center></v:roundrect><![endif]--></body></html>`;
  const clean = '<html><body><h1>W3 Shiga: tres capas para la nieve</h1><p>La chaqueta pesa 680 g.</p><a href="https://x.es/a">Elige tu talla</a></body></html>';
  const r = run(`
    const c = require(${mod('copyCheck.ts')});
    const q = require(${mod('qualityCheck.ts')});
    const s = require(${mod('../server/standalone.ts')});
    const w = require(${mod('hermes-worker.ts')});
    const item = (h) => q.staticChecks(h).find((x) => x.id === 'copy');
    const review = w.artReviewQuery(undefined, '# Brief', '<p>x</p>', '/tmp/h.jpg', undefined, null, c.copyFindings(${JSON.stringify(html)}).found);
    process.stdout.write(JSON.stringify({ bad: c.copyFindings(${JSON.stringify(html)}), good: c.copyFindings(${JSON.stringify(clean)}), badItem: item(${JSON.stringify(html)}), goodItem: item(${JSON.stringify(clean)}), rules: c.COPY_RULES.join(' '), review, critique: w.BRIEF_CRITIQUE.join(' '), criteria: Object.keys(w.ART_CRITERIA) }));
  `);
  assert.equal(r.bad.warnings.length, 3);
  assert.match(r.bad.warnings[0], /Muletilla «descubre»: …Descubre la nueva W3 Shiga/);
  assert.ok(r.bad.warnings.some((x) => /«en tu día a día»/.test(x)));
  assert.ok(r.bad.warnings.some((x) => /Botón genérico «Descubre más»/.test(x)));
  assert.ok(!r.bad.warnings.some((x) => /Elige tu talla/.test(x)));
  assert.deepEqual(r.good.warnings, []);
  assert.equal(r.badItem.status, 'warning');
  assert.equal(r.badItem.errorCount, 0);
  assert.equal(r.goodItem.status, 'ok');
  assert.match(r.rules, /verbo \+ objeto/);
  assert.match(r.rules, /«en tu día a día»/);
  assert.match(r.review, /Copy genérico que ha detectado Studio.*botón «Descubre más»/);
  assert.match(r.critique, /«explora»/);
  assert.ok(r.criteria.includes('copy'));
});

test('Lienzo y franjas: secciones del color del exterior y franjas sueltas, medidas por píxeles', () => {
  const r = run(`
    const rc = require(${mod('renderChecks.ts')});
    // Página de 900 px; lienzo 150-750 y 0-1000. Exterior gris claro.
    const OUT = [244, 244, 245], DARK = [52, 73, 87], WHITE = [255, 255, 255], LIGHT = [234, 236, 240];
    const page = (rows) => (x, y) => (x < 150 || x >= 750 ? OUT : rows(y, x));
    const box = { left: 150, right: 750, top: 0, bottom: 1000 };
    // Mala: sección 300-500 del color del exterior; franja de 20 px (600-620) del exterior entre dos bloques oscuros;
    // franja blanca de 16 px (800-816) pegada a una foto que empieza en 816.
    const bad = page((y, x) => (y < 300 ? DARK : y < 500 ? OUT : y < 600 ? DARK : y < 620 ? OUT : y < 800 ? DARK : y < 816 ? WHITE : (x + y) % 7 ? [90, 90, 90] : [20, 20, 20]));
    // Buena: lienzo blanco y secciones oscuras, sin franjas; una línea de 2 px no cuenta.
    const good = page((y) => (y < 400 ? WHITE : y < 402 ? [200, 200, 200] : y < 700 ? DARK : LIGHT));
    const mb = rc.frameFromPixels(bad, box, 900, [816, 1000]);
    const mg = rc.frameFromPixels(good, box, 900, []);
    process.stdout.write(JSON.stringify({ mb, mg, f: rc.frameFindings(mb, null), ok: rc.frameFindings(mg, mg) }));
  `);
  assert.deepEqual(r.mb.blend, [{ y: 300, h: 200 }]);
  assert.deepEqual(r.mb.strips.map((x) => [x.y, x.h]), [[600, 20], [800, 16]]);
  assert.deepEqual(r.mg.blend, []);
  assert.deepEqual(r.mg.strips, []);
  assert.match(r.f.canvas.errors[0], /En claro, una sección se funde con el fondo exterior \(#f4f4f5\): 200 px a 300 px/);
  assert.equal(r.f.strips.errors.length, 2);
  assert.match(r.f.strips.errors[1], /franja suelta de 16 px de color #ffffff/);
  assert.deepEqual(r.ok, { canvas: { errors: [], warnings: [] }, strips: { errors: [], warnings: [] } });
});

test('Calidad: Studio guarda la revisión de arte limpia y calcula la nota final (después si la mejora se quedó)', () => {
  const r = run(`
    const s = require(${mod('../server/standalone.ts')});
    const st = require(${mod('../server/store.ts')});
    const before = { peticion: 4, copy: 3, oscuro: 4, raro: 9, 'mal-id': 4 };
    const clean = s.sanitizeArtReview({ before, after: { peticion: 5, copy: 4, oscuro: 5 }, kept: true, web: true, problemas: ['a', 3], mejoras: ['b'] });
    const dropped = s.sanitizeArtReview({ before: { peticion: 4, copy: 3, oscuro: 4 }, after: { peticion: 3, copy: 3, oscuro: 3 }, kept: false });
    process.stdout.write(JSON.stringify({ clean, pct: st.artPct(clean), droppedPct: st.artPct(dropped), none: s.sanitizeArtReview({ before: {} }) ?? null, junk: s.sanitizeArtReview('x') ?? null }));
  `);
  assert.deepEqual(r.clean.before, { peticion: 4, copy: 3, oscuro: 4 });
  assert.deepEqual(r.clean.problemas, ['a']);
  assert.equal(r.clean.web, true);
  assert.equal(r.pct, 93); // 14/15
  assert.equal(r.droppedPct, 73); // la mejora se descartó: valen las de antes, 11/15
  assert.equal(r.none, null);
  assert.equal(r.junk, null);
});

test('Notas de calidad puntuadas después: se marcan como backfill y se guardan limpias', () => {
  const r = run(`
    const s = require(${mod('../server/standalone.ts')});
    process.stdout.write(JSON.stringify({ a: s.sanitizeArtReview({ before: { peticion: 4, copy: 3 }, backfill: true, web: false }), b: s.sanitizeArtReview({ before: { peticion: 4 }, backfill: 'sí' }) }));
  `);
  assert.equal(r.a.backfill, true);
  assert.deepEqual(r.a.before, { peticion: 4, copy: 3 });
  assert.equal(r.b.backfill, undefined);
});

test('Ficha de producto: URLs de ficha del brief, umbrales de envío y fotos del propio producto', () => {
  const r = run(`
    const p = require(${mod('productSheet.ts')});
    const brief = 'Home https://www.paredes.es/es/ y ficha https://www.paredes.es/es/1087-10558-zapatillas-ligeras-eden-negro-dc26164-ne.html, ' +
      'fuentes https://fonts.googleapis.com/css2?family=Barlow, foto https://www.paredes.es/1-large/x.jpg y novedades https://www.paredes.es/es/1048-novedades.';
    const urls = p.productUrls(brief);
    const onlyCategory = p.productUrls('Solo la colección: https://www.paredes.es/es/1048-novedades');
    const signals = ['https://www.nike.com/es/t/pegasus-42-S1bYkOza/IB1873-702', 'https://shop.example.com/products/gafas-k3',
      'https://www.paredes.es/es/1087-10558-zapatillas-ligeras-eden-negro-dc26164-ne.html', 'https://www.paredes.es/es/1048-novedades',
      'https://www.siroko.com/es/gafas'].map(p.looksProduct);
    const t = p.shippingThresholds(['Envio gratuito a partir de 29,99€', 'Coste del envío: Gratuito para pedidos superiores a 25€ sino el coste es de 6€', 'Envíos 48/72 horas']);
    const gallery = p.ownGallery('https://www.paredes.es/es/1087-10558-zapatillas-ligeras-eden-negro-dc26164-ne.html', [
      'https://www.paredes.es/15737-medium_default/zapatillas-ligeras-eden-negro.jpg',
      'https://www.paredes.es/15191-home_default/zapatillas-tolox-kaki.jpg',
      'https://www.paredes.es/16162-home_default/zapatillas-ligeras-eden-kaki.jpg',
    ]);
    const hashed = p.ownGallery('https://shop.example.com/products/gafas-k3', ['https://cdn.shopify.com/a1b2.jpg', 'https://cdn.shopify.com/c3d4.jpg']);
    const note = p.productSheetNote({ pages: [{ url: 'https://x.es/p/1', title: 'Eden', price: { amount: 48.99, currency: 'EUR', source: 'JSON-LD' }, shipping: ['Envio gratuito a partir de 29,99€', 'Gratuito para pedidos superiores a 25€'], images: [] }], photos: [{ file: 'foto-1.jpg (800×800, 33 KB)', from: 'https://x.es/1.jpg' }], contactSheet: '/tmp/x.png' }, 'newsletters/2026/x/hermes/y');
    const noPrice = p.productSheetNote({ pages: [{ url: 'https://x.es/p/1', title: 'Eden', price: null, shipping: [], images: [] }], photos: [], contactSheet: null }, 'd');
    process.stdout.write(JSON.stringify({ urls, onlyCategory, signals, t, gallery, hashed, note, noPrice }));
  `);
  // La categoría «1048-novedades» (solo un número) no cuenta como ficha cuando el brief cita una de verdad.
  assert.deepEqual(r.urls, ['https://www.paredes.es/es/1087-10558-zapatillas-ligeras-eden-negro-dc26164-ne.html']);
  assert.deepEqual(r.onlyCategory, ['https://www.paredes.es/es/1048-novedades']);
  assert.deepEqual(r.signals, [true, true, true, false, false]);
  assert.deepEqual(r.t, [25, 29.99]);
  assert.deepEqual(r.gallery, ['https://www.paredes.es/15737-medium_default/zapatillas-ligeras-eden-negro.jpg']);
  assert.equal(r.hashed.length, 2);
  assert.match(r.note, /Precio: 48,99 €/);
  assert.match(r.note, /NO cites el envío gratis/);
  assert.match(r.note, /foto-1\.jpg/);
  assert.match(r.note, /_trabajo\/fotos-producto\.png/);
  assert.match(r.noPrice, /no pongas precio/);
});

// ------------------------------------------------ modo oscuro legible (2026-10-06, Paredes: blanco sobre blanco)

test('Modo oscuro legible: blanco sobre blanco es error (también en el pie); lo que ya fallaba en claro, no se repite', () => {
  const r = run(`
    const { darkFindings } = require(${mod('renderChecks.ts')});
    const c = (text, fg, bg, at = 0.3, size = 16) => ({ text, fg, bg, size, bold: false, at });
    const light = [c('Titular', '#25282a', '#ffffff'), c('Ayuda', '#111111', '#ffffff', 0.95, 12), c('Gris', '#cccccc', '#ffffff')];
    const dark = [c('Titular', '#ffffff', '#ffffff'), c('Ayuda', '#111111', '#111111', 0.95, 12), c('Gris', '#cccccc', '#ffffff'), c('CTA', '#ffffff', '#0e9b4f')];
    const ok = darkFindings([c('Titular', '#f2f2f2', '#141414')], light);
    process.stdout.write(JSON.stringify({ bad: darkFindings(dark, light), ok }));
  `);
  assert.equal(r.bad.errors.length, 1);
  assert.match(r.bad.errors[0], /no se leen 2 texto\(s\)/);
  assert.match(r.bad.errors[0], /«Titular» \(#ffffff sobre #ffffff, 1\.0:1\)/);
  assert.match(r.bad.errors[0], /«Ayuda»/);
  assert.doesNotMatch(r.bad.errors[0], /Gris/);
  assert.match(r.bad.warnings[0], /CTA/);
  assert.deepEqual(r.ok, { errors: [], warnings: [] });
});

test('Modo oscuro legible: entra en el control como «Modo oscuro legible»; sin estilos oscuros no aparece', () => {
  const r = run(`
    const q = require(${mod('qualityCheck.ts')});
    const html = '<html><head><title>x</title></head><body><a href="{{unsubscribe_url}}">Darse de baja</a></body></html>';
    const fetcher = async () => ({ status: 200 });
    const withDark = await q.runQualityCheck(html, { fetcher, darkFindings: { errors: ['En modo oscuro no se leen 1 texto(s)'], warnings: [] } });
    const none = await q.runQualityCheck(html, { fetcher, darkFindings: null });
    process.stdout.write(JSON.stringify({ a: withDark.checks.find((c) => c.id === 'dark-legibility'), b: none.checks.some((c) => c.id === 'dark-legibility') }));
  `);
  assert.equal(r.a.status, 'error');
  assert.equal(r.a.label, 'Modo oscuro legible');
  assert.equal(r.b, false);
});

test('Modo oscuro legible renderizando: el @media que pasa el texto a blanco sin oscurecer el bgcolor da error', (t) => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'dark-'));
  const page = (darkCss) => `<!doctype html><html><head><meta name="color-scheme" content="light dark"><style>@media (prefers-color-scheme: dark){${darkCss}}</style></head>` +
    '<body><table width="600"><tr><td bgcolor="#ffffff" class="bg"><p class="t" style="color:#25282a;font-size:16px">Un titular que tiene que leerse siempre</p></td></tr></table></body></html>';
  fs.writeFileSync(path.join(dir, 'roto.html'), page('.t{color:#ffffff !important}'));
  fs.writeFileSync(path.join(dir, 'bien.html'), page('.t{color:#ffffff !important}.bg{background:#141414 !important}'));
  let out;
  try {
    out = run(`
      const { renderChecks } = require(${mod('renderChecks.ts')});
      const a = await renderChecks(${JSON.stringify(path.join(dir, 'roto.html'))}, ${JSON.stringify(dir)});
      const b = await renderChecks(${JSON.stringify(path.join(dir, 'bien.html'))}, ${JSON.stringify(dir)});
      process.stdout.write(JSON.stringify({ a: a && a.dark, b: b && b.dark }));
    `);
  } catch {
    return t.skip('Chromium no arranca aquí');
  }
  if (!out.a) return t.skip('Chromium no arranca aquí');
  assert.equal(out.a.errors.length, 1);
  assert.match(out.a.errors[0], /#ffffff sobre #ffffff/);
  assert.deepEqual(out.b.errors, []);
});

// ------------------------------------------- afirmaciones comerciales contra lo verificado (2026-10-06, fase A)

test('Claims: lo verificado sale de «Datos verificados» (sin «Fuera de la pieza») y de la ficha sin sus «no cites»', () => {
  const r = run(`
    const c = require(${mod('claims.ts')});
    const brief = '# Brief\\n## 2. Identidad\\nenvío gratis en la web antigua\\n## 3. Datos verificados\\n- Precio 43,99 € → https://x.es/p.html\\n- Envío gratis a partir de 29,99 € → https://x.es/envios\\n- **Fuera de la pieza**: descuento del 30 %\\n## 4. Asunto\\nAsunto\\n\\n---\\n## Instrucciones de entrega\\n- gratis';
    const note = '- Envío, texto literal: «Envío gratis desde 25 €»\\n  · La página da umbrales distintos: NO cites el envío gratis.';
    const pasted = 'Newsletter de rebajas: hasta un 50 % en polos.\\nPendiente: envío gratis sin confirmar.';
    process.stdout.write(JSON.stringify({ v: c.verifiedSource(brief, note), p: c.verifiedSource(pasted) }));
  `);
  assert.match(r.v, /43,99/);
  assert.match(r.v, /29,99/);
  assert.match(r.v, /desde 25/);
  assert.doesNotMatch(r.v, /30 %|NO cites|web antigua|Instrucciones/);
  assert.match(r.p, /hasta un 50 %/);
  assert.doesNotMatch(r.p, /Pendiente/);
});

test('Claims: crítica sin verificar es error; verificada con la misma cifra pasa; cifra distinta, error; sin contexto, aviso', () => {
  const r = run(`
    const c = require(${mod('claims.ts')});
    const verified = '- Envío gratis a partir de 29,99 €\\n- Descuento del 20 % en la colección';
    const piece = 'Black Friday: -20 % en todo. Envío gratis a partir de 29,99 €. Solo hoy. Te regalamos una bolsa. La potencia que buscas.';
    const other = 'Ahora -30 % en la colección.';
    process.stdout.write(JSON.stringify({
      a: c.claimFindings(piece, verified), b: c.claimFindings(other, verified), none: c.claimFindings(piece),
    }));
  `);
  assert.equal(r.a.verified.length, 2, JSON.stringify(r.a));
  assert.ok(r.a.verified.some((v) => /-20 %/.test(v)));
  assert.ok(r.a.verified.some((v) => /Envío gratis/.test(v)));
  assert.equal(r.a.errors.length, 2, JSON.stringify(r.a.errors));
  assert.ok(r.a.errors.some((e) => /«urgencia»/.test(e)));
  assert.ok(r.a.errors.some((e) => /«gratis \/ regalo»/.test(e)));
  assert.ok(r.a.warnings.some((w) => /«potencia»/.test(w)), 'las técnicas del motor siguen como aviso');
  assert.equal(r.b.errors.length, 1);
  assert.match(r.b.errors[0], /«descuento»/);
  assert.equal(r.none.errors.length, 0);
  assert.ok(r.none.warnings.length >= 4);
});

test('Claims: el control los marca como error con datos verificados y como aviso sin ellos; el formato sigue sirviendo a locate.js', () => {
  const r = run(`
    const q = require(${mod('qualityCheck.ts')});
    const html = '<html><body><p>Envío gratis en todos los pedidos.</p></body></html>';
    const strict = q.staticChecks(html, [], '- Precio 43,99 €').find((x) => x.id === 'claims');
    const loose = q.staticChecks(html).find((x) => x.id === 'claims');
    process.stdout.write(JSON.stringify({ strict, loose }));
  `);
  assert.equal(r.strict.status, 'error');
  assert.match(r.strict.details[0], /: ….+… — /);
  assert.equal(r.loose.status, 'warning');
});

test('Encargo y brief llevan la regla de afirmaciones comerciales', () => {
  const r = prompts({ clientSlug: 'paredes', clientName: 'Paredes', brandMode: 'new', briefText: '', instruction: 'Newsletter de la Eden', imageMode: 'official', mode: 'standalone' });
  const h = prompts({ clientSlug: 'paredes', clientName: 'Paredes', brandMode: 'new', briefText: '# Brief', imageMode: 'official', mode: 'standalone' });
  assert.match(r.brief, /Afirmaciones comerciales .*sección 3/);
  assert.match(h.hermes, /Afirmaciones comerciales \(Studio las comprueba contra lo verificado\)/);
});

// ------------------------------------------------ catálogo de módulos y patrones (2026-10-06, opción 3, fase B)

test('Catálogo: cada módulo del índice tiene su HTML de email y su imagen, sin sintaxis del motor sin resolver', () => {
  const ids = run(`process.stdout.write(JSON.stringify(Object.keys(require(${JSON.stringify(path.join(ROOT, 'studio', 'hermes', 'catalog.ts'))}).MODULES)));`);
  assert.ok(ids.length >= 29);
  for (const id of ids) {
    const html = fs.readFileSync(path.join(ROOT, 'studio', 'hermes', 'modulos', `${id}.html`), 'utf8');
    assert.match(html, /<table|<tr/i, id);
    assert.doesNotMatch(html, /\{\{(data|token|include|#each|slot):/, id);
    assert.ok(fs.statSync(path.join(ROOT, 'studio', 'hermes', 'modulos', `${id}.png`)).size > 1000, id);
  }
  const index = fs.readFileSync(path.join(ROOT, 'studio', 'hermes', 'catalogo.md'), 'utf8');
  for (const id of ids) assert.ok(index.includes(`\`${id}\``), id);
});

test('Catálogo: los módulos que nombra el brief, en orden, sin confundir variantes ni palabras sueltas', () => {
  const r = run(`
    const c = require(${JSON.stringify(path.join(ROOT, 'studio', 'hermes', 'catalog.ts'))});
    const brief = '1. Apertura — Módulo: \`hero-imagen\`\\n2. Detalle — editorial-foto-texto-inverso\\n3. Tres pasos para comprarla (propio)\\n4. Cierre — \`banda-cierre\`';
    const note = c.chosenModulesNote(brief, ${JSON.stringify(ROOT)});
    process.stdout.write(JSON.stringify({ ids: c.chosenModules(brief), note: note.length, hasHtml: /Módulo \`hero-imagen\`[\\s\\S]*<table/.test(note), none: c.chosenModulesNote('sin módulos', ${JSON.stringify(ROOT)}) }));
  `);
  assert.deepEqual(r.ids, ['hero-imagen', 'editorial-foto-texto-inverso', 'banda-cierre']);
  assert.ok(r.hasHtml);
  assert.equal(r.none, '');
});

test('Brief con patrones y catálogo; encargo que apunta al catálogo', () => {
  const b = prompts({ clientSlug: 'paredes', clientName: 'Paredes', brandMode: 'new', briefText: '', instruction: 'Newsletter de la Eden', imageMode: 'official', mode: 'standalone' });
  const h = prompts({ clientSlug: 'paredes', clientName: 'Paredes', brandMode: 'new', briefText: '# Brief', imageMode: 'official', mode: 'standalone' });
  assert.match(b.brief, /Oferta y precio: .*`hero-asimetrico`/);
  assert.match(b.brief, /Fotografía primero/);
  assert.match(b.brief, /· `metric-strip-premium` \(datos\)/);
  assert.match(b.brief, /patrón elegido/);
  assert.match(b.brief, /módulo \(el id del catálogo/);
  assert.match(h.hermes, /studio\/hermes\/catalogo\.md/);
});

// ------------------------------------------------ brief sin límites de DeepSeek y con autocrítica (2026-10-06, punto 3)

test('Brief: presupuesto ampliado y autocrítica con la rúbrica y lo que falta de la petición', () => {
  const r = prompts({ clientSlug: 'paredes', clientName: 'Paredes', brandMode: 'new', briefText: '', instruction: 'Newsletter de la Eden', imageMode: 'official', mode: 'standalone' });
  assert.match(r.brief, /12 minutos y unas 60 acciones/);
  assert.doesNotMatch(r.brief, /5 búsquedas/);
  const w = run(`
    const w = require(${JSON.stringify(path.join(ROOT, 'studio', 'worker', 'hermes-worker.ts'))});
    const gaps = require(${JSON.stringify(path.join(ROOT, 'studio', 'server', 'requestCoverage.ts'))}).missingInBrief('Newsletter de Black Friday para público joven', '# Brief\\n## 1. Concepto — la Eden');
    process.stdout.write(JSON.stringify({ a: w.BRIEF_ACTION_BUDGET, t: w.BRIEF_TIME_BUDGET_SEC, plain: w.briefCritiqueQuery('out', []), withGaps: w.briefCritiqueQuery('out', gaps, 'Newsletter de Black Friday para público joven'), n: gaps.length }));
  `);
  assert.ok(w.a >= 60 && w.t >= 12 * 60);
  assert.match(w.plain, /NO navegues/);
  assert.match(w.plain, /valdría para la competencia/);
  assert.match(w.plain, /out\/_trabajo\/autocritica-brief\.md/);
  assert.doesNotMatch(w.plain, /PRIMERO/);
  assert.ok(w.n >= 1);
  assert.match(w.withGaps, /PRIMERO: no recoge .*Black Friday/i);
});

test('Barra: las sesiones tras la primera versión cuentan como revisión (no vuelve de 75 % a «Preparando»)', () => {
  const r = run(`
    const w = require(${mod('hermes-worker.ts')});
    const fresh = w.estimateProgress([], 180, 900);
    const later = w.laterSessionProgress(fresh);
    const review = w.estimateProgress([{ name: 'write_file', target: 'a.html' }, { name: 'vision_analyze', target: '' }], 600, 900);
    process.stdout.write(JSON.stringify({ fresh, later, same: w.laterSessionProgress(review) === review }));
  `);
  assert.equal(r.fresh.stage, 'preparando');
  assert.ok(r.fresh.pct < 15);
  assert.equal(r.later.stage, 'revisando');
  assert.ok(r.later.pct >= 75 && r.later.pct < 97);
  assert.equal(r.same, true);
});

// ------------------------------------------------ galería de campaña e imagen principal (2026-10-06, punto 2)

test('Galería: páginas de la sección 6 del dominio de la marca, sin fichas ni otros dominios, y la portada al final', () => {
  const brief = [
    '## 3. Datos verificados', '- Ficha: https://www.paredes.es/es/zapatillas/eden-negro-DC26164.html',
    '## 6. Imágenes',
    '- Hero: https://www.paredes.es/es/campana-otono (lifestyle, horizontal)',
    '- Detalle: https://www.paredes.es/es/zapatillas/eden-negro-DC26164.html',
    '- Otra: https://www.instagram.com/paredes/ y https://otra-marca.com/look',
    '- Lookbook: https://paredes.es/es/lookbook-2026',
    '- Tercera: https://www.paredes.es/es/novedades',
    '## 7. Prohibido en esta pieza', '- https://www.paredes.es/es/no-esta-en-6',
  ].join('\n');
  const r = run(`
    const p = require(${mod('productSheet.ts')});
    process.stdout.write(JSON.stringify({ a: p.galleryUrls(${JSON.stringify(brief)}, 'https://www.paredes.es/es/'), b: p.galleryUrls('# Brief pegado sin sección 6', 'https://www.adeslas.es/'), c: p.galleryUrls('nada', null) }));
  `);
  assert.deepEqual(r.a, ['https://www.paredes.es/es/campana-otono', 'https://paredes.es/es/lookbook-2026', 'https://www.paredes.es/es/']);
  assert.deepEqual(r.b, ['https://www.adeslas.es/']);
  assert.deepEqual(r.c, []);
});

test('Galería: portada de la marca deducida del brief (dominio más citado; a secas solo con palabra de la marca)', () => {
  const r = run(`
    const p = require(${mod('productSheet.ts')});
    process.stdout.write(JSON.stringify({
      url: p.brandHome('Fuente https://www.paredes.es/es/a y https://www.paredes.es/es/b; tipografía https://fonts.googleapis.com/x; https://cdn.paredes.es/y y https://instagram.com/paredes', 'paredes'),
      bare: p.brandHome('Web oficial: segurcaixaadeslas.es (consultada hoy). Competencia: sanitas.es', 'segurcaixa-adeslas'),
      none: p.brandHome('sin web', 'adeslas'),
    }));
  `);
  assert.equal(r.url, 'https://www.paredes.es/');
  assert.equal(r.bare, 'https://segurcaixaadeslas.es/');
  assert.equal(r.none, null);
});

test('Galería: web que bloquea a Studio (403, «Un momento…») se marca y Hermes elige la imagen principal', () => {
  const r = run(`
    const p = require(${mod('productSheet.ts')});
    const note = p.productSheetNote({ pages: [{ url: 'https://www.segurcaixaadeslas.es/', title: null, price: null, shipping: [], images: [], kind: 'gallery', blocked: true }], photos: [], contactSheet: null }, 'out');
    process.stdout.write(JSON.stringify({
      s403: p.isBlockedPage(403, 'Seguros'), wait: p.isBlockedPage(200, 'Un momento…'), denied: p.isBlockedPage(200, 'Access Denied'),
      ok: p.isBlockedPage(200, 'Paredes - Tus Zapatillas Deportivas Online'), none: p.isBlockedPage(null, ''), note,
    }));
  `);
  assert.equal(r.s403, true);
  assert.equal(r.wait, true);
  assert.equal(r.denied, true);
  assert.equal(r.ok, false);
  assert.equal(r.none, false);
  assert.match(r.note, /bloquea la lectura automática de Studio en: https:\/\/www\.segurcaixaadeslas\.es\//);
  assert.match(r.note, /Imagen principal OBLIGATORIA igualmente: elige tú/);
});

test('Galería en pieza de producto: las fotos de la portada son AMBIENTE, no el producto; razonamiento high solo en la primera versión', () => {
  const r = run(`
    const p = require(${mod('productSheet.ts')});
    const w = require(${mod('hermes-worker.ts')});
    const pages = [{ url: 'https://www.paredes.es/es/eden.html', title: 'Eden negro', price: { amount: 43.99, currency: 'EUR', source: 'JSON-LD' }, shipping: [], images: ['a'], kind: 'product' }, { url: 'https://www.paredes.es/', title: null, price: null, shipping: [], images: ['b'], kind: 'gallery' }];
    const photos = [{ file: 'foto-1.jpg (1200×600, 1 KB)', from: 'https://x/eden.jpg', hero: true }, { file: 'foto-2.jpg (1200×550, 1 KB)', from: 'https://x/home.jpg', hero: true, ambient: true }];
    process.stdout.write(JSON.stringify({ note: p.productSheetNote({ pages, photos, contactSheet: null }, 'out'), draft: w.draftReasoningArgs(false), edit: w.draftReasoningArgs(true) }));
  `);
  assert.match(r.note, /foto-2\.jpg[^\n]*AMBIENTE de la marca, NO es el producto de la ficha/);
  assert.doesNotMatch(r.note, /foto-1\.jpg[^\n]*AMBIENTE/);
  assert.match(r.note, /nunca con un texto que las presente como el producto de la ficha/);
  assert.deepEqual(r.draft, ['--reasoning', 'high']);
  assert.deepEqual(r.edit, []);
});

test('Galería: candidatas a imagen principal y nota con ★, imagen principal obligatoria y variedad', () => {
  const r = run(`
    const p = require(${mod('productSheet.ts')});
    const photos = [
      { file: 'foto-1.jpg (1200×600, 90 KB)', from: 'https://x.es/a.jpg', ...p.photoSize('foto-1.jpg (1200×600, 90 KB)') },
      ...[2, 3, 4, 5].map((n) => ({ file: 'foto-' + n + '.jpg (800×800, 40 KB)', from: 'https://x.es/' + n + '.jpg', ...p.photoSize('foto-' + n + '.jpg (800×800, 40 KB)') })),
    ];
    const note = p.productSheetNote({ pages: [{ url: 'https://x.es/', title: null, price: null, shipping: [], images: ['a'], kind: 'gallery' }], photos, contactSheet: '/tmp/x.png' }, 'out');
    process.stdout.write(JSON.stringify({ wide: p.photoSize('a.jpg (1200×600, 1 KB)'), square: p.photoSize('a.jpg (1200×1200, 1 KB)'), small: p.photoSize('a.jpg (900×500, 1 KB)'), note }));
  `);
  assert.equal(r.wide.hero, true);
  assert.equal(r.square.hero, false);
  assert.equal(r.small.hero, false);
  assert.match(r.note, /galería de campaña/);
  assert.match(r.note, /foto-1\.jpg \(1200×600, 90 KB\) ★ candidata/);
  assert.doesNotMatch(r.note, /foto-2\.jpg[^\n]*★/);
  assert.match(r.note, /Imagen principal OBLIGATORIA[^\n]*★/);
  assert.match(r.note, /al menos 3 fotos distintas/);
  assert.doesNotMatch(r.note, /Precio:/);
});

test('Imagen principal y variedad: error con candidatas, aviso sin ellas; logo y fotos pequeñas no cuentan', () => {
  const html = (imgs) => imgs.map((i) => `<img src="${i}" alt="">`).join('');
  const r = run(`
    const { photoFindings } = require(${mod('renderChecks.ts')});
    const g = { photos: 6, heroCandidates: ['foto-1.jpg'] };
    process.stdout.write(JSON.stringify({
      ok: photoFindings(${JSON.stringify(html(['logo.png', 'foto-1.jpg', 'foto-2.jpg', 'foto-3.jpg']))}, [180, 600, 280, 280], [20, 120, 900, 900], g),
      low: photoFindings(${JSON.stringify(html(['logo.png', 'foto-1.jpg']))}, [180, 600], [20, 1400], g),
      narrow: photoFindings(${JSON.stringify(html(['polo-mark.png', 'foto-2.jpg']))}, [600, 300], [20, 120], null),
      noGallery: photoFindings(${JSON.stringify(html(['foto-2.jpg']))}, [300], [100], { photos: 2, heroCandidates: [] }),
    }));
  `);
  assert.deepEqual(r.ok.hero.errors, []);
  assert.deepEqual(r.ok.hero.warnings, []);
  assert.deepEqual(r.ok.variety.warnings, []);
  assert.match(r.low.hero.errors[0], /Sin imagen principal.*foto-1\.jpg/);
  assert.match(r.low.variety.warnings[0], /1 foto\(s\) distinta\(s\).*6/);
  assert.equal(r.narrow.hero.errors.length, 0);
  assert.match(r.narrow.hero.warnings[0], /Sin imagen principal/);
  assert.deepEqual(r.noGallery.variety.warnings, []);
});

test('Imagen principal renderizando: una foto a 600 px tras la cabecera pasa; sin ella, error en el control', (t) => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'hero-'));
  fs.mkdirSync(path.join(dir, '_trabajo'));
  fs.writeFileSync(path.join(dir, '_trabajo', 'galeria.json'), JSON.stringify({ photos: 3, heroCandidates: ['foto-1.png'] }));
  const page = (body) => `<!doctype html><html><body><table width="600"><tr><td><img src="logo.png" width="160" height="40" alt="Marca"></td></tr>${body}</table></body></html>`;
  fs.writeFileSync(path.join(dir, 'con.html'), page('<tr><td><img src="foto-1.png" width="600" height="300" alt=""></td></tr>'));
  fs.writeFileSync(path.join(dir, 'sin.html'), page('<tr><td><h1>Titular</h1><p>Texto</p></td></tr>'));
  let out;
  try {
    out = run(`
      const { execSync } = require('child_process');
      const sharp = require('sharp');
      await sharp({ create: { width: 1200, height: 600, channels: 3, background: '#888' } }).png().toFile(${JSON.stringify(path.join(dir, 'foto-1.png'))});
      await sharp({ create: { width: 320, height: 80, channels: 3, background: '#111' } }).png().toFile(${JSON.stringify(path.join(dir, 'logo.png'))});
      const { renderChecks } = require(${mod('renderChecks.ts')});
      const a = await renderChecks(${JSON.stringify(path.join(dir, 'con.html'))}, ${JSON.stringify(dir)});
      const b = await renderChecks(${JSON.stringify(path.join(dir, 'sin.html'))}, ${JSON.stringify(dir)});
      process.stdout.write(JSON.stringify({ a: a && a.photos, b: b && b.photos }));
    `);
  } catch {
    return t.skip('Chromium no arranca aquí');
  }
  if (!out.a) return t.skip('Chromium no arranca aquí');
  assert.deepEqual(out.a.hero.errors, []);
  assert.equal(out.b.hero.errors.length, 1);
});

test('Brief e encargo piden la imagen principal y la URL de cada página de imágenes', () => {
  const r = prompts({ clientSlug: 'paredes', clientName: 'Paredes', brandMode: 'new', briefText: '', instruction: 'Newsletter de la Eden', imageMode: 'official', mode: 'standalone' });
  const h = prompts({ clientSlug: 'paredes', clientName: 'Paredes', brandMode: 'new', briefText: '# Brief', imageMode: 'official', mode: 'standalone' });
  assert.match(r.brief, /escena 1 abre con una imagen principal/);
  assert.match(r.brief, /URL completa de la página oficial/);
  assert.match(h.hermes, /imagen principal, a todo el ancho tras el logo/);
});

test('Hoja de capturas sin cortes (2026-10-07, recuperado el 08-10): si la columna móvil no cabe, se estrechan las tres', () => {
  const r = run(`
    const h = require(${mod('render-newsletter.ts')});
    // Nike (06-10): a 420 px de ancho, 600 px → 2316, 375 px → 3206 (más alta que el máximo de 3000).
    process.stdout.write(JSON.stringify({ fits: h.sheetColumnWidth([2316, 1800, 2316]), nike: h.sheetColumnWidth([2316, 3206, 2316]) }));
  `);
  assert.equal(r.fits, 420);
  assert.ok(r.nike < 420 && Math.ceil((3206 * r.nike) / 420) + 36 <= 3000, 'la columna móvil entera cabe');
});

test('Logo medido vacío (Inglesina, 2026-10-07, recuperado el 08-10): no cuenta como logo', () => {
  const r = run(`
    const sharp = require('sharp');
    const m = require(${mod('measureBrand.ts')});
    const blank = await sharp({ create: { width: 280, height: 80, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } }).png().toBuffer();
    const ink = await sharp({ create: { width: 100, height: 40, channels: 4, background: '#222222ff' } }).png().toBuffer();
    const jpg = await sharp({ create: { width: 100, height: 40, channels: 3, background: '#ffffff' } }).jpeg().toBuffer();
    process.stdout.write(JSON.stringify({ blank: await m.hasVisiblePixels(blank), ink: await m.hasVisiblePixels(ink), jpg: await m.hasVisiblePixels(jpg), broken: await m.hasVisiblePixels(Buffer.from('x')) }));
  `);
  assert.deepEqual([r.blank, r.ink, r.jpg, r.broken], [false, true, true, false]);
});

test('Vigilante de cuelgues (2026-10-07, recuperado el 08-10): topes de la revisión de arte', () => {
  const r = run(`
    const w = require(${mod('hermes-worker.ts')});
    process.stdout.write(JSON.stringify({ score: w.ART_SCORE_CAP_MS, improve: w.ART_IMPROVE_CAP_MS }));
  `);
  assert.deepEqual([r.score, r.improve], [5 * 60 * 1000, 8 * 60 * 1000]);
});


test('Q1 (2026-10-07): la oferta con su cifra', () => {
  const r = run(`
    const rc = require(${JSON.stringify(path.join(__dirname, '../server/requestCoverage.ts'))});
    const { runQualityCheck } = require(${mod('qualityCheck.ts')});
    const html = '<html><head><title>Rebajas Lacoste</title></head><body><h1>Rebajas en polos</h1></body></html>';
    const check = async (offer) => (await runQualityCheck(html, { offer })).checks.find((c) => c.id === 'offer');
    const verified = '## 3. Datos verificados\\nOferta: hasta un 50 % en polos (https://www.lacoste.com/es/rebajas). Polo L.12.12 100% algodón, 100,00 € → 50,00 €.';
    process.stdout.write(JSON.stringify({
      asks: [rc.asksForOffer('newsletter de rebajas de Lacoste'), rc.asksForOffer('newsletter de Navidad de El Corte Inglés'), rc.asksForOffer('con un descuento para jóvenes')],
      figures: rc.offerFigures(verified), cotton: rc.offerFigures('Polo 100% algodón'),
      shows: [rc.pieceShowsFigure('Polos al 50 %'), rc.pieceShowsFigure('Ahora 49,95&nbsp;€'), rc.pieceShowsFigure('Rebajas en polos')],
      err: await check({ asked: true, verifiedFigures: rc.offerFigures(verified), pieceHasFigure: false }),
      warn: await check({ asked: true, verifiedFigures: [], pieceHasFigure: false }),
      ok: await check({ asked: true, verifiedFigures: ['hasta un 50 %'], pieceHasFigure: true }),
      none: await check({ asked: false, verifiedFigures: [], pieceHasFigure: false }),
    }));
  `);
  assert.deepEqual(r.asks, [true, false, true]);
  assert.deepEqual(r.figures, ['hasta un 50 %', '100,00 €', '50,00 €']);
  assert.deepEqual(r.cotton, [], '«100 % algodón» no es una oferta');
  assert.deepEqual(r.shows, [true, true, false]);
  assert.equal(r.err.status, 'error');
  assert.match(r.err.details[0], /hasta un 50 %/);
  assert.equal(r.warn.status, 'warning');
  assert.match(r.warn.details[0], /no la inventes/);
  assert.equal(r.ok.status, 'ok');
  assert.equal(r.none, undefined);
});

test('Q2 (2026-10-07, recuperada el 08-10): la foto de cada escena se elige antes de escribir su texto', () => {
  const r = run(`
    const s = require(${JSON.stringify(path.join(__dirname, '../server/standalone.ts'))});
    const job = { id: 'x', createdAt: '2026-10-07T10:00:00Z', input: { clientName: 'Nike', clientSlug: 'nike', briefText: '# Brief', imageMode: 'official' } };
    process.stdout.write(JSON.stringify({ prompt: s.buildHermesPrompt(job), brief: s.buildBriefPrompt({ ...job, input: { ...job.input, instruction: 'newsletter de Nike' } }) }));
  `);
  assert.match(r.prompt, /elige la foto de cada escena ANTES de escribir su texto/);
  assert.match(r.prompt, /la escena donde va y qué se ve en ella/);
  assert.match(r.brief, /escritos sobre lo que muestra ESA foto/);
});

test('Prompt completo (Nike, 2026-10-08): sin brief, el borrador investiga; con brief, no navega', () => {
  const r = run(`
    const s = require(${JSON.stringify(path.join(__dirname, '../server/standalone.ts'))});
    const w = require(${mod('hermes-worker.ts')});
    const job = { id: 'x', createdAt: '2026-10-08T10:00:00Z', input: { clientName: 'Nike', clientSlug: 'nike', briefText: '# Prompt', imageMode: 'official' } };
    process.stdout.write(JSON.stringify({
      full: s.buildHermesPrompt(job), withBrief: s.buildHermesPrompt({ ...job, input: { ...job.input, instruction: 'newsletter de Nike' } }),
      noteFull: w.selfContainedNote('newsletters/2026/nike/hermes/x', process.cwd(), false), noteBrief: w.selfContainedNote('newsletters/2026/nike/hermes/x'),
      peticion: w.ART_CRITERIA.peticion,
    }));
  `);
  assert.match(r.full, /haz tú la investigación que pide/);
  assert.doesNotMatch(r.full, /no vuelve a navegar la web/);
  assert.match(r.withBrief, /no vuelve a navegar la web/);
  assert.match(r.noteFull, /la haces tú ahora/);
  assert.doesNotMatch(r.noteFull, /No investigues/);
  assert.match(r.noteBrief, /No investigues lo que el brief deja pendiente/);
  assert.match(r.peticion, /Si la petición no pide una oferta, la oferta no cuenta/);
});

test('Fotos repetidas (Nike, 2026-10-08): la misma foto con otro nombre es error; el logo repetido, no', () => {
  const r = run(`
    const fs = require('fs'), os = require('os'), path = require('path'), sharp = require('sharp');
    const { imageFindings } = require(${mod('renderChecks.ts')});
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'dup-'));
    const photo = (name, color) => sharp({ create: { width: 600, height: 400, channels: 3, background: color } }).jpeg().toFile(path.join(dir, name));
    await photo('suela.jpg', '#c03030'); fs.copyFileSync(path.join(dir, 'suela.jpg'), path.join(dir, 'suela-crop.jpg'));
    await photo('lateral.jpg', '#3050c0'); await photo('logo.jpg', '#111111');
    const img = (src, w) => '<img src="' + src + '" width="' + w + '">';
    const check = async (html) => (await imageFindings(html, dir, dir)).errors.filter((e) => e.startsWith('Foto repetida'));
    process.stdout.write(JSON.stringify({
      renamed: await check(img('suela.jpg', 600) + img('lateral.jpg', 250) + img('suela-crop.jpg', 250)),
      same: await check(img('lateral.jpg', 600) + img('lateral.jpg', 250)),
      logo: await check(img('logo.jpg', 200) + img('suela.jpg', 600) + img('logo.jpg', 200)),
      small: await check(img('lateral.jpg', 600) + img('lateral.jpg', 120)),
    }));
  `);
  assert.equal(r.renamed.length, 1);
  assert.match(r.renamed[0], /suela\.jpg, suela-crop\.jpg\), con otro nombre o recortada/);
  assert.equal(r.same.length, 1);
  assert.deepEqual([r.logo, r.small], [[], []]);
});

test('Q1 (Jordan y Nike, 2026-10-08): «saltes» no es «sales» y un prompt que pide verificar ofertas no pide una', () => {
  const r = run(`
    const rc = require(${JSON.stringify(path.join(__dirname, '../server/requestCoverage.ts'))});
    process.stdout.write(JSON.stringify({
      saltes: rc.asksForOffer('Ejecuta los pasos siguientes EN ORDEN. No saltes ninguno.'),
      sales: rc.asksForOffer('newsletter de sales de verano'),
      typo: rc.requestTerms('newsletter de black frisay').map((t) => t.id),
      rebajas: rc.asksForOffer('newsletter de rebjas de Lacoste'),
    }));
  `);
  assert.equal(r.saltes, false);
  assert.equal(r.sales, true);
  assert.deepEqual(r.typo, ['black-friday']);
  assert.equal(r.rebajas, true, 'las palabras largas siguen tolerando una errata');
});

test('Voz de la marca (Digital Car y Nike, 2026-10-08): contar la investigación o hablar de la pieza es error', () => {
  const r = run(`
    const { researchVoiceFindings, COPY_RULES } = require(${mod('copyCheck.ts')});
    const { runQualityCheck } = require(${mod('qualityCheck.ts')});
    const page = (t) => '<html><head><title>x</title></head><body><p>' + t + '</p></body></html>';
    const bad = [
      'La portada de DigitalCar anuncia un descuento de 15.000 € para coches de ocasión.',
      'No se han localizado las bases ni el periodo de validez.',
      'Condiciones finales pendientes de confirmación.',
      'Pieza de marca para corredores que preparan una media o un maratón.',
      'Hasta 10.000 mm de resistencia al agua, según la ficha del producto.',
    ];
    const good = [
      'Hasta 15.000 € menos en coches de ocasión. Consulta modelos y condiciones en cada ficha.',
      'La chaqueta resiste 10.000 mm de columna de agua.',
      'Una newsletter cada mes con lo nuevo.',
      'Elige tu talla en la web.',
    ];
    const check = (await runQualityCheck(page(bad[0]))).checks.find((c) => c.id === 'voice');
    process.stdout.write(JSON.stringify({
      bad: bad.map((t) => researchVoiceFindings(page(t)).length),
      good: good.map((t) => researchVoiceFindings(page(t)).length),
      status: check.status, rules: COPY_RULES.join(' '),
    }));
  `);
  assert.deepEqual(r.bad, [1, 1, 1, 1, 1]);
  assert.deepEqual(r.good, [0, 0, 0, 0]);
  assert.equal(r.status, 'error');
  assert.match(r.rules, /Lo pendiente va SOLO a notas\.md/);
});

test('Columnas que se apilan en escritorio (Spotify y Jordan, 2026-10-08): autoFix quita el espacio entre columnas', () => {
  const r = run(`
    const { autoFix } = require(${mod('autoFix.ts')});
    const html = '<table><tr><td style="padding:0 40px">\\n  <!--[if mso]><table role="presentation" width="520"><tr><td width="256"><![endif]-->\\n' +
      '  <div class="stack" style="display:inline-block; max-width:256px;"><img src="a.jpg" width="256"></div>\\n' +
      '  <!--[if mso]></td><td width="264"><![endif]-->\\n  <div class="stack stack-gap" style="display:inline-block; max-width:264px;"><p>Texto</p></div>\\n' +
      '  <!--[if mso]></td></tr></table><![endif]-->\\n</td></tr></table>';
    const out = autoFix(html);
    const again = autoFix(out.html);
    process.stdout.write(JSON.stringify({ html: out.html, applied: out.applied, again: again.applied }));
  `);
  assert.match(r.html, /<\/div><!--\[if mso\]><\/td><td width="264"><!\[endif\]--><div class="stack stack-gap"/);
  assert.match(r.html, /<table role="presentation" width="520">/, 'los comentarios de Outlook conservan sus espacios');
  assert.ok(r.applied.some((a) => /columnas lado a lado/.test(a)));
  assert.ok(!r.again.some((a) => /columnas lado a lado/.test(a)), 'una segunda pasada no cambia nada');
});

test('Foto repetida recortada (Tarífalo, 2026-10-08): un recorte cuenta como la misma foto; dos fotos parecidas, no', () => {
  const r = run(`
    const fs = require('fs'), os = require('os'), path = require('path'), sharp = require('sharp');
    const { imageFindings, samePhoto } = require(${mod('renderChecks.ts')});
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'crop-'));
    // Una «foto» con detalle: degradado y bloques de color.
    const w = 708, h = 800, px = Buffer.alloc(w * h * 3);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const i = (y * w + x) * 3; px[i] = (x * 255) / w; px[i + 1] = (y * 255) / h; px[i + 2] = ((x >> 5) + (y >> 5)) % 2 ? 200 : 40; }
    await sharp(px, { raw: { width: w, height: h, channels: 3 } }).jpeg().toFile(path.join(dir, 'hero.jpg'));
    await sharp(path.join(dir, 'hero.jpg')).extract({ left: 0, top: 200, width: 708, height: 480 }).jpeg({ quality: 70 }).toFile(path.join(dir, 'recorte.jpg'));
    // Variante de color sobre el mismo fondo (como dos frascos de perfume): no es la misma foto.
    const bottle = async (name, color) => sharp({ create: { width: 600, height: 600, channels: 3, background: '#eeeeee' } })
      .composite([{ input: await sharp({ create: { width: 220, height: 320, channels: 3, background: color } }).png().toBuffer(), left: 190, top: 140 }]).jpeg().toFile(path.join(dir, name));
    await bottle('violeta.jpg', '#6b2fa0'); await bottle('rojo.jpg', '#c4204f');
    const img = (src) => '<img src="' + src + '" width="600">';
    const errs = async (html) => (await imageFindings(html, dir, dir)).errors.filter((e) => e.startsWith('Foto repetida'));
    process.stdout.write(JSON.stringify({
      crop: await samePhoto(path.join(dir, 'hero.jpg'), path.join(dir, 'recorte.jpg')),
      variants: await samePhoto(path.join(dir, 'violeta.jpg'), path.join(dir, 'rojo.jpg')),
      piece: await errs(img('hero.jpg') + img('recorte.jpg')),
      ok: await errs(img('violeta.jpg') + img('rojo.jpg')),
    }));
  `);
  assert.equal(r.crop, true);
  assert.equal(r.variants, false);
  assert.equal(r.piece.length, 1);
  assert.match(r.piece[0], /con otro nombre o recortada/);
  assert.deepEqual(r.ok, []);
});

// ---------------------------------------------------------------- espaciados (spacing.ts, 2026-10-15)

test('Espaciados: mensajes, y texto encima o debajo de una foto se deja a layoutFindings', () => {
  const r = run(`
    const { spacingFindings } = require(${mod('spacing.ts')});
    process.stdout.write(JSON.stringify(spacingFindings({
      width: 700,
      edges: [
        { text: 'Conoce cómo trabajamos', side: 'arriba', gap: 7, what: 'banda', button: true },
        { text: 'Titular bajo la foto', side: 'arriba', gap: 4, what: 'foto', button: false },
        { text: 'Botas claras', side: 'izquierda', gap: 0, what: 'foto', button: false },
      ],
      rules: [{ text: 'La comunicación ordena', gap: 0 }],
      holes: [{ after: 'Conoce cómo trabajamos', before: 'La comunicación ordena', gap: 90 }],
      overlaps: [],
    }, 'a 600 px')));
  `);
  assert.equal(r.length, 4, JSON.stringify(r));
  assert.match(r[0], /^Botón «Conoce cómo trabajamos» pegado por arriba a la banda de otro color \(7 px, a 600 px\)/);
  assert.match(r[1], /^Texto «Botas claras» pegado por la izquierda a la foto/);
  assert.match(r[2], /línea decorativa/);
  assert.match(r[3], /Hueco vacío de 90 px/);
});

test('Espaciados renderizando: botón pegado a la banda, texto pegado a su línea y a la foto, hueco; una pieza bien, nada', (t) => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'spacing-'));
  const shell = (rows) => '<!doctype html><html><head><meta name="viewport" content="width=device-width"><style>body{margin:0;background:#d9c21e;font:16px/1.5 Arial}' +
    '@media (max-width:620px){.c{width:100%!important}}</style></head><body><table class="c" width="600" align="center" cellpadding="0" cellspacing="0" style="background:#fff">' + rows + '</table></body></html>';
  const band = '<tr><td style="background:#000;color:#fff;padding:40px 24px"><h1 style="margin:0">Cada mensaje toma su forma.</h1></td></tr>';
  const para = (txt) => '<tr><td style="padding:24px"><p style="margin:0">' + txt + '</p></td></tr>';
  const roto = shell(band +
    '<tr><td style="padding:6px 24px 130px"><table><tr><td style="background:#d9c21e;padding:12px 20px"><a href="https://x.es">Conoce cómo trabajamos</a></td></tr></table></td></tr>' +
    '<tr><td style="padding:0 24px 24px"><div style="border-left:2px solid #d9c21e"><p style="margin:0">La comunicación ordena el enfoque para que cada mensaje responda a sus objetivos.</p></div></td></tr>' +
    para('Un segundo bloque de texto con su separación normal entre escenas.') + para('Y un tercero para que la pieza tenga su ritmo habitual.') +
    '<tr><td style="padding:24px"><table width="100%"><tr><td width="200"><img src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==" width="200" height="200" style="display:block;background:#888"></td><td valign="top"><p style="margin:0">Botas claras frente a tonos oscuros, con texto largo.</p></td></tr></table></td></tr>' +
    '<tr><td style="padding:32px 24px"><table><tr><td style="background:#d9c21e;padding:12px 20px"><a href="https://x.es/h">Habla con el equipo</a></td></tr></table></td></tr>');
  const bien = shell(band +
    '<tr><td style="padding:32px 24px"><table><tr><td style="background:#d9c21e;padding:12px 20px"><a href="https://x.es">Conoce cómo trabajamos</a></td></tr></table></td></tr>' +
    '<tr><td style="padding:0 24px 24px"><div style="border-left:2px solid #d9c21e;padding-left:16px"><p style="margin:0">La comunicación ordena el enfoque para que cada mensaje responda a sus objetivos.</p></div></td></tr>' +
    para('Un segundo bloque de texto con su separación normal entre escenas.') +
    '<tr><td style="padding:24px 24px 40px"><p style="margin:0;text-align:center"><a href="https://x.es/p">Política de privacidad muy larga que salta de línea</a> · <a href="https://x.es/c">Política de cookies</a></p></td></tr>');
  fs.writeFileSync(path.join(dir, 'roto.html'), roto);
  fs.writeFileSync(path.join(dir, 'bien.html'), bien);
  let out;
  try {
    out = run(`
      const { chromium } = require('playwright');
      const { spacingFindingsWith } = require(${mod('spacing.ts')});
      const b = await chromium.launch();
      const a = await spacingFindingsWith(b, ${JSON.stringify(path.join(dir, 'roto.html'))}, 700, 375);
      const c = await spacingFindingsWith(b, ${JSON.stringify(path.join(dir, 'bien.html'))}, 700, 375);
      await b.close();
      process.stdout.write(JSON.stringify({ a, c }));
    `);
  } catch {
    return t.skip('Chromium no arranca aquí');
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
  const all = out.a.join('\n');
  assert.match(all, /Botón «Conoce cómo trabajamos» pegado por arriba a la banda de otro color \(\d px, en escritorio y móvil\)/);
  assert.match(all, /«La comunicación ordena[^»]*» a 0 px de su línea decorativa/);
  assert.match(all, /«Botas claras[^»]*» pegado por la izquierda a la foto \(\d px, a 600 px\)/);
  assert.match(all, /Hueco vacío de \d+ px entre «Conoce cómo trabajamos» y «La comunicación ordena/);
  assert.deepEqual(out.c, []);
});

// ---------------------------------------------------------------- alineaciones (alignment.ts, 2026-10-15)

test('Alineaciones: mensajes de descuadre y de centrado', () => {
  const r = run(`
    const { alignmentFindings } = require(${mod('alignment.ts')});
    process.stdout.write(JSON.stringify(alignmentFindings({
      width: 700,
      lefts: [[{ x: 40, text: '«ANTES DEL PICO»' }, { x: 48, text: '«CRM + EMAIL MARKETING»' }]],
      centers: [{ text: 'Reservar mi auditoría', left: 20, right: 40 }],
    }, 'a 600 px')));
  `);
  assert.equal(r.length, 2);
  assert.match(r[0], /^Descuadre a la izquierda \(a 600 px\): «ANTES DEL PICO» a 40 px, «CRM \+ EMAIL MARKETING» a 48 px del borde/);
  assert.match(r[1], /«Reservar mi auditoría» está centrado pero queda descentrado \(20 px a la izquierda y 40 px a la derecha/);
});

test('Alineaciones renderizando: 48 frente a 40 px y un centrado torcido; la tarjeta, la sangría y el botón centrado, no', (t) => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'align-'));
  const shell = (rows) => '<!doctype html><html><head><meta name="viewport" content="width=device-width"><style>body{margin:0;background:#eee;font:16px/1.5 Arial}' +
    '@media (max-width:620px){.c{width:100%!important}}</style></head><body><table class="c" width="600" align="center" cellpadding="0" cellspacing="0" style="background:#fff">' + rows + '</table></body></html>';
  const p = (pad, txt) => '<tr><td style="padding:24px ' + pad + 'px"><p style="margin:0">' + txt + '</p></td></tr>';
  const card = '<tr><td style="padding:24px 40px"><table width="100%" cellpadding="0" cellspacing="0"><tr><td style="background:#1b1464;color:#fff;padding:16px 18px"><p style="margin:0">Segmentación: ¿cada envío llega al segmento previsto?</p></td></tr></table></td></tr>';
  const button = '<tr><td align="center" style="padding:24px 40px"><table cellpadding="0" cellspacing="0"><tr><td style="background:#1b1464;padding:12px 24px;border-radius:999px"><a href="https://x.es" style="color:#fff">Reservar mi auditoría</a></td></tr></table></td></tr>';
  const tail = '<tr><td style="padding:24px 40px"><p style="margin:0">Feebbo Solutions · pie</p></td></tr>'.repeat(8);
  const roto = shell(p(48, 'CRM y email marketing, en noviembre.') + p(40, 'Antes del pico: tres revisiones.') + card + button +
    '<tr><td style="padding:24px 40px 24px 80px"><p style="margin:0;text-align:center">Un texto centrado con más aire a un lado</p></td></tr>' + tail);
  const bien = shell(p(40, 'CRM y email marketing, en noviembre.') + p(40, 'Antes del pico: tres revisiones.') + card + button +
    p(64, 'Una sangría a propósito, más de 12 px.') + tail);
  fs.writeFileSync(path.join(dir, 'roto.html'), roto);
  fs.writeFileSync(path.join(dir, 'bien.html'), bien);
  let out;
  try {
    out = run(`
      const { chromium } = require('playwright');
      const { alignmentFindingsWith } = require(${mod('alignment.ts')});
      const b = await chromium.launch();
      const a = await alignmentFindingsWith(b, ${JSON.stringify(path.join(dir, 'roto.html'))}, 700, 375);
      const c = await alignmentFindingsWith(b, ${JSON.stringify(path.join(dir, 'bien.html'))}, 700, 375);
      await b.close();
      process.stdout.write(JSON.stringify({ a, c }));
    `);
  } catch {
    return t.skip('Chromium no arranca aquí');
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
  const all = out.a.join('\n');
  assert.match(all, /Descuadre a la izquierda \(a 600 px\): «Antes del pico[^»]*» a 40 px[^\n]*«CRM y email marketing[^»]*» a 48 px/);
  assert.match(all, /«Un texto centrado con más aire a un lado» está centrado pero queda descentrado/);
  assert.deepEqual(out.c, []);
});

// ---------------------------------------------------------------- revisión de arte fiable (2026-10-16)

test('Juez de arte: hoja de escritorio en tramos, resumen del brief y medidas de Studio', () => {
  const brief = [
    '# Brief — Novo — Áticos',
    '## 1. Concepto — Cuando cae la tarde, empieza la terraza.',
    'Encaja con la marca.',
    '## 2. Identidad de marca — Playfair',
    'Paleta larga '.repeat(400),
    '## 3. Datos verificados',
    'Oferta: -20 % hasta el 30-11 (https://x.es)',
    'Precio 300 €',
    '## 4. Asunto y preheader — La terraza al caer la tarde',
    '## 5. Escenas',
    '1. Apertura: foto de la terraza.',
    '## 6. Imágenes',
    'foto-1.jpg',
    '',
    '## Instrucciones de entrega',
    'no',
  ].join('\n');
  const r = run(`
    const rn = require(${mod('render-newsletter.ts')});
    const j = require(${mod('artJudge.ts')});
    const w = require(${mod('hermes-worker.ts')});
    const facts = j.judgeFacts({
      fonts: { desktop: { bodyMin: 15, bodyTypical: 16, footerMin: 12 }, mobile: { bodyMin: 14, bodyTypical: 16, footerMin: null } },
      mobile: null, design: { errors: [], warnings: ['Contraste bajo: «X» (#fff sobre #128c3c, 4.3:1); lo recomendable es 4,5:1.'] }, dark: null,
    });
    const q = w.artReviewQuery(undefined, ${JSON.stringify(brief)}, '<p>Hola</p>', '/tmp/hoja.jpg', { width: 1246, height: 2000 },
      { path: '/tmp/web.jpg', size: { width: 1280, height: 900 } }, [], { path: '/tmp/esc.jpg', width: 1272, height: 1486 }, facts);
    process.stdout.write(JSON.stringify({
      tiles: [rn.desktopTiles(1000), rn.desktopTiles(3300), rn.desktopTiles(9000).length],
      digest: j.briefDigest(${JSON.stringify(brief)}),
      legacy: j.briefDigest('# Prompt pegado\\n' + 'x'.repeat(5000)).length,
      facts, q,
    }));
  `);
  assert.deepEqual(r.tiles[0], [[0, 1000]]);
  // Tres tramos con solape de 60 px; nunca más de tres.
  assert.deepEqual(r.tiles[1], [[0, 1100], [1040, 2200], [2140, 3300]]);
  assert.equal(r.tiles[2], 3);
  // El resumen lleva concepto, oferta, asunto y escenas; no la identidad (larga) ni las imágenes.
  assert.match(r.digest, /Concepto: Cuando cae la tarde/);
  assert.match(r.digest, /Oferta: -20 %/);
  assert.match(r.digest, /Asunto y preheader/);
  assert.match(r.digest, /1\. Apertura: foto de la terraza/);
  assert.doesNotMatch(r.digest, /Paleta larga|foto-1\.jpg|Precio 300/);
  assert.equal(r.legacy, 3500);
  assert.match(r.facts[0], /600 px: mínima 15 px, habitual 16 px; pie 12 px/);
  assert.match(r.facts[1], /pie sin texto corrido/);
  assert.match(r.facts[3], /4\.3:1/);
  // Pasos: escritorio, hoja, web y JSON, en ese orden.
  assert.match(r.q, /1\. Llama a vision_analyze con image_url \/tmp\/esc\.jpg y region \[0, 0, 1272, 1486\]/);
  assert.match(r.q, /2\. Llama a vision_analyze con image_url \/tmp\/hoja\.jpg/);
  assert.match(r.q, /3\. Llama a vision_analyze con image_url \/tmp\/web\.jpg/);
  assert.match(r.q, /4\. Con lo que te devuelvan, responde SOLO con un JSON/);
  assert.match(r.q, /Medidas de Studio:[\s\S]*NO los juzgues por las imágenes/);
  assert.doesNotMatch(r.q, /Paleta larga/);
});

test('Juez de arte: la mejora se decide comparando, con el motivo real en el registro', () => {
  const r = run(`
    const j = require(${mod('artJudge.ts')});
    const w = require(${mod('hermes-worker.ts')});
    const keys = Object.keys(w.ART_CRITERIA);
    const all = (v) => Object.fromEntries(keys.map((k) => [k, v]));
    const ok = j.parseArtCompare('Va: ' + JSON.stringify({ criterios: { ...all('igual'), copy: 'B', aire: 'b', movil: 'A' }, razones: { copy: 'titular concreto' } }), keys);
    const bad = j.parseArtCompare(JSON.stringify({ criterios: { ...all('igual'), copy: 'mejor' } }), keys);
    const partial = j.parseArtCompare(JSON.stringify({ criterios: { copy: 'B' } }), keys);
    const wins = j.compareVerdict({ criterios: { ...all('igual'), copy: 'B', aire: 'B', jerarquia: 'A' }, razones: {} }, 'B');
    const swapped = j.compareVerdict({ criterios: { ...all('igual'), copy: 'B', aire: 'B', jerarquia: 'A' }, razones: {} }, 'A');
    const guard = j.compareVerdict({ criterios: { ...all('igual'), copy: 'B', aire: 'B', movil: 'A' }, razones: {} }, 'B');
    const tie = j.compareVerdict({ criterios: all('igual'), razones: {} }, 'B');
    const note = (o) => ({ notas: { ...all(4), ...o }, problemas: [], mejoras: [] });
    const fb = [w.fallbackVerdict(note({}), note({ copy: 5, aire: 5, movil: 3 })), w.fallbackVerdict(note({}), note({ copy: 3 , aire: 3})), w.fallbackVerdict(note({}), null)];
    const q = j.artCompareQuery(w.ART_CRITERIA, { desktop: { path: '/tmp/d.jpg', width: 1092, height: 2400 }, mobile: { path: '/tmp/m.jpg', width: 796, height: 2400 } }, 'Concepto: X', 'texto a', 'texto b', 'black friday');
    process.stdout.write(JSON.stringify({ ok, bad, partial, wins, swapped, guard, tie, fb, q, summary: w.compareSummary(ok, 'B') }));
  `);
  assert.equal(r.ok.criterios.aire, 'B');
  assert.equal(r.ok.criterios.movil, 'A');
  assert.deepEqual(r.ok.razones, { copy: 'titular concreto' });
  assert.equal(r.bad, null);
  assert.equal(r.partial, null);
  assert.equal(r.wins.keep, true);
  assert.match(r.wins.reason, /se queda: la comparación la prefiere en aire, copy \(pierde en jerarquia\)/);
  // El orden se sortea: con la mejorada como A, los mismos votos favorecen a la anterior.
  assert.equal(r.swapped.keep, false);
  assert.equal(r.guard.keep, false);
  assert.match(r.guard.reason, /pierde en movil aunque gana en aire, copy/);
  assert.equal(r.tie.keep, false);
  assert.match(r.tie.reason, /no ve diferencias/);
  // Sin comparación: el motivo es el criterio que baja de 4, no «empeoraba».
  assert.equal(r.fb[0].keep, false);
  assert.match(r.fb[0].reason, /movil 4 → 3 baja de 4/);
  assert.match(r.fb[1].reason, /aire 4 → 3, copy 4 → 3 baja de 4/);
  assert.equal(r.fb[2].keep, true);
  assert.match(r.q, /1\. Llama a vision_analyze con image_url \/tmp\/d\.jpg y region \[0, 0, 1092, 2400\]/);
  assert.match(r.q, /2\. Llama a vision_analyze con image_url \/tmp\/m\.jpg/);
  assert.match(r.q, /Si dudas, «igual»/);
  assert.match(r.q, /black friday/);
  assert.match(r.summary, /- copy: mejorada — titular concreto/);
  assert.match(r.summary, /- movil: anterior/);
});

test('Juez de arte: dos comparaciones con el orden cambiado; la mejora se queda solo si las dos la prefieren', () => {
  const r = run(`
    const j = require(${mod('artJudge.ts')});
    const w = require(${mod('hermes-worker.ts')});
    const all = (v) => Object.fromEntries(Object.keys(w.ART_CRITERIA).map((k) => [k, v]));
    const v = (crit, afterIs) => j.compareVerdict({ criterios: { ...all('igual'), ...crit }, razones: {} }, afterIs);
    // Mejorada en A y en B: los votos ya vienen por lado.
    const keepA = v({ copy: 'A', aire: 'A' }, 'A');
    const keepB = v({ copy: 'B', jerarquia: 'B' }, 'B');
    const loseA = v({ copy: 'B' }, 'A');
    const loseB = v({ copy: 'A', movil: 'A' }, 'B');
    process.stdout.write(JSON.stringify({
      both: j.doubleVerdict(keepA, keepB),
      split: j.doubleVerdict(keepA, loseB),
      none: j.doubleVerdict(loseA, loseB),
    }));
  `);
  assert.equal(r.both.keep, true);
  assert.match(r.both.reason, /las dos comparaciones la prefieren \(en las dos gana en copy\)/);
  // Sesgo de posición (8 de 20 parejas en la prueba): si no coinciden, se queda la anterior.
  assert.equal(r.split.keep, false);
  assert.match(r.split.reason, /no coinciden \(primera: \+2\/−0; segunda: \+0\/−2\)/);
  assert.equal(r.none.keep, false);
  assert.match(r.none.reason, /ninguna de las dos/);
});
