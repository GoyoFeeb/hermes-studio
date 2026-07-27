#!/usr/bin/env npx tsx
/**
 * validate-hero-component.ts — valida un hero de marca generado (Claude design) contra el
 * contrato (scripts/hero-design/HERO-DESIGN-CONTRACT.md) ANTES de aceptarlo en el motor.
 *
 * Uso:
 *   npx tsx scripts/validate-hero-component.ts --brand tarifalo            # solo validar
 *   npx tsx scripts/validate-hero-component.ts --brand tarifalo --accept   # validar + integrar
 *
 * --accept: mueve el candidato a engine/components/, regenera el lock (check-engine --update)
 * y añade la entrada al CHANGELOG del motor. La línea del patrón ya cubre hero-marca-* y el
 * adaptador/schema son genéricos — no hay más pasos por marca.
 */
import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

const ROOT = path.resolve(import.meta.dirname, '..');

function arg(name: string): string | undefined {
  const i = process.argv.indexOf('--' + name);
  return i >= 0 && !String(process.argv[i + 1] || '').startsWith('--') ? process.argv[i + 1] : undefined;
}

function main(): void {
  const brand = arg('brand');
  const accept = process.argv.includes('--accept');
  if (!brand) { console.error('Uso: --brand {slug} [--accept]'); process.exit(1); }

  const name = `hero-marca-${brand}`;
  const candPath = path.join(ROOT, 'engine', 'components', '_candidates', `${name}.html`);
  const packPath = path.join(ROOT, 'brands', brand, 'tokens', 'brand-tokens.json');
  const errors: string[] = [];

  if (!fs.existsSync(candPath)) { console.error(`❌ No existe el candidato ${candPath}`); process.exit(1); }
  if (!fs.existsSync(packPath)) { console.error(`❌ No existe el brand pack ${packPath}`); process.exit(1); }
  const raw = fs.readFileSync(candPath, 'utf8');
  const tokens = JSON.parse(fs.readFileSync(packPath, 'utf8'));

  // 1) cabecera de documentación + markup <tr>...</tr>
  const { stripLeadingComment, renderTemplate } = require(path.join(ROOT, 'engine', 'lib', 'assemble.js'));
  if (!/^\s*<!--/.test(raw)) errors.push('Falta el comentario de documentación de cabecera.');
  const body = stripLeadingComment(raw);
  if (!body.trimStart().startsWith('<tr>')) errors.push('El markup no empieza en <tr>.');
  if (!body.trimEnd().endsWith('</tr>')) errors.push('El markup no termina en </tr>.');

  // 2) patrones prohibidos
  const forbidden: Array<[RegExp, string]> = [
    [/<div[\s>]/i, '<div>'], [/<style[\s>]/i, '<style>'], [/<script[\s>]/i, '<script>'],
    [/<svg[\s>]/i, '<svg>'], [/display\s*:\s*flex/i, 'flexbox'], [/display\s*:\s*grid/i, 'grid'],
    [/position\s*:/i, 'position:'], [/\.svg["')]/i, 'imagen .svg'],
    [/@media/i, '@media propio (usar las clases mobile-* del shell)'],
  ];
  for (const [re, label] of forbidden) if (re.test(body)) errors.push(`Prohibido: ${label}`);

  // 3) CTA solo vía el parcial compartido
  if (!body.includes('{{include:cta-bulletproof}}')) errors.push('El CTA debe ser {{include:cta-bulletproof}}.');
  if (/v:roundrect/i.test(body)) errors.push('VML propio detectado — el VML vive solo en cta-bulletproof.');

  // 4) placeholders de datos dentro del contrato hero-centrado
  const allowedData = new Set(['hero.brandName', 'hero.h1', 'hero.subtitle']);
  for (const m of body.matchAll(/\{\{data:([a-zA-Z0-9_.\[\]]+)\}\}/g)) {
    if (!allowedData.has(m[1])) errors.push(`{{data:${m[1]}}} fuera del contrato (permitidos: ${[...allowedData].join(', ')}).`);
  }

  // 5) tokens: todos los paths existen en el pack, y cero hex de marca hardcodeado
  const resolveTok = (tp: string) => tp.split('.').reduce((cur: any, p: string) => (cur && typeof cur === 'object' ? cur[p] : undefined), tokens);
  for (const m of body.matchAll(/\{\{token:([a-zA-Z0-9_.]+)\}\}/g)) {
    const v = resolveTok(m[1]);
    if (v === undefined || (v !== null && typeof v === 'object')) errors.push(`{{token:${m[1]}}} no resuelve a un valor escalar en el pack de ${brand}.`);
  }
  const packHexes = new Set<string>();
  (function walk(o: any) {
    if (o && typeof o === 'object') Object.entries(o).forEach(([k, v]) => { if (!k.startsWith('_')) walk(v); });
    else if (typeof o === 'string' && /^#[0-9A-Fa-f]{6}$/.test(o) && o.toUpperCase() !== '#FFFFFF') packHexes.add(o.toUpperCase());
  })(tokens);
  for (const m of body.matchAll(/#[0-9A-Fa-f]{6}/g)) {
    if (packHexes.has(m[0].toUpperCase())) errors.push(`Hex de marca hardcodeado: ${m[0]} (usar {{token:...}}).`);
  }

  // 6) render de humo con datos de muestra + balance de tablas
  try {
    const scope = {
      hero: { brandName: 'Marca', h1: 'Titular de prueba', subtitle: 'Subtítulo de prueba.', cta: { href: 'https://example.com/x', label: 'Probar' } },
      cta: { href: 'https://example.com/x', label: 'Probar' }
    };
    const out = renderTemplate(body, scope, tokens, path.join(ROOT, 'engine', 'components'), { file: name });
    if (/\{\{/.test(out)) errors.push('Quedan placeholders sin resolver tras el render de humo.');
    const open = (out.match(/<table[ >]/g) || []).length, close = (out.match(/<\/table>/g) || []).length;
    if (open !== close) errors.push(`Tablas desbalanceadas en el render (${open} abiertas, ${close} cerradas).`);
  } catch (err) {
    errors.push(`Render de humo falló: ${(err as Error).message}`);
  }

  if (errors.length) {
    console.error(`\n❌ ${name} NO cumple el contrato (${errors.length}):\n`);
    for (const e of errors) console.error(`   ❌ ${e}`);
    console.error('');
    process.exit(1);
  }
  console.log(`\n✅ ${name} cumple el contrato.`);

  if (!accept) { console.log(`   Para integrarlo al motor: añadir --accept\n`); return; }

  const destPath = path.join(ROOT, 'engine', 'components', `${name}.html`);
  fs.copyFileSync(candPath, destPath);
  fs.rmSync(candPath);
  fs.appendFileSync(path.join(ROOT, 'engine', 'CHANGELOG.md'),
    `\n## ${new Date().toISOString().slice(0, 10)} — hero de marca aceptado: ${name}\n\n` +
    `Generado con Claude design (captura de la web + brand pack + contrato) y aceptado tras pasar\n` +
    `validate-hero-component.ts (contrato completo + render de humo). Contrato de datos: el de\n` +
    `hero-centrado (adaptador/schema/patrón genéricos hero-marca-*). Revisión visual final: QA (08)\n` +
    `en la primera campaña que lo use.\n`);
  execSync(`"${path.join(ROOT, 'node_modules', '.bin', 'tsx')}" "${path.join(ROOT, 'scripts', 'check-engine-integrity.ts')}" --update`, { cwd: ROOT, stdio: 'inherit' });
  console.log(`✅ Integrado: ${destPath} (CHANGELOG + lock actualizados)\n`);
}
main();
