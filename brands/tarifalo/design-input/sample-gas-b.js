// Muestreo de píxeles del render 600px para verificar colores de fondo de la Zona A (navy) y la tabla.
const sharp = require('sharp');
const path = require('path');

const IMG = path.resolve(__dirname, '../../..', 'preview-gas-b-2026-08-600.png');

async function sample(x, y) {
  const { data, info } = await sharp(IMG)
    .extract({ left: x, top: y, width: 1, height: 1 })
    .raw()
    .toBuffer({ resolveWithObject: true });
  const [r, g, b] = data;
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

(async () => {
  console.log('esquina sup-der (zona A, debe ser navy oscuro):', await sample(560, 20));
  console.log('centro zona A (debe ser navy):                ', await sample(300, 240));
  console.log('zona B cuerpo (debe ser blanco):               ', await sample(300, 700));
  console.log('header tabla DESPUES (debe ser navy #003049):  ', await sample(450, 640));
})();
