#!/usr/bin/env npx tsx
/**
 * check-hero-decision.ts — verifica que la elección de hero de 03 (agents/03-newsletter-
 * architect.md §"Elegir hero") REALMENTE evaluó `hero-imagen` cuando sus propios criterios se
 * cumplen, en vez de saltárselo en silencio.
 *
 * Motivo real, no hipotético (2026-07-24, ronda "que las newsletters dejen de verse genéricas"):
 * `2026-jul-spotify-premium-test` se construyó con `hero-centrado` pese a que (a) el CTA del
 * hero apunta a una URL real de landing (https://www.spotify.com/us/premium/, no un placeholder)
 * y (b) `brands/spotify/tokens/brand-tokens.json` → `photography.usesRealPhotography: true` — es
 * decir, las DOS condiciones que agents/03-newsletter-architect.md documenta para elegir
 * `hero-imagen` se cumplían. `module-selection.md` de esa campaña no menciona "hero-imagen" NI
 * UNA VEZ — no es que se evaluara y se descartara con un motivo real, es que ni siquiera entró
 * en el radar. La investigación real de marca (fotografía dominante, documentada por 02 con
 * Chrome real) existía; nunca llegó a la decisión de estructura.
 *
 * Este script no puede saber si la decisión final fue correcta (eso requiere juicio humano/de
 * agente sobre el motivo escrito) — pero SÍ puede detectar el patrón exacto de arriba: criterios
 * cumplidos + cero mención de la alternativa que esos criterios activan. Eso ya es suficiente
 * para forzar que alguien lo mire, en vez de que se pierda en silencio como pasó con Spotify.
 *
 * Uso:
 *   npx tsx scripts/check-hero-decision.ts --campaign newsletters/{year}/{client}/{campaign}
 */
import * as fs from 'fs';
import * as path from 'path';

const ROOT = path.resolve(import.meta.dirname, '..');
const PLACEHOLDER_URL_RE = /pending-|placeholder/i;
const MENTIONS_HERO_IMAGEN_RE = /hero-imagen|arte generado|arte de ia|arte ia/i;

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

// Simplificado 2026-07-28 (auditoría técnica): todos los brand packs viven en brands/{cliente}/
// desde que paraycompara se movió a la raíz — ya no hace falta la resolución dual de rutas.
function resolveBrandPath(brandRelPath: string): string | null {
  const resolved = path.resolve(ROOT, brandRelPath);
  return fs.existsSync(resolved) ? resolved : null;
}

function looksLikeRealUrl(href: string | undefined): boolean {
  if (!href) return false;
  if (PLACEHOLDER_URL_RE.test(href)) return false;
  if (!/^https?:\/\//i.test(href)) return false;
  return true;
}

function main(): void {
  const args = parseArgs();
  if (!args.campaign) {
    console.error('\n  ❌ Error: falta --campaign\n');
    console.error('  Uso: npx tsx scripts/check-hero-decision.ts --campaign newsletters/{year}/{client}/{campaign}\n');
    process.exit(1);
  }

  const campaignDir = path.isAbsolute(args.campaign) ? args.campaign : path.resolve(ROOT, args.campaign);
  const dataPath = path.join(campaignDir, '06-data', 'campaign-data.json');
  const moduleSelectionPath = path.join(campaignDir, '03-strategy', 'module-selection.md');

  console.log('\n═══════════════════════════════════════════════════');
  console.log('   check-hero-decision');
  console.log('═══════════════════════════════════════════════════\n');

  if (!fs.existsSync(dataPath)) {
    console.log(`   ⏭️  No existe ${dataPath} — omitida (no es una campaña del motor).\n`);
    process.exit(0);
  }

  const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
  const heroModule = (data.modules || []).find((m: any) => typeof m.component === 'string' && m.component.startsWith('hero-'));

  if (!heroModule) {
    console.log('   ⏭️  Esta campaña no tiene módulo hero-* — omitida.\n');
    process.exit(0);
  }

  const heroComponent: string = heroModule.component;
  const alreadyUsesImagenOArt = heroComponent === 'hero-imagen' || heroComponent.startsWith('hero-marca-');

  console.log(`   Hero elegido: ${heroComponent}`);

  if (alreadyUsesImagenOArt) {
    console.log('   ✅ Ya usa hero-imagen o hero-marca-* — nada que verificar.\n');
    process.exit(0);
  }

  const href: string | undefined = heroModule.data?.cta?.href;
  const hasRealUrl = looksLikeRealUrl(href);
  console.log(`   CTA href del hero: ${href || '(ausente)'} — ¿URL real, no placeholder? ${hasRealUrl ? 'sí' : 'no'}`);

  if (!data.brand) {
    console.log('   ⚠️  campaign-data.json no declara "brand" — no se puede leer photography.usesRealPhotography.\n');
    process.exit(0);
  }
  const brandPath = resolveBrandPath(data.brand);
  if (!brandPath) {
    console.log(`   ⚠️  No se encontró el brand pack (${data.brand}) — omitido.\n`);
    process.exit(0);
  }
  const brand = JSON.parse(fs.readFileSync(brandPath, 'utf8'));
  const usesRealPhotography = brand.photography?.usesRealPhotography === true;
  console.log(`   brand-tokens.json → photography.usesRealPhotography: ${usesRealPhotography}`);

  const criteriaMetForHeroImagen = hasRealUrl && usesRealPhotography;

  if (!criteriaMetForHeroImagen) {
    console.log('\n   ✅ Los criterios de agents/03-newsletter-architect.md §"Elegir hero" para');
    console.log('      hero-imagen no se cumplen los dos a la vez (URL real + fotografía dominante) —');
    console.log(`      "${heroComponent}" no requiere justificación adicional aquí.\n`);
    process.exit(0);
  }

  console.log('\n   ⚠️  Se cumplen los DOS criterios documentados para hero-imagen (URL real de landing');
  console.log('      + photography.usesRealPhotography:true) pero el hero elegido NO es hero-imagen.');

  if (!fs.existsSync(moduleSelectionPath)) {
    console.log(`   ❌ Además, no existe ${moduleSelectionPath} — no hay ningún motivo documentado.\n`);
    console.log('   ❌ check-hero-decision: FAIL\n');
    process.exit(1);
  }

  const moduleSelectionText = fs.readFileSync(moduleSelectionPath, 'utf8');
  const mentionsAlternative = MENTIONS_HERO_IMAGEN_RE.test(moduleSelectionText);

  if (!mentionsAlternative) {
    console.log(`   ❌ ${moduleSelectionPath} no menciona "hero-imagen" (ni "arte generado"/"arte de IA")`);
    console.log('      en ningún sitio — no es que se evaluara y se descartara con un motivo real, es que');
    console.log('      no se evaluó. Ver agents/03-newsletter-architect.md §"Elegir hero".\n');
    console.log('   ❌ check-hero-decision: FAIL\n');
    process.exit(1);
  }

  console.log(`   ✅ ${moduleSelectionPath} sí menciona la alternativa — asumido que se evaluó y se`);
  console.log('      descartó con un motivo escrito (este script no juzga si el motivo es bueno,');
  console.log('      solo que existe). Revisión humana del motivo recomendada de todas formas.\n');
  console.log('   ✅ check-hero-decision: OK (con aviso)\n');
}

main();
