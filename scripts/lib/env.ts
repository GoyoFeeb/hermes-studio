/**
 * lib/env.ts — carga {raíz}/.env en process.env (solo claves no definidas ya).
 * Sin dependencias. Las claves de API viven en .env (local, NUNCA en el repo ni en prompts
 * de agentes) — ver .env.example.
 */
import * as fs from 'fs';
import * as path from 'path';

export function loadEnv(root: string): void {
  const p = path.join(root, '.env');
  if (!fs.existsSync(p)) return;
  for (const line of fs.readFileSync(p, 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (m && !(m[1] in process.env)) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
}
