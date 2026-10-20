const test = require('node:test');
const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..', '..');
const TSX_BIN = path.join(ROOT, 'node_modules', '.bin', 'tsx');
const FIXTURES = path.join(__dirname, 'fixtures', 'deepseek');

// Respuestas reales de deepseek-v4-flash (valla, prosa, claves en inglés, notas como texto).
function run(code) {
  const out = execFileSync(TSX_BIN, ['-e', `(async () => { ${code} })().catch((e) => { console.error(e); process.exit(1); });`], {
    cwd: ROOT,
    encoding: 'utf-8',
    env: { ...process.env, HERMES_WORKER_ENV_DIR: '/nonexistent' },
    maxBuffer: 8 * 1024 * 1024,
  });
  return JSON.parse(out);
}
const mod = (name) => JSON.stringify(path.join(__dirname, name));

test('Autoauditoría: ruta y plantilla exactas, y el mensaje de DeepSeek se guarda como notas.md', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'notas-'));
  const r = run(`
    const fs = require('fs');
    const path = require('path');
    const s = require(${mod('selfAudit.ts')});
    const w = require(${mod('hermes-worker.ts')});
    const stand = require(${JSON.stringify(path.join(ROOT, 'studio', 'server', 'standalone.ts'))});
    const fx = ${JSON.stringify(FIXTURES)};
    const dir = ${JSON.stringify(dir)};
    const read = (name) => fs.readFileSync(path.join(fx, name), 'utf8');
    const prompt = s.selfAuditPrompt('newsletters/2026/mazda/hermes/mvgo4yop-uo1kyw', 'new');
    const mobile = s.selfAuditPrompt('newsletters/2026/mazda/hermes/mvgo4yop-uo1kyw', 'mobile-fix');
    const fencedPath = path.join(dir, 'fenced.md');
    const markedPath = path.join(dir, 'marked.md');
    const headingPath = path.join(dir, 'heading.md');
    const chatPath = path.join(dir, 'chat.md');
    const keptPath = path.join(dir, 'kept.md');
    const stalePath = path.join(dir, 'stale.md');
    const fenced = s.recoverSelfAudit(fencedPath, read('notas-fenced.md'), 0);
    const marked = s.recoverSelfAudit(markedPath, read('notas-markers.txt'), 0);
    const heading = s.recoverSelfAudit(headingPath, read('notas-heading.md'), 0);
    const chat = s.recoverSelfAudit(chatPath, read('notas-chat-only.txt'), 0);
    fs.writeFileSync(keptPath, '# Autoauditoría\\n\\n## Ya estaba\\n\\n## Fuentes\\n\\ntexto de este trabajo\\n');
    const kept = s.recoverSelfAudit(keptPath, read('notas-markers.txt'), 0);
    fs.writeFileSync(stalePath, '# Notas viejas\\n\\n## Cambios\\n\\n## Fuentes\\n\\nde otro intento\\n');
    const staleStarted = Date.now() + 60000;
    const stale = s.recoverSelfAudit(stalePath, read('notas-heading.md'), staleStarted);
    const job = { id: 'muvx00-abc123', createdAt: '2026-10-05T10:00:00Z', input: { clientSlug: 'siroko', clientName: 'Siroko', brandMode: 'new', briefText: '# Brief', imageMode: 'official', mode: 'standalone', changeRequest: 'cambia el titular' } };
    const hermes = stand.buildHermesPrompt(job);
    const revision = stand.buildRevisionPrompt(job);
    const mobilePrompt = stand.buildMobileFixPrompt(job);
    const order = w.selfContainedNote('newsletters/2026/mazda/hermes/mvgo4yop-uo1kyw');
    process.stdout.write(JSON.stringify({
      prompt, mobile,
      fenced, fencedFile: fs.readFileSync(fencedPath, 'utf8'),
      marked, markedFile: fs.readFileSync(markedPath, 'utf8'),
      headingFile: fs.readFileSync(headingPath, 'utf8'),
      chat, chatExists: fs.existsSync(chatPath),
      kept, keptFile: fs.readFileSync(keptPath, 'utf8'),
      stale, staleFile: fs.readFileSync(stalePath, 'utf8'),
      hermes, revision, mobilePrompt,
      orderHit: /escribe exactamente newsletters\\/2026\\/mazda\\/hermes\\/mvgo4yop-uo1kyw\\/notas\\.md/.test(order),
    }));
  `);
  fs.rmSync(dir, { recursive: true, force: true });
  assert.match(r.prompt, /newsletters\/2026\/mazda\/hermes\/mvgo4yop-uo1kyw\/notas\.md/);
  assert.match(r.prompt, /write_file/);
  assert.match(r.prompt, /# Autoauditoría/);
  assert.match(r.prompt, /## 1\. Concepto y titular/);
  assert.match(r.prompt, /## 2\. Fuentes/);
  assert.match(r.prompt, /## 3\. Imágenes/);
  assert.match(r.prompt, /## 5\. Preguntas de autoauditoría/);
  assert.match(r.prompt, /<<<NOTAS>>>/);
  assert.match(r.prompt, /<<<FIN NOTAS>>>/);
  assert.match(r.mobile, /## Cambios/);
  assert.match(r.mobile, /375 px/);
  assert.match(r.fenced, /CX-60, cuando la ciudad se apaga/);
  assert.doesNotMatch(r.fencedFile, /write_file no llegó/);
  assert.match(r.markedFile, /el asfalto de noche/);
  assert.doesNotMatch(r.markedFile, /Nada más/);
  assert.match(r.headingFile, /el granate de Mazda/);
  assert.equal(r.chat, null);
  assert.equal(r.chatExists, false);
  assert.equal(r.kept, null);
  assert.match(r.keptFile, /Ya estaba/);
  assert.match(r.stale, /el granate de Mazda/);
  assert.doesNotMatch(r.staleFile, /de otro intento/);
  assert.match(r.hermes, /newsletters\/2026\/siroko\/hermes\/2026-10-05-abc123\/notas\.md/);
  assert.match(r.hermes, /# Autoauditoría/);
  assert.match(r.hermes, /<<<NOTAS>>>/);
  assert.match(r.revision, /newsletters\/2026\/siroko\/hermes\/2026-10-05-abc123\/notas\.md/);
  assert.match(r.revision, /## Cambios/);
  assert.match(r.mobilePrompt, /## Comprobaciones/);
  assert.equal(r.orderHit, true);
});

test('Revisión visual y nota de calidad: valla, prosa, inglés, texto y títulos', () => {
  const r = run(`
    const fs = require('fs');
    const path = require('path');
    const w = require(${mod('hermes-worker.ts')});
    const j = require(${mod('artJudge.ts')});
    const loose = require(${mod('looseJson.ts')});
    const fx = ${JSON.stringify(FIXTURES)};
    const read = (name) => fs.readFileSync(path.join(fx, name), 'utf8');
    const fenced = read('art-fenced-prose.txt');
    const start = fenced.indexOf('{');
    const end = fenced.lastIndexOf('}');
    let naive = true;
    try { JSON.parse(fenced.slice(start, end + 1)); } catch { naive = false; }
    const prose = w.parseArtReview(fenced);
    const english = w.parseArtReview(read('art-english.txt'));
    const markdown = w.parseArtReview(read('art-markdown.md'));
    const blind = w.parseArtReview('He mirado y no veo nada\\n{"sin_imagen": true}\\n');
    const partial = w.parseArtReview('{"notas":{"peticion":"4"}}');
    const none = w.parseArtReview(read('art-unparseable.txt'));
    const keys = Object.keys(w.ART_CRITERIA);
    const cmp = j.parseArtCompare(read('compare-fenced.txt'), keys);
    const query = w.artReviewQuery(undefined, '# Brief', '<p>Hola</p>', '/tmp/hoja.jpg');
    const compareQuery = j.artCompareQuery(w.ART_CRITERIA, { desktop: { path: '/tmp/d.jpg', width: 10, height: 10 }, mobile: { path: '/tmp/m.jpg', width: 10, height: 10 } }, 'Concepto', 'a', 'b');
    const bad = read('art-unparseable.txt') + '\\nAPI_KEY=supersecretvalue sk-testkey123456';
    const repair = w.artReviewRepairPrompt(bad, ['supersecretvalue']);
    const snippet = loose.redactedSnippet(bad, ['supersecretvalue'], 500);
    let retries = 0;
    const fixed = await loose.parseWithOneRepair(read('art-unparseable.txt'), w.parseArtReview, (text) => w.artReviewRepairPrompt(text, []), async () => { retries++; return fenced; });
    let skipped = 0;
    await loose.parseWithOneRepair(read('art-markdown.md'), w.parseArtReview, () => 'no', async () => { skipped++; return ''; });
    process.stdout.write(JSON.stringify({
      naive, prose, english, markdown, blind, partial, none, cmp, query, compareQuery, repair, snippet, retries, skipped,
      fixed: fixed.value && fixed.value.notas.oscuro, unparsed: fixed.unparsed.length,
    }));
  `);
  assert.equal(r.naive, false);
  assert.equal(r.prose.notas.oscuro, 2);
  assert.equal(r.prose.notas.texto_imagen, 5);
  assert.equal(r.prose.notas.originalidad, 3);
  assert.deepEqual(r.prose.problemas, ['En oscuro el logo desaparece sobre el hero']);
  assert.match(r.prose.mejoras[0], /^originalidad:/);
  assert.equal(r.english.notas.peticion, 5);
  assert.equal(r.english.pruebas.peticion, 'Black Friday en el titular');
  assert.equal(r.english.notas.aire, 4);
  assert.equal(r.english.notas.copy, 4);
  assert.equal(r.english.notas.oscuro, 2);
  assert.equal(r.english.notas.concepto, 3);
  assert.match(r.english.problemas[0], /logo desaparece/);
  assert.match(r.english.mejoras[0], /^spacing:/);
  assert.equal(r.markdown.notas.peticion, 4);
  assert.match(r.markdown.pruebas.peticion, /Black Friday sale/);
  assert.equal(r.markdown.notas.texto_imagen, 5);
  assert.equal(r.markdown.notas.oscuro, 2);
  assert.equal(r.markdown.notas.aire, 4);
  assert.equal(r.markdown.notas.copy, 4);
  assert.deepEqual(r.markdown.defectos, ['I suelta junto al titular: quitarla']);
  assert.match(r.markdown.problemas[0], /logo desaparece/);
  assert.equal(r.blind, null);
  assert.equal(r.partial, null);
  assert.equal(r.none, null);
  assert.equal(r.cmp.criterios.texto_imagen, 'B');
  assert.equal(r.cmp.criterios.aire, 'B');
  assert.equal(r.cmp.criterios.jerarquia, 'A');
  assert.equal(r.cmp.criterios.peticion, 'igual');
  assert.equal(r.cmp.criterios.identidad, 'igual');
  assert.equal(r.cmp.razones.copy, 'el titular nombra el CX-60');
  assert.equal(r.cmp.razones.texto_imagen, 'la foto y el texto coinciden');
  assert.match(r.query, /Esquema JSON obligatorio/);
  assert.match(r.query, /"notas"/);
  assert.match(r.query, /responde SOLO con un JSON/);
  assert.match(r.compareQuery, /Esquema JSON obligatorio/);
  assert.match(r.compareQuery, /"criterios"/);
  assert.doesNotMatch(r.repair, /supersecretvalue/);
  assert.doesNotMatch(r.repair, /sk-testkey123456/);
  assert.match(r.repair, /\[redactado\]/);
  assert.match(r.repair, /He mirado la pieza/);
  assert.match(r.repair, /\{"sin_imagen": true\}/);
  assert.equal(r.snippet.length <= 500, true);
  assert.doesNotMatch(r.snippet, /supersecretvalue/);
  assert.equal(r.retries, 1);
  assert.equal(r.fixed, 2);
  assert.equal(r.unparsed, 1);
  assert.equal(r.skipped, 0);
});

test('Corrección: el log y el encargo nombran la comprobación y su detalle', () => {
  const r = run(`
    const q = require(${mod('qualityCheck.ts')});
    const w = require(${mod('hermes-worker.ts')});
    const report = {
      checkedAt: '2026-10-20T00:00:00.000Z',
      errors: 2,
      warnings: 1,
      checks: [
        { id: 'links', label: 'Enlaces', status: 'error', details: ['https://marca.es/cx-60 responde 404', 'aviso que no se devuelve'], errorCount: 1 },
        { id: 'dark-mode', label: 'Modo oscuro', status: 'error', details: ['Falta el bloque @media (prefers-color-scheme: dark).'], errorCount: 1 },
        { id: 'preheader', label: 'Preheader', status: 'ok', details: ['bien'], errorCount: 0 },
        { id: 'copy', label: 'Copy', status: 'warning', details: ['Muletilla'], errorCount: 0 },
      ],
    };
    const lines = q.checkFailureLines(report);
    const first = w.buildCorrectionMessage({
      outputDir: 'newsletters/2026/mazda/hermes/job',
      brand: 'Mazda',
      report,
      checkCmd: 'npm run check-newsletter -- newsletters/2026/mazda/hermes/job/newsletter.html',
      mobileFix: false,
      continued: false,
    });
    const again = w.buildCorrectionMessage({
      outputDir: 'newsletters/2026/mazda/hermes/job',
      brand: 'Mazda',
      report,
      checkCmd: 'npm run check-newsletter -- newsletters/2026/mazda/hermes/job/newsletter.html',
      mobileFix: false,
      continued: true,
    });
    process.stdout.write(JSON.stringify({ lines, first, again, described: q.describeErrors(report) }));
  `);
  assert.deepEqual(r.lines, [
    'links — Enlaces: https://marca.es/cx-60 responde 404',
    'dark-mode — Modo oscuro: Falta el bloque @media (prefers-color-scheme: dark).',
  ]);
  assert.match(r.first, /links — Enlaces: https:\/\/marca\.es\/cx-60 responde 404/);
  assert.match(r.first, /dark-mode — Modo oscuro: Falta el bloque @media/);
  assert.match(r.first, /un enlace que da 404/);
  assert.doesNotMatch(r.first, /Muletilla/);
  assert.doesNotMatch(r.first, /aviso que no se devuelve/);
  assert.match(r.again, /Siguen estos errores/);
  assert.match(r.again, /links — Enlaces: https:\/\/marca\.es\/cx-60 responde 404/);
  assert.match(r.again, /dark-mode — Modo oscuro/);
  assert.match(r.described, /base-darwin|marca\.es\/cx-60/);
});
