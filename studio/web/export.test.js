const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { prepare, withUtm, defaultCampaign } = require('./export.js');

// Pieza real (Nike Pegasus 42): enlaces con &amp;, botones VML de Outlook y {{unsubscribe_url}}.
const NIKE = fs.readFileSync(path.join(__dirname, '..', 'server', 'fixtures', 'nike-pegasus-42.html'), 'utf8');

test('Mailchimp: variables de baja, ver online y preferencias; el resto de la pieza igual', () => {
  const html = '<a href="{{unsubscribe_url}}">Baja</a> <a href="{{ view_url }}">Ver</a> <a href="{{preferences_url}}">Pref</a>';
  const r = prepare(html, { platform: 'mailchimp' });
  assert.equal(r.html, '<a href="*|UNSUB|*">Baja</a> <a href="*|ARCHIVE|*">Ver</a> <a href="*|UPDATE_PROFILE|*">Pref</a>');
  assert.deepEqual(r.replaced, { unsubscribe_url: 1, view_url: 1, preferences_url: 1 });
  assert.deepEqual(r.missing, []);
});

test('Klaviyo no tiene equivalente seguro para "ver online": se deja y se avisa', () => {
  const r = prepare('<a href="{{view_url}}">Ver</a><a href="{{unsubscribe_url}}">Baja</a>', { platform: 'klaviyo' });
  assert.match(r.html, /\{\{view_url\}\}/);
  assert.match(r.html, /\{% unsubscribe_url %\}/);
  assert.deepEqual(r.missing, ['view_url']);
});

test('Genérico sin UTM: el HTML sale idéntico', () => {
  assert.equal(prepare(NIKE, { platform: 'generic' }).html, NIKE);
});

test('UTM en todos los enlaces de la pieza real, también en los botones de Outlook; nada más cambia', () => {
  const utm = { source: 'newsletter', medium: 'email', campaign: 'nike-2026-09-28' };
  const r = prepare(NIKE, { platform: 'brevo', utm });
  const hrefs = (h) => [...h.matchAll(/<(a|v:roundrect)\b[^>]*?\bhref="([^"]*)"/gi)].map((m) => [m[1].toLowerCase(), m[2]]);
  const before = hrefs(NIKE).filter(([, u]) => /^https?:/.test(u));
  const after = hrefs(r.html).filter(([, u]) => /^https?:/.test(u));
  assert.equal(after.length, before.length);
  assert.equal(r.utmLinks, before.length);
  assert.ok(after.some(([tag]) => tag === 'v:roundrect'), 'los botones VML llevan UTM');
  for (const [, u] of after) assert.match(u, /[?&]utm_source=newsletter&amp;utm_medium=email&amp;utm_campaign=nike-2026-09-28/);
  assert.match(r.html, /href="\{\{ unsubscribe \}\}"/); // la baja no lleva UTM
  const strip = (h) => h.replace(/href="[^"]*"/g, 'href=""');
  assert.equal(strip(r.html), strip(NIKE));
});

test('withUtm: respeta los UTM que ya tenga, conserva la consulta y el ancla', () => {
  assert.equal(withUtm('https://a.es/x?utm_source=marca&id=3#top', { source: 'newsletter', medium: 'email' }), 'https://a.es/x?utm_source=marca&id=3&utm_medium=email#top');
  assert.equal(withUtm('https://a.es/', { campaign: 'año nuevo' }), 'https://a.es/?utm_campaign=a%C3%B1o%20nuevo');
  assert.equal(withUtm('mailto:x@y.es', { source: 's' }), 'mailto:x@y.es');
  assert.equal(withUtm('https://a.es/?q=%E0%A4%A', { source: 's' }), 'https://a.es/?q=%E0%A4%A&utm_source=s'); // no rompe
});

test('una URL con &amp; en el HTML se decodifica para añadir y se vuelve a escribir con &amp;', () => {
  const r = prepare('<a href="https://a.es/p?a=1&amp;b=2">x</a>', { utm: { source: 'nl' } });
  assert.equal(r.html, '<a href="https://a.es/p?a=1&amp;b=2&amp;utm_source=nl">x</a>');
});

test('defaultCampaign: marca sin acentos y fecha', () => {
  assert.equal(defaultCampaign('El Corte Inglés', '2026-09-28T15:00:00Z'), 'el-corte-ingles-2026-09-28');
});
