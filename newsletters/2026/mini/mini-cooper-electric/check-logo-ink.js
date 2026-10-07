// Verifica deterministamente: logo negro (cabecera) y logo blanco (footer)
const sharp = require('/Users/javifeebbo/Desktop/newsletter-system-reutilizable/sistema-final/node_modules/sharp');
const D = '/Users/javifeebbo/Desktop/newsletter-system-reutilizable/sistema-final/newsletters/2026/mini/mini-cooper-electric/design-input/';
(async () => {
  for (const f of ['logo-official-black.png', 'logo-official-white.png']) {
    const { data, info } = await sharp(D + f).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    let r = 0, g = 0, b = 0, n = 0;
    for (let i = 0; i < data.length; i += 4) {
      if (data[i+3] > 60) { r += data[i]; g += data[i+1]; b += data[i+2]; n++; }
    }
    console.log(`${f}: tinta media = rgb(${(r/n).toFixed(0)},${(g/n).toFixed(0)},${(b/n).toFixed(0)}) sobre ${n} px opacos`);
  }
})();
