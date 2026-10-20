/**
 * workerPool.ts — huecos que Studio cree que hay ahora (2026-10-20).
 *
 * Cada réplica avisa en el latido cuántos trabajos puede llevar (WORKER_CONCURRENCY).
 * La suma de las réplicas vistas en el último minuto y medio es la capacidad de la cola.
 * Sin avisos, STUDIO_WORKER_SLOTS (defecto 2).
 */
const FRESH_MS = 90_000;
const seen = new Map<string, { concurrency: number; at: number }>();

export function noteWorker(id: string | undefined, concurrency: number | undefined, now = Date.now()): void {
  const key = (id || '').trim();
  if (!key) return;
  const n = Number(concurrency);
  const slots = Number.isFinite(n) && n >= 1 ? Math.min(8, Math.floor(n)) : 1;
  seen.set(key, { concurrency: slots, at: now });
}

export function workerCapacity(now = Date.now(), env: NodeJS.ProcessEnv = process.env): number {
  let sum = 0;
  for (const [id, w] of seen) {
    if (now - w.at > FRESH_MS) seen.delete(id);
    else sum += w.concurrency;
  }
  if (sum > 0) return sum;
  const fallback = Number(env.STUDIO_WORKER_SLOTS ?? 2);
  if (!Number.isFinite(fallback) || fallback < 1) return 2;
  return Math.min(16, Math.floor(fallback));
}

export function resetWorkerPool(): void {
  seen.clear();
}
