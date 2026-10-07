// Verificación de paleta por muestreo de píxeles (protocolo del skill):
// cuerpo del coche debe ser rojo metalizado Toyota (~#C8102E oscuro), cielo azul profundo/ámbar.
const sharp = require('/Users/javifeebbo/Desktop/newsletter-system-reutilizable/sistema-final/node_modules/sharp');

(async () => {
  const img = sharp('/Users/javifeebbo/Desktop/newsletter-system-reutilizable/sistema-final/brands/toyota/design-input/hero-raw2.png');
  const { data, info } = await img.raw().toBuffer({ resolveWithObject: true });
  const W = info.width, H = info.height; // 1024x768
  const px = (x, y) => {
    const i = (y * W + x) * 3;
    return [data[i], data[i + 1], data[i + 2]];
  };
  const avg = (x0, y0, x1, y1) => {
    let r = 0, g = 0, b = 0, n = 0;
    for (let x = x0; x < x1; x += 4) for (let y = y0; y < y1; y += 4) {
      const [R, G, B] = px(x, y); r += R; g += G; b += B; n++;
    }
    return [Math.round(r / n), Math.round(g / n), Math.round(b / n)];
  };
  const hex = (c) => '#' + c.map(v => v.toString(16).padStart(2, '0')).join('');
  // Carrocería: zona central del coche (el coche ocupa centro-derecha inferior)
  console.log('carroceria (500,400)-(680,560):', hex(avg(500, 400, 680, 560)));
  console.log('carroceria alta (430,330)-(560,420):', hex(avg(430, 330, 560, 420)));
  // Cielo atardecer (superior)
  console.log('cielo izq (80,40)-(300,120):', hex(avg(80, 40, 300, 120)));
  console.log('horizonte (150,330)-(400,390):', hex(avg(150, 330, 400, 390)));
  // Asfalto mojado
  console.log('asfalto (200,700)-(500,750):', hex(avg(200, 700, 500, 750)));
  // Pared/edificio izq
  console.log('pared izq (30,300)-(90,500):', hex(avg(30, 300, 90, 500)));
})().catch((e) => { console.error('ERR', e.message); process.exit(1); });
