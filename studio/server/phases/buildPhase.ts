/**
 * buildPhase.ts — fase 07 (HTML Email Developer). 100% determinista: solo invoca el motor
 * real, nunca genera HTML por IA. Ver engine/README.md.
 */
import * as path from 'path';
import { execFile } from 'child_process';
import { promisify } from 'util';
import { ROOT } from '../paths';

const execFileAsync = promisify(execFile);

export interface BuildResult {
  ok: boolean;
  message: string;
}

export async function runBuildPhase(campaignRelPath: string): Promise<BuildResult> {
  const dataPath = path.join(campaignRelPath, '06-data', 'campaign-data.json');
  const outPath = path.join(campaignRelPath, '09-exports');

  try {
    const { stdout } = await execFileAsync(
      'node',
      ['engine/build-newsletter.js', '--data', dataPath, '--out', outPath],
      { cwd: ROOT }
    );
    return { ok: true, message: stdout };
  } catch (err) {
    const e = err as { stderr?: string; stdout?: string; message: string };
    return { ok: false, message: e.stderr || e.stdout || e.message };
  }
}
