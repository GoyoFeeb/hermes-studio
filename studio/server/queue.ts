/**
 * queue.ts — cola FIFO en memoria, un job a la vez. Deliberado (ver plan): varios compañeros
 * enviando briefs a la vez sobre el mismo repo (brands/, newsletters/) es la forma más fácil de
 * pisarse trabajo; con el volumen esperado de un equipo pequeño, procesar en serie es
 * suficiente y evita construir aislamiento por job (worktrees, etc.) en v1.
 */
import { listJobs, updateJob, appendEvent } from './store';
import { runJob } from './runner';

const pending: string[] = [];
let processing = false;

export function enqueue(jobId: string): void {
  pending.push(jobId);
  void drain();
}

async function drain(): Promise<void> {
  if (processing) return;
  processing = true;
  try {
    while (pending.length > 0) {
      const jobId = pending.shift()!;
      try {
        await runJob(jobId);
      } catch (err) {
        appendEvent(jobId, { phase: 'system', level: 'error', message: `Fallo no controlado: ${(err as Error).message}` });
        updateJob(jobId, { status: 'failed', error: (err as Error).message });
      }
    }
  } finally {
    processing = false;
  }
}

/** Al arrancar el servicio: los jobs que quedaron "running" murieron con el proceso anterior
 *  (no hay forma segura de retomar a mitad de una fase), así que se marcan como fallidos; los
 *  que seguían "queued" se re-encolan. */
export function recoverOnStartup(): void {
  for (const job of listJobs()) {
    if (job.status === 'running') {
      updateJob(job.id, { status: 'failed', error: 'Interrumpido por un reinicio del servicio.' });
      appendEvent(job.id, {
        phase: 'system',
        level: 'error',
        message: 'El servicio se reinició mientras este trabajo corría — reenvíalo desde el formulario.',
      });
    } else if (job.status === 'queued') {
      enqueue(job.id);
    }
  }
}
