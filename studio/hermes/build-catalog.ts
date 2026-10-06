/**
 * build-catalog.ts — catálogo de módulos para Hermes a partir de los componentes del motor (2026-10-06, opción 3, fase B).
 *
 * El motor (`engine/components`) tiene 29 módulos de email probados en Outlook, Gmail y modo oscuro, pero son plantillas
 * con su propia sintaxis ({{data:…}}, {{token:…}}, {{include:…}}, {{#each}}): Hermes no puede usarlas tal cual y en
 * Studio solo recibía 3 módulos de ejemplo (email-modulos.md). Aquí se renderiza cada componente CON EL PROPIO MOTOR,
 * con datos reales de una campaña que lo usó y el brand pack de esa marca, y se guarda el HTML de email resultante:
 *
 *   studio/hermes/modulos/<id>.html   el módulo (filas <tr> para la tabla de 600 px de la base técnica)
 *   studio/hermes/modulos/<id>.png    cómo se ve (600 px, con la base técnica alrededor)
 *   studio/hermes/catalogo.md         índice: qué es, cuándo usarlo y con qué marca se renderizó
 *
 * Las variantes sin campaña propia (asimétrica, a 2 columnas, vertical, en línea…) usan los datos de su componente base:
 * el motor les da el mismo adaptador. Las imágenes de los datos se cambian por un gris neutro (los archivos de las
 * campañas no viajan con el catálogo).
 *
 * Uso: npm run build-catalog   (vuelve a generarlo todo; no toca engine/)
 */
import * as fs from 'fs';
import * as path from 'path';
import sharp from 'sharp';
import { launchBrowser } from '../worker/renderChecks';
import { MODULES } from './catalog';

const ROOT = path.resolve(__dirname, '..', '..');
const COMPONENTS = path.join(ROOT, 'engine', 'components');
const OUT = path.join(__dirname, 'modulos');
const INDEX = path.join(__dirname, 'catalogo.md');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { renderTemplate, stripLeadingComment, MODULE_ADAPTERS } = require(path.join(ROOT, 'engine', 'lib', 'assemble.js'));
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { loadBrandTokens } = require(path.join(ROOT, 'engine', 'lib', 'tokens.js'));

/** Componente cuyos datos usa una variante sin campaña propia (mismo adaptador en el motor). */
function baseOf(id: string): string | null {
  for (const suffix of ['-sin-icono-asimetrico', '-asimetrico', '-2col', '-vertical', '-inline', '-sin-icono']) {
    if (id.endsWith(suffix)) return id.slice(0, -suffix.length);
  }
  return null;
}

interface Sample {
  data: unknown;
  brand: string;
  from: string;
}

/** Una instancia real de datos por componente (la primera que se pueda renderizar con el pack de su marca). */
function samples(): Map<string, Sample[]> {
  const out = new Map<string, Sample[]>();
  const files: string[] = [];
  const walk = (dir: string): void => {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      if (e.name.startsWith('_') || e.name.startsWith('.')) continue;
      const abs = path.join(dir, e.name);
      if (e.isDirectory()) walk(abs);
      else if (e.name === 'campaign-data.json') files.push(abs);
    }
  };
  walk(path.join(ROOT, 'newsletters'));
  for (const f of files.sort()) {
    let d: { brand?: string; modules?: { component: string; data: unknown }[] };
    try {
      d = JSON.parse(fs.readFileSync(f, 'utf8'));
    } catch {
      continue;
    }
    if (!d.brand) continue;
    for (const m of d.modules || []) {
      const list = out.get(m.component) || [];
      list.push({ data: m.data, brand: d.brand, from: path.relative(ROOT, f).split(path.sep).slice(1, 4).join('/') });
      out.set(m.component, list);
    }
  }
  return out;
}

const PLACEHOLDER = 'catalogo-imagen.png';
const FILLER = /sustitu|punto de partida|bloque \d|describe el|production-gate|revisar brief|cerrar qa|validar contenido|(?<![=/_-])\b\d{4}-[a-z]{3}-[a-z0-9-]+/i;

/** El módulo renderizado con el motor; las imágenes de la campaña pasan a un gris neutro. */
function renderModule(id: string, sample: Sample): string {
  const adapter = MODULE_ADAPTERS[id];
  if (!adapter) throw new Error(`sin adaptador para ${id}`);
  const { tokens } = loadBrandTokens(sample.brand, ROOT);
  const template = stripLeadingComment(fs.readFileSync(path.join(COMPONENTS, `${id}.html`), 'utf8'));
  const html: string = renderTemplate(template, adapter(sample.data, tokens), tokens, COMPONENTS, { file: id });
  return html.replace(/(<img\b[^>]*\bsrc=")(?!https?:)[^"]*(")/gi, `$1${PLACEHOLDER}$2`).replace(/(<img\b[^>]*\bsrc=")https?:[^"]*(")/gi, `$1${PLACEHOLDER}$2`);
}

/** Vista previa: el módulo en una tabla de 600 px como la de la base técnica. */
function preview(moduleHtml: string): string {
  const body = /^\s*<tr/i.test(moduleHtml) ? moduleHtml : `<tr><td>${moduleHtml}</td></tr>`;
  return `<!doctype html><html><head><meta charset="utf-8"></head><body style="margin:0;padding:20px 0;background:#eeeeee"><table role="presentation" width="600" align="center" cellpadding="0" cellspacing="0" border="0" style="background:#ffffff">${body}</table></body></html>`;
}

async function main(): Promise<void> {
  fs.rmSync(OUT, { recursive: true, force: true });
  fs.mkdirSync(OUT, { recursive: true });
  await sharp({ create: { width: 1200, height: 800, channels: 3, background: '#c9c9c9' } }).png().toFile(path.join(OUT, PLACEHOLDER));
  const all = samples();
  const rows: string[] = [];
  const done: { id: string; brand: string }[] = [];
  const slugOf = (brandPath: string): string => brandPath.split('/')[1] || brandPath;
  const browser = await launchBrowser();
  try {
    for (const id of Object.keys(MODULES)) {
      // Primero los datos con contenido real: las campañas de prueba del motor traen textos de relleno («Bloque 1…
      // Describe el primer beneficio», «Revisar brief / Cerrar QA», el nombre interno de la campaña como titular).
      const filler = (x: Sample): boolean => FILLER.test(JSON.stringify(x.data));
      const pool = [...(all.get(id) || []), ...(baseOf(id) ? all.get(baseOf(id)!) || [] : [])];
      const candidates = [...pool.filter((x) => !filler(x)), ...pool.filter(filler)];
      let html = '';
      let used: Sample | null = null;
      for (const s of candidates) {
        try {
          html = renderModule(id, s);
          used = s;
          break;
        } catch {
          // datos de otra versión del schema o pack incompleto: la siguiente
        }
      }
      if (!used) {
        console.log(`✗ ${id}: ninguna campaña lo renderiza`);
        continue;
      }
      const info = MODULES[id];
      const header =
        `<!-- Módulo «${id}» del catálogo de Studio (generado por studio/hermes/build-catalog.ts desde engine/components).\n` +
        `     ${info.que} Cuándo: ${info.cuando}\n` +
        `     Ejemplo renderizado con el brand pack de ${slugOf(used.brand)} (${used.from}): los textos, imágenes, colores y\n` +
        `     tipografía son de ESA marca — sustitúyelos por los de la tuya. La estructura de tablas, el VML de los botones y\n` +
        `     las clases son lo que se reutiliza. -->\n`;
      fs.writeFileSync(path.join(OUT, `${id}.html`), header + html.trim() + '\n');
      const file = path.join(OUT, `_vista-${id}.html`);
      fs.writeFileSync(file, preview(html));
      const page = await browser.newPage({ viewport: { width: 640, height: 400 }, javaScriptEnabled: false });
      await page.goto(`file://${file}`, { waitUntil: 'load', timeout: 30000 });
      await page.screenshot({ path: path.join(OUT, `${id}.png`), fullPage: true });
      await page.close();
      fs.rmSync(file);
      done.push({ id, brand: slugOf(used.brand) });
      rows.push(`| \`${id}\` | ${info.grupo} | ${info.que} | ${info.cuando} | ${slugOf(used.brand)} |`);
    }
  } finally {
    await browser.close();
  }
  fs.writeFileSync(
    INDEX,
    [
      '# Catálogo de módulos de Studio',
      '',
      '> Generado por `npm run build-catalog` desde los componentes del motor (`engine/components`). No editar a mano.',
      '> Cada módulo: `studio/hermes/modulos/<id>.html` (HTML de email probado en Outlook, Gmail y modo oscuro, filas',
      '> `<tr>` para la tabla de 600 px de la base técnica) y `<id>.png` (cómo se ve). Los ejemplos están renderizados',
      '> con el brand pack de otra marca: se reutiliza la ESTRUCTURA, no sus textos, colores ni fotos.',
      '',
      '| Módulo | Grupo | Qué es | Cuándo usarlo | Renderizado con |',
      '|---|---|---|---|---|',
      ...rows,
      '',
    ].join('\n')
  );
  console.log(`Catálogo: ${done.length} módulos en ${path.relative(ROOT, OUT)} e índice en ${path.relative(ROOT, INDEX)}.`);
}

if (require.main === module) {
  main().catch((err) => {
    console.error(err);
    process.exitCode = 1;
  });
}
