/**
 * Validación de la Q3 (2026-10-07): ¿la escala con anclas distingue mejor que la antigua?
 * Cada pieza se puntúa con las dos escalas sobre la MISMA hoja de capturas; dos piezas, dos veces con la nueva
 * (consistencia). Uso: npx tsx _archive/prueba-nota-2026-10-07/validar.ts
 */
import { spawn } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as nueva from '../../studio/worker/hermes-worker';
// La versión anterior del worker (git show HEAD, antes de la Q3), copiada junto a él para que resuelva sus imports.
import * as antigua from '../../studio/worker/.prueba-escala-antigua';
import sharp from 'sharp';

const ROOT = path.resolve(__dirname, '../..');
const OUT = path.join(__dirname, 'resultados.json');
const PIEZAS = [
  'newsletters/2026/tienda-animal/hermes/2026-10-07-pnbnxs',
  'newsletters/2026/el-corte-ingles/hermes/2026-10-06-vxvm7f',
  'newsletters/2026/lacoste/hermes/2026-10-06-idyg6t',
  'newsletters/2026/feebbo/hermes/2026-10-06-y07dqw',
  'newsletters/2026/helly-hansen/hermes/2026-10-06-1xvav7',
  'newsletters/2026/nike/hermes/2026-10-06-jcpy0x',
  'newsletters/2026/stockx/hermes/2026-10-06-641bhj',
  'newsletters/2026/siroko/hermes/2026-10-06-xfla8l',
];
const REPETIR = ['newsletters/2026/lacoste/hermes/2026-10-06-idyg6t', 'newsletters/2026/nike/hermes/2026-10-06-jcpy0x'];

function hermes(query: string, extra: string[] = []): Promise<{ output: string; sec: number }> {
  const t = Date.now();
  return new Promise((resolve) => {
    const child = spawn('hermes', ['chat', '-q', query, '-Q', '--yolo', '--ignore-rules', '-t', 'terminal,file,vision', ...extra], { cwd: ROOT });
    let out = '';
    child.stdout.on('data', (d) => (out += d));
    const cap = setTimeout(() => child.kill('SIGTERM'), 6 * 60 * 1000);
    child.on('close', () => {
      clearTimeout(cap);
      resolve({ output: out.replace(/^\s*session_id:.*$/m, '').trim(), sec: Math.round((Date.now() - t) / 1000) });
    });
  });
}

async function size(abs: string): Promise<{ width: number; height: number } | undefined> {
  const m = await sharp(abs).metadata().catch(() => null);
  return m?.width && m?.height ? { width: m.width, height: m.height } : undefined;
}

async function main(): Promise<void> {
  const results: unknown[] = fs.existsSync(OUT) ? JSON.parse(fs.readFileSync(OUT, 'utf8')) : [];
  const done = new Set(results.map((r) => JSON.stringify([(r as { pieza: string }).pieza, (r as { escala: string }).escala, (r as { vuelta: number }).vuelta])));
  // «nueva2» (segunda vuelta): la escala ajustada para que un 5 se gane (5 con mejora de su criterio o sin prueba = 4).
  // Las tareas ya hechas («antigua», «nueva») se saltan; el código de «nueva» ya no existe, solo sus resultados.
  // «baja» (T2): la escala de nueva2 con razonamiento bajo en el turno de la nota.
  type Escala = 'antigua' | 'nueva' | 'nueva2' | 'baja';
  const tareas: [string, Escala, number][] = [
    ...PIEZAS.flatMap((p) => [[p, 'antigua', 1], [p, 'nueva', 1], [p, 'nueva2', 1], [p, 'baja', 1]] as [string, Escala, number][]),
    ...REPETIR.flatMap((p) => [[p, 'nueva', 2], [p, 'nueva2', 2]] as [string, Escala, number][]),
  ];
  for (const [pieza, escala, vuelta] of tareas) {
    if (done.has(JSON.stringify([pieza, escala, vuelta]))) continue;
    const dir = path.join(ROOT, pieza);
    const work = path.join(dir, '_trabajo');
    const html = fs.readFileSync(path.join(dir, 'newsletter.html'), 'utf8');
    const prompt = fs.readFileSync(path.join(work, 'encargo.md'), 'utf8');
    const reqFile = path.join(work, 'peticion.txt');
    const request = fs.existsSync(reqFile) ? fs.readFileSync(reqFile, 'utf8').trim() : undefined;
    const sheet = path.join(pieza, '_trabajo', 'render-hoja.jpg');
    const webAbs = path.join(work, 'web-marca.jpg');
    const web = fs.existsSync(webAbs) ? { path: path.join(pieza, '_trabajo', 'web-marca.jpg'), size: await size(webAbs) } : null;
    const mod = escala === 'antigua' ? antigua : nueva;
    const query = mod.artReviewQuery(request, prompt, html, sheet, await size(path.join(ROOT, sheet)), web, []);
    console.log(`${new Date().toLocaleTimeString('es-ES')} ${pieza.split('/')[2]} · ${escala} · vuelta ${vuelta}…`);
    const { output, sec } = await hermes(query, escala === 'baja' ? ['--reasoning', 'low'] : []);
    const review = mod.parseArtReview(output);
    results.push({ pieza, escala, vuelta, sec, notas: review?.notas ?? null, pruebas: (review as { pruebas?: unknown } | null)?.pruebas ?? null, problemas: review?.problemas ?? [], raw: review ? undefined : output.slice(0, 1500) });
    fs.writeFileSync(OUT, JSON.stringify(results, null, 2));
    console.log(`   ${review ? `${Object.values(review.notas).reduce((a, b) => a + b, 0)}/50 · ${Object.values(review.notas).join(' ')}` : 'sin notas legibles'} · ${sec}s`);
  }
}
main();
