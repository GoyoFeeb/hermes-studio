const test = require('node:test');
const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', '..');
const TSX_BIN = path.join(ROOT, 'node_modules', '.bin', 'tsx');

function run(code) {
  const wrapped = `
    const path = require('path');
    const fs = require('fs');
    const channel = require(${JSON.stringify(path.join(__dirname, 'channelB.ts'))});
    const store = require(${JSON.stringify(path.join(__dirname, 'store.ts'))});
    const paths = require(${JSON.stringify(path.join(__dirname, 'paths.ts'))});
    const { parseChannelBBody, bearerMatches, attachChannelB, readChannelBHtml, readChannelBText, ChannelBInputError } = channel;
    const { createJob, getJob } = store;
    const { JOBS_DIR, ROOT } = paths;
    (async () => {
      ${code}
    })().catch((err) => {
      console.error(err && err.stack ? err.stack : err);
      process.exit(1);
    });
  `;
  return JSON.parse(execFileSync(TSX_BIN, ['-e', wrapped], { cwd: ROOT, encoding: 'utf8' }).trim());
}

const PNG = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';

test('token de servicio: solo el bearer exacto, y el cuerpo malo se rechaza antes de guardar', () => {
  const out = run(`
    const bad = (body) => { try { parseChannelBBody(body); return ''; } catch (e) { return e instanceof ChannelBInputError ? e.message : 'otro'; } };
    console.log(JSON.stringify({
      empty: bearerMatches(undefined, ''),
      wrong: bearerMatches('Bearer otro', 'secreto-de-prueba'),
      short: bearerMatches('Bearer secreto', 'secreto-de-prueba'),
      ok: bearerMatches('Bearer secreto-de-prueba', 'secreto-de-prueba'),
      basic: bearerMatches('Basic secreto-de-prueba', 'secreto-de-prueba'),
      noHtml: bad({}),
      noTag: bad({ html: '<p>sin documento</p>' }),
      channel: bad({ html: '<html></html>', channel: 'Creas IT' }),
      review: bad({ html: '<html></html>', review: Object.fromEntries(Array.from({ length: 20 }, (_, i) => ['k' + i, 'x'.repeat(2000)])) }),
    }));
  `);
  assert.equal(out.empty, false);
  assert.equal(out.wrong, false);
  assert.equal(out.short, false);
  assert.equal(out.ok, true);
  assert.equal(out.basic, false);
  assert.match(out.noHtml, /HTML/);
  assert.match(out.noTag, /<html>/);
  assert.match(out.channel, /canal/);
  assert.match(out.review, /demasiado grande/);
});

test('adjuntar B publica las imágenes, pasa el revisor y no cambia el estado de Hermes', () => {
  const out = run(`
    const html = ${JSON.stringify(`<!doctype html><html><head><title>Asunto del HTML</title>
<meta name="color-scheme" content="light dark">
<style>@media (prefers-color-scheme: dark){body{background:#111;color:#fff}}</style></head><body>
<div style="display:none;max-height:0;overflow:hidden">Preheader oculto de la versión B de prueba</div>
<img alt="Logo" width="1" height="1" src="data:image/png;base64,${PNG}">
<p>Texto vivo de la pieza.</p>
<a href="https://example.com/oferta">Ver la oferta</a>
<a href="{{unsubscribe_url}}">Darse de baja</a>
<!--[if mso]><p>outlook</p><![endif]-->
<p>Recibes este email porque estás suscrito. Marca Ejemplo, S.L. Calle Mayor 1, 28013 Madrid.</p>
</body></html>`)} ;
    const job = createJob({
      mode: 'standalone',
      clientSlug: 'zz-channel-b-test',
      clientName: 'ZZ Channel B',
      brandMode: 'new',
      briefText: 'Brief de prueba para la versión B.',
      imageMode: 'official',
    });
    const fetcher = async () => ({ status: 200, body: null });
    let report = { id: job.id };
    try {
      const updated = await attachChannelB(job, {
        html,
        text: 'Versión en texto plano.',
        subject: 'Asunto pedido por el canal',
        preheader: 'Preheader pedido por el canal',
        author: 'Creas IT',
        channel: 'creas-it',
        review: { origen: 'bot', nota: 'revisión externa' },
      }, { fetcher });
      const again = await attachChannelB(getJob(job.id), { html, author: 'Creas IT', channel: 'creas-it', subject: 'Segunda vez' }, { fetcher });
      const disk = readChannelBHtml(again);
      const text = readChannelBText(updated);
      report = {
        id: job.id,
        status: again.status,
        subject: again.channelB.subject,
        preheader: updated.channelB.preheader,
        preheaderAgain: again.channelB.preheader,
        bytes: again.channelB.bytes,
        hasText: updated.channelB.hasText,
        text,
        published: !!disk && !disk.includes('data:image') && disk.includes('/assets/'),
        checks: (again.channelB.quality.checks || []).map((c) => c.id),
        errors: again.channelB.quality.errors,
        review: again.channelB.externalReview || null,
        out: again.channelB.resultRelPath,
      };
    } finally {
      fs.rmSync(path.join(JOBS_DIR, job.id + '.json'), { force: true });
      fs.rmSync(path.join(JOBS_DIR, job.id + '.events.ndjson'), { force: true });
      fs.rmSync(path.join(ROOT, 'newsletters', job.createdAt.slice(0, 4), 'zz-channel-b-test'), { recursive: true, force: true });
      fs.rmSync(path.join(ROOT, 'brands', 'zz-channel-b-test'), { recursive: true, force: true });
    }
    console.log(JSON.stringify(report));
  `);
  assert.equal(out.status, 'queued');
  assert.equal(out.subject, 'Segunda vez');
  assert.equal(out.preheader, 'Preheader pedido por el canal');
  assert.equal(out.preheaderAgain, 'Preheader oculto de la versión B de prueba');
  assert.equal(out.published, true);
  assert.ok(out.bytes > 0);
  assert.equal(out.hasText, true);
  assert.match(out.text, /texto plano/);
  assert.equal(out.review, null);
  assert.ok(out.checks.includes('preheader'));
  assert.ok(out.checks.includes('links'));
  assert.equal(typeof out.errors, 'number');
});
