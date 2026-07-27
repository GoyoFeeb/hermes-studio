const fs = require('fs');
const html = fs.readFileSync(process.argv[2], 'utf8');

// Check basic tag balance
const opens = (html.match(/<[a-z][a-z0-9]*/gi) || []).length;
const closes = (html.match(/<\/[a-z][a-z0-9]*>/gi) || []).length;
const selfClosing = (html.match(/<[a-z][a-z0-9]*[^>]*\/>/gi) || []).length;

console.log('Opening tags:', opens);
console.log('Closing tags:', closes);
console.log('Self-closing tags:', selfClosing);

// Check for unbalanced tags
const selfCloseTags = new Set(['meta','link','br','hr','img','input','v:roundrect','w:anchorlock']);
const tagCounts = {};
const tagRegex = /<(\/?)([a-z][a-z0-9:_]*)/gi;
let match;
while ((match = tagRegex.exec(html)) !== null) {
  const tag = match[2].toLowerCase();
  if (selfCloseTags.has(tag)) continue;
  if (tag.startsWith('v:') || tag.startsWith('w:')) continue;
  if (match[1] === '/') {
    tagCounts[tag] = (tagCounts[tag] || 0) - 1;
  } else {
    tagCounts[tag] = (tagCounts[tag] || 0) + 1;
  }
}
const unbalanced = Object.entries(tagCounts).filter(([_,c]) => c !== 0);
if (unbalanced.length > 0) {
  console.log('❌ Unbalanced tags:', JSON.stringify(unbalanced));
} else {
  console.log('✅ All tags balanced');
}
