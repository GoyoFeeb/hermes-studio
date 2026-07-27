#!/usr/bin/env npx tsx
/**
 * generate-hero.ts — pide a Claude (API de Anthropic, multimodal) el hero de una marca a
 * partir de la captura de su web + su brand pack + el contrato de diseño.
 *
 * Uso:  ANTHROPIC_API_KEY=... npx tsx scripts/generate-hero.ts --brand tarifalo
 * Requiere: brands/{brand}/design-input/site-*.png (de capture-brand-site.ts) y
 *           brands/{brand}/tokens/brand-tokens.json
 * Salida:  engine/components/_candidates/hero-marca-{brand}.html (CANDIDATO — no entra al
 *          motor hasta pasar validate-hero-component.ts --accept)
 */
import * as fs from 'fs';
import * as path from 'path';

import { loadEnv } from './lib/env';

const ROOT = path.resolve(import.meta.dirname, '..');
loadEnv(ROOT);
const MODEL = process.env.HERO_MODEL || 'claude-sonnet-5';

function arg(name: string): string | undefined {
  const i = process.argv.indexOf('--' + name);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

async function main(): Promise<void> {
  const brand = arg('brand');
  if (!brand) { console.error('Uso: --brand {slug}'); process.exit(1); }
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) { console.error('❌ Falta ANTHROPIC_API_KEY en el entorno.'); process.exit(1); }

  const packPath = path.join(ROOT, 'brands', brand, 'tokens', 'brand-tokens.json');
  if (!fs.existsSync(packPath)) { console.error(`❌ No existe ${packPath}`); process.exit(1); }
  const inputDir = path.join(ROOT, 'brands', brand, 'design-input');
  const shots = fs.existsSync(inputDir) ? fs.readdirSync(inputDir).filter((f) => f.endsWith('.png')) : [];
  if (shots.length === 0) {
    console.error(`❌ Sin capturas en ${inputDir} — correr antes capture-brand-site.ts`);
    process.exit(1);
  }

  const contract = fs.readFileSync(path.join(ROOT, 'scripts', 'hero-design', 'HERO-DESIGN-CONTRACT.md'), 'utf8');
  const pack = fs.readFileSync(packPath, 'utf8');

  const content: any[] = [
    { type: 'text', text: contract },
    { type: 'text', text: `Slug del cliente: ${brand}\n\nbrand-tokens.json de la marca:\n\n${pack}` },
  ];
  for (const s of shots) {
    content.push({ type: 'text', text: `Captura de la web (${s}):` });
    content.push({
      type: 'image',
      source: { type: 'base64', media_type: 'image/png', data: fs.readFileSync(path.join(inputDir, s)).toString('base64') },
    });
  }

  console.log(`Llamando a ${MODEL} con ${shots.length} captura(s)...`);
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'x-api-key': key, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
    body: JSON.stringify({ model: MODEL, max_tokens: 4000, messages: [{ role: 'user', content }] }),
  });
  if (!res.ok) { console.error(`❌ API ${res.status}: ${await res.text()}`); process.exit(1); }
  const data: any = await res.json();
  const text = (data.content || []).filter((b: any) => b.type === 'text').map((b: any) => b.text).join('\n');
  const m = text.match(/```html\n([\s\S]*?)```/);
  if (!m) { console.error('❌ La respuesta no contiene un bloque ```html```. Respuesta:\n' + text.slice(0, 800)); process.exit(1); }

  const outDir = path.join(ROOT, 'engine', 'components', '_candidates');
  fs.mkdirSync(outDir, { recursive: true });
  const outPath = path.join(outDir, `hero-marca-${brand}.html`);
  fs.writeFileSync(outPath, m[1]);
  console.log(`✅ Candidato escrito: ${outPath}`);
  console.log(`   Siguiente paso: npm run validate-hero -- --brand ${brand}  (y --accept si pasa)`);
}
main();
