// Find the most saturated lime/yellow pixels (the real "glow" accent) in the PLATINUM image.
const sharp = require('sharp');
const path = require('path');
const DIR = __dirname;

(async () => {
  const platPath = path.join(DIR, 'product-platinum.jpg');
  const { data, info } = await sharp(platPath).raw().toBuffer({ resolveWithObject: true });
  const scored = []; // {r,g,b,score}
  for (let i = 0; i < data.length; i += info.channels) {
    const r = data[i], g = data[i + 1], b = data[i + 2];
    const score = (g - b) + (g - r); // lime-yellow saturation proxy
    if (score > 60 && g > 140) scored.push({ r, g, b, score });
  }
  scored.sort((a, b) => b.score - a.score);
  const top = scored.slice(0, Math.min(3000, scored.length));
  if (!top.length) { console.log('no glow pixels found'); return; }
  let sr = 0, sg = 0, sb = 0;
  for (const p of top) { sr += p.r; sg += p.g; sb += p.b; }
  const n = top.length;
  const hex = '#' + [Math.round(sr / n), Math.round(sg / n), Math.round(sb / n)].map((v) => v.toString(16).padStart(2, '0')).join('').toUpperCase();
  console.log('glow pixels found:', n, 'of', data.length / info.channels);
  console.log('GLOW_HEX avg of top-3000:', hex);
  // also print the single most saturated pixel
  const m = top[0];
  console.log('most saturated pixel:', m.r, m.g, m.b, 'score', m.score);
  const hexM = '#' + [m.r, m.g, m.b].map((v) => v.toString(16).padStart(2, '0')).join('').toUpperCase();
  console.log('GLOW_HEX max:', hexM);
})().catch((e) => { console.error(e); process.exit(1); });
