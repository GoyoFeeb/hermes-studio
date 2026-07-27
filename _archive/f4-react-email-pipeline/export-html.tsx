#!/usr/bin/env npx tsx
/**
 * export-html.tsx — Renderiza una newsletter React Email a HTML final.
 *
 * Uso:
 *   npx tsx scripts/export-html.tsx --campaign newsletters/{year}/{client}/{campaign}
 *   npx tsx scripts/export-html.tsx --campaign /ruta/absoluta --inline --force
 *
 * Dependencias requeridas:
 *   - react, react-dom
 *   - @react-email/components
 *   - @react-email/render
 *   - typescript
 *   - tsx
 *
 * Instalación:
 *   cd (carpeta de la campana o raiz del proyecto)
 *   npm install react react-dom @react-email/components @react-email/render typescript tsx
 */

import * as fs from 'fs';
import * as path from 'path';

// ── Configuración ──────────────────────────────────────────────────────────

const ROOT = path.resolve(import.meta.dirname, '..');
const REQUIRED_DEPS = ['react', 'react-dom', '@react-email/components', '@react-email/render', 'typescript', 'tsx'];
const RESULTS: { type: 'ok' | 'warn' | 'err'; message: string }[] = [];

function ok(msg: string): void { RESULTS.push({ type: 'ok', message: msg }); }
function warn(msg: string): void { RESULTS.push({ type: 'warn', message: msg }); }
function err(msg: string): void { RESULTS.push({ type: 'err', message: msg }); }

// ── Argumentos ─────────────────────────────────────────────────────────────

function parseArgs(): Record<string, string> {
  const args = process.argv.slice(2);
  const parsed: Record<string, string> = {};
  for (let i = 0; i < args.length; i++) {
    const key = args[i].replace(/^--/, '');
    const next = args[i + 1];
    if (key === 'force' || key === 'inline') {
      parsed[key] = 'true';
    } else if (next && !next.startsWith('--')) {
      parsed[key] = next;
      i++;
    } else {
      parsed[key] = 'true';
    }
  }
  return parsed;
}

function resolveCampaignPath(raw: string): string {
  if (path.isAbsolute(raw)) return raw;
  return path.resolve(ROOT, raw);
}

// ── Verificar dependencias ─────────────────────────────────────────────────

function checkDeps(): boolean {
  const missing: string[] = [];

  for (const dep of REQUIRED_DEPS) {
    try {
      require.resolve(dep, { paths: [ROOT] });
    } catch {
      missing.push(dep);
    }
  }

  if (missing.length > 0) {
    console.error('\n  ❌ Error: Faltan dependencias para exportar HTML.\n');
    console.error(`     Instala los siguientes paquetes:\n`);
    console.error(`     npm install ${missing.join(' ')}\n`);
    console.error('     O desde la carpeta de la campaña si tiene su propio package.json.\n');
    return false;
  }

  return true;
}

// ── Añadir VML bulletproof a los CTAs ──────────────────────────────────────

function addVmlToButtons(html: string): string {
  console.log('addVmlToButtons called, html length:', html.length);

  // Detecta si hay background-color:#FF5A3C en el HTML
  const hasCta = html.includes('background-color:#FF5A3C');
  console.log('Has CTA:', hasCta);

  if (!hasCta) return html;

  // Estrategia: buscamos background-color:#FF5A3C y luego
  // caminamos hacia adelante para encontrar href y text
  const lines = html.split('\n');
  let result = '';
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (line.includes('background-color:#FF5A3C') && line.includes('border-radius:') && line.includes('padding:')) {
      // Encontramos el CTA — extraer href y text de líneas siguientes
      let href = '';
      let text = '';
      let j = i + 1;

      while (j < lines.length && j < i + 10) {
        const hrefMatch = lines[j].match(/href="([^"]+)"/);
        if (hrefMatch) href = hrefMatch[1];

        const textMatch = lines[j].match(/>([A-Z\s]+)<\/a/);
        if (textMatch) text = textMatch[1];

        // Si encontramos </a>, hemos llegado al final del CTA
        if (lines[j].includes('</a')) {
          // Ensamblar el VML
          const vmlBlock = `<!--[if mso]>
            <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word"
              href="${href}" style="height:52px;v-text-anchor:middle;width:100%;"
              arcsize="50%" strokecolor="#FF5A3C" fillcolor="#FF5A3C">
              <w:anchorlock/>
              <center style="color:#FFFFFF;font-family:Arial,Helvetica,sans-serif;font-size:16px;font-weight:700;">${text}</center>
            </v:roundrect>
            <![endif]-->
            <!--[if !mso]><!-->`;

          const endBlock = `<!--<![endif]-->`;

          // Reemplazar el bloque CTA
          const ctaLines = lines.slice(i, j + 1).join('\n');
          result += vmlBlock + '\n' + ctaLines + '\n' + endBlock + '\n';
          i = j + 1;
          break;
        }
        j++;
      }

      if (!href) {
        result += line + '\n';
        i++;
      }
    } else {
      result += line + '\n';
      i++;
    }
  }

  console.log('VML processing complete');
  return result;
}

// ── Renderizar HTML ────────────────────────────────────────────────────────

async function renderHtml(campaignDir: string, inline: boolean, force: boolean): Promise<void> {
  const reactEmailDir = path.join(campaignDir, '07-code', 'react-email');
  const jsonPath = path.join(campaignDir, '06-data', 'newsletter-data.json');
  const nuevaCreaPath = path.join(reactEmailDir, 'NuevaCrea.tsx');
  const destDir = path.join(campaignDir, '09-exports');
  const htmlPath = path.join(destDir, 'final.html');
  const inlinePath = path.join(destDir, 'final-inline.html');

  // Comprobar archivos necesarios
  if (!fs.existsSync(jsonPath)) {
    err(`No se encuentra 06-data/newsletter-data.json en ${campaignDir}`);
    return;
  }
  ok('06-data/newsletter-data.json encontrado');

  if (!fs.existsSync(nuevaCreaPath)) {
    err(`No se encuentra 07-code/react-email/NuevaCrea.tsx en ${campaignDir}`);
    return;
  }
  ok('07-code/react-email/NuevaCrea.tsx encontrado');

  if (!fs.existsSync(destDir)) {
    warn('09-exports/ no existe — se creará');
    fs.mkdirSync(destDir, { recursive: true });
  }

  // No sobrescribir sin --force
  if (fs.existsSync(htmlPath) && !force) {
    err(`Ya existe final.html en ${destDir}. Usa --force para sobrescribir.`);
    return;
  }

  // Importar datos y componente
  const data = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
  ok('newsletter-data.json cargado');

  // Renderizar con @react-email/render
  try {
    const React = require('react');
    const { render } = require('@react-email/render');
    const modulePath = path.resolve(nuevaCreaPath);

    // Import dinámico del componente de la campaña (tsx maneja .tsx via import())
    const componentModule = await import(modulePath);
    const HermesNewsletter = componentModule.default || componentModule.HermesNewsletter;

    if (!HermesNewsletter) {
      err('El componente HermesNewsletter no se encontró en NuevaCrea.tsx');
      return;
    }

    const component = React.createElement(HermesNewsletter, { data });
    const html = await render(component, { pretty: true });

    // Post-procesado: añadir VML bulletproof a los CTAs para Outlook
    const htmlWithVml = addVmlToButtons(html);

    fs.writeFileSync(htmlPath, htmlWithVml, 'utf-8');
    const sizeKb = (Buffer.byteLength(html) / 1024).toFixed(1);
    ok(`final.html generado (${sizeKb} KB)`);

    // Inline si se solicita
    if (inline) {
      try {
        const juiceModule = require('juice');
        const juice = juiceModule.default || juiceModule;
        const inlined = juice(htmlWithVml);
        fs.writeFileSync(inlinePath, inlined, 'utf-8');
        const inlineSizeKb = (Buffer.byteLength(inlined) / 1024).toFixed(1);
        ok(`final-inline.html generado (${inlineSizeKb} KB)`);
      } catch (juiceErr) {
        warn(`juice no está disponible — final-inline.html no se generó. Error: ${(juiceErr as Error).message}. Instala: npm install juice`);
      }
    }

  } catch (renderErr) {
    err(`Error al renderizar: ${(renderErr as Error).message}`);
    return;
  }
}

// ── Mostrar resultados ─────────────────────────────────────────────────────

function printResults(): void {
  const errors = RESULTS.filter(r => r.type === 'err');
  const warnings = RESULTS.filter(r => r.type === 'warn');
  const oks = RESULTS.filter(r => r.type === 'ok');

  console.log('');
  if (oks.length > 0) {
    for (const r of oks) console.log(`  ✅ ${r.message}`);
  }
  if (warnings.length > 0) {
    console.log('');
    for (const r of warnings) console.log(`  ⚠️  ${r.message}`);
  }
  if (errors.length > 0) {
    console.log('');
    for (const r of errors) console.log(`  ❌ ${r.message}`);
  }

  console.log('\n═══════════════════════════════════════════════════');
  if (errors.length > 0) {
    console.log('   ❌ Exportación fallida.\n');
    process.exit(1);
  } else {
    console.log('   ✅ Exportación completada.\n');
    process.exit(0);
  }
}

// ── Main ───────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  console.log('\n═══════════════════════════════════════════════════');
  console.log('   Hermes Newsletter System — Exportar HTML');
  console.log('═══════════════════════════════════════════════════\n');

  const args = parseArgs();

  if (!args.campaign) {
    console.error('\n  ❌ Error: falta --campaign\n');
    console.error('  Uso: npx tsx scripts/export-html.tsx --campaign newsletters/{year}/{client}/{campaign} [--inline] [--force]\n');
    process.exit(1);
  }

  // Verificar dependencias
  if (!checkDeps()) {
    process.exit(1);
  }

  const campaignDir = resolveCampaignPath(args.campaign);
  const force = args.force === 'true';
  const inline = args.inline === 'true';

  console.log(`   Campaña: ${campaignDir}`);
  if (force) console.log('   Modo:     --force (sobrescribir si existe)');
  if (inline) console.log('   Modo:     --inline (generar tambien final-inline.html)');

  await renderHtml(campaignDir, inline, force);
  printResults();
}

main();
