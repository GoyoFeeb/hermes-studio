// Count brand names in VISIBLE text only (strip tags, scripts, data URIs).
const fs = require('fs');
const html = fs.readFileSync('/Users/javifeebbo/Desktop/newsletter-system-reutilizable/sistema-final/amazon-fiesta-ofertas-prime-newsletter.html', 'utf8');
// strip VML/HTML tags and entities -> plain text
const text = html
  .replace(/<[^>]+>/g, ' ')
  .replace(/<!--[\s\S]*?-->/g, ' ')
  .replace(/&Aacute;|&Eacute;|&Iacute;|&Oacute;|&Uacute;/g, x => ({'&Aacute;':'a','&Eacute;':'e','&Iacute;':'i','&Oacute;':'o','&Uacute;':'u'}[x]))
  .replace(/&iacute;|&eacute;|&aacute;|&oacute;|&uacute;|&ntilde;/g, x => ({'&iacute;':'i','&eacute;':'e','&aacute;':'a','&oacute;':'o','&uacute;':'u','&ntilde;':'n'}[x]))
  .replace(/&copy;|&nbsp;|&iquest;/g, ' ');
const words = text.split(/\s+/).filter(Boolean);
const amz = words.filter(w => w.toLowerCase().includes('amazon')).length;
const prm = words.filter(w => w.toLowerCase().includes('prime')).length;
console.log('visible Amazon:', amz, '| visible Prime:', prm, '| total:', amz + prm);
console.log('contextos:', words.filter(w => w.toLowerCase().includes('amazon') || w.toLowerCase().includes('prime')).join(' | '));
