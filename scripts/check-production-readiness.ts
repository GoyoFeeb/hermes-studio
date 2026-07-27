#!/usr/bin/env npx tsx
/**
 * check-production-readiness.ts — cierra 2 huecos reales encontrados en la auditoría profunda
 * del motor (2026-07-24, a petición del usuario):
 *
 * 1. Ningún gate detectaba URLs de relleno tipo "https://PENDING-CDN-UPLOAD/..." o
 *    "https://PENDING-BMW-LOGO/" — verificado que pasan el $def httpsUrl del schema sin
 *    problema (solo exige el prefijo "https://") y que YA se han usado en 3 campañas reales
 *    de esta sesión (BMW, Nike, Tarífalo) mientras se esperaba la subida real al CDN. Eso es
 *    correcto mientras la campaña sea de prueba — pero nada impedía que ese mismo placeholder
 *    llegara a una campaña con metadata.productionReady:true sin que ningún gate lo bloqueara.
 * 2. engine/schema/campaign-data.schema.json documenta explícitamente, en el comentario de
 *    "legalLine", que no puede hacer validación cruzada isTestCampaign/placeholder sin JSON
 *    Schema 2019-09 (if/then) — "limitación conocida". Este script hace esa validación cruzada
 *    como TypeScript en vez de forzarla dentro del schema.
 *
 * Regla: si metadata.isTestCampaign !== true (es decir, se declara como campaña real), ningún
 * placeholder de relleno puede sobrevivir: ni "PENDING-"/"PLACEHOLDER" (case-insensitive) en
 * ninguna URL de campaign-data.json o del HTML exportado, ni un valor de texto que empiece por
 * "[" (mismo convenio [Q-NNN]/[PENDIENTE] ya usado en el resto del sistema, incluida la única
 * excepción ya documentada: legalLine con isTestCampaign:true). Si isTestCampaign:true, los
 * mismos hallazgos se degradan a avisos informativos — es exactamente lo que next-steps.md ya
 * debería listar, esto solo lo hace verificable en vez de depender de que un humano lo recuerde.
 *
 * Uso:
 *   npx tsx scripts/check-production-readiness.ts --campaign newsletters/{year}/{client}/{campaign}
 */
import * as fs from 'fs';
import * as path from 'path';

const ROOT = path.resolve(import.meta.dirname, '..');

const PLACEHOLDER_URL_RE = /pending-|placeholder/i;
const BRACKET_PLACEHOLDER_RE = /^\s*\[/;
const SKIP_KEYS = new Set(['href', 'icon', 'unsubscribeUrl', 'preferencesUrl']); // ESP merge-tags entre corchetes son legítimos, no placeholders

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

interface Finding {
  fieldPath: string;
  value: string;
  reason: string;
}

function scanCampaignData(data: any): Finding[] {
  const findings: Finding[] = [];

  function walk(obj: any, fieldPath: string): void {
    if (obj === null || obj === undefined) return;
    if (typeof obj === 'string') {
      if (PLACEHOLDER_URL_RE.test(obj)) {
        findings.push({ fieldPath, value: obj, reason: 'contiene "PENDING-"/"PLACEHOLDER"' });
      } else if (BRACKET_PLACEHOLDER_RE.test(obj) && !/^\[[A-Z_]+\]$/.test(obj.trim())) {
        // Excluye merge-tags de ESP válidos tipo "[UNSUBSCRIBE_LINK]" (mayúsculas+guion bajo,
        // sin más texto) — esos NO son placeholders, son tokens que el ESP resuelve en el envío.
        findings.push({ fieldPath, value: obj, reason: 'empieza por "[" — placeholder de texto sin resolver' });
      }
      return;
    }
    if (Array.isArray(obj)) {
      obj.forEach((item, i) => walk(item, `${fieldPath}[${i}]`));
      return;
    }
    if (typeof obj === 'object') {
      for (const key of Object.keys(obj)) {
        if (key.startsWith('_')) continue;
        walk(obj[key], `${fieldPath}.${key}`);
      }
    }
  }

  walk(data.metadata, 'metadata');
  if (Array.isArray(data.modules)) {
    data.modules.forEach((mod: any, i: number) => walk(mod.data, `modules[${i}] (${mod.component || '?'}).data`));
  }

  return findings;
}

function scanHtml(html: string): Finding[] {
  const findings: Finding[] = [];
  const re = /(?:src|href)="([^"]+)"/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html))) {
    if (PLACEHOLDER_URL_RE.test(m[1])) {
      findings.push({ fieldPath: '(final-inline.html)', value: m[1], reason: 'contiene "PENDING-"/"PLACEHOLDER"' });
    }
  }
  return findings;
}

function main(): void {
  const args = parseArgs();
  if (!args.campaign) {
    console.error('\n  ❌ Error: falta --campaign\n');
    console.error('  Uso: npx tsx scripts/check-production-readiness.ts --campaign newsletters/{year}/{client}/{campaign}\n');
    process.exit(1);
  }

  const campaignDir = path.isAbsolute(args.campaign) ? args.campaign : path.resolve(ROOT, args.campaign);
  const dataPath = path.join(campaignDir, '06-data', 'campaign-data.json');
  const inlinePath = path.join(campaignDir, '09-exports', 'final-inline.html');

  console.log('\n═══════════════════════════════════════════════════');
  console.log('   check-production-readiness');
  console.log('═══════════════════════════════════════════════════\n');

  if (!fs.existsSync(dataPath)) {
    console.error(`   ❌ No existe ${dataPath}\n`);
    process.exit(1);
  }

  const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
  const isTestCampaign = data.metadata?.isTestCampaign === true;

  let findings: Finding[] = scanCampaignData(data);
  if (fs.existsSync(inlinePath)) {
    findings = findings.concat(scanHtml(fs.readFileSync(inlinePath, 'utf8')));
  } else {
    console.log(`   ⚠️  No existe ${inlinePath} — solo se audita campaign-data.json, no el HTML exportado.\n`);
  }

  console.log(`   metadata.isTestCampaign: ${isTestCampaign}\n`);

  if (findings.length === 0) {
    console.log('   ✅ Ningún placeholder de relleno encontrado.\n');
    process.exit(0);
  }

  let hasError = false;
  for (const f of findings) {
    if (isTestCampaign) {
      console.log(`   ⚠️  ${f.fieldPath}: "${f.value}" — ${f.reason} (permitido: isTestCampaign:true)`);
    } else {
      console.log(`   ❌ ${f.fieldPath}: "${f.value}" — ${f.reason} — campaña NO marcada como isTestCampaign, esto NO puede llegar a producción`);
      hasError = true;
    }
  }

  console.log('');
  if (hasError) {
    console.log('   ❌ check-production-readiness: FAIL\n');
    process.exit(1);
  }
  console.log('   ✅ check-production-readiness: OK (con avisos, ver arriba — campaña de prueba)\n');
}

main();
