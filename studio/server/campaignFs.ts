/**
 * campaignFs.ts — el nombre de carpeta (slug) de una marca o campaña. Antes también creaba campañas y escribía los
 * archivos del pipeline de 9 fases, retirado el 2026-10-05; studio/web/app.js replica este slugify().
 */
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
