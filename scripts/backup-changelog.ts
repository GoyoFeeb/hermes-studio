#!/usr/bin/env npx tsx
/**
 * backup-changelog.ts — copia timestamped de engine/CHANGELOG.md antes de modificarlo.
 *
 * Motivo (docs/incidente-changelog-engine-2026-08-01.md): el 2026-08-01, una sesión de
 * Hermes Agent CLI usó `write_file` (reescritura completa) en vez de `patch` (append) para
 * añadir una entrada al changelog, y sobrescribió el archivo entero — de ~2.777 líneas a 148
 * (~91% de pérdida). El repo no tenía control de versiones en ese momento, así que la pérdida
 * fue irreversible. task_changelog_backup (tasks.json) pedía exactamente este script.
 *
 * Uso:
 *   npx tsx scripts/backup-changelog.ts
 *   npm run changelog:backup
 *
 * No falla si ya existe un backup con el mismo timestamp (no debería pasar, resolución de
 * segundo) — sobrescribe ese caso concreto en vez de abortar, para que este script nunca sea
 * el motivo de que alguien se salte el backup.
 */
import * as fs from 'fs';
import * as path from 'path';

const ROOT = path.resolve(import.meta.dirname, '..');
const CHANGELOG = path.join(ROOT, 'engine', 'CHANGELOG.md');
const BACKUP_DIR = path.join(ROOT, '_archive', 'changelog-backups');

function timestamp(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return (
    `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-` +
    `${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`
  );
}

function main(): void {
  if (!fs.existsSync(CHANGELOG)) {
    console.error(`\n  ❌ No existe ${CHANGELOG} — nada que respaldar.\n`);
    process.exit(1);
  }

  fs.mkdirSync(BACKUP_DIR, { recursive: true });

  const stats = fs.statSync(CHANGELOG);
  const content = fs.readFileSync(CHANGELOG, 'utf8');
  const lines = content.split('\n').length;

  const backupPath = path.join(BACKUP_DIR, `CHANGELOG-${timestamp()}.md`);
  fs.copyFileSync(CHANGELOG, backupPath);

  console.log(`\n  ✅ Backup creado: ${path.relative(ROOT, backupPath)}`);
  console.log(`     (${lines} líneas, ${(stats.size / 1024).toFixed(1)} KB)\n`);
}

main();
