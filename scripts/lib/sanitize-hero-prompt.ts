/**
 * lib/sanitize-hero-prompt.ts — saneado de texto antes de enviarlo como prompt a la API de
 * imágenes de OpenAI para el hero de una campaña.
 *
 * Extraído de scripts/generate-hero-image.ts (auditoría 2026-09-23, BUG-H08): la función vivía
 * solo ahí, así que studio/server/heroImage.ts —el otro punto de entrada que genera héroes, vía
 * Hermes Studio— construía su prompt sin pasar por este saneado. studio/README.md ya lo
 * señalaba explícitamente como "mejora pendiente, no construida en v1". Se comparte desde aquí
 * en vez de duplicarlo, para que un futuro ajuste (nuevo patrón detectado) se aplique una sola
 * vez a los dos flujos.
 *
 * Motivo original (incidente BMW, 2026-07-27, ver memory.md): la descripción visual de una
 * landing real, generada por visión de IA, puede incluir términos demasiado identificables
 * (modelos, emblemas, logotipos, o incluso elementos accidentales de la página como un
 * personaje promocional) que activan el safety system de OpenAI (error.code: "safety"). En
 * Studio no hay paso de visión sobre la landing —el prompt sale de metadata.clientName y del
 * brief que escribe la persona—, pero ese texto es igual de libre y puede contener las mismas
 * categorías de contenido problemático, así que el mismo saneado aplica.
 */

// Palabras/conceptos que activan safety system cuando se asocian a marca real (BMW fue el caso
// que los originó — parrilla/emblema/matrícula son genéricos de automoción, no exclusivos de esa
// marca, así que se mantienen tal cual para cualquier marca del sector).
const BRAND_TRIGGERS: RegExp[] = [
  /bmw\s*kidney\s*grill/i, /bmw\s*grille/i, /roundel/i,
  /kidney\s*grill/i, /double\s*kidney/i,
  /logo\s+bmw/i, /bmw\s+logo/i, /emblem/i, /insignia/i,
  /modelo\s+x\d/i, /x\d\s+bmw/i, /m\s+\d+/i,
  /license\s*plate/i, /matr[íi]cula/i,
  /brand\s+badge/i, /brand\s+emblem/i,
];

/**
 * Sanitiza un texto (descripción visual de landing, o cualquier otro texto libre) para que el
 * prompt final no active el safety system de OpenAI. Transforma referencias literales a una
 * marca/página real, personajes con copyright, contacto/precios y URLs en dirección de arte
 * genérica segura.
 */
export function sanitizeLandingPrompt(desc: string, brandName: string): string {
  let sanitized = desc;
  for (const re of BRAND_TRIGGERS) {
    sanitized = sanitized.replace(re, '[automotive design element]');
  }

  // Reemplazar el nombre de la marca por descripción genérica si aparece
  // en contexto identificable (evita "bmw" suelto, pero no "color azul BMW" genérico)
  if (brandName) {
    const brandPattern = new RegExp(`\\b${brandName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
    sanitized = sanitized.replace(brandPattern, 'the brand');
  }

  // Limpiar referencias a modelos concretos (X1, X3, M4, Serie 1, Serie 3...)
  sanitized = sanitized.replace(/\b(serie\s+\d|x\d|m\d+|i\d+|z\d+)\b/gi, '[model]');

  // Eliminar URLs, textos literales, números de teléfono, precios
  sanitized = sanitized.replace(/https?:\/\/[^\s]+/g, '');
  sanitized = sanitized.replace(/\b\d{3,4}\s*\d{3,4}\s*\d{3,4}\b/g, '[contact]');
  sanitized = sanitized.replace(/\b\d+[.,]\d{2}\s*[€$]/g, '[price]');

  // Reemplazar "the brand's own page" o similar
  sanitized = sanitized.replace(/from\s+the\s+brand'?s?\s*own\s+page/gi, 'art direction reference');
  sanitized = sanitized.replace(/the\s+brand'?s?\s*website/gi, 'reference material');

  // STRIP: personajes/personas con copyright — superheroes, figuras, personajes de cómic/película
  sanitized = sanitized.replace(/\bsuperhero\b/gi, '');
  sanitized = sanitized.replace(/\bsuper[- ]?hero(es)?\b/gi, '');
  sanitized = sanitized.replace(/\bcostumed\s+figure\b/gi, '');
  sanitized = sanitized.replace(/\bcostumed\s+character\b/gi, '');
  sanitized = sanitized.replace(/\bcomic[- ]?book\s+(character|figure|hero)\b/gi, '');
  sanitized = sanitized.replace(/\bcinematic\s+(superhero|character|figure)\b/gi, '');
  sanitized = sanitized.replace(/\bairborne\s+figure\b/gi, '');
  sanitized = sanitized.replace(/\bsuspended\s+(dynamically|overhead|in\s+mid[- ]?air)\b/gi, '');
  sanitized = sanitized.replace(/\bhero\s+(composite|shot|scene|image)\b/gi, 'featured imagery');
  sanitized = sanitized.replace(/\bmotion\s+blur\s+creating\s+(speed|impact|drama)\b/gi, 'motion blur');
  sanitized = sanitized.replace(/\bpromotional\s+character\s+colors\b/gi, 'brand accent colors');
  sanitized = sanitized.replace(/\bcookie[- ]?consent\s+(panel|banner|overlay)\b/gi, 'ui overlay');
  sanitized = sanitized.replace(/\belectric[- ]?blue\s+primary\s+action\b/gi, 'brand primary action');
  sanitized = sanitized.replace(/\bradial\s+motion\s+blur\b/gi, 'motion blur');
  sanitized = sanitized.replace(/\bvivid\s+red\s+accents\b/gi, 'accent colors');

  // Comprimir espacios dobles tras eliminaciones
  sanitized = sanitized.replace(/\s{2,}/g, ' ');

  return sanitized.trim();
}
