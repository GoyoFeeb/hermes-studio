const sharp = require('/Users/javifeebbo/Desktop/newsletter-system-reutilizable/sistema-final/node_modules/sharp');
(async () => {
  const logo = '/Users/javifeebbo/Desktop/newsletter-system-reutilizable/sistema-final/brands/mazda/design-input/assets/mazda-logo.png';
  const resized = await sharp(logo).resize({ width: 300, height: 300 }).png().toBuffer();
  const out = await sharp({ create: { width: 600, height: 440, channels: 4, background: { r: 26, g: 26, b: 26, alpha: 1 } } })
    .composite([{ input: resized, top: 70, left: 150 }])
    .png().toBuffer();
  await sharp(out).toFile('/Users/javifeebbo/Desktop/newsletter-system-reutilizable/sistema-final/brands/mazda/design-input/assets/logo-on-dark.png');
  console.log('done');
})();
