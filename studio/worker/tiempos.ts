/**
 * tiempos.ts — cuánto tarda cada fase, antes y después de un cambio (auditoría de tiempo, punto A, 2026-10-07).
 *
 * Lee el registro del worker (~/Library/Logs/hermes-worker.log): la línea «Trabajo <id> → <carpeta>», el
 * «Brief de <id> listo en N min» y el resumen «<id>: fase M:SS · fase M:SS — total M:SS». Las líneas solo llevan la
 * hora; la fecha sale del nombre de la carpeta del trabajo (…/2026-10-06-jcpy0x).
 *
 *   npm run tiempos                                  últimos 14 días, todo junto
 *   npm run tiempos -- --desde "2026-10-07 09:35"    antes y después de esa fecha y hora
 *   npm run tiempos -- --log otro.log
 */
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

export interface JobTiming {
  id: string;
  /** Fecha y hora de inicio (local). */
  at: Date;
  dir: string;
  /** Segundos por fase, con el nombre del registro («primera versión», «revisión visual»…). */
  phases: Record<string, number>;
  total: number;
  briefSec?: number;
  edit: boolean;
}

const clock = (t: string): number => {
  const [m, s] = t.split(':').map(Number);
  return m * 60 + s;
};

export function parseLog(text: string): JobTiming[] {
  const starts = new Map<string, { dir: string; time: string }>();
  const briefs = new Map<string, number>();
  const out: JobTiming[] = [];
  for (const line of text.split('\n')) {
    const start = line.match(/^\[(\d{1,2}:\d{2}:\d{2})\] Trabajo (\S+) → (\S+)/);
    if (start) {
      starts.set(start[2], { time: start[1], dir: start[3] });
      continue;
    }
    const brief = line.match(/^\[[\d:]+\] Brief de (\S+) listo en (\d+) min/);
    if (brief) {
      briefs.set(brief[1], Number(brief[2]) * 60);
      continue;
    }
    const sum = line.match(/^\[[\d:]+\] (\S+): (.+) — total (\d+:\d{2})\s*$/);
    if (!sum) continue;
    const id = sum[1];
    const s = starts.get(id);
    const day = s?.dir.match(/(\d{4}-\d{2}-\d{2})-[a-z0-9]+$/)?.[1];
    if (!s || !day) continue;
    const phases: Record<string, number> = {};
    for (const part of sum[2].split(' · ')) {
      const m = part.match(/^(.+?) (\d+:\d{2})$/);
      if (m) phases[m[1]] = (phases[m[1]] || 0) + clock(m[2]);
    }
    out.push({
      id,
      at: new Date(`${day}T${s.time.padStart(8, '0')}`),
      dir: s.dir,
      phases,
      total: clock(sum[3]),
      briefSec: briefs.get(id),
      edit: 'cambios pedidos' in phases || 'adaptación a móvil' in phases || !('primera versión' in phases),
    });
  }
  return out;
}

function median(v: number[]): number {
  const s = [...v].sort((a, b) => a - b);
  return s.length ? (s.length % 2 ? s[(s.length - 1) / 2] : (s[s.length / 2 - 1] + s[s.length / 2]) / 2) : NaN;
}
const mmss = (sec: number): string => (Number.isFinite(sec) ? `${Math.floor(sec / 60)}:${String(Math.round(sec % 60)).padStart(2, '0')}` : '—');

const PHASES = ['identidad medida en la web', 'ficha de producto y galería', 'primera versión', 'comprobación de studio', 'revisión visual'];

export function summary(jobs: JobTiming[]): string[] {
  const rows: [string, number[]][] = [
    ['brief', jobs.map((j) => j.briefSec).filter((v): v is number => v !== undefined)],
    ...PHASES.map((p) => [p, jobs.map((j) => j.phases[p]).filter((v): v is number => v !== undefined)] as [string, number[]]),
    ['total (sin brief)', jobs.map((j) => j.total)],
    ['total (con brief)', jobs.map((j) => j.total + (j.briefSec || 0))],
  ];
  return rows.map(([name, v]) => `  ${name.padEnd(30)} mediana ${mmss(median(v)).padStart(6)}   máx ${mmss(v.length ? Math.max(...v) : NaN).padStart(6)}   (${v.length})`);
}

function main(): void {
  const args = process.argv.slice(2);
  const arg = (name: string): string | undefined => {
    const i = args.indexOf(name);
    return i >= 0 ? args[i + 1] : undefined;
  };
  const logFile = arg('--log') || path.join(os.homedir(), 'Library', 'Logs', 'hermes-worker.log');
  const all = parseLog(fs.readFileSync(logFile, 'utf8')).filter((j) => !j.edit);
  const since = arg('--desde');
  if (!since) {
    const from = Date.now() - 14 * 86400000;
    const jobs = all.filter((j) => j.at.getTime() >= from);
    console.log(`Piezas nuevas de los últimos 14 días: ${jobs.length}`);
    console.log(summary(jobs).join('\n'));
    return;
  }
  const cut = new Date(since.replace(' ', 'T'));
  if (isNaN(cut.getTime())) throw new Error(`Fecha no válida: ${since} (usa "AAAA-MM-DD HH:MM")`);
  const weekBefore = cut.getTime() - 7 * 86400000;
  const before = all.filter((j) => j.at < cut && j.at.getTime() >= weekBefore);
  const after = all.filter((j) => j.at >= cut);
  console.log(`Antes de ${since} (7 días, ${before.length} piezas nuevas):`);
  console.log(summary(before).join('\n'));
  console.log(`\nDesde ${since} (${after.length} piezas nuevas):`);
  console.log(summary(after).join('\n'));
  if (after.length < 5) console.log('\nOjo: con menos de 5 piezas la mediana todavía no es fiable.');
}

if (require.main === module) main();
