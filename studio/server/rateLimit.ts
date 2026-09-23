/**
 * rateLimit.ts — limitador de tasa en memoria, sin dependencias nuevas (auditoría 2026-09-23,
 * BUG-H09: la única barrera de acceso de Studio era una contraseña compartida sin ningún límite
 * de intentos — fuerza-bruteable sin fricción si el servicio queda expuesto). Ventana fija por
 * IP, deliberadamente simple: Studio es un servicio de un solo proceso para un equipo pequeño
 * (ver studio/README.md, "Un job a la vez" — la cola ya asume una sola instancia), así que un
 * contador en memoria por proceso es suficiente y no añade `express-rate-limit` ni Redis para
 * un problema de esta escala — mismo criterio que el resto del proyecto (motor de plantillas
 * propio, sin Vitest, `node --test` en vez de un runner de terceros).
 *
 * No apto para despliegue multi-instancia (el contador no se comparte entre procesos) — si
 * Studio alguna vez escala a varias réplicas, esto necesita un store compartido (Redis, etc.).
 * No es el caso hoy: un solo proceso, una sola cola secuencial.
 */
import type { NextFunction, Request, Response } from 'express';

interface Bucket {
  count: number;
  resetAt: number;
}

/**
 * Middleware de ventana fija: permite como máximo `max` peticiones por IP cada `windowMs`.
 * `keyPrefix` evita que dos limitadores distintos (ej. auth vs. /api/jobs) compartan contador
 * para la misma IP.
 */
export function createRateLimiter(opts: { windowMs: number; max: number; keyPrefix: string; message: string }) {
  const buckets = new Map<string, Bucket>();

  // Poda periódica para no acumular IPs viejas indefinidamente en un proceso de larga duración.
  const sweepInterval = setInterval(() => {
    const now = Date.now();
    for (const [key, bucket] of buckets) {
      if (bucket.resetAt <= now) buckets.delete(key);
    }
  }, Math.max(opts.windowMs, 60_000));
  sweepInterval.unref?.();

  function keyFor(req: Request): string {
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    return `${opts.keyPrefix}:${ip}`;
  }

  function currentBucket(req: Request): Bucket {
    const key = keyFor(req);
    const now = Date.now();
    let bucket = buckets.get(key);
    if (!bucket || bucket.resetAt <= now) {
      bucket = { count: 0, resetAt: now + opts.windowMs };
      buckets.set(key, bucket);
    }
    return bucket;
  }

  /** true si esta IP ya alcanzó el límite (consulta, no consume cupo). */
  function isLimited(req: Request): boolean {
    const bucket = currentBucket(req);
    return bucket.count >= opts.max;
  }

  function reject(req: Request, res: Response): void {
    const bucket = currentBucket(req);
    const retryAfterSec = Math.ceil((bucket.resetAt - Date.now()) / 1000);
    res.set('Retry-After', String(retryAfterSec));
    res.status(429).json({ error: opts.message });
  }

  /** Middleware estándar: consume 1 de cupo en CADA petición que pasa por aquí. */
  function rateLimit(req: Request, res: Response, next: NextFunction): void {
    const bucket = currentBucket(req);
    bucket.count++;
    const remaining = Math.max(0, opts.max - bucket.count);
    res.set('X-RateLimit-Limit', String(opts.max));
    res.set('X-RateLimit-Remaining', String(remaining));
    if (bucket.count > opts.max) {
      reject(req, res);
      return;
    }
    next();
  }

  /**
   * Marca un intento fallido para esta IP (consume 1 de cupo) — usar DENTRO de un middleware de
   * auth, solo en la rama que falla, para no penalizar el uso normal ya autenticado con el
   * mismo límite pensado para cortar fuerza bruta.
   */
  function recordFailure(req: Request): void {
    const bucket = currentBucket(req);
    bucket.count++;
  }

  return { middleware: rateLimit, isLimited, reject, recordFailure };
}
