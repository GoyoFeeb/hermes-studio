/**
 * enqueueJob.ts — alta de un trabajo standalone, compartida por POST /api/jobs y el webhook
 * de ClickUp. La validación del formulario (marca, web, imágenes) se queda en la ruta;
 * aquí solo se guarda el trabajo y se anuncia en la cola de Hermes.
 */
import { createJob, type Job, type JobInput } from './store';
import { log } from './standalone';

export function enqueueStandaloneJob(input: JobInput, workerRecentlySeen: boolean): Job {
  const job = createJob(input);
  log(
    job.id,
    workerRecentlySeen
      ? 'En cola: Hermes lo recogerá en unos segundos.'
      : 'En cola: Hermes no está conectado ahora mismo — empezará en cuanto el Mac del worker se conecte.'
  );
  return job;
}
