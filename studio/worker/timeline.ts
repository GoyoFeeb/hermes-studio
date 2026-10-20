/**
 * timeline.ts — tiempo de cada fase de un trabajo de Hermes (2026-10-05, auditoría de agentes).
 *
 * Hasta ahora solo se sabía la duración total y el reparto se reconstruía leyendo el log del worker (Calvin
 * Klein: brief 2 min, primera versión 24, ronda de móvil 23). El worker anota aquí cada fase —identidad medida,
 * brief, primera versión, autoauditoría, comprobación, cada corrección, revisión visual, subida—, las esperas al
 * modelo que hubo que cortar y las rondas; viaja con la newsletter y Studio lo enseña en el panel de revisión.
 */

export interface PhaseTiming {
  id: string;
  label: string;
  sec: number;
  /** Acciones de Hermes en la fase (si se pudieron leer de su sesión). */
  actions?: number;
  /** Desglose de la primera versión (2026-10-15): investigación, escritura y autorrevisión de Hermes, cortadas por la
   *  hora de cada mensaje de su sesión. Suman `sec`. */
  parts?: PhasePart[];
}

export interface PhasePart {
  id: 'research' | 'write' | 'selfreview';
  label: string;
  sec: number;
}

export interface JobTimings {
  phases: PhaseTiming[];
  /** Turnos cortados por llevar demasiado sin actividad (llamada al modelo colgada) y minutos perdidos en ellos. */
  hangs: { count: number; sec: number };
  /** Rondas de corrección (pieza devuelta a Hermes). */
  rounds: number;
  totalSec: number;
}

export class Timeline {
  private phases: PhaseTiming[] = [];
  private open: { id: string; label: string; at: number } | null = null;
  private hangs = { count: 0, sec: 0 };
  private rounds = 0;
  private readonly startedAt: number;

  constructor(
    private readonly now: () => number = Date.now,
    private readonly log?: (message: string) => void
  ) {
    this.startedAt = now();
  }

  /** Empieza una fase (cierra la anterior si seguía abierta). */
  start(id: string, label: string): void {
    if (this.open) this.end();
    this.open = { id, label, at: this.now() };
    this.log?.(`fase «${label}» empieza`);
  }

  end(actions?: number): void {
    if (!this.open) return;
    const sec = Math.max(0, Math.round((this.now() - this.open.at) / 1000));
    const label = this.open.label;
    this.phases.push({ id: this.open.id, label, sec, ...(actions !== undefined ? { actions } : {}) });
    this.open = null;
    const mmss = `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`;
    this.log?.(`fase «${label}» termina en ${mmss}`);
  }

  /** La fase abierta, o la última cerrada, para el mensaje de tiempo agotado. */
  currentLabel(): string | null {
    return this.open?.label ?? this.phases[this.phases.length - 1]?.label ?? null;
  }

  /** Hora (epoch ms) a la que empezó la fase abierta, para cortar después su sesión de Hermes. */
  openedAt(): number | null {
    return this.open?.at ?? null;
  }

  /** Desglose de la última fase cerrada. La última parte se ajusta para que sumen lo que midió la fase. */
  splitLast(parts: PhasePart[]): void {
    const last = this.phases[this.phases.length - 1];
    if (!last || !parts.length) return;
    let left = last.sec;
    last.parts = parts.map((p, i) => {
      const sec = i === parts.length - 1 ? left : Math.min(Math.max(0, Math.round(p.sec)), left);
      left -= sec;
      return { ...p, sec };
    });
  }

  hang(idleSec: number): void {
    this.hangs.count++;
    this.hangs.sec += Math.round(idleSec);
  }

  round(): void {
    this.rounds++;
  }

  toJSON(): JobTimings {
    if (this.open) this.end();
    return {
      phases: this.phases,
      hangs: { ...this.hangs },
      rounds: this.rounds,
      totalSec: Math.round((this.now() - this.startedAt) / 1000),
    };
  }
}

/** Línea de resumen para el log del worker: «medir 0:45 · brief 2:10 · primera versión 14:02 …». */
export function summarize(t: JobTimings): string {
  const mmss = (s: number): string => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
  const parts = t.phases.map((p) => `${p.label.toLowerCase()} ${mmss(p.sec)}`);
  if (t.hangs.count) parts.push(`esperas cortadas ${t.hangs.count} (${mmss(t.hangs.sec)})`);
  return `${parts.join(' · ')} — total ${mmss(t.totalSec)}`;
}
