#!/usr/bin/env npx tsx
/**
 * check-column-balance.ts — bloquea si un módulo "columns-3-beneficios" tiene columnas
 * (items[].body) con longitudes de texto muy desiguales.
 *
 * Origen (2026-07-22): newsletter de UAX — la columna 1 tenía ~12 palabras (compartía espacio
 * con un badge de promo dentro de la misma columna) y las columnas 2/3 tenían ~35, dando
 * alturas de columna muy distintas en el HTML aunque las 3 celdas fueran vertical-align:top.
 * columns-3-beneficios.html ya resuelve la mitad del problema estructuralmente (el highlight
 * ya no puede vivir dentro de una columna — ver su comentario de cabecera). Este script cierra
 * la otra mitad: el copy en sí también puede desequilibrarse sin que ningún elemento extra esté
 * de por medio, y de eso no puede protegernos una plantilla — hace falta comprobarlo.
 *
 * No certifica nada por sí solo "bonito" — solo detecta un desequilibrio burdo (ratio de
 * palabras > MAX_RATIO entre la columna más larga y la más corta). Ajustar el copy para que
 * quede bien sigue siendo trabajo humano/editorial; esto es un guardarraíl, no un corrector de
 * estilo.
 *
 * Ampliado 2026-07-27: tambien bloquea títulos de banda-cierre >45 caracteres. Origen:
 * la prueba real F5 encontró que 46 caracteres rompen la promesa de una línea a 600px.
 *
 * Uso: npx tsx scripts/check-column-balance.ts --campaign newsletters/{year}/{client}/{campaign}
 */
import * as fs from 'fs';
import * as path from 'path';

const ROOT = path.resolve(import.meta.dirname, '..');

// Ratio máximo (palabras de la columna más larga / de la más corta) por nº de columnas EN LA
// MISMA FILA. Ampliado 2026-07-24 (ronda "conteos fijos", ver engine/CHANGELOG.md): hasta esta
// fecha era un 1.6 único, porque el módulo solo admitía exactamente 3 columnas. Ahora admite
// 2-4 y se reparten en filas equilibradas (2→[2], 3→[3], 4→[2,2]), así que el margen se calcula
// por fila real, no sobre el módulo entero: con 2 columnas anchas (50% cada una) una diferencia
// de longitud se nota MENOS que con 3 estrechas, así que el umbral puede ser más laxo; con 4 en
// dos filas, lo que importa es el equilibrio dentro de cada fila, no entre filas.
const MAX_RATIO_BY_COLS: Record<number, number> = { 2: 2.0, 3: 1.6, 4: 1.6 };
const DEFAULT_MAX_RATIO = 1.6;
const MAX_CLOSING_TITLE_CHARS = 45;

function parseArgs(): Record<string, string> {
  const args = process.argv.slice(2);
  const out: Record<string, string> = {};
  for (let i = 0; i < args.length; i++) {
    const key = args[i].replace(/^--/, '');
    const next = args[i + 1];
    if (next && !next.startsWith('--')) {
      out[key] = next;
      i++;
    } else {
      out[key] = 'true';
    }
  }
  return out;
}

function wordCount(s: string): number {
  return String(s || '').trim().split(/\s+/).filter(Boolean).length;
}

function charCount(s: string): number {
  return Array.from(String(s || '').trim()).length;
}

function main(): void {
  const args = parseArgs();
  if (!args.campaign) {
    console.error('\n  ❌ Error: falta --campaign\n');
    console.error('  Uso: npx tsx scripts/check-column-balance.ts --campaign newsletters/{year}/{client}/{campaign}\n');
    process.exit(1);
  }

  const campaignDir = path.isAbsolute(args.campaign) ? args.campaign : path.resolve(ROOT, args.campaign);
  const dataPath = path.join(campaignDir, '06-data', 'campaign-data.json');
  if (!fs.existsSync(dataPath)) {
    console.error(`\n  ❌ No existe ${dataPath}\n`);
    process.exit(1);
  }

  const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
  const modules = Array.isArray(data.modules) ? data.modules : [];

  console.log('\n═══════════════════════════════════════════════════');
  console.log('   check-column-balance — columnas + título de cierre');
  console.log('═══════════════════════════════════════════════════\n');

  let checkedColumns = 0;
  let checkedClosingTitles = 0;
  let failed = false;

  for (const mod of modules) {
    if (mod.component === 'banda-cierre' || mod.component === 'banda-cierre-asimetrico') {
      checkedClosingTitles++;
      const title = mod.data && mod.data.title;
      const count = charCount(title);
      console.log(
        `   Módulo "${mod.component}": título de cierre ${count} caracteres ` +
        `(límite ${MAX_CLOSING_TITLE_CHARS})`
      );
      if (count > MAX_CLOSING_TITLE_CHARS) {
        failed = true;
        console.log('     ❌ Título demasiado largo para mantener 1 línea a 600px.');
        console.log(`        Reduce el título a ${MAX_CLOSING_TITLE_CHARS} caracteres o menos.`);
      } else {
        console.log('     ✅ Dentro del límite.');
      }
      console.log('');
    }

    // Cubre todas las variantes de contrato compatible (misma forma items[].body):
    // columns-3-beneficios, -asimetrico, -sin-icono (añadida 2026-07-24, campaña BMW).
    if (mod.component !== 'columns-3-beneficios' &&
        mod.component !== 'columns-3-beneficios-asimetrico' &&
        mod.component !== 'columns-3-beneficios-sin-icono') continue;
    const items = (mod.data && mod.data.items) || [];
    if (!Array.isArray(items) || items.length < 2) continue; // el schema ya exige 2-4; si no lo cumple, no es este el gate que lo reporta

    checkedColumns++;

    // Mismo reparto en filas que engine/lib/assemble.js → balancedRows(items, 3):
    // 2→[2] · 3→[3] · 4→[2,2]. Se comprueba el equilibrio DENTRO de cada fila.
    const n = items.length;
    const rowSizes: number[] = [];
    if (n <= 3) rowSizes.push(n);
    else {
      const rowCount = Math.ceil(n / 3);
      const base = Math.floor(n / rowCount);
      const extra = n % rowCount;
      for (let r = 0; r < rowCount; r++) rowSizes.push(base + (r < extra ? 1 : 0));
    }

    let cursor = 0;
    for (const [rowIdx, size] of rowSizes.entries()) {
      const row = items.slice(cursor, cursor + size);
      cursor += size;
      const counts = row.map((it: any) => wordCount(it && it.body));
      const max = Math.max(...counts);
      const min = Math.min(...counts);
      const ratio = min === 0 ? Infinity : max / min;
      const limit = MAX_RATIO_BY_COLS[size] ?? DEFAULT_MAX_RATIO;
      const rowLabel = rowSizes.length > 1 ? ` fila ${rowIdx + 1}` : '';

      console.log(
        `   Módulo "${mod.component}"${rowLabel}: ${counts.join(' / ')} palabras ` +
        `(${size} col, ratio ${ratio === Infinity ? '∞' : ratio.toFixed(2)}x, límite ${limit}x)`
      );

      if (ratio > limit) {
        failed = true;
        console.log(`     ❌ Desequilibrio > ${limit}x entre la columna más larga y la más corta de esta fila.`);
        console.log('        Reescribe el body más corto o más largo para acercarlo a los de su fila —');
        console.log('        columnas con nº de líneas muy distinto es exactamente el bug de UAX (2026-07-22).');
      } else {
        console.log('     ✅ Dentro del margen.');
      }
    }
  }

  console.log('');
  if (checkedColumns === 0) {
    console.log('   ℹ️  No hay módulos "columns-3-beneficios" en esta campaña — nada que comprobar.\n');
  }
  if (checkedClosingTitles === 0) {
    console.log('   ℹ️  No hay módulos "banda-cierre" en esta campaña — nada que comprobar.\n');
  }

  if (failed) {
    console.log('   ❌ check-column-balance: FAIL\n');
    process.exit(1);
  }

  console.log('   ✅ check-column-balance: OK\n');
}

main();
