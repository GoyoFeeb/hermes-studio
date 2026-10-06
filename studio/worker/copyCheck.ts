/**
 * copyCheck.ts — copy genérico de email marketing (2026-10-06, punto 4 de la auditoría de calidad).
 *
 * En las 12 últimas piezas casi todas llevaban «descubre/descubrir» y Adeslas acumulaba 7 muletillas («en tu día a
 * día», «explora», «Empieza por lo que encaja contigo»). Una sola lista sirve para todo: el brief y el encargo la
 * citan, la autocrítica del brief la usa, el control de Studio avisa (nunca error: el juicio fino es de la revisión de
 * dirección de arte) y la revisión recibe lo detectado para reescribirlo en la pasada de mejora.
 */

/** Muletillas en titulares y texto (no en botones: esos van en GENERIC_CTA). */
export const GENERIC_PHRASES: { re: RegExp; label: string }[] = [
  { re: /\bdescubr(?:e|ir|elo|ela|elos|elas|en|as|irás)\b/i, label: 'descubre' },
  { re: /\bexplor(?:a|ar|en|es)\b/i, label: 'explora' },
  { re: /\bno te (?:lo|la|los|las) pierdas\b/i, label: 'no te lo pierdas' },
  { re: /\beleva(?:r|rá)? (?:tu|tus|su)\b/i, label: 'eleva tu…' },
  { re: /\btu mejor versi[oó]n\b/i, label: 'tu mejor versión' },
  { re: /\blo tiene todo\b/i, label: 'lo tiene todo' },
  { re: /\ben tu d[ií]a a d[ií]a\b/i, label: 'en tu día a día' },
  { re: /\bencaja(?:n)? contigo\b/i, label: 'encaja contigo' },
  { re: /\bdise[ñn]ad[oa]s? (?:para|pensando en) ti\b/i, label: 'diseñado para ti' },
  { re: /\btodo lo que necesitas\b/i, label: 'todo lo que necesitas' },
  { re: /\bla combinaci[oó]n perfecta\b/i, label: 'la combinación perfecta' },
  { re: /\b(?:para|en) cualquier ocasi[oó]n\b/i, label: 'para cualquier ocasión' },
  { re: /\bmarca(?:r)? la diferencia\b/i, label: 'marca la diferencia' },
  { re: /\bda(?:r)? un paso m[aá]s\b/i, label: 'da un paso más' },
  { re: /\ba otro nivel\b/i, label: 'a otro nivel' },
  { re: /\bsin renunciar a\b/i, label: 'sin renunciar a' },
  { re: /\bd[eé]jate (?:sorprender|llevar|seducir)\b/i, label: 'déjate sorprender' },
  { re: /\bsum[eé]rgete\b/i, label: 'sumérgete' },
  { re: /\bvive la experiencia\b/i, label: 'vive la experiencia' },
  { re: /\btu (?:mejor )?aliad[oa]\b/i, label: 'tu aliado' },
  { re: /\bno busques m[aá]s\b/i, label: 'no busques más' },
  { re: /\bhaz que cada momento cuente\b/i, label: 'haz que cada momento cuente' },
  { re: /\bexperiencia (?:[úu]nica|inolvidable)\b/i, label: 'experiencia única' },
  { re: /\bcomo nunca antes\b/i, label: 'como nunca antes' },
  { re: /\b(?:est[aá]s|estáis) list[oa]s? para\b/i, label: '¿estás listo para…?' },
];

/** Botones que no dicen qué pasa al pulsarlos. */
export const GENERIC_CTA = /^(?:descubr(?:e|ir)(?: m[aá]s)?|saber m[aá]s|s[aá]be(?:lo)? m[aá]s|m[aá]s informaci[oó]n|ver m[aá]s|haz clic aqu[ií]|pulsa aqu[ií]|clic aqu[ií]|leer m[aá]s|ver ahora|empieza ya)[.!→›»\s]*$/i;

/** Las muletillas, para citarlas en los encargos. */
export const GENERIC_PHRASES_LIST = GENERIC_PHRASES.map((p) => `«${p.label}»`).join(', ');

/** Reglas de copy del brief y del encargo de la pieza. */
export const COPY_RULES = [
  '- Copy (Studio lo revisa): cada titular nombra algo concreto (el producto, un beneficio que se pueda comprobar o la',
  '  ocasión) y suena a esta marca: usa el tono de voz de su brand pack o de su web, no el de una plantilla. Los botones',
  '  dicen qué pasa al pulsarlos, verbo + objeto («Calcula tu precio», «Elige tu talla»), nunca «Descubre más», «Saber',
  `  más» ni «Ver más». Sin muletillas de email marketing: ${GENERIC_PHRASES_LIST}.`,
];

const strip = (html: string): string =>
  html
    .replace(/<head[\s\S]*?<\/head>|<style[\s\S]*?<\/style>|<!--[\s\S]*?-->/gi, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&');

const textOf = (fragment: string): string =>
  fragment
    .replace(/<[^>]+>/g, ' ')
    .replace(/&#?[a-z0-9]+;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();

export interface CopyFindings {
  warnings: string[];
  /** Lo detectado, en corto, para pasárselo a la revisión de dirección de arte. */
  found: string[];
}

export function copyFindings(html: string): CopyFindings {
  const clean = strip(html);
  const anchors = [...clean.matchAll(/<a\b[^>]*>([\s\S]*?)<\/a>/gi)].map((m) => textOf(m[1])).filter(Boolean);
  // Texto sin enlaces ni botones (el VML de Outlook repite el texto del botón).
  const body = textOf(clean.replace(/<a\b[^>]*>[\s\S]*?<\/a>/gi, ' ').replace(/<v:[a-z]+\b[\s\S]*?<\/v:[a-z]+>/gi, ' '));
  const warnings: string[] = [];
  const found: string[] = [];
  for (const { re, label } of GENERIC_PHRASES) {
    const m = body.match(re);
    if (!m) continue;
    const i = m.index || 0;
    const ctx = body.slice(Math.max(0, i - 40), i + m[0].length + 40).trim();
    warnings.push(`Muletilla «${label}»: …${ctx}… — reescríbelo con algo concreto que solo diría esta marca.`);
    found.push(`«${m[0]}» en «…${ctx}…»`);
  }
  for (const cta of [...new Set(anchors)]) {
    if (cta.length > 40 || !GENERIC_CTA.test(cta)) continue;
    warnings.push(`Botón genérico «${cta}»: di qué pasa al pulsarlo, verbo + objeto (p. ej. «Calcula tu precio»).`);
    found.push(`botón «${cta}»`);
  }
  return { warnings, found };
}
