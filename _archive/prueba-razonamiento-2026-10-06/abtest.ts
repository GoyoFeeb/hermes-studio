// Prueba A/B de razonamiento (2026-10-06, punto 6 de la auditoría): GPT-6 Luna con --reasoning medium y high en la
// primera versión, mismos encargos que el worker (Paredes pre-Black Friday y Siroko W3 Shiga), en paralelo. Después,
// el control de Studio y la revisión de dirección de arte (siempre en medium, el mismo revisor para las cuatro).
import * as fs from 'fs';
import * as path from 'path';
import { spawn } from 'child_process';
import { execFileSync } from 'child_process';

const ROOT = '/Users/javifeebbo/Desktop/newsletter-system-reutilizable/sistema-final';
process.chdir(ROOT);
const s = require(path.join(ROOT, 'studio/server/standalone.ts'));
const w = require(path.join(ROOT, 'studio/worker/hermes-worker.ts'));
const ps = require(path.join(ROOT, 'studio/worker/productSheet.ts'));
const mb = require(path.join(ROOT, 'studio/worker/measureBrand.ts'));
const rn = require(path.join(ROOT, 'studio/worker/render-newsletter.ts'));
const ins = require(path.join(ROOT, 'studio/worker/inspect.ts'));
const cc = require(path.join(ROOT, 'studio/worker/copyCheck.ts'));

const MODEL = 'openai/gpt-6-luna';
const LEVELS = ['medium', 'high'];
const CASES = [
  {
    slug: 'paredes', name: 'Paredes',
    request: 'Newsletter pre-Black Friday de las zapatillas Eden negro de Paredes para público joven',
    brief: 'newsletters/2026/paredes/hermes/2026-10-05-bd5yhl/brief.md',
  },
  {
    slug: 'siroko', name: 'Siroko',
    request: 'Quiero una newsletter de esta marca: https://www.siroko.com/es/ de la coleccion otoño invierno',
    brief: 'newsletters/2026/siroko/hermes/2026-10-06-xfla8l/brief.md',
  },
];
const TIMEOUT_MS = 45 * 60 * 1000;
const OUT = path.join(ROOT, '_archive/prueba-razonamiento-2026-10-06');
const LOG = path.join(OUT, 'registro.log');
const log = (m: string): void => {
  const line = `[${new Date().toLocaleTimeString('es-ES')}] ${m}`;
  console.log(line);
  fs.appendFileSync(LOG, line + '\n');
};

function turn(query: string, extra: string[], resume: string | null): Promise<{ session: string | null; out: string }> {
  return new Promise((resolve) => {
    const args = ['chat', '-q', query, '-Q', '--yolo', '--ignore-rules', '-m', MODEL, ...extra, ...(resume ? ['--resume', resume] : [])];
    const env = { ...process.env };
    delete env.WORKER_TOKEN;
    delete env.STUDIO_WORKER_URL;
    const child = spawn('hermes', args, { cwd: ROOT, env, stdio: ['ignore', 'pipe', 'pipe'] });
    let out = '';
    child.stdout.on('data', (d) => (out += d));
    const killer = setTimeout(() => child.kill('SIGTERM'), TIMEOUT_MS);
    child.on('close', () => {
      clearTimeout(killer);
      resolve({ session: out.match(/session_id:\s*(\S+)/)?.[1] || resume, out });
    });
  });
}

/** Acciones, tokens de razonamiento y coste estimado de las sesiones (state.db de Hermes, solo lectura). */
function usage(ids: string[]): { actions: number; reasoningTokens: number; outputTokens: number; costUsd: number } {
  const list = ids.filter(Boolean).map((i) => `'${i.replace(/'/g, '')}'`).join(',');
  if (!list) return { actions: 0, reasoningTokens: 0, outputTokens: 0, costUsd: 0 };
  const q = `select coalesce(sum(tool_call_count),0), coalesce(sum(reasoning_tokens),0), coalesce(sum(output_tokens),0), coalesce(sum(estimated_cost_usd),0) from sessions where id in (${list})`;
  const row = execFileSync('sqlite3', ['-readonly', path.join(process.env.HOME!, '.hermes/state.db'), q], { encoding: 'utf8' }).trim().split('|').map(Number);
  return { actions: row[0], reasoningTokens: row[1], outputTokens: row[2], costUsd: +row[3].toFixed(3) };
}

async function prepare(c: (typeof CASES)[number]): Promise<{ tpl: string; sheet: any; identity: string; home: string | null; brief: string }> {
  const brief = fs.readFileSync(path.join(ROOT, c.brief), 'utf8');
  const tpl = path.join(OUT, `_plantilla-${c.slug}`);
  fs.rmSync(tpl, { recursive: true, force: true });
  const measured = mb.readMeasuredIdentity(ROOT, c.slug);
  const home = measured?.url || ps.brandHome(brief, c.slug);
  const sheet = await ps.buildProductSheet(ps.productUrls(brief), tpl, { gallery: ps.galleryUrls(brief, home) });
  log(`${c.name}: ficha y galería → ${sheet.photos.length} fotos, ${sheet.photos.filter((p: any) => p.hero).length} candidatas`);
  return { tpl, sheet, identity: measured ? mb.identityNote(measured) : '', home, brief };
}

async function main(): Promise<void> {
  fs.writeFileSync(LOG, '');
  const prepared = new Map<string, Awaited<ReturnType<typeof prepare>>>();
  for (const c of CASES) prepared.set(c.slug, await prepare(c));
  const runs = CASES.flatMap((c) =>
    LEVELS.map(async (level) => {
      const p = prepared.get(c.slug)!;
      const outDir = path.relative(ROOT, path.join(OUT, `${c.slug}-${level}`));
      const outAbs = path.join(ROOT, outDir);
      fs.rmSync(outAbs, { recursive: true, force: true });
      fs.cpSync(p.tpl, outAbs, { recursive: true });
      fs.writeFileSync(path.join(outAbs, 'brief.md'), p.brief);
      fs.writeFileSync(path.join(outAbs, '_trabajo', 'peticion.txt'), c.request);
      const logo = path.join(ROOT, `brands/${c.slug}/design-input/logo-medido.png`);
      if (fs.existsSync(logo)) fs.copyFileSync(logo, path.join(outAbs, 'logo-medido.png'));
      const job = {
        id: `mab-${c.slug}-${level}`,
        createdAt: '2026-10-06T13:30:00Z',
        input: { clientSlug: c.slug, clientName: c.name, brandMode: 'existing', briefText: p.brief, instruction: c.request, imageMode: 'official', mode: 'standalone' },
      };
      const genDir = s.standaloneOutputDir(job);
      const prompt =
        s.buildHermesPrompt(job).split(genDir).join(outDir) +
        p.identity +
        (fs.existsSync(logo) ? `\n- Logo oficial medido ya copiado en ${outDir}/logo-medido.png: úsalo tal cual (no lo copies ni lo busques).` : '') +
        ps.productSheetNote(p.sheet, outDir) +
        w.WEB_ACCESS_NOTE +
        w.selfContainedNote(outDir) +
        w.PREVIOUS_WORK_NOTE +
        w.SECRETS_NOTE;
      fs.writeFileSync(path.join(outAbs, '_trabajo', 'encargo.md'), prompt);
      const html = path.join(outAbs, 'newsletter.html');
      const t0 = Date.now();
      let htmlAt: number | null = null;
      const watch = setInterval(() => {
        if (!htmlAt && fs.existsSync(html)) htmlAt = Date.now();
      }, 3000);
      const tag = `${c.name} ${level}`;
      log(`${tag}: empieza`);
      const reasoning = ['--reasoning', level];
      let r = await turn(prompt, reasoning, null);
      const sessions = [r.session];
      for (let i = 1; i <= 2 && !fs.existsSync(html) && Date.now() - t0 < TIMEOUT_MS; i++) {
        log(`${tag}: paró sin HTML — continuar ${i}/2`);
        r = await turn(`Todavía no existe ${outDir}/newsletter.html. Responde AHORA con llamadas a herramientas: escribe el HTML, compruébalo y termínalo.`, reasoning, r.session);
      }
      clearInterval(watch);
      const totalMin = +((Date.now() - t0) / 60000).toFixed(1);
      const use = usage(sessions as string[]);
      const res: Record<string, unknown> = { case: c.name, level, dir: outDir, session: sessions[0], totalMin, htmlMin: htmlAt ? +((htmlAt - t0) / 60000).toFixed(1) : null, html: fs.existsSync(html), ...use };
      if (fs.existsSync(html)) {
        // Control de Studio (como el worker al recibir la pieza, con los arreglos automáticos).
        const q = await ins.inspectNewsletter(html, ROOT, { fix: true, design: true, brandSlug: c.slug }).catch(() => null);
        res.errors = q ? q.report.checks.filter((x: any) => x.status === 'error').map((x: any) => x.id) : null;
        res.warnings = q ? q.report.warnings : null;
        // Revisión de dirección de arte: mismo revisor (medium) para las cuatro.
        const workDir = path.join(outAbs, '_trabajo');
        const sheet = await rn.renderSheet(html, workDir);
        const webFile = p.home ? await rn.captureBrandWeb(p.home, path.join(workDir, 'web-marca.jpg')) : null;
        const sizeOf = async (f: string): Promise<any> => {
          const m = await require('sharp')(f).metadata();
          return { width: m.width, height: m.height };
        };
        const query = w.artReviewQuery(c.request, prompt, fs.readFileSync(html, 'utf8'), sheet.sheet, await sizeOf(sheet.sheet), webFile ? { path: webFile, size: await sizeOf(webFile) } : null, cc.copyFindings(fs.readFileSync(html, 'utf8')).found);
        const look = await turn(query, ['--reasoning', 'medium'], null);
        const review = w.parseArtReview(look.out);
        res.web = !!webFile;
        res.art = review ? review.notas : null;
        res.artPct = review ? Math.round((Object.values(review.notas as Record<string, number>).reduce((a, b) => a + b, 0) / (Object.keys(review.notas).length * 5)) * 100) : null;
        res.problemas = review?.problemas || [];
        fs.writeFileSync(path.join(workDir, 'revision-visual.json'), JSON.stringify(review || look.out.slice(0, 3000), null, 2));
      }
      log(`${tag}: termina — ${JSON.stringify(res)}`);
      return res;
    })
  );
  const results = await Promise.all(runs);
  fs.writeFileSync(path.join(OUT, 'resultados.json'), JSON.stringify(results, null, 2));
  log('FIN');
}

main().catch((e) => {
  log(`ERROR ${e?.stack || e}`);
  process.exit(1);
});
