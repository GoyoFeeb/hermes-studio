// Convert SVGs to PNG - with white logo for purple background
const path = require('path');
const fs = require('fs');
const http = require('https');
const { chromium } = require('playwright');

const ASSETS_DIR = path.join(__dirname, '..', 'newsletters', '2026', 'paraycompara', '2026-jul-ahorra-fibra-movil', '09-exports', 'assets');
fs.mkdirSync(ASSETS_DIR, { recursive: true });

const LOGO_W = 400, LOGO_H = 110;

// Download logo SVG and create white version (replace purple with white)
const logoUrl = 'https://paraycompara.com/assets/img/logo-paraycompara.svg';
async function getModifiedLogos() {
  return new Promise((resolve, reject) => {
    http.get(logoUrl, res => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        // Create white version: all #792771 → #FFFFFF
        const whiteSvg = data.replace(/#792771/gi, '#FFFFFF');
        // Create original version (for reference)
        console.log(`Logo SVG: ${data.length} bytes`);
        resolve({ original: data, white: whiteSvg });
      });
      res.on('error', reject);
    });
  });
}

(async () => {
  const logos = await getModifiedLogos();
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  // 1. WHITE logo on purple background ✅
  await page.setContent(`<html><body style="margin:0;background:#792771;">
    <img src="data:image/svg+xml;base64,${Buffer.from(logos.white).toString('base64')}" width="${LOGO_W}" height="${LOGO_H}" />
  </body></html>`);
  await page.setViewportSize({ width: LOGO_W, height: LOGO_H });
  await page.screenshot({ path: path.join(ASSETS_DIR, '_logo-on-purple.png') });
  
  // Save WHITE logo as PNG (this is what we use in the header)
  const logoWhitePath = path.join(ASSETS_DIR, 'logo-paraycompara.png');
  await page.screenshot({ path: logoWhitePath, clip: { x: 0, y: 0, width: LOGO_W, height: LOGO_H } });
  const logoBytes = fs.statSync(logoWhitePath).size;
  console.log(`✅ logo-paraycompara.png (white, ${logoBytes}b, ${LOGO_W}x${LOGO_H}, display 200x55)`);
  
  // 2. Convert icon SVGs to PNG
  const icons = [
    { name: 'tarifa-movil-icon', url: 'https://paraycompara.com/assets/img/tarifa-movil-icon.svg', displayW: 48, displayH: 48 },
    { name: 'tarifa-fibra-icon', url: 'https://paraycompara.com/assets/img/tarifa-fibra-icon.svg', displayW: 48, displayH: 48 },
    { name: 'tarifa-fibra-movil-icon', url: 'https://paraycompara.com/assets/img/tarifa-fibra-movil-icon.svg', displayW: 48, displayH: 48 },
    { name: 'tarifa-tv-icon', url: 'https://paraycompara.com/assets/img/tarifa-tv-icon.svg', displayW: 48, displayH: 48 },
    { name: 'aspecto1', url: 'https://paraycompara.com/assets/img/aspecto1.svg', displayW: 40, displayH: 40 },
    { name: 'aspecto2', url: 'https://paraycompara.com/assets/img/aspecto2.svg', displayW: 40, displayH: 40 },
    { name: 'aspecto3', url: 'https://paraycompara.com/assets/img/aspecto3.svg', displayW: 40, displayH: 40 },
    { name: 'aspecto4', url: 'https://paraycompara.com/assets/img/aspecto4.svg', displayW: 40, displayH: 40 },
  ];
  
  const results = [{ name: 'logo-paraycompara', purpose: 'Logo header (white)', bytes: logoBytes, displayW: 200, displayH: 55 }];
  
  for (const icon of icons) {
    const sourceW = icon.displayW * 2; // 2x retina
    await page.setContent(`<html><body style="margin:0;width:${sourceW}px;height:${sourceW}px">
      <img src="${icon.url}" width="${sourceW}" height="${sourceW}" />
    </body></html>`);
    await page.setViewportSize({ width: sourceW, height: sourceW });
    
    const outPath = path.join(ASSETS_DIR, `${icon.name}.png`);
    await page.screenshot({ path: outPath, clip: { x: 0, y: 0, width: sourceW, height: sourceW } });
    const bytes = fs.statSync(outPath).size;
    const ok = bytes > 200 ? '✅' : '⚠️';
    console.log(`  ${ok} ${icon.name}.png (${bytes}b, ${sourceW}x${sourceW}, display ${icon.displayW}x${icon.displayH})`);
    results.push({ name: icon.name, purpose: icon.name.includes('tarifa') ? 'Servicios' : 'Educativo', bytes, displayW: icon.displayW, displayH: icon.displayH });
  }
  
  await browser.close();
  
  fs.writeFileSync(path.join(ASSETS_DIR, 'assets-metadata.json'), JSON.stringify({ created: '2026-07-09', tool: 'Playwright', assets: results }, null, 2));
  console.log(`\n=== Done: ${results.length} assets ===`);
})();