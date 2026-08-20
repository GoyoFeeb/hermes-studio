const fs = require('fs');
const svg = fs.readFileSync('brands/mercedes-amg/design-input/logo-mercedes-amg-official.svg', 'utf8');
console.log('SVG head:', JSON.stringify(svg.slice(0, 400)));
console.log('fill/color mentions:', [...new Set([...svg.matchAll(/(?:fill|stroke|stop-color)="([^"]*)"/g)].map(m => m[1]))].join(' | ') || '(ninguno)');
console.log('style mentions:', [...new Set([...svg.matchAll(/style="([^"]*)"/g)].map(m => m[1].slice(0, 60)))].join(' | ') || '(ninguno)');
