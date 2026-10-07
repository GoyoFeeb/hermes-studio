// Pixel sanity check on the 3 images used in the piece (mean brightness + color stddev)
const sharp = require('/Users/javifeebbo/Desktop/newsletter-system-reutilizable/sistema-final/node_modules/sharp');
const D = '/Users/javifeebbo/Desktop/newsletter-system-reutilizable/sistema-final/newsletters/2026/mini/mini-cooper-electric/design-input/';
(async () => {
  for (const f of ['hero-stage.jpg', 'gallery-overview.jpg', 'gallery-interior.jpg']) {
    const { data, info } = await sharp(D + f).raw().toBuffer({ resolveWithObject: true });
    const n = info.width * info.height;
    let r = 0, g = 0, b = 0;
    for (let i = 0; i < data.length; i += 3) { r += data[i]; g += data[i+1]; b += data[i+2]; }
    const mr = r / n, mg = g / n, mb = b / n;
    let vr = 0, vg = 0, vb = 0;
    for (let i = 0; i < data.length; i += 3) { vr += (data[i]-mr)**2; vg += (data[i+1]-mg)**2; vb += (data[i+2]-mb)**2; }
    console.log(`${f}: ${info.width}x${info.height} meanRGB=(${mr.toFixed(0)},${mg.toFixed(0)},${mb.toFixed(0)}) stddev=(${Math.sqrt(vr/n).toFixed(0)},${Math.sqrt(vg/n).toFixed(0)},${Math.sqrt(vb/n).toFixed(0)})`);
  }
})();
