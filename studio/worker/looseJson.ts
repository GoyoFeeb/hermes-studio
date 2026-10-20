/**
 * looseJson.ts — leer JSON que DeepSeek deja en el chat (2026-10-20).
 *
 * deepseek-v4-flash con chat_completions (Nous, Hermes Agent) envuelve el JSON en una valla,
 * añade prosa (a veces con llaves), comas finales o comillas simples. Cortar del primer `{`
 * al último `}` mezcla esa prosa con el objeto y JSON.parse falla entero.
 */
import { redactSecrets } from './hermesTrace';

/** Objetos `{...}` equilibrados, respetando comillas. No recorta del primero al último. */
export function balancedObjects(text: string): string[] {
  const out: string[] = [];
  for (let i = 0; i < text.length; i++) {
    if (text[i] !== '{') continue;
    const end = matchBrace(text, i);
    if (end > i) {
      out.push(text.slice(i, end + 1));
      i = end;
    }
  }
  return out;
}

function matchBrace(text: string, start: number): number {
  let depth = 0;
  let quote: '"' | "'" | null = null;
  for (let i = start; i < text.length; i++) {
    const c = text[i];
    if (quote) {
      if (c === '\\') {
        i++;
        continue;
      }
      if (c === quote) quote = null;
      continue;
    }
    if (c === '"' || c === "'") {
      quote = c;
      continue;
    }
    if (c === '{') depth++;
    else if (c === '}') {
      depth--;
      if (depth === 0) return i;
    }
  }
  return -1;
}

/** Arregla lo que JSON.parse rechaza y DeepSeek escribe igual: BOM, comillas tipográficas, comentarios de línea y comas finales. */
export function loosenJson(src: string): string {
  let s = src.replace(/^\uFEFF/, '').trim();
  s = s.replace(/[“”]/g, '"').replace(/[‘’]/g, "'");
  s = s.replace(/\/\*[\s\S]*?\*\//g, '');
  s = s.replace(/^\s*\/\/.*$/gm, '');
  s = s.replace(/,\s*([}\]])/g, '$1');
  // Solo comillas simples que delimitan un valor JSON, no un apóstrofe dentro de un texto.
  s = s.replace(/([{\[:,]\s*)'([^'\\]*(?:\\.[^'\\]*)*)'/g, (_m, pre, inner) => `${pre}"${String(inner).replace(/"/g, '\\"')}"`);
  return s;
}

export function parseLooseJson(src: string): unknown {
  const trimmed = src.trim();
  if (!trimmed) return undefined;
  for (const candidate of [trimmed, loosenJson(trimmed)]) {
    try {
      return JSON.parse(candidate);
    } catch {
      // el siguiente intento afloja la sintaxis
    }
  }
  return undefined;
}

/**
 * Objetos JSON de una respuesta. Primero el interior de las vallas (el bloque final del modelo) y
 * después el resto del texto, por si el JSON iba suelto. El último que valida es el que hay que usar.
 */
export function jsonObjects(text: string): unknown[] {
  if (!text) return [];
  const chunks: string[] = [];
  const fence = /```(?:json|javascript|js|markdown|md|text)?[^\n]*\r?\n([\s\S]*?)```/gi;
  let m: RegExpExecArray | null;
  while ((m = fence.exec(text))) chunks.push(m[1]);
  chunks.push(text);
  const seen = new Set<string>();
  const out: unknown[] = [];
  for (const chunk of chunks) {
    for (const raw of balancedObjects(chunk)) {
      if (seen.has(raw)) continue;
      seen.add(raw);
      const parsed = parseLooseJson(raw);
      if (parsed && typeof parsed === 'object') out.push(parsed);
    }
  }
  return out;
}

/** Primeros `max` caracteres, en una línea y sin secretos, para el log cuando no se puede parsear. */
export function redactedSnippet(text: string, secrets: string[] = [], max = 500): string {
  const flat = redactSecrets(text || '', secrets).replace(/\s+/g, ' ').trim();
  return flat.slice(0, max);
}

/**
 * Valida la respuesta. Si no se puede leer, pide el JSON una sola vez con `repair` y vuelve a validar.
 * `unparsed` son las respuestas que no valieron, para registrar un recorte.
 */
export async function parseWithOneRepair<T>(
  firstOutput: string,
  parse: (output: string) => T | null,
  repair: (bad: string) => string,
  rerun: (prompt: string) => Promise<string>
): Promise<{ value: T | null; output: string; unparsed: string[] }> {
  const unparsed: string[] = [];
  const first = parse(firstOutput);
  if (first) return { value: first, output: firstOutput, unparsed };
  unparsed.push(firstOutput);
  const secondOutput = await rerun(repair(firstOutput));
  const second = parse(secondOutput);
  if (!second) unparsed.push(secondOutput);
  return { value: second, output: second ? secondOutput : firstOutput, unparsed };
}
