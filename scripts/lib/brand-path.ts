import * as fs from 'fs';
import * as path from 'path';

export function resolveBrandPackPath(root: string, brandRelPath: string): string {
  const resolved = path.resolve(root, brandRelPath);
  if (!fs.existsSync(resolved)) {
    throw new Error(`Brand pack no encontrado en ${resolved}`);
  }
  return resolved;
}

export function resolveBrandPackPathOrNull(root: string, brandRelPath: string): string | null {
  const resolved = path.resolve(root, brandRelPath);
  return fs.existsSync(resolved) ? resolved : null;
}
