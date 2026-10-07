// Post-proceso The Open Ledger: forzar paleta exacta de Tarífalo sobre la imagen IA.
// 1) Flood-fill del fondo desde los bordes -> #003049 exacto (rgb 0,48,73)
// 2) Tarjeta azul claro (fuera de paleta) -> #004568 exacto (rgb 0,69,104)
// Uso: node enforce-palette.js
const sharp = require('/Users/javifeebbo/Desktop/newsletter-system-reutilizable/sistema-final/node_modules/sharp');
const path = require('path');

const DIR = '/Users/javifeebbo/Desktop/newsletter-system-reutilizable/sistema-final/brands/tarifalo/design-input';
const SRC = path.join(DIR, 'hero-balance-original.png');
const OUT = path.join(DIR, 'hero-balance-flat.png');

const NAVY = [0, 48, 73];      // #003049
const CARD = [0, 69, 104];     // #004568

const dist = (a, b) => {
  const dr = a[0] - b[0], dg = a[1] - b[1], db = a[2] - b[2];
  return Math.sqrt(dr * dr + dg * dg + db * db);
};

(async () => {
  const meta = await sharp(SRC).metadata();
  const W = meta.width, H = meta.height;
  const { data, info } = await sharp(SRC).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const ch = info.channels; // RGBA
  const pxAt = (i) => [data[i], data[i + 1], data[i + 2]];

  // Color medio de las 4 esquinas (el fondo)
  const corners = [
    pxAt(0), pxAt((W - 1) * ch),
    pxAt((H - 1) * W * ch), pxAt(((H - 1) * W + W - 1) * ch)
  ];
  const bg = [
    Math.round(corners.reduce((s, c) => s + c[0], 0) / 4),
    Math.round(corners.reduce((s, c) => s + c[1], 0) / 4),
    Math.round(corners.reduce((s, c) => s + c[2], 0) / 4)
  ];
  console.log('Fondo detectado (media esquinas):', bg);

  const THRESH = 30; // tolerancia flood-fill
  const visited = new Uint8Array(W * H);
  const queue = [];
  const push = (x, y) => {
    if (x < 0 || y < 0 || x >= W || y >= H) return;
    const i = y * W + x;
    if (visited[i]) return;
    const p = pxAt(i * ch);
    if (dist(p, bg) > THRESH) return;
    visited[i] = 1;
    queue.push(i);
  };
  // Sembrar los 4 bordes
  for (let x = 0; x < W; x++) { push(x, 0); push(x, H - 1); }
  for (let y = 0; y < H; y++) { push(0, y); push(W - 1, y); }
  // BFS
  let head = 0;
  while (head < queue.length) {
    const i = queue[head++];
    const x = i % W, y = (i / W) | 0;
    push(x - 1, y); push(x + 1, y); push(x, y - 1); push(x, y + 1);
  }
  console.log('Fondo repintado:', queue.length, 'de', W * H, 'pixeles');
  for (const i of queue) {
    data[i * ch] = NAVY[0]; data[i * ch + 1] = NAVY[1]; data[i * ch + 2] = NAVY[2];
  }

  // Recolor tarjeta azul claro (#B8D8E8 aprox) -> #004568. Solo píxeles no repintados.
  const LIGHT_BLUE = [184, 216, 232];
  let cardPixels = 0;
  for (let i = 0; i < W * H; i++) {
    if (visited[i]) continue;
    const p = pxAt(i * ch);
    // azul claro: B alto, R < G < B, B-R > 40
    if (p[2] - p[0] > 40 && p[1] >= p[0] && dist(p, LIGHT_BLUE) < 90) {
      data[i * ch] = CARD[0]; data[i * ch + 1] = CARD[1]; data[i * ch + 2] = CARD[2];
      cardPixels++;
    }
  }
  console.log('Tarjeta recoloreada a #004568:', cardPixels, 'pixeles');

  await sharp(data, { raw: { width: W, height: H, channels: ch } }).png().toFile(OUT);
  console.log('OK ->', OUT, `${W}x${H}`);
})();
