const sharp = require('/Users/javifeebbo/Desktop/newsletter-system-reutilizable/sistema-final/node_modules/sharp');

(async () => {
  const img = sharp('preview-byd-600.png');
  const { data, info } = await img.raw().toBuffer({ resolveWithObject: true });
  const W = info.width;
  const px = (x, y) => {
    const i = (y * W + x) * info.channels;
    return [data[i], data[i+1], data[i+2]];
  };
  // Muestreo fino entre y=1560 y y=1660 buscando la línea roja #d70c19
  for (let y = 1555; y <= 1640; y += 3) {
    const c = px(300, y);
    if (c[0] > 150 && c[1] < 80 && c[2] < 80) {
      console.log('ROJO encontrado en y=' + y, 'rgb(' + c.join(',') + ')');
    }
  }
  // Buscar también el borde rojo de la escena 2 (entre hero blanco y escena oscura)
  console.log('--- borde escena 2 (entre y=430 y y=470) ---');
  for (let y = 430; y <= 470; y += 2) {
    const c = px(300, y);
    if (c[0] > 150 && c[1] < 80 && c[2] < 80) {
      console.log('ROJO en y=' + y, 'rgb(' + c.join(',') + ')');
    }
  }
})();
