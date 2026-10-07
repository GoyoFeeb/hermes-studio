const sharp = require('/Users/javifeebbo/Desktop/newsletter-system-reutilizable/sistema-final/node_modules/sharp');
const img = process.argv[2];
(async () => {
  const { data, info } = await sharp(img).resize({ width: 800 }).raw().toBuffer({ resolveWithObject: true });
  const w = info.width, h = info.height, ch = info.channels;
  const rows = [];
  for (let y = 0; y < h; y++) {
    let sr=0,sg=0,sb=0,n=0;
    for (let x = 0; x < w; x++) { const i=(y*w+x)*ch; sr+=data[i]; sg+=data[i+1]; sb+=data[i+2]; n++; }
    rows.push({ y, r: sr/n, g: sg/n, b: sb/n });
  }
  // find the row band with the most saturated red (max (r-g)+(r-b) over average row color)
  rows.sort((a,b)=>((b.r-b.g)+(b.r-b.b))-((a.r-a.g)+(a.r-a.b)));
  const top = rows.slice(0, 3);
  console.log('top red rows (avg):', top.map(r => ({ y: r.y, hex: '#'+[Math.round(r.r),Math.round(r.g),Math.round(r.b)].map(v=>v.toString(16).padStart(2,'0')).join('') })));
  // saturation-scored per-pixel over the whole image
  let best = [];
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const i=(y*w+x)*ch; const r=data[i], g=data[i+1], b=data[i+2];
    const score = (r-g)+(r-b);
    if (score > 60) best.push({ r, g, b, score, x, y });
  }
  best.sort((a,b)=>b.score-a.score);
  const topN = best.slice(0, 4000);
  let sr=0,sg=0,sb=0; topN.forEach(p=>{sr+=p.r;sg+=p.g;sb+=p.b;});
  const n = topN.length;
  const hex = '#'+[Math.round(sr/n),Math.round(sg/n),Math.round(sb/n)].map(v=>v.toString(16).padStart(2,'0')).join('');
  console.log('saturated-red avg (top', n, 'pixels):', hex);
  // also bright red (Soul Red highlights)
  const bright = best.filter(p=>p.score>120).slice(0, 2000);
  if (bright.length){ let a=0,b2=0,c=0; bright.forEach(p=>{a+=p.r;b2+=p.g;c+=p.b;}); console.log('intense-red avg:', '#'+[Math.round(a/bright.length),Math.round(b2/bright.length),Math.round(c/bright.length)].map(v=>v.toString(16).padStart(2,'0')).join('')); }
})();
