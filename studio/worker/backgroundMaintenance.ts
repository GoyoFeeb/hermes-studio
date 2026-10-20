/**
 * backgroundMaintenance.ts — miniaturas, nota de calidad y fichas fuera de los huecos (2026-10-20).
 *
 * Tras un despliegue el hueco 0 se quedaba en esa puesta al día (una nota de calidad y las fichas
 * de marca) y el segundo trabajo esperaba minutos. Eso no es un trabajo: corre en segundo plano y
 * el hueco vuelve a pedir cola. Si llega un trabajo, se pide parar entre tareas.
 */

/** El sondeo en vacío no espera al mantenimiento. Solo el hueco 0 lo arranca, y solo si no hay otro. */
export function idleSlotPlan(slot: number, maintenanceRunning: boolean): { blockSlot: boolean; kickMaintenance: boolean } {
  return {
    blockSlot: false,
    kickMaintenance: slot === 0 && !maintenanceRunning,
  };
}

export class BackgroundMaintenance {
  private task: Promise<void> | null = null;
  private stopRequested = false;

  running(): boolean {
    return this.task != null;
  }

  /** Nunca cuenta como hueco ocupado: la cola puede reclamar mientras sigue. */
  occupiesSlot(): boolean {
    return false;
  }

  requestStop(): void {
    this.stopRequested = true;
  }

  shouldContinue(): boolean {
    return !this.stopRequested;
  }

  /**
   * Arranca `work` sin esperarlo. Si ya hay uno en marcha, no abre otro.
   * Devuelve si este llamador ha arrancado el trabajo.
   */
  kick(work: () => Promise<void>): boolean {
    if (this.task) return false;
    this.stopRequested = false;
    let tracked: Promise<void> | null = null;
    const run = work().finally(() => {
      if (this.task === tracked) this.task = null;
    });
    tracked = run;
    this.task = run;
    run.catch(() => undefined);
    return true;
  }
}
