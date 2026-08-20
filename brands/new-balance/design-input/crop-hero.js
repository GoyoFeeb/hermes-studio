// crop-hero.js — recorta la zona superior (masthead + escena 1) del screenshot 1280 para verificación visual.
const sharp = require('sharp');
sharp('/Users/javifeebbo/Desktop/newsletter-system-reutilizable/sistema-final/brands/new-balance/design-input/preview-archivo-1280.png')
  .extract({ left: 200, top: 0, width: 880, height: 560 })
  .toFile('/Users/javifeebbo/Desktop/newsletter-system-reutilizable/sistema-final/brands/new-balance/design-input/crop-hero-1280.png')
  .then(() => console.log('OK crop-hero-1280.png'))
  .catch(e => { console.error('ERROR', e.message); process.exit(1); });
