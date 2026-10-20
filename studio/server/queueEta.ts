/**
 * queueEta.ts — puesto en la cola y cuándo empezará un trabajo (2026-10-20).
 *
 * Con un solo hueco, el tiempo de espera era la suma de lo que quedaba. Con N huecos
 * (WORKER_CONCURRENCY × réplicas) un trabajo en curso no bloquea al siguiente si queda
 * un hueco libre. Un trabajo que ya superó su duración típica no se anuncia como «2 min»:
 * antes el resto se recortaba a 120 s y la cola parecía a punto de moverse.
 */

export interface QueueActor {
  id: string;
  status: 'queued' | 'running';
  createdAt: string;
  /** Segundos que suele tardar (en cola) o los que le quedan (en curso). */
  sec: number;
}

export interface QueueForecast {
  ahead: number;
  runningAhead: number;
  queuedAhead: number;
  startsInSec: number;
  message: string;
}

export function runningRemainingSec(typical: number, elapsed: number, etaSec: number | null | undefined): number {
  const base = typical > 0 ? typical : 20 * 60;
  const overrun = elapsed >= base;
  if (!overrun && typeof etaSec === 'number' && etaSec > 0) return etaSec;
  const left = base - elapsed;
  if (!overrun && left >= 60) return Math.round(left);
  return Math.max(180, Math.round(base * 0.35));
}

export function queueMessage(info: { ahead: number; runningAhead: number; queuedAhead: number; startsInSec: number }): string {
  const min = Math.max(1, Math.round(info.startsInSec / 60));
  if (info.startsInSec < 20) {
    if (info.runningAhead > 0) {
      return info.runningAhead === 1
        ? 'Hay 1 trabajo en curso, pero hay hueco: el tuyo empieza enseguida.'
        : `Hay ${info.runningAhead} trabajos en curso, pero hay hueco: el tuyo empieza enseguida.`;
    }
    return 'Eres el siguiente: Hermes lo recogerá en unos segundos.';
  }
  if (info.queuedAhead === 0 && info.runningAhead > 0) {
    const n = info.runningAhead;
    return `Hay ${n} trabajo${n === 1 ? '' : 's'} en curso delante; el tuyo empezará en ~${min} min`;
  }
  const n = Math.max(1, info.ahead);
  return `Hay ${n} trabajo${n === 1 ? '' : 's'} delante; el tuyo empezará en ~${min} min`;
}

/** Línea del comentario de ClickUp cuando el trabajo no lo recoge el worker al momento. */
export function queueCommentLine(info: { ahead: number; startsInSec: number } | null | undefined): string | null {
  if (!info || info.startsInSec < 30) return null;
  const n = Math.max(1, info.ahead);
  const min = Math.max(1, Math.round(info.startsInSec / 60));
  return `En cola: ${n} trabajo${n === 1 ? '' : 's'} delante, empezará en ~${min} min`;
}

/**
 * Cuándo empieza `targetId`. Los huecos se ocupan con lo que ya está en curso; cada trabajo
 * en cola anterior se asigna al hueco que antes queda libre.
 */
export function forecastStart(jobs: QueueActor[], targetId: string, capacity: number): QueueForecast | null {
  const cap = Math.max(1, Math.floor(capacity) || 1);
  const target = jobs.find((j) => j.id === targetId && j.status === 'queued');
  if (!target) return null;
  const running = jobs.filter((j) => j.status === 'running');
  const queuedAhead = jobs
    .filter((j) => j.status === 'queued' && j.id !== target.id && j.createdAt < target.createdAt)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt) || a.id.localeCompare(b.id));
  const slots = running.map((j) => Math.max(0, j.sec)).sort((a, b) => a - b);
  while (slots.length < cap) slots.push(0);
  for (const q of queuedAhead) {
    let idx = 0;
    for (let i = 1; i < slots.length; i++) if (slots[i] < slots[idx]) idx = i;
    slots[idx] += Math.max(0, q.sec);
  }
  const startsInSec = slots.length ? Math.round(Math.min(...slots)) : 0;
  const forecast = {
    ahead: running.length + queuedAhead.length,
    runningAhead: running.length,
    queuedAhead: queuedAhead.length,
    startsInSec,
    message: '',
  };
  forecast.message = queueMessage(forecast);
  return forecast;
}
