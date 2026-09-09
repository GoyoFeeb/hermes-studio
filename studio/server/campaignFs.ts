/**
 * campaignFs.ts — todas las operaciones de filesystem sobre el repo del pipeline que el
 * servicio necesita: crear campañas (reusa scripts/create-campaign.ts), leer artefactos de
 * fases previas, y escribir los archivos que devuelve el modelo — siempre validando que caen
 * dentro de una carpeta permitida (la propia campaña, o el brand pack correspondiente). Un
 * modelo nunca escribe directamente: solo devuelve texto, este módulo decide si se guarda.
 */
import * as fs from 'fs';
import * as path from 'path';
import { execFile } from 'child_process';
import { promisify } from 'util';
import { ROOT, BRANDS_DIR } from './paths';

const execFileAsync = promisify(execFile);

export function slugify(text: string): string {
  const slug = text
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
  return slug || 'campana';
}

export function brandExists(clientSlug: string): boolean {
  return fs.existsSync(path.join(BRANDS_DIR, clientSlug, 'tokens', 'brand-tokens.json'));
}

export interface CreateCampaignResult {
  campaignRelPath: string;
  campaignPath: string;
  year: string;
}

export async function createCampaign(opts: {
  clientSlug: string;
  clientName: string;
  campaignSlug: string;
  ctaLabel?: string;
  ctaUrl?: string;
}): Promise<CreateCampaignResult> {
  const year = String(new Date().getFullYear());
  const args = [
    'tsx',
    'scripts/create-campaign.ts',
    '--year',
    year,
    '--client',
    opts.clientSlug,
    '--client-name',
    opts.clientName,
    '--campaign',
    opts.campaignSlug,
  ];
  if (opts.ctaLabel) args.push('--cta', opts.ctaLabel);
  if (opts.ctaUrl) args.push('--url', opts.ctaUrl);

  await execFileAsync('npx', args, { cwd: ROOT });

  const campaignRelPath = path.join('newsletters', year, opts.clientSlug, opts.campaignSlug);
  return { campaignRelPath, campaignPath: path.join(ROOT, campaignRelPath), year };
}

/**
 * Escribe los archivos que devolvió el modelo (ver util/fileBlocks.ts), rechazando cualquier
 * ruta que caiga fuera de las carpetas permitidas — la defensa real contra que un job escriba
 * encima de otra campaña o se salga del repo vía path traversal.
 */
export function writeGeneratedFiles(files: Record<string, string>, allowedRelRoots: string[]): string[] {
  const allowedAbs = allowedRelRoots.map((r) => path.resolve(ROOT, r));
  const written: string[] = [];

  for (const [relPath, content] of Object.entries(files)) {
    const abs = path.resolve(ROOT, relPath);
    const isAllowed = allowedAbs.some((root) => abs === root || abs.startsWith(root + path.sep));
    if (!isAllowed) {
      throw new Error(`El modelo intentó escribir fuera de las carpetas permitidas: ${relPath}`);
    }
    fs.mkdirSync(path.dirname(abs), { recursive: true });
    fs.writeFileSync(abs, content, 'utf8');
    written.push(relPath);
  }

  return written;
}

export function readRepoFile(relPath: string): string | null {
  const abs = path.join(ROOT, relPath);
  return fs.existsSync(abs) ? fs.readFileSync(abs, 'utf8') : null;
}

/** Lee todos los .md de una carpeta (relativa a ROOT), como { rutaRelativa: contenido }. */
export function readRepoFilesGlobLike(dirRel: string): Record<string, string> {
  const dirAbs = path.join(ROOT, dirRel);
  const out: Record<string, string> = {};
  if (!fs.existsSync(dirAbs)) return out;
  for (const entry of fs.readdirSync(dirAbs, { withFileTypes: true })) {
    if (entry.isFile() && entry.name.endsWith('.md')) {
      out[path.join(dirRel, entry.name)] = fs.readFileSync(path.join(dirAbs, entry.name), 'utf8');
    }
  }
  return out;
}
