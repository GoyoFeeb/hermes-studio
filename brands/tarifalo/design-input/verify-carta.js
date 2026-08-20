// Verificación final: botón naranja (búsqueda en todo el ancho), color de su texto, firma navy y despedida.
const sharp = require('sharp');

const PNG = '/Users/javifeebbo/Desktop/newsletter-system-reutilizable/sistema-final/brands/tarifalo/design-input/preview-carta-2026-08-600.png';

const near = (p, t, o) => Math.abs(p[0] - t[0]) <= o && Math.abs(p[1] - t[1]) <= o && Math.abs(p[2] - t[2]) <= o;

(async () => {
  const { data, info } = await sharp(PNG).raw().toBuffer({ resolveWithObject: true });
  const w = info.width, h = info.height;
  const px = (x, y) => { const i = (y * w + x) * 3; return [data[i], data[i + 1], data[i + 2]]; };

  // 1) Filas con naranja (umbral bajo: >20 px por fila)
  const btnRows = [];
  for (let y = 0; y < h; y++) {
    let c = 0;
    for (let x = 0; x < w; x++) if (near(px(x, y), [247, 127, 0], 25)) c++;
    if (c > 20) btnRows.push(y);
  }
  console.log('Botón naranja: filas', btnRows.length ? `${btnRows[0]}..${btnRows[btnRows.length - 1]} (${btnRows.length}px alto)` : 'NO ENCONTRADO');

  if (btnRows.length) {
    const y0 = btnRows[0], y1 = btnRows[btnRows.length - 1];
    // rango x del botón
    let xs = new Set();
    for (let y = y0; y <= y1; y++) for (let x = 0; x < w; x++) if (near(px(x, y), [247, 127, 0], 25)) xs.add(x);
    const xMin = Math.min(...xs), xMax = Math.max(...xs);
    console.log(`Botón: x ${xMin}..${xMax} (${xMax - xMin + 1}px ancho), y ${y0}..${y1}`);
    // color de texto dentro del botón
    let dark = 0, white = 0, orange = 0, total = 0;
    for (let y = y0 + 3; y <= y1 - 3; y++) for (let x = xMin + 3; x <= xMax - 3; x++) {
      const p = px(x, y); total++;
      if (near(p, [0, 32, 53], 45)) dark++;
      else if (near(p, [255, 255, 255], 18)) white++;
      else if (near(p, [247, 127, 0], 25)) orange++;
    }
    console.log(`Texto del botón: oscuro=${((100 * dark) / total).toFixed(1)}% blanco=${((100 * white) / total).toFixed(1)}% naranja-fondo=${((100 * orange) / total).toFixed(1)}%`);
  }

  // 2) Despedida "Hasta pronto," — texto navy oscuro sobre blanco entre botón y firma
  const signStart = btnRows.length ? btnRows[btnRows.length - 1] + 1 : 0;
  let signRows = [];
  for (let y = signStart; y < Math.min(h, signStart + 200); y++) {
    for (let x = 0; x < w; x++) {
      const p = px(x, y);
      if (near(p, [0, 48, 73], 40) && p[0] < 60) { signRows.push(y); break; }
    }
  }
  console.log('Despedida "Hasta pronto,": filas', signRows.length ? `${signRows[0]}..${signRows[signRows.length - 1]}` : 'NO ENCONTRADA');

  // 3) Gradiente de la firma navy (columna x=300): top vs bottom del bloque
  const yNavyTop = 1347, yNavyBot = 1593;
  console.log('Firma navy top (x=300):', px(300, yNavyTop + 4).join(','), '| bottom:', px(300, yNavyBot - 4).join(','));
  // logo crema presente
  let cream = 0;
  for (let y = yNavyTop; y <= yNavyBot; y++) for (let x = 0; x < w; x += 2) if (near(px(x, y), [252, 237, 212], 20)) cream++;
  console.log('Píxeles crema (logo):', cream);
})();
