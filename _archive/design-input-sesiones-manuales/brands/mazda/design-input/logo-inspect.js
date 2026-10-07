const sharp = require('/Users/javifeebbo/Desktop/newsletter-system-reutilizable/sistema-final/node_modules/sharp');
const path = process.argv[2];

(async () => {
  const { data, info } = await sharp(path).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const w = info.width, h = info.height, ch = info.channels; // 4
  const px = (x, y) => { const i = (y * w + x) * ch; return { r: data[i], g: data[i+1], b: data[i+2], a: data[i+3] }; };
  // corners
  console.log('size', w, 'x', h);
  console.log('corner TL', JSON.stringify(px(0,0)));
  console.log('corner TR', JSON.stringify(px(w-1,0)));
  console.log('corner BL', JSON.stringify(px(0,h-1)));
  console.log('corner BR', JSON.stringify(px(w-1,h-1)));
  // bounding box of content with alpha > 10
  let minX = w, minY = h, maxX = -1, maxY = -1;
  const opaque = [];
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const p = px(x, y);
      if (p.a > 10) {
        if (x < minX) minX = x; if (x > maxX) maxX = x;
        if (y < minY) minY = y; if (y > maxY) maxY = y;
        if (opaque.length < 200000) opaque.push(p);
      }
    }
  }
  console.log('bbox', { minX, minY, maxX, maxY, w, h });
  // average color of content (alpha>200) weighted
  let sr=0,sg=0,sb=0,n=0;
  for (let y=0;y<h;y++) for (let x=0;x<w;x++){ const p=px(x,y); if (p.a>200){ sr+=p.r; sg+=p.g; sb+=p.b; n++; } }
  console.log('content avg rgb (a>200):', Math.round(sr/n), Math.round(sg/n), Math.round(sb/n), 'pixels', n);
  // sample center of logo area
  const cy = Math.round((minY+maxY)/2);
  const samples = [];
  for (let x = Math.round(w*0.3); x <= Math.round(w*0.7); x += 20) { const p = px(x, cy); if (p.a > 50) samples.push({x, ...p}); }
  console.log('midline samples (a>50):', JSON.stringify(samples.slice(0, 10)));
})();
