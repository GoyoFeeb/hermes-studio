#!/usr/bin/env node
/**
 * embed-images-base64.js
 *
 * Post-build step: reemplaza todas las URLs PENDING-CDN-UPLOAD en los HTMLs
 * generados por el motor con data URIs (base64) de imágenes locales,
 * para poder visualizar la newsletter directamente en navegador sin CDN.
 *
 * Uso:
 *   node scripts/embed-images-base64.js --campaign newsletters/2026/marca/campaña
 *   node scripts/embed-images-base64.js --dir   newsletters/2026/marca/campaña/09-exports/ --images-dir brands/marca/design-input/
 *
 * Busca en --images-dir (por defecto: extrae la marca del path de campaign)
 * archivos locales para reemplazar las URLs de PENDING-CDN-UPLOAD.
 *
 * Para producción: correr `node scripts/embed-images-base64.js --undo --campaign ...`
 * para restaurar los PENDING-CDN-UPLOAD originales (si el HTML fuente se conservó
 * o si se ejecuta sobre una copia del build).
 */

const fs = require('fs');
const path = require('path');

// Parse args
const args = {};
for (let i = 2; i < process.argv.length; i++) {
  if (process.argv[i] === '--campaign') args.campaign = process.argv[++i];
  else if (process.argv[i] === '--dir') args.dir = process.argv[++i];
  else if (process.argv[i] === '--images-dir') args.imagesDir = process.argv[++i];
  else if (process.argv[i] === '--undo') args.undo = true;
}

function findBrand(campaignPath) {
  // brands/new-balance/tokens/ -> new-balance
  const match = campaignPath.match(/newsletters\/\d{4}\/([^/]+)\//);
  if (match) return match[1];
  // fallback
  const parts = campaignPath.split('/');
  const brandFolder = parts[parts.indexOf('design-input') - 1] || parts[parts.indexOf('brands') + 1];
  return brandFolder || 'unknown';
}

function resolveImagesDir() {
  if (args.imagesDir) return path.resolve(args.imagesDir);
  if (args.campaign) {
    const brand = findBrand(args.campaign);
    return path.resolve(`brands/${brand}/design-input`);
  }
  return null;
}

function resolveOutputDir() {
  if (args.dir) return path.resolve(args.dir);
  if (args.campaign) return path.resolve(args.campaign, '09-exports');
  return null;
}

// --- Main ---

const outDir = resolveOutputDir();
const imagesDir = resolveImagesDir();

if (!outDir || !imagesDir) {
  console.error('❌ Uso: node scripts/embed-images-base64.js --campaign <ruta> [--images-dir <ruta>]');
  console.error('   O:  node scripts/embed-images-base64.js --dir <09-exports/> --images-dir <design-input/>');
  process.exit(1);
}

// Build mapping: PENDING URL template path -> local file
// PENDING URLs look like: https://PENDING-CDN-UPLOAD/{brand}/{filename}.{ext}
// or https://PENDING-CDN-UPLOAD/{filename}.{ext}
// Local files live in: brands/{brand}/design-input/ with similar names

const brand = findBrand(args.campaign || args.dir || '');
const localFiles = {};
let pendingCount = 0;

function addFile(pendingUrl, localPath) {
  if (fs.existsSync(localPath)) {
    localFiles[pendingUrl] = localPath;
  }
}

// Search for local files matching PENDING patterns
const imgExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
const LOCAL_IMAGES_DIR = imagesDir;

if (fs.existsSync(LOCAL_IMAGES_DIR)) {
  const files = fs.readdirSync(LOCAL_IMAGES_DIR);
  files.forEach(f => {
    const ext = path.extname(f).toLowerCase();
    if (imgExtensions.includes(ext)) {
      // Try to match: hero-banner-email.jpg -> PENDING/hero-banner.png
      const base = path.basename(f)
        .replace(/-email|-compressed|-optimized/gi, '')
        .replace(/\.[^.]+$/, '');
      
      // Build potential PENDING URLs for this file
      const pendingPatterns = [
        `https://PENDING-CDN-UPLOAD/${brand}/${base}${ext}`,
        `https://PENDING-CDN-UPLOAD/${brand}/${base}.png`,
        `https://PENDING-CDN-UPLOAD/${brand}/${base}.jpg`,
        `https://PENDING-CDN-UPLOAD/${base}${ext}`,
        `https://PENDING-CDN-UPLOAD/${base}.png`,
        `https://PENDING-CDN-UPLOAD/${base}.jpg`,
      ];
      
      pendingPatterns.forEach(p => addFile(p, path.join(LOCAL_IMAGES_DIR, f)));
    }
  });
}

// Also check common naming conventions
const logoFiles = [path.join(LOCAL_IMAGES_DIR, 'logo-nb-email.png'), path.join(LOCAL_IMAGES_DIR, 'logo.png'), path.join(LOCAL_IMAGES_DIR, 'logo-nb.png')];
logoFiles.forEach(lf => {
  addFile(`https://PENDING-CDN-UPLOAD/${brand}/logo.png`, lf);
});

const heroFiles = [path.join(LOCAL_IMAGES_DIR, 'hero-banner-email.jpg'), path.join(LOCAL_IMAGES_DIR, 'hero-banner.jpg'), path.join(LOCAL_IMAGES_DIR, 'hero-banner.png')];
heroFiles.forEach(hf => {
  addFile(`https://PENDING-CDN-UPLOAD/hero-banner.png`, hf);
});

if (Object.keys(localFiles).length === 0) {
  console.log('⚠️  No se encontraron imágenes locales en:', LOCAL_IMAGES_DIR);
  console.log('   Crea imágenes en esa carpeta o usa --images-dir para especificar otra ruta.');
  process.exit(0);
}

// Process HTML files
const htmlFiles = fs.readdirSync(outDir).filter(f => f.endsWith('.html') && !f.endsWith('.bak.html'));

htmlFiles.forEach(htmlFile => {
  const htmlPath = path.join(outDir, htmlFile);
  let html = fs.readFileSync(htmlPath, 'utf8');
  let modified = false;
  
  // Backup original if first time
  const bakPath = htmlPath + '.bak';
  if (!args.undo && !fs.existsSync(bakPath)) {
    // Check if it already has base64 data URIs
    if (html.includes('data:image/')) {
      console.log(`  ⏭️  ${htmlFile} — ya tiene imágenes incrustadas, saltando.`);
      return;
    }
    fs.writeFileSync(bakPath, html);
  }

  if (args.undo && fs.existsSync(bakPath)) {
    fs.writeFileSync(htmlPath, fs.readFileSync(bakPath, 'utf8'));
    console.log(`  🔄 ${htmlFile} — restaurado de backup.`);
    return;
  }

  for (const [pendingUrl, localPath] of Object.entries(localFiles)) {
    if (!html.includes(pendingUrl)) continue;
    
    const imgData = fs.readFileSync(localPath);
    const ext = path.extname(localPath).toLowerCase();
    const mimeType = ext === '.png' ? 'image/png' : ext === '.gif' ? 'image/gif' : ext === '.webp' ? 'image/webp' : 'image/jpeg';
    const b64 = imgData.toString('base64');
    const dataUri = `data:${mimeType};base64,${b64}`;
    
    html = html.replaceAll(pendingUrl, dataUri);
    modified = true;
    const sizeKb = Math.round(b64.length / 1024);
    console.log(`  ✅ ${pendingUrl.substring(0, 55)}... → base64 (${sizeKb} KB) [${path.basename(localPath)}]`);
  }

  if (modified) {
    fs.writeFileSync(htmlPath, html);
    const newSize = Math.round(html.length / 1024);
    console.log(`  📄 ${htmlFile} → ${newSize} KB`);
    pendingCount++;
  }
});

if (!args.undo) {
  console.log(`\n✅ ${pendingCount} archivo(s) actualizado(s) con imágenes base64.`);
  console.log('📌 Para restaurar los PENDING originales:');
  console.log(`   node scripts/embed-images-base64.js --undo --campaign ${args.campaign || '...'}`);
} else {
  console.log(`\n✅ HTMLs restaurados a estado PENDING-CDN-UPLOAD original.`);
}
