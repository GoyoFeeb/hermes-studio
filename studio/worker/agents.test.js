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
    const q = w.artReviewQuery('pre-black friday', '# Brief X\\n\\n## Instrucciones de entrega\\nno', '<html><head><style>.a{}</style></head><body><h1>Hola&nbsp;mundo&#847;&zwnj;</h1></body></html>', '/tmp/hoja.jpg');
    const blind = w.parseArtReview('{"sin_imagen": true}');
    process.stdout.write(JSON.stringify({ okLow: w.lowScores(ok), badLow: w.lowScores(bad), problemas: bad.problemas, partial, q, blind }));
  `);
  assert.deepEqual(r.okLow, []);
  assert.deepEqual(r.badLow.sort(), ['oscuro', 'texto_imagen']);
  assert.deepEqual(r.problemas, ['texto blanco sobre blanco en oscuro']);
  assert.equal(r.partial, null);
  assert.match(r.q, /UNA sola vez a vision_analyze con image_url \/tmp\/hoja\.jpg/);
  assert.match(r.q, /\{"sin_imagen": true\}: nunca puntúes sin haberla visto/);
  assert.equal(r.blind, null);
  assert.match(r.q, /«Hola mundo»/);
  assert.match(r.q, /pre-black friday/);
  assert.doesNotMatch(r.q, /Instrucciones de entrega/);
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
