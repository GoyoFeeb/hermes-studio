const sharp = require('/Users/javifeebbo/Desktop/newsletter-system-reutilizable/sistema-final/node_modules/sharp');
(async () => {
  const logo = '/Users/javifeebbo/Desktop/newsletter-system-reutilizable/sistema-final/brands/mazda/design-input/assets/mazda-logo.png';
  const { data, info } = await sharp(logo).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const ch = info.channels;
  // invert RGB where alpha > 0 (white logo -> black logo), keep alpha
  for (let i = 0; i < data.length; i += ch) {
    if (data[i+3] > 10) { data[i] = 0; data[i+1] = 0; data[i+2] = 0; }
  }
  await sharp(data, { raw: { width: info.width, height: info.height, channels: ch } })
    .png().toFile('/Users/javifeebbo/Desktop/newsletter-system-reutilizable/sistema-final/brands/mazda/design-input/assets/mazda-logo-black.png');
  // verify: black version corners still transparent
  const chk = await sharp('/Users/javifeebbo/Desktop/newsletter-system-reutilizable/sistema-final/brands/mazda/design-input/assets/mazda-logo-black.png').ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const c = chk.data; const W = chk.info.width; const H = chk.info.height;
  const at = (x,y) => { const i=(y*W+x)*4; return [c[i],c[i+1],c[i+2],c[i+3]]; };
  console.log('black logo corners:', JSON.stringify(at(0,0)), JSON.stringify(at(W-1,H-1)));
  // sample content
  let found = null;
  outer: for (let y=0;y<H;y++) for (let x=0;x<W;x++) { const p=at(x,y); if (p[3]>200){ found=p; break outer; } }
  console.log('content pixel (should be black, alpha>200):', JSON.stringify(found));
})();
