/**
 * artParse.ts — claves y notas que DeepSeek no escribe como el esquema (2026-10-20).
 *
 * La revisión pide `notas.peticion`. El modelo contesta `scores.request`, `"4"`, `"4/5"` o
 * `## Petición` / `- petición: 4`. Aquí se normaliza; quien llama decide si el conjunto está completo.
 */

export const CRITERION_ALIASES: Record<string, string[]> = {
  peticion: ['peticion', 'petición', 'request', 'pedido'],
  texto_imagen: ['texto_imagen', 'texto-imagen', 'texto e imagen', 'text_image', 'text-image', 'image_text'],
  identidad: ['identidad', 'identity'],
  concepto: ['concepto', 'concept'],
  jerarquia: ['jerarquia', 'jerarquía', 'hierarchy'],
  aire: ['aire', 'spacing', 'whitespace', 'espaciado'],
  originalidad: ['originalidad', 'originality'],
  movil: ['movil', 'móvil', 'mobile'],
  oscuro: ['oscuro', 'dark', 'modo oscuro', 'dark mode', 'modo_oscuro'],
  copy: ['copy', 'textos'],
};

export const NOTE_BAG_ALIASES = ['notas', 'notes', 'scores', 'puntuaciones', 'ratings', 'calificaciones', 'score'];
export const PROOF_ALIASES = ['pruebas', 'proofs', 'evidence', 'evidencias', 'justificaciones', 'justificacion'];
export const PROBLEM_ALIASES = ['problemas', 'problems', 'issues'];
export const IMPROVE_ALIASES = ['mejoras', 'improvements', 'suggestions', 'sugerencias'];
export const DEFECT_ALIASES = ['defectos', 'defects'];
export const COMPARE_BAG_ALIASES = ['criterios', 'criteria', 'picks', 'votes', 'votos'];
export const REASON_ALIASES = ['razones', 'reasons', 'why', 'motivos'];

export function normalizeKey(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '');
}

export function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : null;
}

/** Busca un campo por cualquiera de sus nombres (con o sin acento, en español o en inglés). */
export function field(obj: Record<string, unknown>, aliases: string[]): unknown {
  const map = new Map<string, unknown>();
  for (const [key, value] of Object.entries(obj)) map.set(normalizeKey(key), value);
  for (const alias of aliases) {
    const hit = map.get(normalizeKey(alias));
    if (hit !== undefined) return hit;
  }
  return undefined;
}

const WORDS: Record<string, number> = {
  uno: 1,
  dos: 2,
  tres: 3,
  cuatro: 4,
  cinco: 5,
  one: 1,
  two: 2,
  three: 3,
  four: 4,
  five: 5,
};

/** 4, "4", "4.0", "4/5", "4 de 5" o "cuatro". Null si no es una nota de 1 a 5. */
export function parseScore(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) {
    if (value < 1 || value > 5) return null;
    return Math.abs(value - Math.round(value)) < 1e-6 ? Math.round(value) : value;
  }
  if (typeof value !== 'string') return null;
  const text = value.trim().replace(/^\*+|\*+$/g, '').trim();
  if (!text) return null;
  const word = WORDS[normalizeKey(text)];
  if (word) return word;
  const match = text.match(/^(\d(?:\.\d+)?)(?:\s*(?:\/|de|sobre)\s*5)?(?:\b|[^0-9]|$)/i);
  if (!match) return null;
  const n = Number(match[1]);
  if (!(n >= 1 && n <= 5)) return null;
  return Math.abs(n - Math.round(n)) < 1e-6 ? Math.round(n) : n;
}

/** Lo que acompaña a la nota en la misma línea (`4 — el logo se ve`), sin el número. */
export function proofTail(value: string): string {
  const text = value.trim().replace(/^\*+|\*+$/g, '').trim();
  const match = text.match(/^(?:\d(?:\.\d+)?)(?:\s*(?:\/|de|sobre)\s*5)?\s*(?:[—–:-]\s*)?([\s\S]*)$/i);
  const rest = (match?.[1] || '').trim();
  if (!rest || rest === text) return '';
  return rest.slice(0, 400);
}

export function stringList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  const out: string[] = [];
  for (const item of value) {
    if (typeof item === 'string' && item.trim()) out.push(item.trim());
    else if (item && typeof item === 'object') {
      const row = item as Record<string, unknown>;
      const text = [row.texto, row.text, row.detalle, row.detail, row.descripcion, row.description].find((part) => typeof part === 'string' && part.trim());
      if (typeof text === 'string') out.push(text.trim());
    }
    if (out.length >= 10) break;
  }
  return out;
}

export function aliasesFor(canonical: string): string[] {
  return [canonical, ...(CRITERION_ALIASES[canonical] || [])];
}
