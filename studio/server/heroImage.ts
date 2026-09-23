/**
 * heroImage.ts — genera una imagen de hero vía la API de imágenes de OpenAI cuando la fase 06
 * la necesita. Sigue siendo una versión más simple que scripts/generate-hero-image.ts (no hay
 * paso de visión sobre la landing real, el prompt sale directo del brief que escribe la
 * persona) pero, desde la auditoría 2026-09-23 (BUG-H08), quien construye ese prompt
 * (../phases/dataPhase.ts) sí pasa el texto por el mismo saneado que el flujo CLI usa contra el
 * incidente de moderación de 2026-07-27 (ver scripts/lib/sanitize-hero-prompt.ts y memory.md).
 */
import * as fs from 'fs';
import * as path from 'path';
import { ROOT } from './paths';

const OPENAI_IMAGES_URL = 'https://api.openai.com/v1/images/generations';

export async function generateHeroImage(opts: {
  brandSlug: string;
  campaignSlug: string;
  prompt: string;
}): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY no configurada — no se puede generar la imagen de hero.');
  }

  const model = process.env.HERO_IMG_MODEL || 'gpt-image-1';
  const quality = process.env.HERO_IMG_QUALITY || 'medium';

  const res = await fetch(OPENAI_IMAGES_URL, {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model, prompt: opts.prompt, size: '1536x1024', quality, n: 1 }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`OpenAI images API ${res.status}: ${body.slice(0, 500)}`);
  }

  const json = (await res.json()) as { data?: Array<{ b64_json?: string }> };
  const b64 = json.data?.[0]?.b64_json;
  if (!b64) throw new Error('OpenAI no devolvió imagen (b64_json vacío).');

  const relPath = path.join('brands', opts.brandSlug, 'design-input', `hero-${opts.campaignSlug}.png`);
  fs.mkdirSync(path.join(ROOT, path.dirname(relPath)), { recursive: true });
  fs.writeFileSync(path.join(ROOT, relPath), Buffer.from(b64, 'base64'));
  return relPath;
}

/** Convierte una ruta relativa dentro de brands/ en la URL pública que sirve este servicio
 *  (ver el montaje `app.use('/assets', express.static(BRANDS_DIR))` en server/index.ts).
 *  Requiere STUDIO_PUBLIC_BASE_URL en https para que campaign-data.json valide contra el
 *  schema (exige httpsUrl) — documentado en studio/README.md como requisito de despliegue. */
export function toPublicAssetUrl(relPathUnderBrands: string): string {
  const base = process.env.STUDIO_PUBLIC_BASE_URL || 'http://localhost:3000';
  const withoutBrandsPrefix = relPathUnderBrands.replace(/^brands\//, '');
  return `${base.replace(/\/$/, '')}/assets/${withoutBrandsPrefix}`;
}
