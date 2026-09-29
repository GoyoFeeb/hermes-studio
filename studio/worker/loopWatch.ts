/**
 * loopWatch.ts — detectar que Hermes está en bucle (2026-09-29).
 *
 * Lacoste, 2026-09-29: tras escribir el brief, Hermes (DeepSeek V4 Flash) encontró en la carpeta de la marca
 * el intento a medias del día anterior y se pasó 40 minutos leyendo una y otra vez los mismos dos archivos.
 * Hermes bloqueaba cada lectura repetida ("has llamado a read_file 13 veces y no ha cambiado"), pero el
 * modelo seguía pidiéndola. El vigilante de inactividad del worker no lo veía: cada lectura bloqueada
 * cuenta como acción, así que nunca había "20 minutos sin actividad".
 *
 * Aquí se mira si hay trabajo NUEVO: una acción cuenta como repetida si es la misma herramienta con los
 * mismos argumentos que otra anterior. Bucle = N repetidas seguidas, o M minutos sin ninguna acción nueva
 * aunque haya habido acciones. Las del navegador (browser_*) no cuentan como repetidas: "mirar la página"
 * dos veces seguidas es normal cuando la página ha cambiado entre medias.
 */

export interface WatchedCall {
  name: string;
  target: string;
  /** Herramienta + argumentos: dos acciones con la misma clave son la misma acción. */
  key?: string;
}

/** Acciones repetidas seguidas que ya son bucle (Hermes bloquea la lectura a la 3.ª; se deja margen). */
export const LOOP_REPEAT_CALLS = 6;
/** Minutos sin ninguna acción nueva (habiendo acciones) que ya son bucle. */
export const LOOP_NO_NEW_SEC = 10 * 60;
const LOOP_NO_NEW_MIN_CALLS = 4;

export class LoopWatch {
  private seen = new Set<string>();
  private counted = 0;
  private repeatRun = 0;
  private repeatTargets = new Map<string, number>();
  private callsSinceNew = 0;
  private lastNewAt: number;

  constructor(now = Date.now()) {
    this.lastNewAt = now;
  }

  /** Recibe la lista completa de acciones de la sesión (crece entre llamadas) y procesa las nuevas. */
  update(calls: WatchedCall[], now = Date.now()): void {
    for (; this.counted < calls.length; this.counted++) {
      const c = calls[this.counted];
      const key = c.key || `${c.name}|${c.target}`;
      const repeat = this.seen.has(key) && !/^browser_/.test(c.name);
      this.seen.add(key);
      if (repeat) {
        this.repeatRun++;
        this.callsSinceNew++;
        const what = c.target || c.name;
        this.repeatTargets.set(what, (this.repeatTargets.get(what) || 0) + 1);
      } else {
        this.repeatRun = 0;
        this.repeatTargets.clear();
        this.callsSinceNew = 0;
        this.lastNewAt = now;
      }
    }
  }

  /** Si está en bucle, en qué (para el registro y el aviso); si no, null. */
  looping(now = Date.now()): string | null {
    const top = [...this.repeatTargets.entries()].sort((a, b) => b[1] - a[1]).map(([t]) => t);
    const what = top.slice(0, 2).join(' y ') || 'lo mismo';
    if (this.repeatRun >= LOOP_REPEAT_CALLS) return `repite ${this.repeatRun} veces seguidas la misma acción (${what})`;
    if (now - this.lastNewAt >= LOOP_NO_NEW_SEC * 1000 && this.callsSinceNew >= LOOP_NO_NEW_MIN_CALLS) {
      return `lleva ${Math.round((now - this.lastNewAt) / 60000)} min sin hacer nada nuevo (${what})`;
    }
    return null;
  }

  /** Tras avisar a Hermes: se vuelve a contar desde cero (lo ya visto sigue contando como visto). */
  reset(now = Date.now()): void {
    this.repeatRun = 0;
    this.repeatTargets.clear();
    this.callsSinceNew = 0;
    this.lastNewAt = now;
  }
}
