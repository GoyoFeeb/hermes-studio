/**
 * check-newsletter.ts — la comprobación de Studio, para que Hermes la ejecute él mismo antes de entregar
 * (2026-10-05, auditoría de agentes). Es la misma que hace el worker al recibir la pieza (inspect.ts): si sale
 * limpia aquí, no habrá ronda de corrección.
 *
 * Uso:  npm run check-newsletter -- <ruta/newsletter.html> [--marca <slug>] [--sin-arreglos] [--retoque]
 *   --sin-arreglos  no aplica los arreglos automáticos (por defecto se aplican y se guarda el HTML)
 *   --retoque       «Pedir cambios» / «Adaptar a móvil»: no mide espacios ni estructura
 * Sale con código 1 si hay errores.
 */
import * as fs from 'fs';
import * as path from 'path';
import { inspectNewsletter } from './inspect';
import { describeErrors } from './qualityCheck';

const ROOT = path.resolve(__dirname, '..', '..');

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const file = args.find((a) => !a.startsWith('--') && args[args.indexOf(a) - 1] !== '--marca');
  if (!file) {
    console.error('Uso: npm run check-newsletter -- <ruta/newsletter.html> [--marca <slug>] [--sin-arreglos] [--retoque]');
    process.exit(2);
  }
  const abs = path.resolve(process.cwd(), file);
  if (!fs.existsSync(abs)) {
    console.error(`No existe ${abs}`);
    process.exit(2);
  }
  const i = args.indexOf('--marca');
  // newsletters/<año>/<marca>/hermes/<trabajo>/newsletter.html → la marca sale de la ruta si no se indica.
  const slug = i >= 0 ? args[i + 1] : path.relative(ROOT, abs).split(path.sep)[2];
  const { report, applied } = await inspectNewsletter(abs, ROOT, {
    fix: !args.includes('--sin-arreglos'),
    design: !args.includes('--retoque'),
    brandSlug: slug,
  });
  if (applied.length) console.log(`Arreglos automáticos aplicados (ya guardados):\n${applied.map((a) => `- ${a}`).join('\n')}\n`);
  if (report.errors) {
    console.log(`✗ ${report.errors} comprobación(es) con errores. Corrígelos y vuelve a ejecutar este comando:\n`);
    console.log(describeErrors(report));
  } else {
    console.log('✓ Sin errores: Studio no te devolverá la pieza por nada de esto.');
  }
  const warnings = report.checks.filter((c) => c.status === 'warning');
  if (warnings.length) {
    console.log(`\nAvisos (no bloquean, pero revísalos):\n${warnings.map((c) => `- ${c.label}: ${c.details.slice(0, 2).join(' | ')}`).join('\n')}`);
  }
  process.exitCode = report.errors ? 1 : 0;
}

void main();
