/**
 * jobScope.ts — estado de un trabajo en curso, aislado del de al lado (2026-10-20).
 *
 * Antes había un solo `current` y un solo proceso hijo. Con varios huecos, cada trabajo
 * lleva el suyo (cancelación, hijo de Hermes, brief corregido, HERMES_HOME).
 */
import { AsyncLocalStorage } from 'async_hooks';
import type { ChildProcess } from 'child_process';

export interface JobScope {
  id: string | null;
  outAbs: string | null;
  child: ChildProcess | null;
  cancelled: boolean;
  loopStopped: string | null;
  pendingBrief: { prompt: string; brief: string } | null;
  inDraft: boolean;
  home: string | null;
  /** Paso al que se atribuye el turno en curso. Si falta, se usa la fase de la línea de tiempo. */
  usageStep: string | null;
  /** Prefijo del paso (`b-` en la versión B) para no mezclarlo con el de Hermes. */
  usagePrefix: string | null;
}

const als = new AsyncLocalStorage<JobScope>();
const root: JobScope = {
  id: null,
  outAbs: null,
  child: null,
  cancelled: false,
  loopStopped: null,
  pendingBrief: null,
  inDraft: false,
  home: null,
  usageStep: null,
  usagePrefix: null,
};
const active = new Set<JobScope>();

export function scope(): JobScope {
  return als.getStore() ?? root;
}

export function newScope(home: string | null): JobScope {
  return {
    id: null,
    outAbs: null,
    child: null,
    cancelled: false,
    loopStopped: null,
    pendingBrief: null,
    inDraft: false,
    home,
    usageStep: null,
    usagePrefix: null,
  };
}

export function activeScopes(): JobScope[] {
  return [...active];
}

export function runInScope<T>(slot: JobScope, fn: () => Promise<T>): Promise<T> {
  active.add(slot);
  return als.run(slot, async () => {
    try {
      return await fn();
    } finally {
      active.delete(slot);
    }
  });
}
