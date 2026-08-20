const sharp = require('/Users/javifeebbo/Desktop/newsletter-system-reutilizable/sistema-final/node_modules/sharp');

(async () => {
  const img = sharp('preview-byd-600.png');
  const meta = await img.metadata();
  console.log('preview:', meta.width + 'x' + meta.height);
  const { data, info } = await img.raw().toBuffer({ resolveWithObject: true });
  const W = info.width, H = info.height;
  const px = (x, y) => {
    const i = (y * W + x) * info.channels;
    return [data[i], data[i+1], data[i+2]];
  };
  // Recorrer una columna central x=300 muestreando cada 40px para detectar bandas de fondo
  let prev = null;
  for (let y = 0; y < H; y += 30) {
    const c = px(300, y).join(',');
    if (c !== prev) {
      console.log('y=' + y + ' rgb(' + c + ')  hex=#' + px(300,y).map(v => v.toString(16).padStart(2,'0')).join(''));
      prev = c;
    }
  }
  console.log('--- muestras puntuales ---');
  const pts = {
    'hero imagen (y=100)': [300, 100],
    'hero texto blanco (y=500)': [300, 500],
    'escena2 oscura (y=800)': [300, 800],
    'escena3 gris (y=1150)': [300, 1150],
    'escena4 cierre (y=1550)': [300, 1550],
    'footer (y=1850)': [300, 1850],
  };
  for (const [k, [x, y]] of Object.entries(pts)) {
    const c = px(x, y);
    console.log(k, 'rgb(' + c.join(',') + ') hex=#' + c.map(v => v.toString(16).padStart(2,'0')).join(''));
  }
})();
