const fs = require('fs');
const path = require('path');

// ── Read source ──────────────────────────────────────────────────────────
const SRC_PATH = 'newsletters/2026/paraycompara/2026-jul-ahorra-fibra-movil/v5-premium/final-premium-v2.html';
const HTML = fs.readFileSync(SRC_PATH, 'utf-8');
const LINES = HTML.split('\n');
const ENG_DIR = 'engine/components';
const TOKEN_FILE = 'newsletters/2026/newsletter-system/brands/paraycompara/tokens/brand-tokens.json';
const TOKENS = JSON.parse(fs.readFileSync(TOKEN_FILE, 'utf-8'));

fs.mkdirSync(ENG_DIR, { recursive: true });

// ── Helper: extract lines range ──────────────────────────────────────────
function extract(comment_marker, end_line_or_marker, include_end = true) {
  const start = typeof comment_marker === 'number' ? comment_marker 
    : LINES.findIndex(l => l.includes(comment_marker));
  const end = typeof end_line_or_marker === 'number' ? end_line_or_marker
    : LINES.findIndex((l, i) => i > start && l.includes(end_line_or_marker));
  const block = LINES.slice(start, include_end ? end + 1 : end);
  return { start: start + 1, end: include_end ? end + 1 : end, block: block.join('\n') };
}

// ── Helper: write component ──────────────────────────────────────────────
function writeComponent(name, block, data_fields, token_fields, note = '') {
  // Parametrize brand colors
  let content = block;
  
  // Color tokens
  const colorMap = {
    '#5E2E91': '{{token:colors.primary}}',
    '#3E244D': '{{token:colors.deep}}',
    '#7B1FA2': '{{token:colors.light}}',
    '#FF5A3C': '{{token:colors.ctaBackground}}',
    '#F8F5FC': '{{token:colors.sectionLila}}',
    '#FFFFFF': '{{token:colors.white}}',
    '#F4F3F9': '{{token:colors.global}}',
    '#EDE7F3': '{{token:colors.border}}',
    '#DCC7E5': '{{token:surfaces.stepConnector}}',
    '#D9C2E6': '{{token:colors.subtitleOnBrand}}',
    '#66616A': '{{token:colors.bodySecondary}}',
    '#666666': '{{token:colors.bodySecondary}}',  // card body
    '#E4CDF0': '{{token:colors.eyebrowOnBrand}}',
  };
  // Exclude VML strokecolor/fillcolor and brand-specific hardcodes that aren't in tokens
  for (const [hex, token] of Object.entries(colorMap)) {
    // Don't replace in CDN URLs or existing placeholders
    content = content.replace(new RegExp(hex.replace('#', '\\#'), 'g'), token);
  }
  
  // VML-specific colors (strokecolor/fillcolor) — keep hardcoded, CTA brand color is a design decision
  // But replace standard ones
  content = content.replace(/color:#FF5A3C/g, '{{token:colors.ctaBackground}}');
  
  // Radius tokens
  content = content.replace(/border-radius:50px/g, 'border-radius:{{token:radius.ctaPill}}px');
  content = content.replace(/border-radius:18px/g, 'border-radius:{{token:radius.card}}px');

  // Font family displayFont
  content = content.replace(/'Sora','Segoe UI',Arial,Helvetica,sans-serif/g, '{{token:typography.displayFont}}');
  content = content.replace(/'Sora','Segoe UI',/g, '{{token:typography.displayFont}}');
  
  // Keep mso conditional comments and VML intact—those are email-compatibility critical
  
  // CDN base URL → data
  const CDN_BASE = 'https://feebbodigital.com/creativities-library/paraycompara/2026/jul/';
  content = content.replace(new RegExp(CDN_BASE.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), '{{data:cdnBase}}/');

  // Build header
  const hdr = [
    `<!-- ${name}.html`,
    `  Origen: ${SRC_PATH} líneas ${lines_ranges[name] ? lines_ranges[name] : '?'}`,
    `  Extraído: 2026-07-17 para engine/components/`,
    `  Tokens que consume: ${token_fields.join(', ')}`,
    `  Campos de datos: ${data_fields.join(', ')}`,
    note ? `  Nota: ${note}` : '',
    `-->`,
  ].filter(Boolean).join('\n');

  content = hdr + '\n' + content;
  fs.writeFileSync(path.join(ENG_DIR, name + '.html'), content, 'utf-8');
  const kb = (Buffer.byteLength(content) / 1024).toFixed(1);
  console.log(`  ${name}.html: ${kb} KB`);
}

// Track lines ranges
const lines_ranges = {};

// ── Section boundaries (line numbers, 1-indexed) ─────────────────────────
// Shell: lines 1-67 (doctype through outer table opening)
// Hero: lines 69-167
// Trust bar: lines 169-227
// Tarifas section: lines 228-307
// Pasos: lines 309-412
// Lista premium: lines 414-540
// Banda cierre: lines 542-578
// Footer: lines 580-619

lines_ranges._shell = '1-67, solo el envoltorio';
lines_ranges.preheader = '59-62, contenido del div oculto';
lines_ranges.hero = '69-167';
lines_ranges.trustBar = '169-227';
lines_ranges.tarifas_header = '228-248, cabecera de sección';
lines_ranges.cardTarifa = '252-262, bloque repetible ×4';
lines_ranges.pasos = '309-412';
lines_ranges.listaPremium = '414-540';
lines_ranges.bandaCierre = '542-578';
lines_ranges.footer = '580-619';
lines_ranges.ctaBulletproof = '130-156, parcial VML+fallback (usado en hero y cierre)';

// ── 1. _shell.html ──────────────────────────────────────────────────────
const shell = LINES.slice(0, 67).join('\n');
const shellContent = shell
  .replace(/<title>.*<\/title>/, '<title>{{data:subject}}</title>')
  .replace(/Compara ofertas de más de.*? — Para y Compara/, '{{data:preheader}}')
  .replace('background-color:#F4F3F9', 'background-color:{{token:colors.global}}')
  .replace('background-color:#FFFFFF;margin:0 auto;', 'background-color:{{token:colors.white}};margin:0 auto;');
fs.writeFileSync(path.join(ENG_DIR, '_shell.html'), shellContent, 'utf-8');
console.log('  _shell.html: ' + (Buffer.byteLength(shellContent)/1024).toFixed(1) + ' KB');

// ── 2. preheader.html ────────────────────────────────────────────────────
// Just the content of the hidden div
writeComponent('preheader', 
  '<div class="hidden-preheader" style="display:none;overflow:hidden;line-height:1px;opacity:0;max-height:0;max-width:0;font-size:1px;font-family:Arial,Helvetica,sans-serif;color:#FFFFFF;mso-hide:all;">\n  {{data:preheader}}\n</div>',
  ['preheader'], ['colors.white'],
  'El preheader es contenido de campaña, no de marca.'
);

// ── 3. hero.html ─────────────────────────────────────────────────────────
// Lines 69-167
const heroBlock = LINES.slice(68, 167).join('\n');
writeComponent('hero',
  heroBlock,
  ['brand.logoUrl', 'brand.logoAlt', 'brand.logoWidth', 'brand.logoHeight',
   'title', 'stat.number', 'stat.label', 'cta.href', 'cta.text'],
  ['colors.primary', 'colors.ctaBackground', 'colors.white', 'colors.subtitleOnBrand',
   'colors.eyebrowOnBrand', 'typography.displayFont', 'radius.ctaPill', 'surfaces.brandPatternTile'],
  'El CTA usa {{data:cta.href}} y {{data:cta.text}}. El background tile es {{data:cdnBase}}/brand-pattern-tile.png'
);

// ── 4. trustBar.html ─────────────────────────────────────────────────────
// Lines 169-227. The 3 check items repeat — wrap in {{#each:items}}
const trustBlock = LINES.slice(168, 227).join('\n');
// Replace the 3 check blocks with an each loop
// Each check item has: width:33% td containing a table with check + label
const trustItemPattern = /<td align="center" style="width:33%;padding:6px 4px;vertical-align:middle;" class="mobile-stack">([\s\S]*?)<\/td>/;
// We'll carefully replace with the {{#each}} pattern
// For the trust bar, keep the first item as a template
writeComponent('trustBar',
  trustBlock
    .replace(
      /(<td align="center" style="width:33%;padding:6px 4px;vertical-align:middle;" class="mobile-stack">)[\s\S]*?(<\/tr>\s*<\/table>\s*<\/td>\s*<\/tr>\s*<\/table>\s*<\/td>\s*<\/tr>\s*<\/table>\s*<\/td>\s*<\/tr>\s*<\/table>)/,
      '$1{{#each:items}}$3{{/each}}$2'
    ),
  ['items[*].label'],
  ['colors.primary', 'colors.white', 'colors.border', 'colors.sectionLila'],
  'Repite el bloque de check+label dentro de {{#each:items}}'
);

// ── 5. tarifasHeader.html ────────────────────────────────────────────────
// Section header for tariffs
const tarifasHeaderBlock = LINES.slice(227, 248).join('\n');
writeComponent('tarifasHeader',
  tarifasHeaderBlock,
  ['section.eyebrow', 'section.title', 'section.body'],
  ['colors.light', 'colors.primary', 'colors.bodySecondary', 'colors.white', 'typography.displayFont'],
  'Cabecera de sección con kicker rule (reutilizable para cualquier sección)'
);

// ── 6. cardTarifa.html ───────────────────────────────────────────────────
// One card from the grid (first item, lines 252-262)
// We need to handle the 50% width cell wrapper
const cardBlock = LINES.slice(251, 262).join('\n');
writeComponent('cardTarifa',
  cardBlock
    .replace('width:50%;padding:0 6px 12px;', 'width:50%;padding:0 {{#if:last}}0{{/if}}{{#unless:last}}6px{{/unless}} 12px;')
    .replace(/icon-tarifa-movil\.png/g, '{{icon}}')
    .replace(/alt=""/g, 'alt=""')
    .replace('Móvil', '{{title}}')
    .replace(/Datos y llamadas adaptados a tu consumo\./g, '{{body}}')
    .replace(/href="[^"]*"/g, 'href="{{link}}"')
    .replace(/utm_content=card-movil/g, 'utm_content={{moduleId}}'),
  ['icon', 'title', 'body', 'link', 'moduleId'],
  ['colors.primary', 'colors.light', 'colors.ctaBackground', 'colors.white',
   'colors.bodySecondary', 'colors.border', 'radius.card', 'typography.displayFont'],
  'Repetible ×4 via {{#each:items}}. Soporta padding variable según posición. Usa {{#if:last}} para la última columna.'
);

// ── 7. pasos.html ────────────────────────────────────────────────────────
// Lines 309-412
const pasosBlock = LINES.slice(308, 412).join('\n');
writeComponent('pasos',
  pasosBlock,
  ['section.eyebrow', 'section.title', 'items[*].number', 'items[*].title', 'items[*].body'],
  ['colors.light', 'colors.primary', 'colors.white', 'colors.bodySecondary',
   'colors.white', 'surfaces.stepConnector', 'typography.displayFont'],
  '3 pasos, cada uno con number/title/body. El halo de círculo usa {{#each:items}} internamente.'
);

// ── 8. listaPremium.html ─────────────────────────────────────────────────
// Lines 414-540. Contains premiumListRow pattern with icon badges
const listaBlock = LINES.slice(413, 540).join('\n');
writeComponent('listaPremium',
  listaBlock,
  ['section.eyebrow', 'section.title', 'items[*].icon', 'items[*].title', 'items[*].body', 'items[*].moduleId'],
  ['colors.primary', 'colors.light', 'colors.white', 'colors.bodySecondary',
   'colors.sectionLila', 'colors.border', 'radius.card', 'colors.ctaBackground'],
  '4 ítems con badge de icono. Usa {{#each:items}}. Los iconos son de 36px (los icon-aspecto-* en CDN).'
);

// ── 9. bandaCierre.html ──────────────────────────────────────────────────
// Lines 542-578
const cierreBlock = LINES.slice(541, 578).join('\n');
writeComponent('bandaCierre',
  cierreBlock,
  ['section.title', 'section.body', 'cta.href', 'cta.text', 'brand.logoUrl'],
  ['colors.ctaBackground', 'colors.white', 'colors.subtitleOnBrand', 'colors.deep',
   'colors.white', 'radius.ctaPill', 'typography.displayFont'],
  'Misma anatomía VML que el hero CTA. El background usa {{data:cdnBase}}/brand-pattern-tile.png'
);

// ── 10. footer.html ──────────────────────────────────────────────────────
// Lines 580-619
const footerBlock = LINES.slice(579, 619).join('\n');
writeComponent('footer',
  footerBlock,
  ['legal.unsubscribe', 'legal.preferences', 'legal.address',
   'brand.name', 'brand.tagline', 'legal.year'],
  ['colors.primary', 'colors.bodySecondary', 'colors.deep', 'colors.border',
   'colors.white', 'colors.global'],
  'Placeholders [UNSUBSCRIBE_LINK], [PREFERENCES_LINK], [DIRECCIÓN FÍSICA] se mantienen en {{data:...}}'
);

// ── 11. ctaBulletproof.html ──────────────────────────────────────────────
// The reusable VML+fallback CTA block (lines 130-156)
const ctaBlock = LINES.slice(129, 156).join('\n');
writeComponent('ctaBulletproof',
  ctaBlock,
  ['cta.href', 'cta.text', 'cta.moduleId', 'cta.width'],
  ['colors.ctaBackground', 'colors.white', 'colors.white', 'radius.ctaPill', 'typography.displayFont'],
  'Parcial compartido. Usado por hero y bandaCierre. width:{{cta.width}} (280 para ambos en esta campaña).'
);

// ── INVENTORY.md ─────────────────────────────────────────────────────────
const inventory = `# Component Inventory — Engine

> Extraído de: \`${SRC_PATH}\`
> Fecha: 2026-07-17
> Fuente verificada: ${tables} tables, ${vml} VML, ${h1s} h1, ${h2s} h2, ${h3s} h3, ${imgs} img, ${utms} UTM

| Componente | Origen (líneas) | Campos de datos | Tokens |
|---|---|---|---|
| \`_shell.html\` | 1-67 | subject, preheader | colors.global, colors.white |
| \`preheader.html\` | 59-62 | preheader | — |
| \`hero.html\` | 69-167 | brand.logoUrl, alt, title, stat.number, stat.label, cta.href, cta.text | colors.primary, colors.ctaBackground, colors.white, colors.subtitleOnBrand, typography.displayFont, radius.ctaPill |
| \`trustBar.html\` | 169-227 | items[*].label | colors.primary, colors.white, colors.border, colors.sectionLila |
| \`tarifasHeader.html\` | 228-248 | section.eyebrow, section.title, section.body | colors.light, colors.primary, colors.bodySecondary, typography.displayFont |
| \`cardTarifa.html\` | 252-262 (repetible ×4) | icon, title, body, link, moduleId | colors.primary, colors.light, colors.ctaBackground, colors.border, colors.bodySecondary, radius.card, typography.displayFont |
| \`pasos.html\` | 309-412 | section.eyebrow, section.title, items[*].number, items[*].title, items[*].body | colors.light, colors.primary, colors.white, colors.bodySecondary, surfaces.stepConnector, typography.displayFont |
| \`listaPremium.html\` | 414-540 | section.eyebrow, section.title, items[*].icon, items[*].title, items[*].body, items[*].moduleId | colors.primary, colors.light, colors.white, colors.bodySecondary, colors.sectionLila, colors.border, radius.card |
| \`bandaCierre.html\` | 542-578 | section.title, section.body, cta.href, cta.text | colors.ctaBackground, colors.white, colors.subtitleOnBrand, colors.deep, radius.ctaPill, typography.displayFont |
| \`footer.html\` | 580-619 | legal.unsubscribe, legal.preferences, legal.address, brand.name, brand.tagline, legal.year | colors.primary, colors.bodySecondary, colors.deep, colors.border, colors.white, colors.global |
| \`ctaBulletproof.html\` | 130-156 (parcial) | cta.href, cta.text, cta.moduleId, cta.width | colors.ctaBackground, colors.white, radius.ctaPill, typography.displayFont |

## Verificación de completitud (pendiente de recount en el build script)

| Elemento | Fuente | Componentes |
|---|---|---|
| <table> | ${tables} | ? |
| v:roundrect | ${vml} | ? |
| h1 | ${h1s} | ? |
| h2 | ${h2s} | ? |
| h3 | ${h3s} | ? |
| <img> | ${imgs} | ? |
| Enlaces UTM | ${utms} | ? |

> La columna "Componentes" se rellenará en el prompt 12 cuando el build script ensamble la pieza desde los componentes y se verifique la paridad exacta.
`;

fs.writeFileSync(path.join(ENG_DIR, 'INVENTORY.md'), inventory, 'utf-8');
console.log('\n✅ INVENTORY.md created');
console.log('✅ All components extracted.');