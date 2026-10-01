const test = require('node:test');
const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..', '..');
const TSX_BIN = path.join(ROOT, 'node_modules', '.bin', 'tsx');

// Editar enlaces e imágenes sin Hermes (2026-10-01). Mismo patrón tsx que rateLimit.test.js.
function run(code) {
  const wrapped = `
    const m = await import(${JSON.stringify(path.join(__dirname, 'textEdit.ts'))});
    const { applyTextEdits } = m.default ?? m;
    const tryIt = (fn) => { try { return fn(); } catch (e) { return 'ERR: ' + e.message; } };
    ${code}
  `;
  return JSON.parse(execFileSync(TSX_BIN, ['--input-type=module', '-e', wrapped], { encoding: 'utf8' }).trim());
}

const HTML = `<!doctype html><html><head><title>Hola</title></head><body>
<p><a href="https://x.com/rota">Ver</a> y <a href="https://x.com/rota" style="color:red">otra vez</a></p>
<!--[if mso]><v:roundrect href="https://x.com/rota" style="width:200px"><center>Comprar</center></v:roundrect><![endif]-->
<a href="https://x.com/ok">Bien</a>
<img src="https://cdn.x.com/a.png" width="600" alt="A"><img src="https://cdn.x.com/b.png" alt="B">
</body></html>`;

test('cambiar un destino cambia todos sus enlaces y el VML de Outlook, sin tocar el resto', () => {
  const out = run(`
    const html = ${JSON.stringify(HTML)};
    const r = applyTextEdits(html, [], null, [], [{ before: 'https://x.com/rota', after: 'https://x.com/nueva?utm=1&a=2' }]);
    console.log(JSON.stringify({
      nuevos: (r.html.match(/https:\\/\\/x\\.com\\/nueva\\?utm=1&amp;a=2/g) || []).length,
      viejos: (r.html.match(/x\\.com\\/rota/g) || []).length,
      intacto: r.html.includes('href="https://x.com/ok"') && r.html.includes('style="color:red"'),
      outlook: r.outlookCopies,
      malo: tryIt(() => applyTextEdits(html, [], null, [], [{ before: 'https://x.com/rota', after: 'javascript:alert(1)' }])),
      noEsta: tryIt(() => applyTextEdits(html, [], null, [], [{ before: 'https://x.com/no', after: 'https://x.com/y' }])),
    }));
  `);
  assert.equal(out.nuevos, 3);
  assert.equal(out.viejos, 0);
  assert.equal(out.intacto, true);
  assert.equal(out.outlook, 1);
  assert.match(out.malo, /^ERR: .*no es un destino válido/);
  assert.match(out.noEsta, /^ERR: .*ya no está en la pieza/);
});

test('cambiar una imagen: solo su src, https o archivo subido; comprueba la de antes', () => {
  const out = run(`
    const html = ${JSON.stringify(HTML)};
    const r = applyTextEdits(html, [], null, [], [], [{ index: 1, before: 'https://cdn.x.com/b.png', after: 'https://cdn.x.com/c.png' }]);
    const d = applyTextEdits(html, [], null, [], [], [{ index: 0, before: 'https://cdn.x.com/a.png', after: 'data:image/png;base64,iVBORw0KGgo=' }]);
    console.log(JSON.stringify({
      cambiada: r.html.includes('<img src="https://cdn.x.com/c.png" alt="B">') && r.html.includes('src="https://cdn.x.com/a.png" width="600"'),
      subida: d.html.includes('src="data:image/png;base64,iVBORw0KGgo=" width="600"'),
      http: tryIt(() => applyTextEdits(html, [], null, [], [], [{ index: 1, before: 'https://cdn.x.com/b.png', after: 'http://cdn.x.com/c.png' }])),
      otra: tryIt(() => applyTextEdits(html, [], null, [], [], [{ index: 1, before: 'https://cdn.x.com/a.png', after: 'https://cdn.x.com/c.png' }])),
    }));
  `);
  assert.equal(out.cambiada, true);
  assert.equal(out.subida, true);
  assert.match(out.http, /^ERR: .*https/);
  assert.match(out.otra, /^ERR: .*no coincide/);
});
