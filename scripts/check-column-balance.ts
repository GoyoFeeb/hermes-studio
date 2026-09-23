#!/usr/bin/env npx tsx
/**
 * check-column-balance.ts — bloquea si un módulo multi-columna tiene columnas (un campo de
 * texto de items[]) con longitudes muy desiguales dentro de la misma fila.
 *
 * Origen (2026-07-22): newsletter de UAX — en "columns-3-beneficios", la columna 1 tenía ~12
 * palabras (compartía espacio con un badge de promo dentro de la misma columna) y las columnas
 * 2/3 tenían ~35, dando alturas de columna muy distintas en el HTML aunque las 3 celdas fueran
 * vertical-align:top. columns-3-beneficios.html ya resuelve la mitad del problema
 * estructuralmente (el highlight ya no puede vivir dentro de una columna — ver su comentario de
 * cabecera). Este script cierra la otra mitad: el copy en sí también puede desequilibrarse sin
 * que ningún elemento extra esté de por medio, y de eso no puede protegernos una plantilla —
 * hace falta comprobarlo.
 *
 * No certifica nada por sí solo "bonito" — solo detecta un desequilibrio burdo (ratio de
 * palabras > MAX_RATIO entre la columna más larga y la más corta). Ajustar el copy para que
 * quede bien sigue siendo trabajo humano/editorial; esto es un guardarraíl, no un corrector de
 * estilo.
 *
 * Ampliado 2026-07-27: tambien bloquea títulos de banda-cierre >45 caracteres. Origen:
 * la prueba real F5 encontró que 46 caracteres rompen la promesa de una línea a 600px.
 *
 * Ampliado 2026-09-23 (auditoría): hasta ahora solo cubría "columns-3-beneficios*". Otros 5
 * componentes usan el mismo mecanismo de geometría de celda (`balancedRows`/`withCellGeometry`
 * en engine/lib/assemble.js) y podían sufrir exactamente el mismo bug de UAX sin que este gate
 * lo detectara: usp-cards*, category-grid*, lista-premium-2col, metric-strip-premium, pasos*.
 * BALANCE_CHECKS declara, por componente, qué campo de items[] comparar y con qué reparto de
 * fila (maxPerRow) — el mismo reparto que su adaptador real usa en assemble.js, para no
 * certificar contra una agrupación en filas que el motor no va a renderizar.
 *
 * Uso: npx tsx scripts/check-column-balance.ts --campaign newsletters/{year}/{client}/{campaign}
 */
import * as fs from 'fs';
import * as path from 'path';
import { parseArgs } from './lib/cli';

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

interface BalanceCheckSpec {
  /** Nombres literales de `component` en campaign-data.json cubiertos por esta regla. */
  components: string[];
  /** Campo dentro de cada ítem cuya longitud en palabras se compara (ej. "body", "subtitle"). */
  field: string;
  /** Propiedad de `data` donde vive el array de ítems — "items" salvo category-grid. */
  itemsField?: string;
  /**
   * Ítems por fila, igual que el `maxPerRow`/`perRow` real que el adaptador pasa a
   * balancedRows()/withCellGeometry() en engine/lib/assemble.js. 'all' = todos los ítems en una
   * sola fila (withCellGeometry(items, items.length, ...), sin split — el caso de metric-strip-
   * premium/pasos/trust-bar, que nunca reparten en varias filas).
   */
  maxPerRow: number | 'all';
}

// Cubre todas las variantes de contrato compatible (misma forma items[].body):
// columns-3-beneficios, -asimetrico, -sin-icono (añadida 2026-07-24, campaña BMW).
const BALANCE_CHECKS: BalanceCheckSpec[] = [
  {
    components: ['columns-3-beneficios', 'columns-3-beneficios-asimetrico', 'columns-3-beneficios-sin-icono'],
    field: 'body',
    maxPerRow: 3
  },
  // usp-cards* usa balancedRows(items, 3, ...) — mismo mecanismo, mismo campo de texto (body).
  {
    components: ['usp-cards', 'usp-cards-asimetrico', 'usp-cards-sin-icono', 'usp-cards-sin-icono-asimetrico'],
    field: 'body',
    maxPerRow: 3
  },
  // lista-premium (flat, listItems) es de una sola columna — no hay fila con la que comparar,
  // por eso no entra aquí. lista-premium-2col sí reparte con balancedRows(items, 2, ...).
  {
    components: ['lista-premium-2col'],
    field: 'body',
    maxPerRow: 2
  },
  // category-grid agrupa "categories" (no "items") con balancedRows(categories, 3, ...); el
  // campo de texto libre es subtitle (title es más corto y más rígido, menos propenso a
  // desequilibrio real, pero subtitle es donde ya se vio el bug real de fila huérfana — Fase F4).
  {
    components: ['category-grid', 'category-grid-img'],
    field: 'subtitle',
    itemsField: 'categories',
    maxPerRow: 3
  },
  // metric-strip-premium: withCellGeometry(items, items.length, ...) — todos en una fila, nunca
  // se reparte en varias. label es el único texto libre (value es una cifra corta).
  {
    components: ['metric-strip-premium'],
    field: 'label',
    maxPerRow: 'all'
  },
  // pasos/pasos-vertical: mismo adaptador, withCellGeometry(items, items.length, ...) también en
  // una sola fila (pasos-vertical apila visualmente con conector, pero comparte el mismo dato
  // base y el mismo riesgo de longitud de body desigual entre pasos).
  {
    components: ['pasos', 'pasos-vertical'],
    field: 'body',
    maxPerRow: 'all'
  },
  // trust-bar/trust-bar-inline: fijo a exactamente 3 ítems, withCellGeometry(items, 3) — una fila.
  {
    components: ['trust-bar', 'trust-bar-inline'],
    field: 'text',
    maxPerRow: 'all'
  }
];


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

    const spec = BALANCE_CHECKS.find((s) => s.components.includes(mod.component));
    if (!spec) continue;
    const items = (mod.data && mod.data[spec.itemsField || 'items']) || [];
    if (!Array.isArray(items) || items.length < 2) continue; // el schema ya exige un mínimo; si no lo cumple, no es este el gate que lo reporta

    checkedColumns++;

    // Mismo reparto en filas que el adaptador real de este componente en engine/lib/assemble.js
    // (balancedRows(items, maxPerRow, ...) o, si maxPerRow es 'all', withCellGeometry(items,
    // items.length, ...) — todos los ítems en una única fila, sin split).
    const n = items.length;
    const rowSizes: number[] = [];
    if (spec.maxPerRow === 'all' || n <= spec.maxPerRow) {
      rowSizes.push(n);
    } else {
      const rowCount = Math.ceil(n / spec.maxPerRow);
      const base = Math.floor(n / rowCount);
      const extra = n % rowCount;
      for (let r = 0; r < rowCount; r++) rowSizes.push(base + (r < extra ? 1 : 0));
    }

    let cursor = 0;
    for (const [rowIdx, size] of rowSizes.entries()) {
      const row = items.slice(cursor, cursor + size);
      cursor += size;
      const counts = row.map((it: any) => wordCount(it && it[spec.field]));
      const max = Math.max(...counts);
      const min = Math.min(...counts);
      const ratio = min === 0 ? Infinity : max / min;
      const limit = MAX_RATIO_BY_COLS[size] ?? DEFAULT_MAX_RATIO;
      const rowLabel = rowSizes.length > 1 ? ` fila ${rowIdx + 1}` : '';

      console.log(
        `   Módulo "${mod.component}"${rowLabel} (campo "${spec.field}"): ${counts.join(' / ')} palabras ` +
        `(${size} col, ratio ${ratio === Infinity ? '∞' : ratio.toFixed(2)}x, límite ${limit}x)`
      );

      if (ratio > limit) {
        failed = true;
        console.log(`     ❌ Desequilibrio > ${limit}x entre la columna más larga y la más corta de esta fila.`);
        console.log(`        Reescribe el "${spec.field}" más corto o más largo para acercarlo a los de su fila —`);
        console.log('        columnas con nº de líneas muy distinto es exactamente el bug de UAX (2026-07-22).');
      } else {
        console.log('     ✅ Dentro del margen.');
      }
    }
  }

  console.log('');
  if (checkedColumns === 0) {
    console.log('   ℹ️  Ningún módulo multi-columna cubierto por BALANCE_CHECKS en esta campaña — nada que comprobar.\n');
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
