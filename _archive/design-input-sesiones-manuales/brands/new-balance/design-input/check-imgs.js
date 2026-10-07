// Verify logo PNG transparency (corner alpha) + inspect product shot backgrounds
const sharp = require('sharp');
const dir = '/Users/javifeebbo/Desktop/newsletter-system-reutilizable/sistema-final/brands/new-balance/design-input/';
async function main() {
  // Logo corner alpha check
  const { data, info } = await sharp(dir + 'logo-nb-oficial-email.png').raw().toBuffer({ resolveWithObject: true });
  const ch = info.channels;
  const corner = [0, 0, ch - 1, 0, 0, info.height - 1, ch - 1, info.height - 1];
  const alphas = corner.map(i => data[i]);
  console.log('logo alpha corners:', alphas.join(','), '-> transparent:', alphas.every(a => a < 10));
  // Product shot corner color (is bg white or gray?)
  for (const n of ['nb-740n-02.jpg', 'nb-740n-03.jpg', 'nb-740n-04.jpg', 'nb-740n-05.jpg', 'nb-740n-06.jpg', 'nb-740n-07.jpg']) {
    const p = await sharp(dir + n).resize(60, 60).removeAlpha().raw().toBuffer({ resolveWithObject: true });
    const d = p.data;
    // sample 4 corners
    const w = 60, h = 60;
    const c = (x, y) => { const i = (y * w + x) * 3; return `${d[i]},${d[i+1]},${d[i+2]}`; };
    console.log(n, 'corners:', c(2,2), c(57,2), c(2,57), c(57,57));
  }
}
main().catch(e => { console.error(e); process.exit(1); });
