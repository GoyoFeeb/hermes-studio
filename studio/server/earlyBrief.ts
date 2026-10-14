/**
 * earlyBrief.ts — el brief a la vista en cuanto existe, sin parar a Hermes (auditoría de UX 2026-10-14, H-17).
 *
 * Antes había dos caminos: esperar ~27 min sin ver nada, o marcar «Revisar el brief antes», que paraba a Hermes hasta
 * que alguien lo aprobara (en North Face, 29 min de espera) y casi nadie lo usaba. Ahora el brief sale en la página a
 * los pocos minutos mientras Hermes sigue con la pieza: «Hermes va a hacer esto. Corrígelo ahora o deja que siga».
 *
 * Una corrección se guarda en el trabajo y se le entrega al worker en su siguiente latido (cada 30 s): corta el turno
 * de la pieza y la vuelve a empezar con el brief corregido. Solo mientras la primera versión no esté terminada: cuando
 * el worker pasa a comprobarla, cierra el brief (`briefLock`) y ya no se puede corregir (para eso, «Pedir cambios»).
 *
 * El worker anuncia que sabe hacerlo (`canRestart` al subir el brief); con uno anterior, el brief se enseña igual pero
 * sin «Corregir». Funciones puras: index.ts las aplica con updateJob (tests en earlyBrief.test.js).
 */

export interface BriefCorrection {
  /** Cuándo se pidió la última corrección y quién. */
  at: string;
  by?: string;
  /** Cuándo se le entregó al worker; sin esto, sigue pendiente. */
  sentAt?: string;
  /** Correcciones pedidas en este trabajo. */
  count: number;
}

export interface EarlyBriefState<I extends { briefText: string } = { instruction?: string; briefText: string }> {
  status: string;
  input: I;
  briefShownAt?: string;
  briefEditable?: boolean;
  briefCorrection?: BriefCorrection;
}

export const MIN_BRIEF_CHARS = 50;
export const MAX_BRIEF_CHARS = 200000;

/** Al llegar el brief del worker (sin pausa): queda a la vista y, si el worker sabe reiniciar la pieza, corregible. */
export function openBrief(canRestart: boolean, now = new Date()): { briefShownAt: string; briefEditable: boolean } {
  return { briefShownAt: now.toISOString(), briefEditable: canRestart };
}

/** «Corregir» desde la página. Devuelve el cambio que hay que guardar o el error para la web. */
export function acceptCorrection<I extends { briefText: string }>(
  job: EarlyBriefState<I>,
  text: unknown,
  by: unknown,
  now = new Date()
): { patch: { input: I; briefCorrection: BriefCorrection }; changed: boolean } | { status: number; error: string } {
  if (job.status !== 'running' || !job.briefEditable) {
    return { status: 409, error: 'Hermes ya ha terminado la primera versión con este brief: para cambiarla, usa «Pedir cambios» cuando esté lista.' };
  }
  const brief = typeof text === 'string' ? text.trim() : '';
  if (brief.length < MIN_BRIEF_CHARS) return { status: 400, error: 'El brief ha quedado demasiado corto: Hermes no tendría con qué trabajar.' };
  if (brief === job.input.briefText.trim()) return { status: 400, error: 'No has cambiado nada del brief.' };
  const who = typeof by === 'string' ? by.trim().slice(0, 80) : '';
  return {
    changed: true,
    patch: {
      input: { ...job.input, briefText: brief.slice(0, MAX_BRIEF_CHARS) },
      briefCorrection: { at: now.toISOString(), ...(who ? { by: who } : {}), count: (job.briefCorrection?.count || 0) + 1 },
    },
  };
}

/** En cada latido del worker: si hay una corrección sin entregar, se entrega (y el worker rehace la pieza). Con
 *  `briefLock` el worker avisa de que la primera versión está terminada: se cierra el brief, salvo que justo haya una
 *  corrección pendiente, que se entrega y el worker vuelve a empezar la pieza. */
export function onWorkerBeat<I extends { briefText: string }>(
  job: EarlyBriefState<I>,
  briefLock: boolean,
  now = new Date()
): { patch: { briefEditable?: boolean; briefCorrection?: BriefCorrection } | null; restart: boolean } {
  const pending = !!job.briefEditable && !!job.briefCorrection && !job.briefCorrection.sentAt;
  if (pending) return { patch: { briefCorrection: { ...job.briefCorrection!, sentAt: now.toISOString() } }, restart: true };
  if (briefLock && job.briefEditable) return { patch: { briefEditable: false }, restart: false };
  return { patch: null, restart: false };
}

/** Minutos desde que Hermes empezó hasta que el brief estuvo a la vista (métrica «tiempo hasta lo primero útil»). */
export function secondsToBrief(startedAt: string | undefined, briefShownAt: string | undefined): number | null {
  if (!startedAt || !briefShownAt) return null;
  const s = (Date.parse(briefShownAt) - Date.parse(startedAt)) / 1000;
  return Number.isFinite(s) && s >= 0 ? Math.round(s) : null;
}
