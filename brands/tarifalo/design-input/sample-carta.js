// Muestreo objetivo de colores del render 600px: botón, navy, hoja blanca.
// Uso: node sample-carta.js
const sharp = require('sharp');
const path = require('path');

const PNG = '/Users/javifeebbo/Desktop/newsletter-system-reutilizable/sistema-final/brands/tarifalo/design-input/preview-carta-2026-08-600.png';

const near = (r, g, b, t, o) => Math.abs(r - t[0]) <= o && Math.abs(g - t[1]) <= o && Math.abs(b - t[2]) <= o;

(async () => {
  const { data, info } = await sharp(PNG).raw().toBuffer({ resolveWithObject: true });
  const w = info.width, h = info.height;
  const px = (x, y) => { const i = (y * w + x) * 4; return [data[i], data[i + 1], data[i + 2]]; };

  const ORANGE = [247, 127, 0];   // #F77F00
  const NAVY_A = [0, 48, 73];     // #003049
  const NAVY_B = [0, 32, 53];     // #002035
  const CREAM = [252, 237, 212];  // #FCEDD4

  // Filas con muchos píxeles naranjas -> botón
  let btnRows = [];
  for (let y = 0; y < h; y++) {
    let c = 0;
    for (let x = 0; x < w; x += 4) { const p = px(x, y); if (near(...p, ORANGE, 30)) c++; }
    if (c > w * 0.15) btnRows.push(y);
  }
  console.log('Botón naranja: filas', btnRows.length ? `${btnRows[0]}..${btnRows[btnRows.length - 1]}` : 'NO ENCONTRADO');

  if (btnRows.length) {
    const midY = Math.round((btnRows[0] + btnRows[btnRows.length - 1]) / 2);
    // Muestrear dentro del botón: si el texto es #002035 oscuro, habrá píxeles oscuros cerca del centro
    let dark = 0, white = 0, total = 0;
    for (let x = Math.round(w * 0.2); x < w * 0.8; x++) {
      const p = px(x, midY);
      if (near(...p, [0, 32, 53], 40)) dark++;
      if (near(...p, [255, 255, 255], 20)) white++;
      total++;
    }
    console.log(`Dentro del botón (y=${midY}): oscuro=${dark} (${(100 * dark / total).toFixed(1)}%) blanco=${white} (${(100 * white / total).toFixed(1)}%)`);
  }

  // Filas navy (firma) después del botón
  let navyRows = [];
  for (let y = btnRows.length ? btnRows[btnRows.length - 1] : 0; y < h; y++) {
    const p = px(Math.round(w / 2), y);
    if (near(...p, NAVY_A, 25) || near(...p, NAVY_B, 25)) navyRows.push(y);
  }
  console.log('Firma navy: filas', navyRows.length ? `${navyRows[0]}..${navyRows[navyRows.length - 1]}` : 'NO ENCONTRADA');
  if (navyRows.length) {
    const yTop = navyRows[0], yBot = navyRows[navyRows.length - 1];
    console.log('  color top  (x=300):', px(300, yTop + 2).join(','));
    console.log('  color bot  (x=300):', px(300, yBot - 2).join(','));
    // Buscar crema del logo dentro de la banda navy
    let creamFound = 0;
    for (let y = yTop; y <= yBot; y++) for (let x = 0; x < w; x += 2) { const p = px(x, y); if (near(...p, CREAM, 20)) creamFound++; }
    console.log('  píxeles crema logo:', creamFound);
  }

  // Hoja blanca (zona de texto)
  console.log('Hoja blanca (x=300, y=1/4):', px(300, Math.round(h * 0.25)).join(','));
})();
