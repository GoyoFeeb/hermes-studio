// Depuración: clasifica el píxel central de cada fila y muestra los tramos.
const sharp = require('sharp');

const PNG = '/Users/javifeebbo/Desktop/newsletter-system-reutilizable/sistema-final/brands/tarifalo/design-input/preview-carta-2026-08-600.png';

(async () => {
  const { data, info } = await sharp(PNG).raw().toBuffer({ resolveWithObject: true });
  const w = info.width, h = info.height;
  console.log('Tamaño:', w + 'x' + h, 'canales:', info.channels);
  const px = (x, y) => { const i = (y * w + x) * info.channels; return [data[i], data[i + 1], data[i + 2]]; };

  const near = (p, t, o) => Math.abs(p[0] - t[0]) <= o && Math.abs(p[1] - t[1]) <= o && Math.abs(p[2] - t[2]) <= o;
  const label = (p) => {
    if (near(p, [247, 127, 0], 30)) return 'ORANGE';
    if (near(p, [0, 48, 73], 25) || near(p, [0, 32, 53], 25)) return 'NAVY';
    if (near(p, [255, 255, 255], 8)) return 'WHITE';
    if (near(p, [255, 246, 231], 8)) return 'CREAM';
    return 'OTHER(' + p.join(',') + ')';
  };

  let prev = null, start = 0;
  const runs = [];
  for (let y = 0; y < h; y++) {
    const l = label(px(300, y));
    if (l !== prev) { if (prev !== null) runs.push([prev, start, y - 1]); prev = l; start = y; }
  }
  runs.push([prev, start, h - 1]);
  for (const [l, a, b] of runs) console.log(`${String(a).padStart(5)}..${String(b).padStart(5)}  ${l}`);
})();
