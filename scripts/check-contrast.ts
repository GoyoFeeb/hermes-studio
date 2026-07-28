#!/usr/bin/env npx tsx
/**
 * check-contrast.ts — verificación automática de contraste WCAG contra un brand-tokens.json
 * real. Añadido 2026-07-24 (auditoría profunda del motor, a petición del usuario).
 *
 * Motivo real, no hipotético: todo el trabajo de contraste hecho esta sesión (tarifalo,
 * paraycompara, BMW — ver patterns/saving.md §4, patterns/institutional.md §5,
 * patterns/fotografia-primero.md §4) se calculó A MANO con la fórmula de luminancia relativa
 * WCAG 2.x, documentado como tabla estática en markdown. Es exactamente el tipo de verificación
 * manual-propensa-a-error que el resto del sistema ya automatizó (paridad de fuente/inline,
 * equilibrio de columnas, claims de marketing) — un error de aritmética o un color de marca que
 * cambia en una revisión posterior del pack no se detecta hasta que alguien recalcula a mano de
 * nuevo. Este script recalcula, en cada build, un conjunto FIJO de combinaciones texto/fondo que
 * los componentes reales del motor usan en todas las marcas (ver COMBINATIONS abajo — cada una
 * verificada contra dónde se usa en engine/components/*.html), con el tamaño/peso de fuente real
 * de ese contexto (hardcodeado aquí porque esos tamaños viven en los componentes, no en el brand
 * pack) para elegir el umbral WCAG correcto (3:1 texto grande, 4.5:1 texto normal).
 *
 * No sustituye las tablas de patterns/{género}.md — esas documentan el razonamiento y sirven de
 * referencia legible; este script es la comprobación automática que confirma que la tabla sigue
 * siendo cierta HOY, no solo el día que se escribió.
 *
 * Uso:
 *   npx tsx scripts/check-contrast.ts --brand {slug}
 *   npx tsx scripts/check-contrast.ts --campaign newsletters/{year}/{client}/{campaign}
 */
import * as fs from 'fs';
import * as path from 'path';
import { parseArgs } from './lib/cli';
import { resolveBrandPackPath } from './lib/brand-path';

const ROOT = path.resolve(import.meta.dirname, '..');

function get(obj: any, dotted: string): any {
  return dotted.split('.').reduce((cur, k) => (cur == null ? undefined : cur[k]), obj);
}

// ── Fórmula WCAG 2.x de luminancia relativa / ratio de contraste ────────────

const HEX_RE = /^#([0-9A-Fa-f]{6})$/;

function hexToRgb(hex: string): [number, number, number] | null {
  const m = HEX_RE.exec(hex.trim());
  if (!m) return null;
  const int = parseInt(m[1], 16);
  return [(int >> 16) & 255, (int >> 8) & 255, int & 255];
}

function srgbToLinear(c: number): number {
  const cs = c / 255;
  return cs <= 0.04045 ? cs / 12.92 : Math.pow((cs + 0.055) / 1.055, 2.4);
}

function relativeLuminance(hex: string): number | null {
  const rgb = hexToRgb(hex);
  if (!rgb) return null;
  const [r, g, b] = rgb.map(srgbToLinear);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrastRatio(hex1: string, hex2: string): number | null {
  const l1 = relativeLuminance(hex1);
  const l2 = relativeLuminance(hex2);
  if (l1 === null || l2 === null) return null;
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

/** WCAG: texto "grande" si >=24px normal, o >=18.66px (14pt) si el peso es >=700 (bold/semibold). */
function isLargeText(sizePx: number, weight: number): boolean {
  if (sizePx >= 24) return true;
  if (sizePx >= 18.66 && weight >= 700) return true;
  return false;
}

// ── Combinaciones fijas, verificadas contra dónde se usan en engine/components/*.html ──

interface Combo {
  label: string;
  fgPath: string;
  bgPath: string;
  /** Tamaño/peso literal, usado solo si no hay sizePath/weightPath o si el pack no los trae. */
  sizePx: number;
  weight: number;
  /**
   * Ruta al tamaño/peso REAL en el brand pack (2026-07-24 — ver engine/CHANGELOG.md, entrada
   * "El gate de contraste certificaba contra un tamaño que ya nadie renderiza"). Sin esto, el
   * check evaluaba el CTA con 19px/700 fijo para todas las marcas, que era el tamaño hardcodeado
   * en cta-bulletproof.html ANTES de tokenizarlo. Desde que el tamaño del botón es real por marca
   * (14-19px según la marca), un literal aquí certifica contra algo que no se renderiza — y el
   * umbral WCAG DEPENDE del tamaño (3:1 si es "texto grande", 4.5:1 si no), así que el error no
   * es cosmético: puede aprobar un contraste que en pantalla falla.
   */
  sizePath?: string;
  weightPath?: string;
  /**
   * Fallback de COLOR de primer plano si fgPath no existe en el pack (2026-07-25 — ver
   * engine/CHANGELOG.md, "El H1 de hero-imagen ignoraba typography.hero.h1"). Necesario porque
   * lib/assemble.js también hace fallback en JS cuando el pack no declara typography.hero.h1 —
   * este check tiene que evaluar el MISMO valor que de verdad se renderiza, no simplemente saltar
   * la combinación cuando el pack no lo declara.
   */
  fgFallback?: string;
  usedIn: string;
}

const COMBOS: Combo[] = [
  {
    label: 'CTA: texto sobre fondo del botón',
    fgPath: 'colors.ctaText',
    bgPath: 'colors.ctaBackground',
    sizePath: 'typography.cta.size',
    weightPath: 'typography.cta.weight',
    sizePx: 19,   // fallback solo si el pack no declara typography.cta (packs legacy)
    weight: 700,
    usedIn: 'cta-bulletproof.html'
  },
  {
    label: 'Cuerpo de texto secundario sobre blanco',
    fgPath: 'colors.text.secondary',
    bgPath: 'colors.background.white',
    sizePx: 14,
    weight: 400,
    usedIn: 'card-tarifa.html, lista-premium.html, columns-3-beneficios*.html (body)'
  },
  {
    label: 'Cuerpo de texto secundario sobre sección alterna',
    fgPath: 'colors.text.secondary',
    bgPath: 'surfaces.sectionLila',
    sizePx: 13,
    weight: 400,
    usedIn: 'usp-cards.html, columns-3-beneficios.html (fondo surfaces.sectionLila)'
  },
  {
    label: 'Subtítulo del hero sobre color primario de marca',
    fgPath: 'colors.onBrandSecondary',
    bgPath: 'colors.primary',
    sizePx: 15,
    weight: 400,
    usedIn: 'hero-centrado.html, hero-asimetrico.html, hero-imagen.html, hero-marca-*.html'
  },
  {
    // Añadido 2026-07-25 (hallazgo durante el test de Worn Wear — ver engine/CHANGELOG.md, "El
    // H1 de hero-imagen ignoraba typography.hero.h1"): hasta ahora el H1 de hero-imagen.html
    // tenía color/tamaño/peso HARDCODEADOS y este check no lo cubría porque no había nada que
    // verificar (el motor ignoraba el token). Ahora que el motor lee typography.hero.h1 con
    // fallback a #FFFFFF/28/800 si el pack no lo declara, un valor mal verificado en el pack
    // (como #000000 sobre #000000 en Spotify o #111111 sobre #111111 en Nike, encontrados y
    // corregidos ese mismo día) dejaría el titular del hero invisible sin que ningún gate lo
    // detectara. fgFallback/sizePx/weight replican EXACTAMENTE el fallback de lib/assemble.js.
    label: 'H1 del hero sobre color primario de marca',
    fgPath: 'typography.hero.h1.color',
    fgFallback: '#FFFFFF',
    bgPath: 'colors.primary',
    sizePath: 'typography.hero.h1.size',
    weightPath: 'typography.hero.h1.weight',
    sizePx: 28,
    weight: 800,
    usedIn: 'hero-imagen.html (H1) — único hero que lee typography.hero.h1; hero-asimetrico/hero-centrado/hero-marca-* siguen con blanco fijo'
  },
  {
    label: 'Cuerpo de la banda de cierre sobre color profundo de marca',
    fgPath: 'colors.onBrandSecondary',
    bgPath: 'colors.deep',
    sizePx: 15,
    weight: 400,
    usedIn: 'banda-cierre.html, banda-cierre-asimetrico.html'
  },
  {
    label: 'H2 de sección sobre blanco',
    fgPath: 'colors.primary',
    bgPath: 'colors.background.white',
    sizePx: 22,
    weight: 800,
    usedIn: 'card-tarifa.html, usp-cards.html, columns-3-beneficios*.html (h2)'
  },
  {
    label: 'Enlace secundario de tarjeta sobre blanco',
    fgPath: 'colors.primary',
    bgPath: 'colors.background.white',
    sizePx: 13,
    weight: 700,
    usedIn: 'card-tarifa.html, card-tarifa-3.html (linkLabel) — resuelve el hallazgo cardLinkSecondary documentado en saving.md §5.2'
  },
  {
    label: 'Texto de footer sobre fondo global',
    fgPath: 'colors.text.secondary',
    bgPath: 'surfaces.global',
    sizePx: 12,
    weight: 400,
    usedIn: 'footer.html'
  },
  {
    label: 'CTA secundario (outline) sobre blanco',
    fgPath: 'colors.primary',
    bgPath: 'colors.background.white',
    sizePx: 14,
    weight: 700,
    usedIn: 'cta-secondary-bulletproof.html (intro-cta*.html, category-grid*.html) — añadido 2026-07-24, ronda "jerarquía de CTA"'
  }
];

interface ComboResult {
  combo: Combo;
  fg?: string;
  bg?: string;
  ratio?: number;
  threshold?: number;
  pass?: boolean;
  skippedReason?: string;
  /** Tamaño/peso realmente usados para elegir el umbral (del pack si estaba, si no el literal). */
  sizePx?: number;
  weight?: number;
  usedFallback?: boolean;
  /** true si fg vino de combo.fgFallback porque el pack no declaraba fgPath. */
  usedFgFallback?: boolean;
}

function checkContrast(tokens: any): ComboResult[] {
  const results: ComboResult[] = [];
  for (const combo of COMBOS) {
    const fgFromPack = get(tokens, combo.fgPath);
    const fg = typeof fgFromPack === 'string' ? fgFromPack : combo.fgFallback;
    const usedFgFallback = typeof fgFromPack !== 'string' && typeof combo.fgFallback === 'string';
    const bg = get(tokens, combo.bgPath);
    if (typeof fg !== 'string' || typeof bg !== 'string') {
      results.push({ combo, skippedReason: `campo(s) ausente(s) en el pack: ${combo.fgPath}=${fg}, ${combo.bgPath}=${bg}` });
      continue;
    }
    const ratio = contrastRatio(fg, bg);
    if (ratio === null) {
      results.push({ combo, fg, bg, skippedReason: 'uno de los 2 valores no es un hex de 6 dígitos (ej. rgba(...)) — no soportado por este check, verificar a mano.' });
      continue;
    }
    // Tamaño/peso REALES del pack cuando la combinación los declara (el umbral WCAG depende de
    // ellos). Si el pack no los trae, se cae al literal y se avisa — nunca en silencio.
    const sizeFromPack = combo.sizePath ? get(tokens, combo.sizePath) : undefined;
    const weightFromPack = combo.weightPath ? get(tokens, combo.weightPath) : undefined;
    const sizePx = typeof sizeFromPack === 'number' ? sizeFromPack : combo.sizePx;
    const weight = typeof weightFromPack === 'number' ? weightFromPack : combo.weight;
    const usedFallback = !!combo.sizePath && typeof sizeFromPack !== 'number';
    const threshold = isLargeText(sizePx, weight) ? 3.0 : 4.5;
    results.push({ combo, fg, bg, ratio, threshold, pass: ratio >= threshold, sizePx, weight, usedFallback, usedFgFallback });
  }
  return results;
}

function main(): void {
  const args = parseArgs();
  let packPath: string;

  if (args.campaign) {
    const campaignDir = path.isAbsolute(args.campaign) ? args.campaign : path.resolve(ROOT, args.campaign);
    const dataPath = path.join(campaignDir, '06-data', 'campaign-data.json');
    if (!fs.existsSync(dataPath)) {
      console.error(`\n  ❌ No existe ${dataPath}\n`);
      process.exit(1);
    }
    const campaignData = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
    if (!campaignData.brand) {
      console.error(`\n  ❌ ${dataPath} no declara "brand".\n`);
      process.exit(1);
    }
    packPath = resolveBrandPackPath(ROOT, campaignData.brand);
  } else if (args.brand) {
    packPath = resolveBrandPackPath(ROOT, `brands/${args.brand}/tokens/brand-tokens.json`);
  } else {
    console.error('\n  ❌ Error: falta --campaign o --brand\n');
    console.error('  Uso: npx tsx scripts/check-contrast.ts --campaign newsletters/{year}/{client}/{campaign}\n');
    console.error('   o : npx tsx scripts/check-contrast.ts --brand {slug}\n');
    process.exit(1);
  }

  console.log('\n═══════════════════════════════════════════════════');
  console.log('   check-contrast — verificación WCAG automática');
  console.log('═══════════════════════════════════════════════════\n');
  console.log(`   Brand pack: ${packPath}\n`);

  const tokens = JSON.parse(fs.readFileSync(packPath, 'utf8'));
  const results = checkContrast(tokens);

  let hasFailure = false;
  for (const r of results) {
    if (r.skippedReason) {
      console.log(`   ⏭️  ${r.combo.label}: omitido (${r.skippedReason})`);
      continue;
    }
    const icon = r.pass ? '✅' : '❌';
    const src = r.combo.sizePath ? (r.usedFallback ? ` ⚠️ tamaño por defecto: el pack no declara ${r.combo.sizePath.replace(/\.size$/, '')}` : ' [tamaño real del pack]') : '';
    const fgSrc = r.usedFgFallback ? ` ⚠️ color por defecto: el pack no declara ${r.combo.fgPath}` : '';
    console.log(
      `   ${icon} ${r.combo.label} — ${r.fg} / ${r.bg} — ${r.ratio!.toFixed(2)}:1 ` +
      `(umbral ${r.threshold}:1, ${r.sizePx}px/${r.weight})${src}${fgSrc} — usado en ${r.combo.usedIn}`
    );
    if (!r.pass) hasFailure = true;
  }

  console.log('');
  if (hasFailure) {
    console.log('   ❌ check-contrast: FAIL — al menos una combinación no alcanza su umbral WCAG.\n');
    process.exit(1);
  }
  console.log('   ✅ check-contrast: OK\n');
}

main();
