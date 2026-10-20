/**
 * claimQueue.ts — reclamar un trabajo sin que dos workers o dos huecos cojan el mismo (2026-10-20).
 *
 * El candado es un mkdir atómico en el disco de Studio. La selección es pura: el más antiguo
 * en cola y listo para coger. El arrendamiento (lease) lo renueva el latido de ese trabajo;
 * si caduca, otro worker puede fallarlo y la cola sigue.
 */
import * as fs from 'fs';
import * as path from 'path';

export const DEFAULT_LEASE_MS = 4 * 60 * 1000;

export interface ClaimCandidate {
  id: string;
  status: string;
  createdAt: string;
  ready: boolean;
  mode?: string;
}

export interface JobLease {
  workerId: string;
  slot: number;
  until: string;
}

export function selectClaim(jobs: ClaimCandidate[]): ClaimCandidate | null {
  return (
    jobs
      .filter((j) => j.status === 'queued' && j.ready && (j.mode == null || j.mode === 'standalone'))
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt) || a.id.localeCompare(b.id))[0] || null
  );
}

export function leaseUntil(now: number, leaseMs = DEFAULT_LEASE_MS): string {
  return new Date(now + leaseMs).toISOString();
}

export function leaseExpired(until: string | undefined, now: number): boolean {
  if (!until) return false;
  const t = Date.parse(until);
  return Number.isFinite(t) && t <= now;
}

/** Renueva solo si el worker es el dueño y queda menos de media vida. Si no toca, devuelve el mismo. */
export function nextLease(current: JobLease, workerId: string, now: number, leaseMs = DEFAULT_LEASE_MS): JobLease | null {
  if (!workerId || current.workerId !== workerId) return null;
  if (Date.parse(current.until) - now > leaseMs / 2) return current;
  return { ...current, until: leaseUntil(now, leaseMs) };
}

export function workerConcurrency(env: NodeJS.ProcessEnv = process.env): number {
  const raw = env.WORKER_CONCURRENCY;
  if (raw == null || String(raw).trim() === '') return 2;
  const n = Number(raw);
  if (!Number.isFinite(n)) return 2;
  return Math.max(1, Math.min(8, Math.floor(n)));
}

/** Huecos libres de 0 a limit-1 que no están en `busySlots`. */
export function freeSlots(limit: number, busySlots: number[]): number[] {
  const busy = new Set(busySlots);
  const out: number[] = [];
  const n = Math.max(0, Math.floor(limit));
  for (let i = 0; i < n; i++) if (!busy.has(i)) out.push(i);
  return out;
}

export function workerIdentity(env: NodeJS.ProcessEnv = process.env): string {
  const raw = (env.RAILWAY_REPLICA_ID || env.HOSTNAME || 'local').trim();
  const safe = raw.replace(/[^a-zA-Z0-9._-]/g, '').slice(0, 64);
  return safe || 'local';
}

/** Un mkdir gana. El perdedor espera. Un candado de más de 30 s se considera de un proceso muerto. */
export async function withStoreLock<T>(dir: string, fn: () => Promise<T> | T): Promise<T> {
  fs.mkdirSync(dir, { recursive: true });
  const lock = path.join(dir, '.claim.lock');
  const deadline = Date.now() + 8_000;
  for (;;) {
    try {
      fs.mkdirSync(lock);
      break;
    } catch (err) {
      const code = (err as NodeJS.ErrnoException).code;
      if (code !== 'EEXIST') throw err;
      try {
        const st = fs.statSync(lock);
        if (Date.now() - st.mtimeMs > 30_000) fs.rmSync(lock, { recursive: true, force: true });
      } catch {
        // otro proceso lo acaba de soltar
      }
      if (Date.now() > deadline) throw new Error('No se pudo tomar el candado de la cola.');
      await new Promise((r) => setTimeout(r, 5 + Math.floor(Math.random() * 20)));
    }
  }
  try {
    return await fn();
  } finally {
    fs.rmSync(lock, { recursive: true, force: true });
  }
}
