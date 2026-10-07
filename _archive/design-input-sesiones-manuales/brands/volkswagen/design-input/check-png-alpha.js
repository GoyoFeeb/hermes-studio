// check-png-alpha.js — verifica si un PNG tiene esquinas transparentes (alpha=0) o fondo opaco
const fs = require('fs');
const zlib = require('zlib');

function parsePNG(path) {
  const buf = fs.readFileSync(path);
  if (buf.readUInt32BE(0) !== 0x89504e47) throw new Error('No es PNG');
  let pos = 8;
  let width = 0, height = 0, bitDepth = 0, colorType = 0;
  const idat = [];
  while (pos < buf.length) {
    const len = buf.readUInt32BE(pos);
    const type = buf.toString('ascii', pos + 4, pos + 8);
    const data = buf.subarray(pos + 8, pos + 8 + len);
    if (type === 'IHDR') {
      width = data.readUInt32BE(0);
      height = data.readUInt32BE(4);
      bitDepth = data[8];
      colorType = data[9];
    } else if (type === 'IDAT') {
      idat.push(data);
    } else if (type === 'IEND') {
      break;
    }
    pos += 12 + len;
  }
  const raw = zlib.inflateSync(Buffer.concat(idat));
  const channels = colorType === 6 ? 4 : colorType === 2 ? 3 : colorType === 3 ? 1 : 0;
  if (!channels) throw new Error('colorType no soportado: ' + colorType);
  const bpp = (bitDepth / 8) * channels;
  const stride = width * bpp;
  const rows = [];
  let p = 0;
  for (let y = 0; y < height; y++) {
    const filter = raw[p++];
    const row = Buffer.from(raw.subarray(p, p + stride));
    p += stride;
    // Unfilter básico (solo None/Sub/Up/Prior necesarios para esquinas)
    if (filter === 1) { for (let i = bpp; i < stride; i++) row[i] = (row[i] + row[i - bpp]) & 0xff; }
    else if (filter === 2) { if (y > 0) for (let i = 0; i < stride; i++) row[i] = (row[i] + rows[y - 1][i]) & 0xff; }
    else if (filter === 3) { for (let i = 0; i < stride; i++) { const a = i >= bpp ? row[i - bpp] : 0; const b = y > 0 ? rows[y - 1][i] : 0; row[i] = (row[i] + ((a + b) >> 1)) & 0xff; } }
    else if (filter === 4) { for (let i = 0; i < stride; i++) { const a = i >= bpp ? row[i - bpp] : 0; const b = y > 0 ? rows[y - 1][i] : 0; const c = y > 0 && i >= bpp ? rows[y - 1][i - bpp] : 0; const pa = Math.abs(b - c), pb = Math.abs(a - c), pc = Math.abs(a + b - 2 * c); const pr = pa <= pb && pa <= pc ? a : pb <= pc ? b : c; row[i] = (row[i] + pr) & 0xff; } }
    rows.push(row);
  }
  function px(x, y) {
    const row = rows[y];
    const o = x * bpp;
    if (colorType === 6) return { r: row[o], g: row[o + 1], b: row[o + 2], a: row[o + 3] };
    return { r: row[o], g: row[o + 1], b: row[o + 2], a: 255 };
  }
  const corners = {
    'sup-izq': px(0, 0), 'sup-der': px(width - 1, 0),
    'inf-izq': px(0, height - 1), 'inf-der': px(width - 1, height - 1),
    centro: px(Math.floor(width / 2), Math.floor(height / 2)),
  };
  return { width, height, bitDepth, colorType, corners };
}

const r = parsePNG(process.argv[2]);
console.log(JSON.stringify(r, null, 2));
const minA = Math.min(...Object.values(r.corners).map(c => c.a));
console.log(minA === 0 ? 'RESULTADO: fondo TRANSPARENTE (esquinas alpha=0)' : 'RESULTADO: fondo OPACO (min alpha=' + minA + ')');
