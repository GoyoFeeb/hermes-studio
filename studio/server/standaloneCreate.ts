/**
 * standaloneCreate.ts — el cuerpo con el que la web (y el token de servicio) crean un trabajo
 * de Hermes. Misma validación en los dos sitios: la página no cambia de comportamiento.
 */
import { slugify } from './campaignFs';
import { readBrandCard } from './brandCards';
import { promptMentionsBrand } from './standalone';
import type { JobInput } from './store';

const SLUG_RE = /^[a-z0-9][a-z0-9-]{0,59}$/;

export type StandaloneBuild =
  | { ok: true; input: JobInput }
  | { ok: false; status: number; error: string; code?: string };

/** Traduce el JSON del formulario a un `JobInput`, o el mismo error que devolvía POST /api/jobs. */
export function standaloneInputFromBody(body: Record<string, unknown>, requesterName?: string): StandaloneBuild {
  if (body.existingBrand && !SLUG_RE.test(String(body.existingBrand))) {
    return { ok: false, status: 400, error: 'Marca no válida.' };
  }
  if (body.mode !== 'standalone') {
    return { ok: false, status: 400, error: 'Solo se aceptan newsletters hechas con Hermes (mode: "standalone").' };
  }
  if (!body.promptText || !body.clientName) {
    return { ok: false, status: 400, error: 'Faltan campos obligatorios: marca y prompt.' };
  }
  if (body.imageMode !== 'official' && body.imageMode !== 'ai') {
    return { ok: false, status: 400, error: 'Elige de dónde salen las imágenes: assets oficiales o IA.' };
  }
  const fromInstruction = body.inputKind === 'instruction';
  const clientSlug = (body.existingBrand as string) || slugify(String(body.clientName));
  if (!body.confirmBrand && !promptMentionsBrand(String(body.promptText), String(body.clientName), clientSlug)) {
    return {
      ok: false,
      status: 409,
      code: 'brand_mismatch',
      error: `${fromInstruction ? 'La instrucción' : 'El prompt'} no menciona "${body.clientName}". ¿Seguro que la marca elegida es la correcta?`,
    };
  }
  const brandUrl =
    typeof body.brandUrl === 'string' && /^https:\/\/[^\s"'<>]{4,300}$/.test(body.brandUrl.trim()) ? body.brandUrl.trim() : undefined;
  const knownCard = body.existingBrand ? readBrandCard(clientSlug)?.card : undefined;
  const unconfirmedKnown = !!body.existingBrand && (!knownCard || (!knownCard.hasPack && !knownCard.web?.confirmed));
  if ((!body.existingBrand || unconfirmedKnown) && !brandUrl && body.confirmNoBrandUrl !== true) {
    return {
      ok: false,
      status: 409,
      code: 'brand_url_required',
      error: body.existingBrand
        ? `"${body.clientName}" no tiene web oficial confirmada: indícala o confirma que la envías sin ella (Hermes la investigará).`
        : `"${body.clientName}" es una marca nueva: indica su web oficial o confirma que la envías sin ella (Hermes la investigará).`,
    };
  }
  const promptText = body.promptText as string;
  return {
    ok: true,
    input: {
      mode: 'standalone',
      clientSlug,
      clientName: String(body.clientName),
      brandMode: body.existingBrand ? 'existing' : 'new',
      briefText: fromInstruction ? '' : promptText,
      instruction: fromInstruction ? String(promptText).slice(0, 4000) : undefined,
      reviewBrief: fromInstruction && body.reviewBrief === true ? true : undefined,
      artReview: body.artReview === true ? true : undefined,
      brandUrl,
      imageMode: body.imageMode,
      requesterName,
    },
  };
}
