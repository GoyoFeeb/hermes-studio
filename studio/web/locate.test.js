const test = require('node:test');
const assert = require('node:assert/strict');
const { locatorsFor, changeLocators, urlOf } = require('./locate.js');
const { compareVersions } = require('./compare.js');

// Los detalles son los textos reales de studio/worker/qualityCheck.ts.

test('urlOf: roto y no verificable (Inglesina 404, Prozis 429)', () => {
  assert.equal(urlOf('https://www.inglesina.com/es-es/products/base-darwin-360-isize → HTTP 404'), 'https://www.inglesina.com/es-es/products/base-darwin-360-isize');
  assert.equal(urlOf('No verificable: https://www.prozis.com/es/es → HTTP 429 (la web bloquea peticiones automáticas)'), 'https://www.prozis.com/es/es');
  assert.equal(urlOf('12 comprobados.'), null);
});

test('locatorsFor: enlaces e imágenes por URL; el resumen "N comprobados" no lleva a ningún sitio', () => {
  assert.deepEqual(
    locatorsFor({ id: 'links', details: ['https://a.es/x → HTTP 404', '3 comprobados.'] }),
    [{ kind: 'href', url: 'https://a.es/x' }, null]
  );
  assert.deepEqual(locatorsFor({ id: 'images', details: ['https://c.es/i.png → el dominio no existe'] }), [{ kind: 'src', url: 'https://c.es/i.png' }]);
  assert.deepEqual(locatorsFor({ id: 'local-images', details: ['La imagen img/hero.png no existe en el Mac.'] }), [{ kind: 'src', url: 'img/hero.png' }]);
});

test('locatorsFor: sin alt y sin width se cuentan por orden; flex; los errores generales no', () => {
  assert.deepEqual(
    locatorsFor({ id: 'alt', details: ['Imagen sin atributo alt: <img src="a">', 'Imagen sin atributo alt: <img src="b">'] }),
    [{ kind: 'nth', selector: 'img:not([alt])', n: 0 }, { kind: 'nth', selector: 'img:not([alt])', n: 1 }]
  );
  assert.deepEqual(
    locatorsFor({
      id: 'outlook',
      details: [
        'No hay ajustes para Outlook de escritorio: falta un bloque <!--[if mso]> (…)',
        '1 elemento(s) con display:flex/grid en línea: Outlook no los entiende; usa tablas. P. ej.: <div style="display:flex">',
        'Imagen sin atributo width (Outlook la pinta a su tamaño real): <img src="a">',
        'Imagen sin atributo width (Outlook la pinta a su tamaño real): <img src="b">',
        'Tipografía sin alternativa genérica ("Inter"): …',
      ],
    }),
    [null, { kind: 'flex' }, { kind: 'nth', selector: 'img:not([width])', n: 0 }, { kind: 'nth', selector: 'img:not([width])', n: 1 }, null]
  );
  assert.deepEqual(locatorsFor({ id: 'dark-mode', details: ['Falta declarar el modo oscuro…'] }), [null]);
  assert.deepEqual(locatorsFor({ id: 'empty-links', details: ['Enlace vacío o a "#": <a href="#">'] }), [{ kind: 'empty-link', n: 0 }]);
});

test('locatorsFor: claim por su contexto; móvil por medición', () => {
  const [claim] = locatorsFor({
    id: 'claims',
    details: ['«garantizado» (alto): …La moto más ágil. Potencia garantizada en cualquier   terreno y… — Usa una cifra con fuente.'],
  });
  assert.deepEqual(claim, { kind: 'text', text: 'La moto más ágil. Potencia garantizada en cualquier terreno y' });
  assert.deepEqual(
    locatorsFor({ id: 'mobile', details: ['A 375 px la página mide 415 px de ancho. Se salen: td.hero (415 px)'] }),
    [{ kind: 'overflow' }]
  );
});

test('changeLocators: lo añadido en la versión nueva y lo quitado en la anterior (revisión real de Nike)', () => {
  const before = '<body><p>El aire que te impulsa.</p><img src="https://x/AIR+ZOOM.png"><a href="https://nike.com/a">Ver</a></body>';
  const after = '<body><p>El aire que te lleva.</p><img src="detalle-air-zoom-cropped.png"><a href="https://nike.com/a">Ver</a></body>';
  const diff = compareVersions(before, after);
  assert.deepEqual(changeLocators(diff, 'after'), [
    { kind: 'text', text: 'El aire que te lleva.' },
    { kind: 'src', url: 'detalle-air-zoom-cropped.png' },
  ]);
  assert.deepEqual(changeLocators(diff, 'before'), [
    { kind: 'text', text: 'El aire que te impulsa.' },
    { kind: 'src', url: 'https://x/AIR+ZOOM.png' },
  ]);
});
