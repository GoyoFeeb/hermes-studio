#!/usr/bin/env node
/**
 * embed standalone El Corte Inglés newsletter: replaces {{TOKEN}} with
 * base64 data URIs from brands/el-corte-ingles/design-input/.
 */
const fs = require('fs');
const path = require('path');

const DESIGN = '/Users/javifeebbo/Desktop/newsletter-system-reutilizable/sistema-final/brands/el-corte-ingles/design-input';
const SRC = path.join(DESIGN, 'eci-source.html');
const OUT = '/Users/javifeebbo/Desktop/newsletter-system-reutilizable/sistema-final/el-corte-ingles-newsletter.html';

const map = {
  '{{LOGO}}': 'eci-logo-white-email.png',
  '{{HERO}}': 'eci-hero-email.jpg',
  '{{VESTIDOS}}': 'eci-vestidos-email.jpg',
};

let html = fs.readFileSync(SRC, 'utf8');

for (const [token, file] of Object.entries(map)) {
  const p = path.join(DESIGN, file);
  const b64 = fs.readFileSync(p).toString('base64');
  const mime = file.endsWith('.png') ? 'image/png' : 'image/jpeg';
  html = html.split(token).join(`data:${mime};base64,${b64}`);
}

if (html.includes('{{')) {
  console.error('ABORT: unresolved tokens remain');
  process.exit(1);
}

fs.writeFileSync(OUT, html);
console.log('OK ->', OUT, Math.round(fs.statSync(OUT).size / 1024) + 'KB');
