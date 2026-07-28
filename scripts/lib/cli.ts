/**
 * lib/cli.ts — parseo de argumentos y resolución de rutas de campaña, compartido entre
 * scripts/*.ts.
 *
 * Motivo (auditoría técnica 2026-07-28): `parseArgs()` existía copiado y pegado literalmente
 * en 16 scripts distintos (2 variantes byte-idénticas + 2 con un caso especial para `--force`
 * que tampoco divergían en comportamiento real), y `resolveCampaignPath()` en 4 más — mismo
 * patrón de duplicación que ya se había resuelto para `scripts/lib/claim-rules.ts`, solo que
 * nunca se dio el paso de extraer estas dos funciones. Cero cambio de comportamiento: cada
 * script sigue funcionando exactamente igual, solo que ahora hay un único sitio que mantener.
 */

import * as path from 'path';

/**
 * Parsea `process.argv` en pares `--flag valor` / `--flag` (booleano).
 *
 * @param booleanFlags - nombres de flag que NUNCA consumen el siguiente token como valor,
 *   incluso si parece un valor válido (ej. `--force` no debe robarle el valor a un flag
 *   posicional accidentalmente mal ordenado). Por defecto, ninguno — el comportamiento
 *   genérico ya trata `--flag` sin valor siguiente como booleano de todas formas.
 */
export function parseArgs(booleanFlags: string[] = []): Record<string, string> {
  const args = process.argv.slice(2);
  const parsed: Record<string, string> = {};
  for (let i = 0; i < args.length; i++) {
    const key = args[i].replace(/^--/, '');
    const next = args[i + 1];
    if (booleanFlags.includes(key)) {
      parsed[key] = 'true';
    } else if (next && !next.startsWith('--')) {
      parsed[key] = next;
      i++;
    } else {
      parsed[key] = 'true';
    }
  }
  return parsed;
}

/** Resuelve `--campaign` a una ruta absoluta, relativa a `root` si no es ya absoluta. */
export function resolveCampaignPath(root: string, raw: string): string {
  if (path.isAbsolute(raw)) return raw;
  return path.resolve(root, raw);
}
