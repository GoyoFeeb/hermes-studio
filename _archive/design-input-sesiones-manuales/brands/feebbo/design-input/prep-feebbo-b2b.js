// prep-feebbo-b2b.js — aplanar assets sobre fondos de escena para la pieza B2B
// Uso: node prep-feebbo-b2b.js
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const DESIGN = __dirname;
const out = (f) => path.join(DESIGN, f);

async function main() {
  // RAID transparente -> aplanado sobre navy #14183F (escena 3)
  const raid = sharp(out('feebbo-raid.png'))
    .resize(420, 420, { fit: 'cover' })
    .flatten({ background: '#14183F' })
    .jpeg({ quality: 82 })
    .toBuffer();
  fs.writeFileSync(out('feebbo-raid-navy.jpg'), await raid);
  console.log('raid-navy ok', fs.statSync(out('feebbo-raid-navy.jpg')).size);

  // Equipo transparente -> aplanado sobre bridge #F4F5FA (escena 4)
  const equipo = sharp(out('feebbo-equipo-interno.png'))
    .resize(400, 400, { fit: 'cover' })
    .flatten({ background: '#F4F5FA' })
    .jpeg({ quality: 82 })
    .toBuffer();
  fs.writeFileSync(out('feebbo-equipo-bridge.jpg'), await equipo);
  console.log('equipo-bridge ok', fs.statSync(out('feebbo-equipo-bridge.jpg')).size);

  // Scatter editorial (520x520 jpg ya lista) — comprobamos que existe
  console.log('scatter existe:', fs.existsSync(out('class5-editorial-email.jpg')));

  // Logo blanco (PNG transparente) — verificar
  console.log('logo existe:', fs.existsSync(out('feebbo-logo-white.png')));
}
main().catch(e => { console.error(e); process.exit(1); });
