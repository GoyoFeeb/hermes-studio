// sample-gti-red.js — muestrea el rojo GTI de las imágenes oficiales (franja roja, pinzas, ambiente)
const fs = require('fs');
const zlib = require('zlib');

function parsePNG(path) {
  const buf = fs.readFileSync(path);
  if (buf.readUInt32BE(0) !== 0x89504e47) throw new Error('No es PNG');
  let pos = 8, width = 0, height = 0, bitDepth = 0, colorType = 0;
  const idat = [];
  while (pos < buf.length) {
    const len = buf.readUInt32BE(pos);
    const type = buf.toString('ascii', pos + 4, pos + 8);
    const data = buf.subarray(pos + 8, pos + 8 + len);
    if (type === 'IHDR') { width = data.readUInt32BE(0); height = data.readUInt32BE(4); bitDepth = data[8]; colorType = data[9]; }
    else if (type === 'IDAT') idat.push(data);
    else if (type === 'IEND') break;
    pos += 12 + len;
  }
  const raw = zlib.inflateSync(Buffer.concat(idat));
  const channels = colorType === 6 ? 4 : colorType === 2 ? 3 : 0;
  if (!channels) throw new Error('colorType: ' + colorType);
  const bpp = (bitDepth / 8) * channels;
  const stride = width * bpp;
  const rows = [];
  let p = 0;
  for (let y = 0; y < height; y++) {
    const filter = raw[p++];
    const row = Buffer.from(raw.subarray(p, p + stride));
    p += stride;
    if (filter === 1) { for (let i = bpp; i < stride; i++) row[i] = (row[i] + row[i - bpp]) & 0xff; }
    else if (filter === 2) { if (y > 0) for (let i = 0; i < stride; i++) row[i] = (row[i] + rows[y - 1][i]) & 0xff; }
    else if (filter === 3) { for (let i = 0; i < stride; i++) { const a = i >= bpp ? row[i - bpp] : 0; const b = y > 0 ? rows[y - 1][i] : 0; row[i] = (row[i] + ((a + b) >> 1)) & 0xff; } }
    else if (filter === 4) { for (let i = 0; i < stride; i++) { const a = i >= bpp ? row[i - bpp] : 0; const b = y > 0 ? rows[y - 1][i] : 0; const c = y > 0 && i >= bpp ? rows[y - 1][i - bpp] : 0; const pa = Math.abs(b - c), pb = Math.abs(a - c), pc = Math.abs(a + b - 2 * c); const pr = pa <= pb && pa <= pc ? a : pb <= pc ? b : c; row[i] = (row[i] + pr) & 0xff; } }
    rows.push(row);
  }
  const px = (x, y) => { const o = x * bpp + y * stride; if (colorType === 6) return [row[o], row[o+1], row[o+2]]; };
  // Acceso por filas
  return {
    width, height,
    getPixel(x, y) { const r = rows[y]; const o = x * bpp; return [r[o], r[o + 1], r[o + 2]]; },
    rows
  };
}

function rgbToHsv(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min;
  let h = 0;
  if (d !== 0) {
    if (max === r) h = ((g - b) / d) % 6;
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h *= 60; if (h < 0) h += 360;
  }
  return [h, max === 0 ? 0 : d / max, max];
}

const img = parsePNG(process.argv[2]);
const sampleEvery = 2; // muestrear cada 2 px
let redPixels = 0, rSum = 0, gSum = 0, bSum = 0;
const hist = {};
for (let y = 0; y < img.height; y += sampleEvery) {
  for (let x = 0; x < img.width; x += sampleEvery) {
    const [r, g, b] = img.getPixel(x, y);
    const [h, s, v] = rgbToHsv(r, g, b);
    // Rojo GTI: hue alrededor de 0 (345-15), saturado y brillante
    if ((h >= 345 || h <= 15) && s > 0.45 && v > 0.5) {
      redPixels++;
      rSum += r; gSum += g; bSum += b;
      const key = `${Math.round(r / 16) * 16},${Math.round(g / 16) * 16},${Math.round(b / 16) * 16}`;
      hist[key] = (hist[key] || 0) + 1;
    }
  }
}
const top = Object.entries(hist).sort((a, b) => b[1] - a[1]).slice(0, 5);
console.log('Archivo:', process.argv[2]);
if (redPixels > 0) {
  const avg = [Math.round(rSum / redPixels), Math.round(gSum / redPixels), Math.round(bSum / redPixels)];
  console.log('Píxeles rojos muestreados:', redPixels);
  console.log('ROJO PROMEDIO: #' + avg.map(v => v.toString(16).padStart(2, '0')).join('').toUpperCase());
  console.log('Clusters más frecuentes:', top.map(([k, v]) => `#${k.replace(/,/g, '')} (${v})`).join(' | '));
} else {
  console.log('No se encontraron píxeles rojos saturados');
}
