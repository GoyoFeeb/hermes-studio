/**
 * paths.ts — rutas centrales del servicio, resueltas una sola vez.
 * STUDIO_DIR = sistema-final/studio ; ROOT = sistema-final (raíz del pipeline Hermes).
 */
import * as path from 'path';

export const STUDIO_DIR = path.resolve(import.meta.dirname, '..');
export const ROOT = path.resolve(STUDIO_DIR, '..');

export const DATA_DIR = path.join(STUDIO_DIR, 'data');
export const JOBS_DIR = path.join(DATA_DIR, 'jobs');

export const AGENTS_DIR = path.join(ROOT, 'agents');
export const BRANDS_DIR = path.join(ROOT, 'brands');
export const NEWSLETTERS_DIR = path.join(ROOT, 'newsletters');
export const PATTERNS_DIR = path.join(ROOT, 'patterns');
export const ENGINE_DIR = path.join(ROOT, 'engine');
export const SCRIPTS_DIR = path.join(ROOT, 'scripts');
