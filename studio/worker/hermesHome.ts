/**
 * hermesHome.ts — un HERMES_HOME por réplica y por hueco (2026-10-20).
 *
 * Dos `hermes chat` en el mismo state.db se pisan las sesiones. Cada hueco tiene carpeta
 * propia: copia config y claves, enlaza el resto (skills, memoria) y deja state.db y sessions
 * nuevos. En el Mac, con un solo hueco y sin nube, no se cambia el home de Hermes.
 */
import * as fs from 'fs';
import * as path from 'path';

const SKIP = new Set([
  'state.db',
  'state.db-wal',
  'state.db-shm',
  'sessions',
  'logs',
  'checkpoints',
  'checkpoint',
  'workers',
  'slots',
  'studio-slots',
]);

const COPY = new Set(['config.yaml', 'config.yml', '.env', 'auth.json', 'SOUL.md']);

export function shouldIsolateHome(env: NodeJS.ProcessEnv, concurrency: number): boolean {
  if (concurrency > 1) return true;
  if (env.HERMES_CLOUD === '1') return true;
  if ((env.RAILWAY_REPLICA_ID || '').trim()) return true;
  return false;
}

export function slotHomeDir(base: string, workerId: string, slot: number): string {
  const id = workerId.replace(/[^a-zA-Z0-9._-]/g, '').slice(0, 64) || 'local';
  return path.join(base, 'workers', id, `slot-${Math.max(0, Math.floor(slot))}`);
}

/** Prepara `slotDir` a partir de `base`. No sigue el propio árbol de workers. */
export function isolateHermesHome(base: string, slotDir: string): void {
  fs.mkdirSync(slotDir, { recursive: true });
  if (!fs.existsSync(base)) return;
  const baseReal = fs.realpathSync(base);
  const slotReal = fs.realpathSync(slotDir);
  if (baseReal === slotReal) return;
  for (const name of fs.readdirSync(base)) {
    if (SKIP.has(name)) continue;
    const from = path.join(base, name);
    const to = path.join(slotDir, name);
    if (fs.existsSync(to)) continue;
    let real = from;
    try {
      real = fs.realpathSync(from);
    } catch {
      continue;
    }
    if (real === slotReal || real.startsWith(slotReal + path.sep) || slotReal.startsWith(real + path.sep)) continue;
    if (COPY.has(name)) {
      try {
        if (fs.statSync(from).isFile()) fs.copyFileSync(from, to);
      } catch {
        // un archivo que no se puede copiar no impide el resto
      }
      continue;
    }
    try {
      fs.symlinkSync(from, to);
    } catch {
      // sin enlace: el hueco arranca sin esa pieza
    }
  }
}
