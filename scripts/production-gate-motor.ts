#!/usr/bin/env npx tsx
/**
 * production-gate-motor.ts — Gate de producción para campañas construidas por
 * engine/build-newsletter.js (F1). Este es el cierre real del sistema vigente:
 * package.json mantiene `production-gate` como alias de este script. Los validadores del
 * pipeline React Email archivado quedan disponibles solo como `legacy:*`.
 *
 * Uso:
 *   npm run production-gate -- --campaign newsletters/{year}/{client}/{campaign}
 */

import * as fs from 'fs';
import * as path from 'path';
import { parseArgs, resolveCampaignPath } from './lib/cli';
import { execFileSync } from 'child_process';
import Ajv from 'ajv';
import { CLAIM_RULES, scanField, type MatchResult } from './lib/claim-rules';

// ── Configuración ──────────────────────────────────────────────────────────

const ROOT = path.resolve(import.meta.dirname, '..');
const SCHEMA_PATH = path.join(ROOT, 'engine', 'schema', 'campaign-data.schema.json');
const TSX_BIN = path.join(ROOT, 'node_modules', '.bin', 'tsx');

// Fix (auditoría enterprise 2026-07-28): cada gate hijo se invocaba con execSync sobre un
// string interpolado a mano (`"${tsx}" "${script}" --campaign "${campaignDir}"`), ejecutado
// vía /bin/sh — inseguro por diseño (una ruta de campaña con comillas/backticks/$() se
// interpretaría como shell) y sin timeout (el gate legacy production-gate.ts sí lo tenía;
// se perdió al migrar). execFileSync con array de argumentos no pasa por ningún shell —
// cero riesgo de inyección — y aquí se centraliza el timeout una sola vez para los 9 gates
// hijos en vez de tener que añadirlo en cada uno.
const CHILD_GATE_TIMEOUT_MS = 120_000;

/** Ejecuta un binario+args como gate hijo, con timeout. Sin shell de por medio. */
function execChildGate(bin: string, args: string[], errorMsg: string): string[] {
  const errors: string[] = [];
  try {
    const output = execFileSync(bin, args, {
      cwd: ROOT,
      encoding: 'utf-8',
      timeout: CHILD_GATE_TIMEOUT_MS,
    });
    console.log(output);
  } catch (err: any) {
    const output = (err.stdout || '') + (err.stderr || '');
    console.log(output);
    if (err.killed || err.signal) {
      errors.push(
        `Proceso terminado tras superar el timeout de ${CHILD_GATE_TIMEOUT_MS / 1000}s ` +
        `(${bin} ${args.join(' ')}) — ver salida arriba.`
      );
    } else {
      errors.push(errorMsg);
    }
  }
  return errors;
}

/** Ejecuta un script de scripts/ vía tsx como gate hijo. */
function runChildGate(scriptName: string, args: string[], errorMsg: string): string[] {
  const script = path.join(ROOT, 'scripts', scriptName);
  return execChildGate(TSX_BIN, [script, ...args], errorMsg);
}

interface GateResult {
  name: string;
  passed: boolean;
  errors: string[];
  warnings: string[];
}

const gates: GateResult[] = [];

// ── Argumentos ─────────────────────────────────────────────────────────────



function runGateHeader(n: number | string, name: string): void {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`   Gate ${n}: ${name}`);
  console.log(`${'='.repeat(60)}\n`);
}

// ── Gate 1: schema ───────────────────────────────────────────────────────────

function gate1Schema(dataPath: string): GateResult {
  runGateHeader(1, 'schema (campaign-data.json vs. campaign-data.schema.json)');
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!fs.existsSync(dataPath)) {
    errors.push(`No existe ${dataPath}`);
    return { name: 'schema', passed: false, errors, warnings };
  }

  let data: any;
  try {
    data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
  } catch (err) {
    errors.push(`campaign-data.json no es JSON válido: ${(err as Error).message}`);
    return { name: 'schema', passed: false, errors, warnings };
  }

  const schema = JSON.parse(fs.readFileSync(SCHEMA_PATH, 'utf8'));
  const ajv = new Ajv({ allErrors: true, strict: false });
  const validate = ajv.compile(schema);
  const valid = validate(data);
  if (!valid) {
    for (const e of validate.errors || []) {
      errors.push(`${e.instancePath || '(raíz)'} ${e.message}`);
    }
  } else {
    console.log('   ✅ campaign-data.json valida contra el schema.\n');
  }

  return { name: 'schema', passed: errors.length === 0, errors, warnings };
}

// ── Gate 2: paridad del export EXISTENTE, ANTES de reconstruir ─────────────
//
// Debe correr ANTES del build (Gate 3), no después. Hallazgo real del prompt 22
// (prompts-fase3-verificacion/22-prueba-de-fuego-f3.md): en el primer intento, este gate
// corría DESPUÉS del build — y el build siempre regenera 09-exports/ desde cero, así que
// cualquier manipulación manual de final-inline.html quedaba silenciosamente sobrescrita
// (y por tanto "arreglada") antes de que la auditoría de paridad llegara a mirarla. Eso
// convertía la comprobación en una tautología que nunca podía fallar — exactamente el tipo de
// gate que "certificaría" un problema real sin detectarlo, el mismo patrón de fondo que el
// Defecto N1. Corregido moviendo la auditoría de paridad a ANTES del build: audita lo que
// hay en disco AHORA MISMO (el estado real, tal cual llegó este gate), antes de que el
// siguiente paso lo regenere.
function gate2ParityAuditPreBuild(campaignDir: string): GateResult {
  runGateHeader(2, 'paridad del export existente (check-parity.ts — ANTES de reconstruir)');
  const errors = runChildGate(
    'check-parity.ts',
    ['--campaign', campaignDir],
    'check-parity.ts detectó una desviación en el export existente — ver el mensaje exacto arriba.'
  );
  return { name: 'parity (pre-build)', passed: errors.length === 0, errors, warnings: [] };
}

// ── Gate 3: build limpio ─────────────────────────────────────────────────────
//
// Corre DESPUÉS de la auditoría de paridad (Gate 2), precisamente para no enmascararla.
// Regenera 09-exports/ desde campaign-data.json — certifica el estado ACTUAL de los datos.

function gate3Build(dataPath: string, outDir: string): GateResult {
  runGateHeader(3, 'build limpio (engine/build-newsletter.js)');
  const buildScript = path.join(ROOT, 'engine', 'build-newsletter.js');
  console.log(`   node "${buildScript}" --data "${dataPath}" --out "${outDir}"\n`);
  const errors = execChildGate(
    'node',
    [buildScript, '--data', dataPath, '--out', outDir],
    'El build terminó en exit ≠ 0 — ver el mensaje exacto arriba.'
  );
  return { name: 'build', passed: errors.length === 0, errors, warnings: [] };
}

// ── Gate 4: claims (sobre campaign-data.json) ───────────────────────────────

const NON_TEXT_KEYS = new Set(['href', 'icon', 'number', 'unsubscribeUrl', 'preferencesUrl']);

function scanCampaignDataForClaims(data: any): MatchResult[] {
  const matches: MatchResult[] = [];

  if (data.metadata) {
    scanField('metadata.subjectLine', data.metadata.subjectLine, matches);
    scanField('metadata.preheader', data.metadata.preheader, matches);
  }

  function walk(obj: any, fieldPath: string): void {
    if (obj === null || obj === undefined) return;
    if (typeof obj === 'string') {
      scanField(fieldPath, obj, matches);
      return;
    }
    if (Array.isArray(obj)) {
      obj.forEach((item, i) => walk(item, `${fieldPath}[${i}]`));
      return;
    }
    if (typeof obj === 'object') {
      for (const key of Object.keys(obj)) {
        if (key.startsWith('_')) continue; // anotaciones (_comment, _reconstructed...)
        if (NON_TEXT_KEYS.has(key)) continue; // URLs/números, no son copy de marketing
        walk(obj[key], `${fieldPath}.${key}`);
      }
    }
  }

  if (Array.isArray(data.modules)) {
    for (let i = 0; i < data.modules.length; i++) {
      const mod = data.modules[i];
      walk(mod.data, `modules[${i}] (${mod.component || '?'}).data`);
    }
  }

  return matches;
}

function gate4Claims(dataPath: string): GateResult {
  runGateHeader(4, `claims (${CLAIM_RULES.length} reglas, sobre campaign-data.json)`);
  const errors: string[] = [];
  const warnings: string[] = [];

  // Defensivo (fix 2026-07-24, auditoría del motor): antes de este fix, si dataPath no existía
  // (campaña de formato antiguo, pipeline React Email — ver main(), que ahora sale limpio antes
  // de llegar aquí en ese caso) esta línea lanzaba ENOENT sin capturar, y el script entero
  // moría con un stack trace de Node en vez de un fallo de gate legible. Se mantiene esta
  // guarda aquí también por si algún día se llama a esta función fuera del flujo de main().
  if (!fs.existsSync(dataPath)) {
    errors.push(`No existe ${dataPath} — no se puede escanear claims.`);
    return { name: 'claims', passed: false, errors, warnings };
  }

  // Fix (auditoría enterprise 2026-07-28): este JSON.parse no tenía su propio try/catch —
  // dependía por completo de que gate1Schema ya hubiera validado el archivo antes. Si el
  // archivo se corrompe/cambia entre gates (proceso externo concurrente, ver el incidente del
  // CHANGELOG en esta misma sesión), este gate moría con un stack trace de Node sin capturar
  // en vez de un fallo de gate legible — el mismo patrón de bug que el comentario de arriba ya
  // documenta como corregido para el caso de archivo ausente, pero no para el de JSON inválido.
  let data: any;
  try {
    data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
  } catch (err) {
    errors.push(`campaign-data.json no es JSON válido al escanear claims: ${(err as Error).message}`);
    return { name: 'claims', passed: false, errors, warnings };
  }
  const matches = scanCampaignDataForClaims(data);

  if (matches.length === 0) {
    console.log(`   ✅ No se detectaron claims problemáticos (${CLAIM_RULES.length} reglas aplicadas).\n`);
    return { name: 'claims', passed: true, errors, warnings };
  }

  for (const m of matches) {
    const msg = `"${m.rule.label}" (${m.rule.severity}) detectado en ${m.fieldPath} — "${m.contextText}". ${m.rule.recommendation}`;
    // Modo producción: crítico y alto son errores; medio es aviso (mismo criterio que
    // validate-claims.ts --production, salvo que aquí medio no bloquea para no ser más
    // estricto que el gate ya validado del pipeline React Email sin justificación nueva).
    if (m.rule.severity === 'medium') {
      warnings.push(msg);
    } else {
      errors.push(msg);
    }
  }

  return { name: 'claims', passed: errors.length === 0, errors, warnings };
}

// ── Gate 5: assets HTTP 200 ──────────────────────────────────────────────────

// Fix 2026-07-24 (auditoría profunda del motor): antes de este fix, una URL de relleno tipo
// "https://PENDING-CDN-UPLOAD/..." fallaba el fetch por DNS (dominio inexistente) y se
// clasificaba EXACTAMENTE igual que un asset real inalcanzable por falta de red del sandbox —
// "sin respuesta... puede ser falta de red del entorno, no un asset roto". Eso es engañoso: un
// placeholder JAMÁS va a resolver, tenga el entorno red o no. Se distingue aquí para que el
// reporte diga la verdad; el bloqueo real para producción lo hace el nuevo Gate 10
// (production-readiness), no este gate (que sigue siendo solo informativo sobre HTTP).
const PLACEHOLDER_URL_RE = /pending-|placeholder/i;

async function checkUrl(url: string): Promise<{ ok: boolean; note: string }> {
  if (PLACEHOLDER_URL_RE.test(url)) {
    return { ok: false, note: 'placeholder declarado (PENDING-/PLACEHOLDER) — nunca va a resolver hasta que se suba el asset real, no es un fallo de red' };
  }
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    const res = await fetch(url, { method: 'HEAD', signal: controller.signal });
    clearTimeout(timeout);
    if (res.status >= 400) {
      return { ok: false, note: `HTTP ${res.status}` };
    }
    return { ok: true, note: `HTTP ${res.status}` };
  } catch (err) {
    const cause = (err as Error).cause || (err as Error).message;
    return { ok: false, note: `sin respuesta (${cause}) — puede ser falta de red del entorno, no un asset roto` };
  }
}

async function gate5Assets(inlinePath: string): Promise<GateResult> {
  runGateHeader(5, 'assets HTTP 200 (final-inline.html)');
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!fs.existsSync(inlinePath)) {
    errors.push(`No existe ${inlinePath} — el Gate 2 (build) debía haberlo generado`);
    return { name: 'assets', passed: false, errors, warnings };
  }

  const html = fs.readFileSync(inlinePath, 'utf8');
  const urls = new Set<string>();
  const re = /(?:src|href)="(https:\/\/[^"]+)"/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html))) urls.add(m[1]);

  if (urls.size === 0) {
    warnings.push('No se encontraron URLs https:// en el HTML para verificar');
    return { name: 'assets', passed: true, errors, warnings };
  }

  console.log(`   Verificando ${urls.size} URL(s)...\n`);
  let networkUnavailable = 0;
  let placeholderCount = 0;
  for (const url of urls) {
    const r = await checkUrl(url);
    if (r.ok) {
      console.log(`     ✅ ${r.note}  ${url}`);
    } else if (PLACEHOLDER_URL_RE.test(url)) {
      // Informativo, no bloquea este gate — el bloqueo real (si productionReady:true) es
      // responsabilidad del Gate 10 (production-readiness), no de este chequeo HTTP.
      console.log(`     ⚠️  ${r.note}  ${url}`);
      placeholderCount++;
      warnings.push(`${url}: ${r.note}`);
    } else if (r.note.includes('sin respuesta')) {
      console.log(`     ⚠️  ${r.note}  ${url}`);
      networkUnavailable++;
      warnings.push(`${url}: ${r.note}`);
    } else {
      console.log(`     ❌ ${r.note}  ${url}`);
      errors.push(`${url}: ${r.note}`);
    }
  }
  console.log('');

  if (placeholderCount > 0) {
    warnings.push(
      `${placeholderCount} URL(s) son placeholders declarados (PENDING-/PLACEHOLDER) — ver Gate 10 ` +
      `(production-readiness) para si esto bloquea o no según metadata.isTestCampaign.`
    );
  }
  if (networkUnavailable > 0 && networkUnavailable === urls.size - placeholderCount) {
    warnings.push(
      'Ninguna URL real (no placeholder) respondió — probablemente el entorno no tiene salida de ' +
      'red al CDN real, no que los assets estén rotos. No verificado, declarado explícitamente ' +
      '(ver agents/09-export-manager.md).'
    );
  }

  return { name: 'assets', passed: errors.length === 0, errors, warnings };
}

// ── Gate 6: control files ────────────────────────────────────────────────────

function gate6ControlFiles(campaignDir: string): GateResult {
  runGateHeader(6, 'control files (check-control-files.ts)');
  const errors = runChildGate(
    'check-control-files.ts',
    ['--campaign', campaignDir],
    'check-control-files.ts detectó un desajuste — ver el mensaje exacto arriba.'
  );
  return { name: 'control-files', passed: errors.length === 0, errors, warnings: [] };
}

// ── Gate 7: equilibrio de columnas (check-column-balance.ts) ───────────────
//
// Añadido 2026-07-22 (hallazgo campaña UAX — ver engine/CHANGELOG.md): un módulo de "3
// columnas iguales" (columns-3-beneficios) puede quedar visualmente descompensado sin que
// ningún schema/plantilla lo detecte, si el copy de cada columna tiene una longitud muy
// distinta. No sustituye la protección estructural del componente (el highlight ya no puede
// vivir dentro de una sola columna) — cierra el otro lado: el propio texto.

function gate7ColumnBalance(campaignDir: string): GateResult {
  runGateHeader(7, 'equilibrio de columnas (check-column-balance.ts)');
  const errors = runChildGate(
    'check-column-balance.ts',
    ['--campaign', campaignDir],
    'check-column-balance.ts detectó columnas descompensadas — ver el mensaje exacto arriba.'
  );
  return { name: 'column-balance', passed: errors.length === 0, errors, warnings: [] };
}

// ── Gate 8: fidelidad del brand pack (check-brand-pack-completeness.ts) ────
//
// Añadido 2026-07-24 (auditoría del motor a petición del usuario — ver engine/CHANGELOG.md):
// hasta esta fecha, ningún gate comprobaba que photography/iconography/voice.rhythm (Nivel 3)
// y layout.contentRhythm (Nivel 4) de un brand pack estuvieran realmente investigados en vez de
// ausentes en silencio o rellenos con un placeholder "[Q-NNN]" sin resolver — toda la garantía
// dependía de la autodisciplina del agente 02. Ejecutar el script contra los brand packs reales
// existentes durante su desarrollo confirmó que el hueco era real, no hipotético.

function gate8BrandPackCompleteness(campaignDir: string): GateResult {
  runGateHeader(8, 'fidelidad del brand pack (check-brand-pack-completeness.ts)');
  const errors = runChildGate(
    'check-brand-pack-completeness.ts',
    ['--campaign', campaignDir],
    'check-brand-pack-completeness.ts detectó un hueco silencioso o un placeholder sin resolver — ver el mensaje exacto arriba.'
  );
  return { name: 'brand-pack-completeness', passed: errors.length === 0, errors, warnings: [] };
}

// ── Gate 9: contraste WCAG automático (check-contrast.ts) ──────────────────
//
// Añadido 2026-07-24 (auditoría profunda del motor): hasta ahora, todo el contraste WCAG del
// sistema se calculaba a mano y se documentaba como tabla estática en patterns/{género}.md — ver
// scripts/check-contrast.ts para el razonamiento completo y las combinaciones fijas verificadas.

function gate9Contrast(campaignDir: string): GateResult {
  runGateHeader(9, 'contraste WCAG automático (check-contrast.ts)');
  const errors = runChildGate(
    'check-contrast.ts',
    ['--campaign', campaignDir],
    'check-contrast.ts detectó una combinación por debajo de su umbral WCAG — ver el mensaje exacto arriba.'
  );
  return { name: 'contrast', passed: errors.length === 0, errors, warnings: [] };
}

// ── Gate 10: preparación para producción (check-production-readiness.ts) ──
//
// Añadido 2026-07-24 (auditoría profunda del motor): cierra el hueco de las URLs "PENDING-"/
// placeholders de texto que pasaban el schema sin problema — ver
// scripts/check-production-readiness.ts para el razonamiento completo.

function gate10ProductionReadiness(campaignDir: string): GateResult {
  runGateHeader(10, 'preparación para producción (check-production-readiness.ts)');
  const errors = runChildGate(
    'check-production-readiness.ts',
    ['--campaign', campaignDir],
    'check-production-readiness.ts detectó un placeholder que no puede llegar a producción — ver el mensaje exacto arriba.'
  );
  return { name: 'production-readiness', passed: errors.length === 0, errors, warnings: [] };
}

// ── Gate 11: decisión de hero (check-hero-decision.ts) ──
//
// Añadido 2026-07-24 (ronda "que las newsletters dejen de verse genéricas"): 03 documenta
// criterios reales para elegir hero-imagen (URL real de landing + photography.usesRealPhotography
// del brand pack) pero nada verificaba que esos criterios se evaluaran de verdad —
// 2026-jul-spotify-premium-test los cumplía los dos y terminó en hero-centrado sin que
// module-selection.md mencionara hero-imagen ni una vez. Ver scripts/check-hero-decision.ts.

function gate11HeroDecision(campaignDir: string): GateResult {
  runGateHeader(11, 'decisión de hero (check-hero-decision.ts)');
  const errors = runChildGate(
    'check-hero-decision.ts',
    ['--campaign', campaignDir],
    'check-hero-decision.ts detectó que se cumplen los criterios de hero-imagen pero no se evaluó — ver el mensaje exacto arriba.'
  );
  return { name: 'hero-decision', passed: errors.length === 0, errors, warnings: [] };
}

// ── Gate 12: diferenciación estructural (check-structural-differentiation.ts) ──
//
// Añadido 2026-07-27 (evolución brand-native — ver engine/CHANGELOG.md). Verifica que la
// newsletter NO es una mera copia de la secuencia por defecto del patrón: exige que exista
// 03-strategy/brand-structure-translation.md documentando la traducción de la página real de la
// marca a la estructura del email, y detecta secuencias clonadas sin justificación (como el
// patrón header-logo → hero-imagen → intro-cta → columns-3 → banda-cierre → footer repetido en
// Audi, BMW, Nike y Worn Wear sin variación estructural).

function gate12StructuralDifferentiation(campaignDir: string): GateResult {
  runGateHeader(12, 'diferenciación estructural (check-structural-differentiation.ts)');
  const errors = runChildGate(
    'check-structural-differentiation.ts',
    ['--campaign', campaignDir],
    'check-structural-differentiation.ts detectó una estructura sin traducción de marca real — ver el mensaje exacto arriba.'
  );
  return { name: 'structural-differentiation', passed: errors.length === 0, errors, warnings: [] };
}

// ── Gate 13: completitud del informe visual de marca (check-brand-visual-report-completeness.ts) ──
//
// Añadido 2026-07-28 (evolución "Nivel 5" del agente 02 — ver
// pipeline-skill/references/brand-visual-analysis-methodology.md). Deliberadamente NO bloqueante
// todavía: hoy ningún brand pack real tiene ninguno de los 9 artefactos nuevos (CSS extraído,
// inventario de componentes del sitio real, guías de adaptación a email), así que bloquear
// producción por su ausencia el día que se introduce el gate fallaría retroactivamente toda
// campaña real existente — mismo criterio de rollout que "Nivel 4" (layout.contentRhythm,
// 2026-07-24). Sí bloquea si un archivo existe pero es un placeholder sin resolver (misma
// disciplina anti-fabricación del resto del sistema).

function gate13BrandVisualReportCompleteness(campaignDir: string): GateResult {
  runGateHeader(13, 'completitud del informe visual de marca (check-brand-visual-report-completeness.ts)');
  const errors = runChildGate(
    'check-brand-visual-report-completeness.ts',
    ['--campaign', campaignDir],
    'check-brand-visual-report-completeness.ts detectó un placeholder sin resolver en un artefacto ya declarado — ver el mensaje exacto arriba.'
  );
  return { name: 'brand-visual-report-completeness', passed: errors.length === 0, errors, warnings: [] };
}

// ── Main ───────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  const args = parseArgs();

  if (!args.campaign) {
    console.error('\n  ❌ Error: falta --campaign\n');
    console.error('  Uso: npx tsx scripts/production-gate-motor.ts --campaign newsletters/{year}/{client}/{campaign}\n');
    process.exit(1);
  }

  const campaignDir = resolveCampaignPath(ROOT, args.campaign);
  const dataPath = path.join(campaignDir, '06-data', 'campaign-data.json');
  const outDir = path.join(campaignDir, '09-exports');
  const inlinePath = path.join(outDir, 'final-inline.html');

  console.log('\n═══════════════════════════════════════════════════');
  console.log('   Hermes Newsletter System — Production Gate (motor)');
  console.log('═══════════════════════════════════════════════════');
  console.log(`\n   Campaña: ${campaignDir}\n`);

  if (!fs.existsSync(campaignDir)) {
    console.error(`   ❌ La carpeta de campaña no existe: ${campaignDir}\n`);
    process.exit(1);
  }

  // Fix 2026-07-24 (auditoría profunda del motor): antes de este fix, una campaña de formato
  // antiguo (06-data/newsletter-data.json en vez de campaign-data.json — el pipeline React
  // Email archivado, ej. 2026-jul-test, ahorra-fibra-movil) hacía que gate1Schema fallara
  // limpio ("No existe..."), pero gate4Claims seguía ejecutándose igual (JSON.parse sobre un
  // archivo inexistente) y moría con un stack trace de Node sin capturar — documentado 2 veces
  // en engine/CHANGELOG.md como bug conocido, nunca arreglado hasta ahora. Se detecta aquí,
  // ANTES de correr ningún gate, y se sale limpio — mismo criterio que check-parity.ts ya usa
  // para campañas fuera de su alcance ("omitida", no "fallida").
  if (!fs.existsSync(dataPath)) {
    console.log(`   ⏭️  Omitida: no existe ${dataPath}.`);
    console.log('      Esta campaña no usa engine/build-newsletter.js (¿pipeline React Email');
    console.log('      archivado, con 06-data/newsletter-data.json? production-gate-motor solo');
    console.log('      audita campañas del motor — no es un fallo de esta campaña.\n');
    process.exit(0);
  }

  // ── Modo exploración (2026-08-20) ───────────────────────────────────────────
  // explorationMode difiere 5 gates que auditan cosas que no existen aún en una campaña de
  // exploración rápida (paridad de export ya construido, HTTP 200 de assets desplegados,
  // archivos de control de traspaso entre sesiones, preparación de producción, e informe
  // Nivel 5 de marca). Las 8 gates que SÍ certifican fidelidad de marca y diferenciación
  // estructural (schema, build real, claims, columnas, brand pack Nivel 3 con .source, WCAG,
  // decisión de hero, diferenciación estructural — Gate 12, la que detecta genericidad) siguen
  // corriendo igual, sin relajar nada. Salvaguarda: si productionReady es true, el flag se
  // ignora — nunca se saltan estas gates en una campaña que de verdad va a producción, aunque
  // alguien olvide desactivar explorationMode al promoverla.
  let explorationMode = false;
  try {
    const raw = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
    explorationMode = raw?.metadata?.explorationMode === true && raw?.metadata?.productionReady !== true;
  } catch {
    explorationMode = false;
  }
  if (explorationMode) {
    console.log('   🚀 explorationMode: true — se difieren 5 gates (paridad, assets HTTP 200,');
    console.log('      archivos de control, preparación de producción, informe Nivel 5 de marca).');
    console.log('      Fidelidad de marca y diferenciación estructural siguen auditándose igual.\n');
  }

  // ── Gate 0: integridad del motor (añadido tras el incidente 2026-07-21 — ver
  // engine/CHANGELOG.md). Si el motor difiere del lock, nada de lo que certifique este gate
  // es fiable: se comprueba ANTES que todo lo demás.
  runGateHeader(0, 'integridad del motor (check-engine-integrity.ts)');
  {
    const errors = runChildGate(
      'check-engine-integrity.ts',
      [],
      'El motor difiere de engine/components.lock.json — ver el detalle arriba. No se certifica nada construido con un motor alterado.'
    );
    gates.push({ name: 'engine-integrity', passed: errors.length === 0, errors, warnings: [] });
    if (errors.length > 0) {
      // Sin motor íntegro, el resto de gates carecen de sentido — reporte corto y salida.
      console.log(`\n${'='.repeat(60)}`);
      console.log('   Resultados del Production Gate (motor)');
      console.log(`${'='.repeat(60)}\n`);
      console.log('   ❌ Gate: engine-integrity');
      for (const e of errors) console.log(`        ❌ ${e}`);
      console.log('\n   ❌ Production gate (motor) failed.\n');
      process.exit(1);
    }
  }

  // Aviso de deriva documental (auditoría técnica 2026-07-28) — NUNCA bloquea el gate maestro
  // (no se añade a gates[]): check-component-inventory.ts es sobre el motor entero, no sobre
  // esta campaña en particular, así que un aviso aquí no debería impedir que ESTA campaña se
  // certifique. Se imprime para que la deriva se note en cada run en vez de acumularse en
  // silencio (el motivo por el que se creó este check).
  runGateHeader('info', 'aviso de deriva documental (check-component-inventory.ts, no bloqueante)');
  runChildGate('check-component-inventory.ts', [], '');

  const g1 = gate1Schema(dataPath);
  gates.push(g1);

  // Si el schema no valida, no tiene sentido auditar ni reconstruir — pero SÍ corremos el
  // resto de gates que no dependen de un build válido (control files), para dar el reporte
  // más completo posible en una sola pasada.
  //
  // Orden crítico: paridad (Gate 2) ANTES de build (Gate 3) — ver comentario de cabecera de
  // gate2ParityAuditPreBuild. Si se invierte, el build enmascara cualquier manipulación
  // manual del export antes de que la auditoría llegue a verla.
  const skipped = (name: string, motivo: string): GateResult => ({
    name,
    passed: true,
    errors: [],
    warnings: [`Omitido — modo exploración: ${motivo}`]
  });

  if (g1.passed) {
    if (explorationMode) {
      gates.push(skipped('parity (pre-build)', 'sin export previo que auditar.'));
    } else {
      gates.push(gate2ParityAuditPreBuild(campaignDir));
    }
    gates.push(gate3Build(dataPath, outDir));
  } else {
    gates.push({ name: 'parity (pre-build)', passed: false, errors: ['Omitido — Gate 1 (schema) no pasó'], warnings: [] });
    gates.push({ name: 'build', passed: false, errors: ['Omitido — Gate 1 (schema) no pasó'], warnings: [] });
  }

  gates.push(gate4Claims(dataPath));
  gates.push(
    explorationMode
      ? skipped('assets HTTP 200', 'sin despliegue que auditar todavía.')
      : await gate5Assets(inlinePath)
  );
  gates.push(
    explorationMode
      ? skipped('control files', 'sin archivos de control de traspaso en una exploración en solitario.')
      : gate6ControlFiles(campaignDir)
  );
  gates.push(gate7ColumnBalance(campaignDir));
  gates.push(gate8BrandPackCompleteness(campaignDir));
  gates.push(gate9Contrast(campaignDir));
  gates.push(
    explorationMode
      ? skipped('production readiness', 'preparación de producción no aplica todavía.')
      : gate10ProductionReadiness(campaignDir)
  );
  gates.push(gate11HeroDecision(campaignDir));
  gates.push(gate12StructuralDifferentiation(campaignDir));
  gates.push(
    explorationMode
      ? skipped('brand visual report completeness', 'informe Nivel 5 de marca diferido hasta producción real.')
      : gate13BrandVisualReportCompleteness(campaignDir)
  );

  // ── Resultados ─────────────────────────────────────────────────────────
  console.log(`\n${'='.repeat(60)}`);
  console.log('   Resultados del Production Gate (motor)');
  console.log(`${'='.repeat(60)}\n`);

  let allPassed = true;
  for (const g of gates) {
    const icon = g.passed ? '✅' : '❌';
    console.log(`   ${icon} Gate: ${g.name}`);
    for (const e of g.errors) console.log(`        ❌ ${e}`);
    for (const w of g.warnings) console.log(`        ⚠️  ${w}`);
    if (!g.passed) allPassed = false;
  }

  console.log('');
  if (allPassed) {
    console.log('   ✅ Production gate (motor) passed.');
    console.log('      Campaign is candidate for production,');
    console.log('      pending final human/client approval.\n');
    process.exit(0);
  } else {
    const failed = gates.filter((g) => !g.passed).map((g) => g.name);
    console.log('   ❌ Production gate (motor) failed.');
    console.log('      Campaign is NOT ready for production.\n');
    console.log(`      ${failed.length} gate(s) failed: ${failed.join(', ')}\n`);
    process.exit(1);
  }
}

main();
