const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('path');
const R = require('./results.js');

const page = {
  total: 3,
  offset: 0,
  limit: 1,
  prevCursor: null,
  nextCursor: 'b2Zmc2V0OjE',
  prevJob: null,
  nextJob: 'mid444-dddd',
  items: [
    {
      id: 'new333-cccc',
      createdAt: '2026-10-21T09:00:00.000Z',
      finishedAt: '2026-10-21T09:16:00.000Z',
      clientName: 'Novo Resort Deluxe',
      campaignName: 'Últimos días',
      title: null,
      clickupUrl: 'https://app.clickup.com/t/abc1234',
      requesterName: 'Goyo',
      durationSec: 900,
      art: {
        pct: 80,
        score: 40,
        max: 50,
        criteria: [
          { id: 'peticion', label: 'Petición', score: 4 },
          { id: 'aire', label: 'Aire', score: 5 },
        ],
      },
      quality: {
        errors: 1,
        warnings: 0,
        checks: [{ id: 'links', label: 'Enlaces', status: 'error', errorCount: 1 }],
      },
      improve: {
        initial: '40/50',
        final: '48/50',
        passCount: 2,
        reached: false,
        belowMax: ['Concepto', 'Originalidad'],
        qcErrors: 0,
        durationSec: 180,
        passes: [
          {
            n: 1,
            before: '40/50',
            after: '46/50',
            kept: true,
            reason: 'se queda: la nota sube',
            durationSec: 90,
            changed: ['Sube el concepto'],
            criteria: [{ id: 'concepto', label: 'Concepto', before: 3, after: 4 }],
          },
        ],
      },
      versions: {
        a: {
          label: 'A',
          preview: '/api/jobs/new333-cccc/result',
          art: { pct: 80, score: 40, max: 50, criteria: [{ id: 'peticion', label: 'Petición', score: 4 }] },
          quality: { errors: 1, warnings: 0, checks: [{ id: 'links', label: 'Enlaces', status: 'error', errorCount: 1 }] },
        },
        b: {
          label: 'B',
          preview: '/api/jobs/new333-cccc/channel-b',
          art: null,
          quality: { errors: 0, warnings: 1, checks: [{ id: 'size', label: 'Peso', status: 'warning', errorCount: 0 }] },
          improve: {
            initial: '40/50',
            final: '44/50',
            passCount: 1,
            reached: false,
            belowMax: ['Originalidad'],
            qcErrors: 1,
            durationSec: 60,
            passes: [
              {
                n: 1,
                before: '40/50',
                after: '44/50',
                kept: true,
                reason: 'se queda: la nota sube',
                durationSec: 60,
                changed: ['Menos errores'],
                criteria: [{ id: 'originalidad', label: 'Originalidad', before: 3, after: 4 }],
              },
            ],
          },
        },
      },
    },
  ],
};

test('pinta una pieza con sus datos, las notas y las dos versiones', () => {
  assert.equal(R.positionLabel(page), '1 de 3');
  assert.equal(R.positionLabel({ total: 0, offset: 0 }), '0 de 0');
  assert.equal(R.jobUrl('new333-cccc'), '?results=1&job=new333-cccc');
  assert.equal(R.formatDuration(900), '15:00');
  const html = R.render(page);
  assert.match(html, /Novo Resort Deluxe/);
  assert.match(html, /Últimos días/);
  assert.match(html, /https:\/\/app\.clickup\.com\/t\/abc1234/);
  assert.match(html, /Goyo/);
  assert.match(html, /15:00/);
  assert.match(html, /40\/50/);
  assert.match(html, /Petición/);
  assert.match(html, /Enlaces/);
  assert.match(html, /Error/);
  assert.match(html, /Versión A/);
  assert.match(html, /Versión B/);
  assert.match(html, /\/api\/jobs\/new333-cccc\/result/);
  assert.match(html, /\/api\/jobs\/new333-cccc\/channel-b/);
  assert.match(html, /Peso/);
  assert.match(html, /Iteraciones de mejora/);
  assert.match(html, /40\/50 → 48\/50/);
  assert.match(html, /Concepto: 3\/5 → 4\/5/);
  assert.match(html, /Sube el concepto/);
  assert.match(html, /Siguen por debajo: Concepto, Originalidad/);
  assert.match(html, /40\/50 → 44\/50/);
  assert.match(html, /\?job=new333-cccc/);
  assert.match(html, /Tiempo · Tokens · Coste/);
  assert.match(html, /sin datos/);
  assert.match(R.render({ total: 0, offset: 0, items: [] }), /Aún no hay piezas terminadas/);
  const file = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
  const app = fs.readFileSync(path.join(__dirname, 'app.js'), 'utf8');
  assert.match(file, /id="usage-card"/);
  assert.match(file, /usageCard\.js/);
  assert.match(app, /renderUsageCard/);
  assert.match(file, /id="view-results"/);
  assert.match(file, />Anterior</);
  assert.match(file, />Siguiente</);
  assert.match(file, />Resultados</);
  assert.match(app, /\/api\/results\?/);
  assert.match(app, /params\.has\('results'\)/);
});
