#!/usr/bin/env npx tsx
/**
 * check-structural-differentiation.ts — Gate de diferenciación estructural (2026-07-27, ampliado
 * 2026-07-28 — Fase F2, ver docs/diagnostico-y-propuesta-flexibilidad-estructural-2026-07-28.md).
 * Verifica que la newsletter NO es una mera copia de la secuencia por defecto del patrón,
 * y que el agente 03 documentó una traducción real de la página de la marca a la estructura
 * del email.
 *
 * Checks:
 * 1. Existe 03-strategy/brand-structure-translation.md.
 * 2. El archivo cita layout.contentRhythm o layout.brandStructure.
 * 3. El archivo mapea al menos 2 secciones reales de la página a módulos del email.
 * 4. Si una campaña fotografia-primero repite intro-cta 2+ veces, debe justificarlo.
 * 5. Si la secuencia coincide exactamente con la comodín DEL PATRÓN ELEGIDO (los 3 patrones
 *    tienen su propia comodín desde Fase F2 — antes solo fotografia-primero la tenía, dejando
 *    saving/institutional sin ningún check equivalente), debe existir justificación explícita.
 * 6. Si la página real documenta editorial-foto-texto como traducible y la campaña no usa
 *    ningún módulo editorial-foto-texto*, el gate debe avisar (o fallar si productionReady).
 * 7. columns-3-beneficios-sin-icono con métricas técnicas → recomienda metric-strip-premium.
 * 8. (Fase F2, nuevo) Comparación CRUZADA real: ¿la secuencia de esta campaña coincide ≥80% con
 *    la de ≥2 marcas DISTINTAS que usan el mismo patrón? Hasta esta fase, el único check de
 *    "genericidad" comparaba una campaña contra una única constante hardcodeada, nunca contra
 *    otra campaña real — prueba directa del hueco: las campañas "brand-native" de Audi y BMW
 *    (2026-08-01), construidas el mismo día para demostrar diferenciación estructural, resultaron
 *    byte-idénticas entre sí sin que este gate lo detectara nunca (ninguna de las dos coincidía
 *    con la constante única que existía entonces). Aviso, no bloqueante — igual que el resto de
 *    checks de esta fase, necesita ejercerse contra datos reales antes de poder bloquear con
 *    confianza (mismo criterio de "Nivel 4/5" ya usado en este sistema).
 *
 * Uso:
 *   npx tsx scripts/check-structural-differentiation.ts --campaign newsletters/{year}/{client}/{campaign}
 */
import * as fs from 'fs';
import * as path from 'path';
import { parseArgs } from './lib/cli';

const ROOT = path.resolve(import.meta.dirname, '..');

// Secuencia comodín por patrón — cada una es la traducción directa del orden por defecto
// documentado en patterns/{patrón}.md. 'hero-*'/'banda-cierre-*' son comodines: la elección
// concreta de variante de hero/cierre ya la verifica el Gate 11 (check-hero-decision.ts) por
// separado — este check es sobre el ORDEN del cuerpo, no sobre qué variante de hero se usó.
const PATTERN_DEFAULT_SEQUENCES: Record<string, string[]> = {
  'fotografia-primero': ['header-logo', 'hero-*', 'intro-cta', 'columns-3-beneficios-sin-icono', 'banda-cierre-*', 'footer'],
  'saving': ['hero-*', 'trust-bar', 'card-tarifa', 'pasos', 'lista-premium', 'banda-cierre-*', 'footer'],
  'institutional': ['header-logo', 'hero-*', 'intro-cta', 'columns-3-beneficios', 'usp-cards', 'banda-cierre-*', 'footer']
};

/** Quita header-logo/footer (siempre presentes, no discriminan) y sustituye la variante concreta
 * de hero/banda-cierre por un comodín — esa elección ya la audita Gate 11 por separado. */
function normalizeSequence(componentNames: string[]): string[] {
  return componentNames
    .filter((n) => n !== 'header-logo' && n !== 'footer')
    .map((n) => (n.startsWith('hero-') ? 'hero-*' : n.startsWith('banda-cierre') ? 'banda-cierre-*' : n));
}

/** Longitud de la subsecuencia común más larga — O(n·m), sobra para secuencias de 3-9 módulos. */
function longestCommonSubsequenceLength(a: string[], b: string[]): number {
  const dp: number[][] = Array.from({ length: a.length + 1 }, () => new Array(b.length + 1).fill(0));
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      dp[i][j] = a[i - 1] === b[j - 1] ? dp[i - 1][j - 1] + 1 : Math.max(dp[i - 1][j], dp[i][j - 1]);
    }
  }
  return dp[a.length][b.length];
}

function sequenceSimilarity(a: string[], b: string[]): number {
  if (a.length === 0 && b.length === 0) return 1;
  return longestCommonSubsequenceLength(a, b) / Math.max(a.length, b.length, 1);
}

function extractBrandSlug(brandField: string | undefined): string | null {
  if (!brandField) return null;
  const m = brandField.match(/^brands\/([^/]+)\//);
  return m ? m[1] : null;
}

interface CampaignFingerprint {
  campaignDir: string;
  brand: string;
  pattern: string;
  sequence: string[];
}

/** Recorre newsletters/{año}/{cliente}/{campaña}/06-data/campaign-data.json — todas las campañas
 * reales del motor, sin asumir un año fijo. Campañas con JSON inválido/ilegible se ignoran (no es
 * responsabilidad de este gate diagnosticarlas, ya lo hace Gate 1). */
function findAllRealCampaigns(root: string): CampaignFingerprint[] {
  const results: CampaignFingerprint[] = [];
  const newslettersDir = path.join(root, 'newsletters');
  if (!fs.existsSync(newslettersDir)) return results;
  for (const year of fs.readdirSync(newslettersDir)) {
    const yearDir = path.join(newslettersDir, year);
    if (!fs.statSync(yearDir).isDirectory()) continue;
    for (const client of fs.readdirSync(yearDir)) {
      const clientDir = path.join(yearDir, client);
      if (!fs.statSync(clientDir).isDirectory()) continue;
      for (const campaign of fs.readdirSync(clientDir)) {
        const campaignDir = path.join(clientDir, campaign);
        try {
          if (!fs.statSync(campaignDir).isDirectory()) continue;
          const dataPath = path.join(campaignDir, '06-data', 'campaign-data.json');
          if (!fs.existsSync(dataPath)) continue;
          const d = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
          const seq = (d.modules || []).map((m: any) => m.component);
          results.push({
            campaignDir,
            brand: extractBrandSlug(d.brand) || client,
            pattern: d.pattern || 'unknown',
            sequence: normalizeSequence(seq)
          });
        } catch {
          continue;
        }
      }
    }
  }
  return results;
}


function main(): void {
  const args = parseArgs();
  if (!args.campaign) {
    console.error('\n  ❌ Error: falta --campaign\n');
    console.error('  Uso: npx tsx scripts/check-structural-differentiation.ts --campaign newsletters/{year}/{client}/{campaign}\n');
    process.exit(1);
  }

  const campaignDir = path.isAbsolute(args.campaign) ? args.campaign : path.resolve(ROOT, args.campaign);
  const dataPath = path.join(campaignDir, '06-data', 'campaign-data.json');
  const brandTranslationPath = path.join(campaignDir, '03-strategy', 'brand-structure-translation.md');
  const moduleSelectionPath = path.join(campaignDir, '03-strategy', 'module-selection.md');
  const brandContentRhythmPath = path.join(campaignDir, '02-analysis', 'brand-analysis.md');

  console.log('\n═══════════════════════════════════════════════════');
  console.log('   check-structural-differentiation');
  console.log('═══════════════════════════════════════════════════\n');

  if (!fs.existsSync(dataPath)) {
    console.log(`   ⏭️  No existe ${dataPath} — omitida (no es una campaña del motor).\n`);
    process.exit(0);
  }

  const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
  const componentNames: string[] = (data.modules || []).map((m: any) => m.component);
  const pattern: string = data.pattern || 'unknown';
  const productionReady: boolean = data.metadata?.productionReady === true;
  const isTestCampaign: boolean = data.metadata?.isTestCampaign === true;

  console.log(`   Patrón: ${pattern}`);
  console.log(`   Módulos (${componentNames.length}): ${componentNames.join(' → ')}`);
  console.log(`   productionReady: ${productionReady}`);
  console.log(`   isTestCampaign: ${isTestCampaign}\n`);

  let allPassed = true;
  const warnings: string[] = [];

  // ── Check 1: existe brand-structure-translation.md ────────────────────────
  console.log('   1) ¿Existe 03-strategy/brand-structure-translation.md?');
  if (!fs.existsSync(brandTranslationPath)) {
    console.log('      ❌ NO — el documento de traducción estructural es obligatorio.\n');
    if (productionReady) {
      allPassed = false;
    } else {
      warnings.push('Falta brand-structure-translation.md — bloquea en producción, aviso en test.');
      console.log('      ⚠️  Falta — bloquea en producción, aviso en campaña de test.\n');
    }
  } else {
    console.log('      ✅ Sí');
    const translationText = fs.readFileSync(brandTranslationPath, 'utf8');

    // ── Check 2: cita contentRhythm o brandStructure ────────────────────────
    console.log('   2) ¿Cita layout.contentRhythm o layout.brandStructure?');
    const hasContentRhythm = /contentRhythm|brandStructure|compositionArchetype/i.test(translationText);
    if (hasContentRhythm) {
      console.log('      ✅ Sí — referencia a estructura de página real presente.\n');
    } else {
      warnings.push('brand-structure-translation.md no cita contentRhythm ni brandStructure.');
      console.log('      ⚠️  No se encontró referencia a contentRhythm o brandStructure.\n');
    }

    // ── Check 3: mapea al menos 2 secciones ─────────────────────────────────
    console.log('   3) ¿Mapea al menos 2 secciones reales a módulos del email?');
    const sectionMentions = (translationText.match(/➡️|→|traduce|se traduce|emailTranslation|module/gi) || []).length;
    if (sectionMentions >= 2) {
      console.log('      ✅ Sí (al menos 2 mapeos detectados).\n');
    } else {
      warnings.push('brand-structure-translation.md menciona menos de 2 mapeos sección→módulo.');
      console.log('      ⚠️  Solo se detectaron ' + sectionMentions + ' posibles mapeos.\n');
    }
  }

  // ── Check 4: repetición de intro-cta en fotografia-primero ────────────────
  console.log('   4) ¿Se repite intro-cta 2+ veces en patrón fotografia-primero?');
  if (pattern === 'fotografia-primero') {
    const introCtaCount = componentNames.filter((n: string) =>
      n === 'intro-cta' || n === 'intro-cta-asimetrico'
    ).length;
    if (introCtaCount >= 2) {
      console.log(`      ⚠️  intro-cta aparece ${introCtaCount} veces.`);
      const hasJustification = fs.existsSync(brandTranslationPath)
        ? fs.readFileSync(brandTranslationPath, 'utf8').toLowerCase().includes('justific') ||
          fs.readFileSync(brandTranslationPath, 'utf8').toLowerCase().includes('sin imágenes') ||
          fs.readFileSync(brandTranslationPath, 'utf8').toLowerCase().includes('text-only')
        : false;
      if (hasJustification || (fs.existsSync(moduleSelectionPath) && (
        fs.readFileSync(moduleSelectionPath, 'utf8').toLowerCase().includes('sin imágenes') ||
        fs.readFileSync(moduleSelectionPath, 'utf8').toLowerCase().includes('text-only')
      ))) {
        console.log('      ✅ Justificado — se documenta que no hay imágenes secundarias útiles.\n');
      } else {
        warnings.push(`intro-cta aparece ${introCtaCount} veces sin justificación documentada en brand-structure-translation.md o module-selection.md.`);
        console.log('      ❌ Sin justificación — preferir editorial-foto-texto* si hay imágenes.\n');
        allPassed = false;
      }
    } else {
      console.log('      ✅ No se repite (0-1 apariciones).\n');
    }
  } else {
    console.log('      ⏭️  No aplica (patrón ' + pattern + ', no fotografia-primero).\n');
  }

  // ── Check 5: secuencia coincide con la comodín del PATRÓN elegido ──────────
  console.log('   5) ¿La secuencia coincide exactamente con la secuencia comodín de este patrón?');
  const defaultBody = PATTERN_DEFAULT_SEQUENCES[pattern];
  if (!defaultBody) {
    console.log(`      ⏭️  No hay secuencia comodín definida para el patrón "${pattern}" (patrón nuevo, sin comodín registrado todavía).\n`);
  } else {
    const normalizedSequence = normalizeSequence(componentNames);
    const normalizedDefault = normalizeSequence(defaultBody);

    const isExactDefaultMatch = (
      normalizedSequence.length === normalizedDefault.length &&
      normalizedSequence.every((n: string, i: number) => n === normalizedDefault[i])
    );

    if (isExactDefaultMatch) {
      console.log('      ⚠️  La secuencia activa coincide exactamente con la secuencia comodín.');
      const usesEditorial = componentNames.some((n: string) =>
        n === 'editorial-foto-texto' || n === 'editorial-foto-texto-inverso'
      );
      if (usesEditorial) {
        console.log('      ✅ Pero usa editorial-foto-texto*, lo que rompe el patrón comodín.\n');
      } else {
        const translationExists = fs.existsSync(brandTranslationPath);
        const hasJustification = translationExists
          ? /justific|es el orden|por defecto|es correcto|es intencional/i.test(fs.readFileSync(brandTranslationPath, 'utf8'))
          : false;
        if (hasJustification) {
          console.log('      ✅ Justificado en brand-structure-translation.md.\n');
        } else {
          warnings.push('La secuencia coincide exactamente con la comodín y no hay justificación explícita en brand-structure-translation.md.');
          console.log('      ❌ Sin justificar — si este orden es correcto para la marca, debe documentarse.\n');
          allPassed = false;
        }
      }
    } else {
      console.log('      ✅ No coincide — la secuencia difiere de la comodín.\n');
    }
  }

  // ── Check 6: editorial-foto-texto disponible en página real pero no usado ─
  console.log('   6) Si la página real tiene bloques foto+texto, ¿se usó editorial-foto-texto*?');
  const translationExists = fs.existsSync(brandTranslationPath);
  let pageHasEditorialSections = false;

  if (translationExists) {
    const translationText = fs.readFileSync(brandTranslationPath, 'utf8');
    pageHasEditorialSections = /editorial.foto.texto|foto.texto|foto.*texto|bloque editorial|photo.*text/i.test(translationText);
  }

  const campaignUsesEditorial = componentNames.some((n: string) =>
    n === 'editorial-foto-texto' || n === 'editorial-foto-texto-inverso'
  );

  if (pageHasEditorialSections && !campaignUsesEditorial) {
    if (translationExists) {
      const translationText = fs.readFileSync(brandTranslationPath, 'utf8');
      const excludedWithReason = /no se traduce|no aplica|se omite|no es necesario|no hay imágenes/i.test(translationText);
      if (excludedWithReason) {
        console.log('      ✅ Se documenta que las secciones foto+texto no se traducen al email.\n');
      } else {
        warnings.push('La página real tiene secciones foto+texto traducibles pero no se usó editorial-foto-texto* y no se documenta por qué.');
        console.log('      ⚠️  La página real documenta bloques foto+texto traducibles pero la campaña no los usa, sin justificar.\n');
        if (productionReady) {
          allPassed = false;
        }
      }
    }
  } else if (campaignUsesEditorial) {
    console.log('      ✅ Usa editorial-foto-texto*, traduciendo directamente de la página real.\n');
  } else {
    console.log('      ⏭️  No hay evidencia de secciones foto+texto en la página real, o no hay translation doc.\n');
  }

  // ── Check 7: columns-3-beneficios-sin-icono con métricas técnicas ──────────
  console.log('   7) ¿Usa columns-3-beneficios-sin-icono para métricas técnicas (kW, km, s, %, CV, V, Nm)?');
  const METRIC_PATTERN = /\b\d+[.,]?\d*\s*(kW|km|s|%|CV|V|Nm)\b/i;
  let metricColumnsDetected = false;

  for (const mod of data.modules || []) {
    if (mod.component === 'columns-3-beneficios-sin-icono' || mod.component === 'columns-3-beneficios') {
      const items = mod.data?.items || [];
      const metricItems = items.filter((item: any) => {
        const title = item.title || '';
        const body = item.body || '';
        return METRIC_PATTERN.test(title);
      });
      if (metricItems.length >= 2) {
        metricColumnsDetected = true;
        const metricNames = metricItems.map((i: any) => i.title).join(', ');
        console.log(`      ⚠️  Detected ${metricItems.length} item(s) con métricas: ${metricNames}`);
        const translationExists = fs.existsSync(brandTranslationPath);
        const hasJustification = translationExists
          ? /metric-strip-premium|tira de métricas|stats.strip/i.test(fs.readFileSync(brandTranslationPath, 'utf8'))
          : false;
        if (hasJustification) {
          console.log('      ✅ Se justifica el uso de columns-3-beneficios (no aplica metric-strip-premium).\n');
        } else {
          warnings.push(`columns-3-beneficios-sin-icono usado con métricas técnicas (${metricNames}). Recomendado: metric-strip-premium para stats strips limpias sin caja highlight.`);
          console.log('      ❌ Recomendado: usar metric-strip-premium para stats strips limpias sin caja highlight.\n');
          if (productionReady) {
            allPassed = false;
          }
        }
      }
    }
  }

  if (!metricColumnsDetected) {
    console.log('      ✅ No usa columns-3-beneficios para métricas — o usa metric-strip-premium.\n');
  }

  // ── Check 8: comparación cruzada real contra otras campañas reales (Fase F2) ──
  console.log('   8) ¿La secuencia colisiona con la de otras marcas reales del mismo patrón?');
  const SIMILARITY_THRESHOLD = 0.8;
  const currentSeqNormalized = normalizeSequence(componentNames);
  const currentBrand = extractBrandSlug(data.brand) || path.basename(path.dirname(campaignDir));
  const allCampaigns = findAllRealCampaigns(ROOT);
  const collisions: { brand: string; campaignDir: string; similarity: number }[] = [];

  for (const other of allCampaigns) {
    if (path.resolve(other.campaignDir) === path.resolve(campaignDir)) continue; // uno mismo
    if (other.pattern !== pattern) continue; // solo mismo patrón — comparar entre patrones distintos no es evidencia de nada
    if (other.brand === currentBrand) continue; // misma marca en varias campañas: coherencia esperada, no genericidad
    const similarity = sequenceSimilarity(currentSeqNormalized, other.sequence);
    if (similarity >= SIMILARITY_THRESHOLD) {
      collisions.push({ brand: other.brand, campaignDir: other.campaignDir, similarity });
    }
  }

  const distinctCollidingBrands = new Set(collisions.map((c) => c.brand));
  if (distinctCollidingBrands.size >= 2) {
    const detail = collisions
      .map((c) => `${c.brand}/${path.basename(c.campaignDir)} (${(c.similarity * 100).toFixed(0)}%)`)
      .join(', ');
    warnings.push(
      `La secuencia coincide ≥${SIMILARITY_THRESHOLD * 100}% con ${distinctCollidingBrands.size} marcas distintas ` +
      `del mismo patrón (${detail}) — riesgo de estructura genérica intercambiable, no solo coherencia de marca propia. ` +
      `Aviso no bloqueante (Fase F2) — ver docs/diagnostico-y-propuesta-flexibilidad-estructural-2026-07-28.md.`
    );
    console.log(`      ⚠️  Coincide con ${distinctCollidingBrands.size} marcas distintas: ${detail}\n`);
  } else if (collisions.length > 0) {
    console.log(`      ⏭️  Coincide con ${collisions.length} campaña(s) pero de una sola marca distinta — no es evidencia suficiente de genericidad por sí sola.\n`);
  } else {
    console.log(`      ✅ Ninguna otra marca del mismo patrón coincide ≥${SIMILARITY_THRESHOLD * 100}%.\n`);
  }

  // ── Resultado final ───────────────────────────────────────────────────────
  console.log('═══════════════════════════════════════════════════\n');
  if (allPassed && warnings.length === 0) {
    console.log('   ✅ check-structural-differentiation: PASS\n');
    process.exit(0);
  } else if (allPassed && warnings.length > 0) {
    console.log('   ✅ check-structural-differentiation: PASS (con avisos)\n');
    for (const w of warnings) console.log(`   ⚠️  ${w}`);
    console.log('');
    process.exit(0);
  } else {
    console.log('   ❌ check-structural-differentiation: FAIL\n');
    for (const w of warnings) console.log(`   ⚠️  ${w}`);
    console.log('');
    process.exit(1);
  }
}

main();
