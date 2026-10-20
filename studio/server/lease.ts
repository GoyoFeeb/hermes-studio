/**
 * lease.ts — renovar el arrendamiento de un trabajo en curso.
 * Solo el worker que lo reclamó. Si queda más de media vida, no se reescribe el archivo.
 */
import { updateJob, type Job } from './store';
import { DEFAULT_LEASE_MS, nextLease } from './claimQueue';

export function renewJobLease(job: Job, workerId: string | undefined, now = Date.now()): Job {
  if (!job.lease || !workerId) return job;
  const next = nextLease(job.lease, workerId, now, DEFAULT_LEASE_MS);
  if (!next || next.until === job.lease.until) return job;
  return updateJob(job.id, { lease: next });
}
