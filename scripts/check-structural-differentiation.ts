#!/usr/bin/env npx tsx
/**
 * check-structural-differentiation.ts — Gate de diferenciación estructural (2026-07-27).
 * Verifica que la newsletter NO es una mera copia de la secuencia por defecto del patrón,
 * y que el agente 03 documentó una traducción real de la página de la marca a la estructura
 * del email.
 *
 * Checks:
 * 1. Existe 03-strategy/brand-structure-translation.md.
 * 2. El archivo cita layout.contentRhythm o layout.brandStructure.
 * 3. El archivo mapea al menos 2 secciones reales de la página a módulos del email.
 * 4. Si una campaña fotografia-primero repite intro-cta 2+ veces, debe justificarlo.
 * 5. Si la secuencia coincide exactamente con la comodín:
 *    header-logo → hero-imagen → intro-cta → columns-3-beneficios-sin-icono → banda-cierre → footer
 *    (sin usar ningún editorial-foto-texto*), debe existir justificación explícita.
 * 6. Si la página real documenta editorial-foto-texto como traducible y la campaña no usa
 *    ningún módulo editorial-foto-texto*, el gate debe avisar (o fallar si productionReady).
 *
 * Uso:
 *   npx tsx scripts/check-structural-differentiation.ts --campaign newsletters/{year}/{client}/{campaign}
 */
import * as fs from 'fs';
import * as path from 'path';

const ROOT = path.resolve(import.meta.dirname, '..');

// La secuencia comodín que indica "sin traducción estructural real"
const DEFAULT_SEQUENCE = [
  'header-logo',
  'hero-imagen',
  'intro-cta',
  'columns-3-beneficios-sin-icono',
  'banda-cierre',
  'footer'
];

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

  // ── Check 5: secuencia coincide con la comodín sin editorial ──────────────
  console.log('   5) ¿La secuencia coincide exactamente con la secuencia comodín sin editorial-foto-texto*?');
  // Normalizamos: quitamos opcionales ausentes para comparar
  const normalizedSequence = componentNames.filter((n: string) =>
    n !== 'header-logo' && n !== 'footer' // siempre presentes
  );
  const defaultBody = DEFAULT_SEQUENCE.filter(n =>
    n !== 'header-logo' && n !== 'footer'
  );

  // Comparar: los módulos activos (sin header-logo/footer) deben diferir del default
  const isExactDefaultMatch = (
    normalizedSequence.length === defaultBody.length &&
    normalizedSequence.every((n: string, i: number) => n === defaultBody[i])
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
