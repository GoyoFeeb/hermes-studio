/**
 * supabase.ts — copia de los datos de Studio en Supabase (fase 1, ver studio/PLAN-SUPABASE-FASE-1.md).
 *
 * El disco sigue mandando: store.ts y compañía escriben como siempre y, además, encolan aquí el mismo
 * cambio. La cola es ordenada (un envío cada vez) para que Postgres reciba los cambios de un trabajo en el
 * orden en que ocurrieron. Sin SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY no hace nada: el entorno local y
 * los tests no necesitan Supabase.
 *
 * Sin dependencia nueva: son cuatro llamadas HTTP (PostgREST y Storage) con el fetch de Node.
 */
import type { Job, JobEvent } from './store';

export type Bucket = 'newsletters' | 'assets' | 'brand-packs';

export interface SupabaseOptions {
  url?: string;
  key?: string;
  fetch?: typeof fetch;
  /** Esperas entre reintentos de un envío fallido. Agotadas, el envío se descarta y se avisa. */
  retryDelaysMs?: number[];
  onError?: (message: string) => void;
}

const DEFAULT_RETRY_DELAYS_MS = [500, 2000, 8000, 30000];
/** Con Supabase caído mucho rato la cola no debe crecer sin fin: a partir de aquí se descarta lo nuevo. */
const MAX_PENDING = 5000;

/** Las rutas llegan como rutas de disco relativas: cada tramo se codifica por separado. */
function objectPath(relPath: string): string {
  return relPath.split(/[\\/]+/).filter(Boolean).map(encodeURIComponent).join('/');
}

export function createSupabase(opts: SupabaseOptions = {}) {
  const url = (opts.url ?? process.env.SUPABASE_URL ?? '').replace(/\/+$/, '');
  const key = opts.key ?? process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';
  const doFetch = opts.fetch ?? fetch;
  const retryDelaysMs = opts.retryDelaysMs ?? DEFAULT_RETRY_DELAYS_MS;
  const onError = opts.onError ?? ((m: string) => console.error(`[supabase] ${m}`));
  const enabled = Boolean(url && key);

  let tail: Promise<void> = Promise.resolve();
  let pending = 0;
  let dropped = 0;
  /** Última versión de cada trabajo aún sin enviar: varios cambios seguidos salen como un solo envío. */
  const latestJob = new Map<string, Job>();

  async function request(path: string, init: RequestInit & { headers?: Record<string, string> }): Promise<Response> {
    const res = await doFetch(`${url}${path}`, {
      ...init,
      headers: { apikey: key, Authorization: `Bearer ${key}`, ...init.headers },
    });
    if (!res.ok) {
      const body = await res.text().catch(() => '');
      throw new Error(`${init.method ?? 'GET'} ${path.split('?')[0]} → ${res.status} ${body.slice(0, 200)}`);
    }
    return res;
  }

  /** Encola un envío. No lanza: un fallo de Supabase no debe tumbar una petición de Studio. */
  function enqueue(label: string, send: () => Promise<unknown>): void {
    if (!enabled) return;
    if (pending >= MAX_PENDING) {
      if (dropped++ === 0) onError(`cola llena (${MAX_PENDING} envíos pendientes): se descartan los nuevos — ${label}`);
      return;
    }
    dropped = 0;
    pending++;
    tail = tail.then(async () => {
      try {
        for (let attempt = 0; ; attempt++) {
          try {
            await send();
            return;
          } catch (err) {
            if (attempt >= retryDelaysMs.length) {
              onError(`${label}: descartado tras ${attempt + 1} intentos — ${(err as Error).message}`);
              return;
            }
            await new Promise((r) => setTimeout(r, retryDelaysMs[attempt]));
          }
        }
      } finally {
        pending--;
      }
    });
  }

  function upsert(table: string, conflict: string, row: unknown): Promise<Response> {
    return request(`/rest/v1/${table}?on_conflict=${conflict}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Prefer: 'resolution=merge-duplicates,return=minimal' },
      body: JSON.stringify(row),
    });
  }

  return {
    enabled,

    /** El trabajo entero cada vez: si un envío se descarta, el siguiente cambio lo pone al día. */
    saveJob(job: Job): void {
      if (!enabled) return;
      const waiting = latestJob.has(job.id);
      latestJob.set(job.id, job);
      if (waiting) return;
      let sending: Job | undefined;
      enqueue(`trabajo ${job.id}`, async () => {
        // Se mira en cada intento: si entretanto llegó una versión más nueva, sale esa. Si otro envío ya se
        // la llevó, aquí no queda nada que mandar.
        const next = latestJob.get(job.id);
        if (next) {
          latestJob.delete(job.id);
          sending = next;
        }
        if (!sending) return;
        await upsert('jobs', 'id', {
          id: sending.id,
          created_at: sending.createdAt,
          updated_at: sending.updatedAt,
          status: sending.status,
          client_slug: sending.input.clientSlug,
          requester: sending.input.requesterName ?? null,
          archived_at: sending.archivedAt ?? null,
          data: sending,
        });
      });
    },

    saveEvent(jobId: string, ev: JobEvent): void {
      enqueue(`evento de ${jobId}`, () =>
        request('/rest/v1/job_events', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Prefer: 'return=minimal' },
          body: JSON.stringify({ job_id: jobId, ts: ev.ts, phase: ev.phase, level: ev.level, message: ev.message }),
        }),
      );
    },

    saveBrandCard(slug: string, data: unknown): void {
      enqueue(`ficha de ${slug}`, () => upsert('brand_cards', 'slug', { slug, updated_at: new Date().toISOString(), data }));
    },

    saveFile(bucket: Bucket, relPath: string, body: Buffer | string, contentType: string): void {
      enqueue(`archivo ${bucket}/${relPath}`, () =>
        request(`/storage/v1/object/${bucket}/${objectPath(relPath)}`, {
          method: 'POST',
          headers: { 'Content-Type': contentType, 'x-upsert': 'true' },
          body: body as BodyInit,
        }),
      );
    },

    /** null si no está (o si Supabase no está configurado). Lanza ante cualquier otro fallo. */
    async readFile(bucket: Bucket, relPath: string): Promise<Buffer | null> {
      if (!enabled) return null;
      const res = await doFetch(`${url}/storage/v1/object/${bucket}/${objectPath(relPath)}`, {
        headers: { apikey: key, Authorization: `Bearer ${key}` },
      });
      // Storage responde 400 (no 404) a un objeto que no existe en algunas versiones.
      if (res.status === 404 || res.status === 400) return null;
      if (!res.ok) throw new Error(`GET ${bucket}/${relPath} → ${res.status}`);
      return Buffer.from(await res.arrayBuffer());
    },

    /** Llamada directa y esperada, sin cola: para scripts de migración y comprobación. */
    raw: request,

    /** Todos los archivos de un bucket con su tamaño (recorre las carpetas). */
    async listFiles(bucket: Bucket): Promise<Map<string, number>> {
      const out = new Map<string, number>();
      const folders = [''];
      while (folders.length) {
        const prefix = folders.pop() as string;
        for (let offset = 0; ; offset += 1000) {
          const res = await request(`/storage/v1/object/list/${bucket}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prefix, limit: 1000, offset, sortBy: { column: 'name', order: 'asc' } }),
          });
          const items = (await res.json()) as { name: string; id: string | null; metadata?: { size?: number } | null }[];
          for (const it of items) {
            const key = prefix ? `${prefix}/${it.name}` : it.name;
            if (it.id === null) folders.push(key);
            else out.set(key, it.metadata?.size ?? -1);
          }
          if (items.length < 1000) break;
        }
      }
      return out;
    },

    pending: () => pending,

    /** Espera a que la cola se vacíe, como mucho `timeoutMs`. Devuelve lo que quedó sin enviar. */
    async flush(timeoutMs: number): Promise<number> {
      let timer: NodeJS.Timeout | undefined;
      await Promise.race([tail, new Promise<void>((r) => (timer = setTimeout(r, timeoutMs)))]);
      clearTimeout(timer);
      return pending;
    },
  };
}

type Supabase = ReturnType<typeof createSupabase>;
let instance: Supabase | undefined;
/** Se crea al primer uso, no al importar: index.ts carga los .env después de sus imports. */
const get = (): Supabase => (instance ??= createSupabase());

export const supabase: Supabase = {
  get enabled() {
    return get().enabled;
  },
  saveJob: (job) => get().saveJob(job),
  saveEvent: (jobId, ev) => get().saveEvent(jobId, ev),
  saveBrandCard: (slug, data) => get().saveBrandCard(slug, data),
  saveFile: (bucket, relPath, body, contentType) => get().saveFile(bucket, relPath, body, contentType),
  readFile: (bucket, relPath) => get().readFile(bucket, relPath),
  raw: (path, init) => get().raw(path, init),
  listFiles: (bucket) => get().listFiles(bucket),
  pending: () => get().pending(),
  flush: (timeoutMs) => get().flush(timeoutMs),
};
