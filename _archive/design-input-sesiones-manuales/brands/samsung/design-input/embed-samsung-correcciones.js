#!/usr/bin/env node
/**
 * embed-samsung-correcciones.js — igual que embed-samsung.js pero genera
 * una COPIA corregida aparte: samsung-newsletter-v2-correcciones.html
 * (la original samsung-newsletter.html queda intacta).
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', '..', '..');
const SRC = path.join(__dirname, 'source-correcciones.html');
const OUT = path.join(ROOT, 'samsung-newsletter-v2-correcciones.html');
const IMG_DIR = __dirname;
const FONT_DIR = '/tmp/samsung-assets/fonts';

const tokens = [
  ['{{LOGO_B64}}', path.join(IMG_DIR, 'logo-blanco.png'), 'image/png'],
  ['{{FONT_BOLD}}', path.join(FONT_DIR, 'SamsungSharpSansBd.woff2'), 'font/woff2'],
  ['{{FONT_MED}}', path.join(FONT_DIR, 'SamsungSharpSansMd.woff2'), 'font/woff2'],
  ['{{FONT_ONE}}', path.join(FONT_DIR, 'SamsungOne-400.woff2'), 'font/woff2'],
];

let html = fs.readFileSync(SRC, 'utf8');
const missing = [];
for (const [token, file] of tokens) {
  if (!fs.existsSync(file)) { missing.push(file); continue; }
  if (!html.includes(token)) { console.log('⚠️ token no presente en source:', token); continue; }
  const b64 = fs.readFileSync(file).toString('base64');
  html = html.split(token).join(b64);
  console.log('✅', path.basename(file), '→', Math.round(b64.length / 1024) + 'KB base64');
}

if (missing.length) { console.error('❌ Faltan archivos locales:', missing); process.exit(1); }
if (/PENDING-CDN-UPLOAD/.test(html)) { console.error('❌ ABORT: quedan tokens PENDING sin resolver'); process.exit(1); }
if (html.includes('{{')) { console.error('❌ ABORT: quedan llaves sin resolver'); process.exit(1); }

fs.writeFileSync(OUT, html);
console.log('📄 Final escrito:', OUT, Math.round(html.length / 1024) + 'KB');
