/**
 * heroImage.ts — URL pública de los recursos de brands/ que sirve este servicio. Antes también generaba el hero
 * con la API de imágenes de OpenAI para la fase 06 del pipeline de 9 fases; ese pipeline se retiró el 2026-10-05
 * (el hero lo hace ahora Hermes en el Mac) y aquí queda solo lo que usa standalone.ts.
 */
/** Convierte una ruta relativa dentro de brands/ en la URL pública que sirve este servicio
 *  (ver el montaje `app.use('/assets', express.static(BRANDS_DIR))` en server/index.ts).
 *  Requiere STUDIO_PUBLIC_BASE_URL en https para que campaign-data.json valide contra el
 *  schema (exige httpsUrl) — documentado en studio/README.md como requisito de despliegue. */
export function toPublicAssetUrl(relPathUnderBrands: string): string {
  const base = process.env.STUDIO_PUBLIC_BASE_URL || 'http://localhost:3000';
  const withoutBrandsPrefix = relPathUnderBrands.replace(/^brands\//, '');
  return `${base.replace(/\/$/, '')}/assets/${withoutBrandsPrefix}`;
}
