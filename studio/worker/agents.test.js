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
  assert.deepEqual(r.urls.slice(0, 2), ['https://www.calvinklein.es/', 'https://www.calvinklein.com/es/']);
  assert.equal(r.given, 'https://www.nike.com/es/');
  assert.equal(r.ok, true);
  assert.equal(r.notOk, false);
  assert.match(r.note, /Titulares: Barlow Condensed \(peso 700, uppercase/);
  assert.match(r.note, /Google Fonts\): Barlow/);
  assert.match(r.note, /logo-medido\.png/);
});

test('Identidad medida: no se mide si hay brand pack o una medición reciente', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'brand-'));
  fs.mkdirSync(path.join(root, 'brands', 'con-pack', 'tokens'), { recursive: true });
  fs.writeFileSync(path.join(root, 'brands', 'con-pack', 'tokens', 'brand-tokens.json'), '{}');
  fs.mkdirSync(path.join(root, 'brands', 'medida', 'tokens'), { recursive: true });
  fs.writeFileSync(path.join(root, 'brands', 'medida', 'tokens', 'identidad-medida.json'), JSON.stringify({ measuredAt: new Date().toISOString(), palette: ['#ff0000'] }));
  fs.mkdirSync(path.join(root, 'brands', 'vieja', 'tokens'), { recursive: true });
  fs.writeFileSync(path.join(root, 'brands', 'vieja', 'tokens', 'identidad-medida.json'), JSON.stringify({ measuredAt: '2026-01-01T00:00:00Z' }));
  const r = run(`
    const m = require(${mod('measureBrand.ts')});
    const root = ${JSON.stringify(root)};
    process.stdout.write(JSON.stringify(['con-pack', 'medida', 'vieja', 'nueva'].map((s) => m.needsMeasure(root, s))));
  `);
  fs.rmSync(root, { recursive: true, force: true });
  assert.deepEqual(r, [false, false, true, true]);
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
  assert.match(r.hermes, /NO se investiga aquí y NO entra en la pieza/);
  assert.match(r.hermes, /no los leas del disco/);
  const b = prompts({ clientSlug: 'paredes', clientName: 'Paredes', brandMode: 'new', briefText: '', instruction: 'Newsletter de la Eden', imageMode: 'official', mode: 'standalone' });
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
    const threes = w.parseArtReview(JSON.stringify({ notas: all(3), problemas: [], mejoras: ['Más aire'] }));
    const oneTwo = w.parseArtReview(JSON.stringify({ notas: { ...all(4), copy: 2 }, problemas: ['titular genérico'], mejoras: [] }));
    const better = w.parseArtReview(JSON.stringify({ notas: { ...all(4), jerarquia: 5, aire: 5 }, problemas: [], mejoras: [] }));
    const worse = w.parseArtReview(JSON.stringify({ notas: { ...all(5), oscuro: 3 }, problemas: [], mejoras: [] }));
    const q = w.artReviewQuery(undefined, '# Brief', '<p>Hola</p>', '/tmp/hoja.jpg', { width: 1246, height: 2000 }, { path: '/tmp/web-marca.jpg', size: { width: 1280, height: 900 } });
    const qNoWeb = w.artReviewQuery(undefined, '# Brief', '<p>Hola</p>', '/tmp/hoja.jpg');
    process.stdout.write(JSON.stringify({
      mejoras: fours.mejoras, legacy: foursNoIdeas.mejoras,
      improve: [w.needsImprovement(fours), w.needsImprovement(fives), w.needsImprovement(foursNoIdeas), w.needsImprovement(threes), w.needsImprovement(oneTwo)],
      keep: [w.keepImproved(fours, better), w.keepImproved(fours, worse), w.keepImproved(fours, null), w.keepImproved(fours, fours)],
      total: w.scoreTotal(fours), q, qNoWeb,
    }));
  `);
  assert.deepEqual(r.mejoras, ['Texto secundario de 13 a 16 px en la apertura']);
  assert.deepEqual(r.legacy, []);
  // Solo con nota baja (2026-10-07): 40/50 ya no pasa por la mejora; 30/50 o un criterio en 2, sí.
  assert.deepEqual(r.improve, [false, false, false, true, true]);
  // Peor: más total (48 > 40) pero oscuro cae a 3 desde 4 → se descarta.
  assert.deepEqual(r.keep, [true, false, true, true]);
  assert.equal(r.total, 40);
  assert.match(r.q, /5 = lo firmaría el director de arte de la marca/);
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

test('Auditoría de tiempo (2026-10-07): herramientas por fase, orientación y topes de la revisión de arte', () => {
  const r = run(`
    const w = require(${mod('hermes-worker.ts')});
    process.stdout.write(JSON.stringify({
      brief: w.TOOLS_BRIEF, review: w.TOOLS_REVIEW,
      draft: w.draftTools('Imágenes: SOLO fotografía oficial'), draftAi: w.draftTools('Imágenes: GENÉRALAS CON IA con tu herramienta'),
      draftNoBrief: w.draftTools('Imágenes: SOLO fotografía oficial', false),
      orient: w.ORIENT_NOTE, caps: [w.ART_SCORE_CAP_MS, w.ART_IMPROVE_CAP_MS], below: w.IMPROVE_BELOW,
    }));
  `);
  assert.deepEqual(r.brief, ['-t', 'web,browser,terminal,file,vision']);
  assert.deepEqual(r.review, ['-t', 'terminal,file,vision']);
  // El borrador no navega: sin web ni browser; con imágenes de IA, también image_gen.
  assert.deepEqual(r.draft, ['-t', 'terminal,file,vision']);
  assert.deepEqual(r.draftAi, ['-t', 'terminal,file,vision,image_gen']);
  // «Prompt completo»: sin fase de brief, la pieza es quien investiga y conserva búsqueda y navegador.
  assert.deepEqual(r.draftNoBrief, ['-t', 'web,browser,terminal,file,vision']);
  assert.match(r.orient, /NO leas AGENTS\.md, CLAUDE\.md/);
  assert.match(r.orient, /no ejecutes git status/);
  assert.deepEqual(r.caps, [5 * 60 * 1000, 8 * 60 * 1000]);
  assert.equal(r.below, 0.72);
});
