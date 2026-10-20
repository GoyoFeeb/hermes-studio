/**
 * jobBudget.ts — tope del trabajo y de cada fase (2026-10-20).
 *
 * Un trabajo de Porsche se quedó más de 34 min en el único hueco del worker: la primera versión y
 * las correcciones ya llevaban ~21 min («tras la corrección no quedan errores») y la revisión visual
 * (43/50, 7 mejoras) abrió otra pasada de Hermes, dos comparaciones con Playwright y una segunda
 * nota. El tope anterior era HERMES_TIMEOUT_MIN (180). Aquí el trabajo entero tiene un tope
 * (20 min por defecto) y cada fase el suyo. Si se agota y el HTML pasa las comprobaciones, se entrega;
 * si no, se falla con el motivo.
 */
export interface JobBudget {
  jobMs: number;
  phases: {
    measure: number;
    product: number;
    brief: number;
    draft: number;
    selfaudit: number;
    fix: number;
    art: number;
    artRevise: number;
    check: number;
  };
  /** Rondas de corrección de Studio (móvil, enlaces, etc.). */
  fixRounds: number;
  /** Pasadas de gusto después de la nota y los defectos. 0 (defecto) no reescribe ni compara. */
  artRevisePasses: number;
  /** Reintentos de parseo de la nota o la comparación (cada uno es otro turno). */
  artRepairRetries: number;
  /** Capturas de Playwright por trabajo (hoja, web, comparaciones). */
  artScreenshots: number;
  /** Comparaciones A/B tras la mejora. 2 era el sesgo de orden; 1 recorta el tiempo. */
  artCompares: number;
  /** Turnos de «continúa» cuando Hermes para sin entregar. */
  maxContinues: number;
}

function intEnv(env: NodeJS.ProcessEnv, key: string, fallback: number, min: number, max: number): number {
  const raw = env[key];
  if (raw == null || String(raw).trim() === '') return fallback;
  const n = Number(raw);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, Math.floor(n)));
}

const MIN = 60_000;

/** Lee los topes. Los valores vacíos o no numéricos dejan el defecto. */
export function jobBudgetFromEnv(env: NodeJS.ProcessEnv = process.env): JobBudget {
  return {
    jobMs: intEnv(env, 'HERMES_JOB_TIMEOUT_MIN', 20, 5, 180) * MIN,
    phases: {
      measure: intEnv(env, 'HERMES_PHASE_MEASURE_MIN', 2, 1, 15) * MIN,
      product: intEnv(env, 'HERMES_PHASE_PRODUCT_MIN', 3, 1, 15) * MIN,
      brief: intEnv(env, 'HERMES_PHASE_BRIEF_MIN', 6, 1, 20) * MIN,
      draft: intEnv(env, 'HERMES_PHASE_DRAFT_MIN', 12, 2, 60) * MIN,
      selfaudit: intEnv(env, 'HERMES_PHASE_SELFAUDIT_MIN', 3, 1, 15) * MIN,
      fix: intEnv(env, 'HERMES_PHASE_FIX_MIN', 4, 1, 20) * MIN,
      art: intEnv(env, 'HERMES_PHASE_ART_MIN', 5, 1, 20) * MIN,
      artRevise: intEnv(env, 'HERMES_PHASE_ART_REVISE_MIN', 6, 1, 20) * MIN,
      check: intEnv(env, 'HERMES_PHASE_CHECK_MIN', 2, 1, 10) * MIN,
    },
    fixRounds: intEnv(env, 'HERMES_FIX_ROUNDS', 2, 0, 4),
    artRevisePasses: intEnv(env, 'HERMES_ART_REVISE_PASSES', 0, 0, 2),
    artRepairRetries: intEnv(env, 'HERMES_ART_REPAIR_RETRIES', 1, 0, 2),
    artScreenshots: intEnv(env, 'HERMES_ART_SCREENSHOTS', 3, 1, 8),
    artCompares: intEnv(env, 'HERMES_ART_COMPARES', 1, 0, 2),
    maxContinues: intEnv(env, 'HERMES_MAX_CONTINUES', 2, 0, 5),
  };
}

export class JobClock {
  constructor(
    private readonly startedAt: number,
    readonly budget: JobBudget,
    private readonly now: () => number = Date.now
  ) {}

  remainingMs(at = this.now()): number {
    return Math.max(0, this.startedAt + this.budget.jobMs - at);
  }

  expired(at = this.now()): boolean {
    return this.remainingMs(at) <= 0;
  }

  /** Lo que le queda a la fase, sin pasarse del tope del trabajo. */
  phaseMs(phase: keyof JobBudget['phases'], at = this.now()): number {
    return Math.max(0, Math.min(this.budget.phases[phase], this.remainingMs(at)));
  }
}

/** Con HTML y cero errores de la comprobación, se entrega. Sin HTML, con errores o sin comprobación, se falla. */
export function deliveryOnTimeout(opts: { hasHtml: boolean; errors: number | null }): 'deliver' | 'fail' {
  if (opts.hasHtml && opts.errors === 0) return 'deliver';
  return 'fail';
}

export function timeoutFailMessage(opts: { minutes: number; phase: string; errors: string[] }): string {
  const where = opts.phase ? ` durante «${opts.phase}»` : '';
  if (!opts.errors.length) {
    return `Se agotó el tiempo del trabajo (${opts.minutes} min)${where}. No hay un HTML que pase las comprobaciones.`;
  }
  return `Se agotó el tiempo del trabajo (${opts.minutes} min)${where}. La pieza no pasa las comprobaciones: ${opts.errors.join(', ')}.`;
}

export function canTakeScreenshot(used: number, budget: JobBudget): boolean {
  return used < budget.artScreenshots;
}
