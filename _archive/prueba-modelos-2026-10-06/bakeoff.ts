// Prueba comparativa de modelos (2026-10-06): misma newsletter de Paredes, mismo encargo que el worker, en paralelo.
import * as fs from 'fs';
import * as path from 'path';
import { spawn } from 'child_process';

const ROOT = '/Users/javifeebbo/Desktop/newsletter-system-reutilizable/sistema-final';
process.chdir(ROOT);
const s = require(path.join(ROOT, 'studio/server/standalone.ts'));
const w = require(path.join(ROOT, 'studio/worker/hermes-worker.ts'));
const ps = require(path.join(ROOT, 'studio/worker/productSheet.ts'));
const mb = require(path.join(ROOT, 'studio/worker/measureBrand.ts'));

const MODELS = [
  'deepseek/deepseek-v4-flash-0731',
  'deepseek/deepseek-v4.1-flash',
  'openai/gpt-6-luna',
  'qwen/qwen3.8-flash',
  'moonshotai/kimi-k2.6',
];
const REQUEST = 'Newsletter pre-Black Friday de las zapatillas Eden negro de Paredes para público joven';
const BRIEF = fs.readFileSync('newsletters/2026/paredes/hermes/2026-10-05-bd5yhl/brief.md', 'utf8');
const TIMEOUT_MS = 50 * 60 * 1000;
const LOG = process.argv[2];
const log = (m: string): void => {
  const line = `[${new Date().toLocaleTimeString('es-ES')}] ${m}`;
  console.log(line);
  fs.appendFileSync(LOG, line + '\n');
};

function turn(query: string, model: string, resume: string | null): Promise<{ session: string | null; out: string }> {
  return new Promise((resolve) => {
    const args = ['chat', '-q', query, '-Q', '--yolo', '--ignore-rules', '-m', model, ...(resume ? ['--resume', resume] : [])];
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

async function main(): Promise<void> {
  const base = 'newsletters/2026/paredes/hermes';
  // Ficha de producto una vez; cada carpeta recibe una copia.
  const tpl = path.join(ROOT, base, '_prueba-modelos-plantilla');
  fs.rmSync(tpl, { recursive: true, force: true });
  const urls = ps.productUrls(BRIEF);
  const sheet = await ps.buildProductSheet(urls, tpl);
  log(`Ficha: ${urls.join(' ')} → ${sheet.photos.length} fotos, precio ${sheet.pages.find((p: any) => p.price)?.price?.amount}`);
  const measured = mb.readMeasuredIdentity(ROOT, 'paredes');
  const identity = measured ? mb.identityNote(measured) : '';

  const runs = MODELS.map(async (model) => {
    const slug = model.split('/')[1].replace(/[^a-z0-9.-]/gi, '-');
    const outDir = `${base}/_prueba-modelos-${slug}`;
    const outAbs = path.join(ROOT, outDir);
    fs.rmSync(outAbs, { recursive: true, force: true });
    fs.cpSync(tpl, outAbs, { recursive: true });
    fs.writeFileSync(path.join(outAbs, 'brief.md'), BRIEF);
    fs.writeFileSync(path.join(outAbs, '_trabajo', 'peticion.txt'), REQUEST);
    fs.copyFileSync(path.join(ROOT, 'brands/paredes/design-input/logo-medido.png'), path.join(outAbs, 'logo-medido.png'));
    const job = {
      id: 'mprueba-' + slug,
      createdAt: '2026-10-06T10:00:00Z',
      input: { clientSlug: 'paredes', clientName: 'Paredes', brandMode: 'existing', briefText: BRIEF, instruction: REQUEST, imageMode: 'official', mode: 'standalone' },
    };
    const genDir = s.standaloneOutputDir(job);
    const prompt =
      s.buildHermesPrompt(job).split(genDir).join(outDir) +
      identity +
      `\n- Logo oficial medido ya copiado en ${outDir}/logo-medido.png: úsalo tal cual (no lo copies ni lo busques).` +
      ps.productSheetNote(sheet, outDir) +
      w.WEB_ACCESS_NOTE +
      w.selfContainedNote(outDir) +
      w.PREVIOUS_WORK_NOTE +
      w.SECRETS_NOTE;
    fs.writeFileSync(path.join(outAbs, '_trabajo', 'encargo.md'), prompt);
    const html = path.join(outAbs, 'newsletter.html');
    const notes = path.join(outAbs, 'notas.md');
    const t0 = Date.now();
    let htmlAt: number | null = null;
    const watch = setInterval(() => {
      if (!htmlAt && fs.existsSync(html)) htmlAt = Date.now();
    }, 3000);
    log(`${model}: empieza`);
    let r = await turn(prompt, model, null);
    const sessions = [r.session];
    for (let i = 1; i <= 2 && !fs.existsSync(html) && Date.now() - t0 < TIMEOUT_MS; i++) {
      log(`${model}: paró sin HTML — continuar ${i}/2`);
      r = await turn(
        `Todavía no existe ${outDir}/newsletter.html. Responde AHORA con llamadas a herramientas, sin texto previo: escribe el HTML, compruébalo y termínalo.`,
        model,
        r.session
      );
    }
    if (fs.existsSync(html) && !fs.existsSync(notes)) {
      log(`${model}: falta notas.md — un turno más`);
      await turn(`Falta ${outDir}/notas.md, obligatorio. Escríbelo AHORA con write_file con los puntos de la autoauditoría.`, model, r.session);
    }
    clearInterval(watch);
    const res = {
      model,
      dir: outDir,
      session: sessions[0],
      totalMin: +((Date.now() - t0) / 60000).toFixed(1),
      htmlMin: htmlAt ? +((htmlAt - t0) / 60000).toFixed(1) : null,
      html: fs.existsSync(html),
      notes: fs.existsSync(notes),
    };
    log(`${model}: termina — ${JSON.stringify(res)}`);
    return res;
  });
  const results = await Promise.all(runs);
  fs.writeFileSync(LOG.replace(/\.log$/, '.json'), JSON.stringify(results, null, 2));
  log('FIN');
}

main().catch((e) => {
  log(`ERROR ${e?.stack || e}`);
  process.exit(1);
});
