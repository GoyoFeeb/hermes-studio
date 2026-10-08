/**
 * requestCoverage.ts — lo que pide la petición del equipo tiene que llegar al brief y a la pieza (2026-10-05).
 *
 * Paredes (muvklec9): la petición era «newsletter de las zapatillas de Paredes, de pre-black friday (escrito
 * «npre-black frisay») y para un público joven». El brief y la pieza se olvidaron del Black Friday y todos los
 * checks salieron limpios, porque solo miraban lo técnico. Aquí se detectan en la petición las cosas que no pueden
 * perderse (ocasión de compra, oferta, público), tolerando erratas, y se comprueba si el brief o el texto visible
 * de la pieza las nombran. Lo usan el worker (rehace el brief una vez; error en la comprobación de la pieza) y
 * Studio (aviso en el panel de revisión del brief).
 */

export type RequestTermKind = 'occasion' | 'offer' | 'audience';

export interface RequestTerm {
  id: string;
  /** Cómo se le dice al equipo y a Hermes («Black Friday»). */
  label: string;
  kind: RequestTermKind;
}

interface TermDef extends RequestTerm {
  /** Secuencias de palabras (ya normalizadas) que lo delatan en la petición; se toleran erratas en las largas. */
  request: string[][];
  /** Cómo se reconoce en el brief o la pieza (texto normalizado, sin tildes). */
  found: RegExp;
}

const TERMS: TermDef[] = [
  {
    id: 'black-friday',
    label: 'Black Friday',
    kind: 'occasion',
    request: [['black', 'friday'], ['blackfriday'], ['black', 'week']],
    found: /\bblack ?(friday|week)\b/,
  },
  { id: 'cyber-monday', label: 'Cyber Monday', kind: 'occasion', request: [['cyber', 'monday'], ['cybermonday']], found: /\bcyber ?monday\b/ },
  { id: 'navidad', label: 'Navidad', kind: 'occasion', request: [['navidad'], ['navidades'], ['navideno'], ['navidena'], ['christmas']], found: /\bnavid|\bchristmas\b/ },
  { id: 'reyes', label: 'Reyes', kind: 'occasion', request: [['reyes', 'magos'], ['dia', 'de', 'reyes']], found: /\breyes\b/ },
  { id: 'rebajas', label: 'rebajas', kind: 'occasion', request: [['rebajas'], ['sales']], found: /\brebaj|\bsales\b/ },
  { id: 'san-valentin', label: 'San Valentín', kind: 'occasion', request: [['san', 'valentin'], ['valentines']], found: /\bvalent/ },
  { id: 'dia-madre', label: 'Día de la Madre', kind: 'occasion', request: [['dia', 'de', 'la', 'madre']], found: /\bdia de la madre\b|\bmama\b|\bmadre\b/ },
  { id: 'dia-padre', label: 'Día del Padre', kind: 'occasion', request: [['dia', 'del', 'padre']], found: /\bdia del padre\b|\bpapa\b|\bpadre\b/ },
  { id: 'vuelta-cole', label: 'vuelta al cole', kind: 'occasion', request: [['vuelta', 'al', 'cole'], ['vuelta', 'al', 'colegio']], found: /\bvuelta al cole/ },
  { id: 'halloween', label: 'Halloween', kind: 'occasion', request: [['halloween']], found: /\bhalloween\b/ },
  { id: 'singles-day', label: 'Singles Day', kind: 'occasion', request: [['singles', 'day']], found: /\bsingles day\b|\b11\.11\b/ },
  { id: 'prime-day', label: 'Prime Day', kind: 'occasion', request: [['prime', 'day']], found: /\bprime day\b/ },
  {
    id: 'oferta',
    label: 'una oferta o descuento',
    kind: 'offer',
    request: [['descuento'], ['descuentos'], ['oferta'], ['ofertas'], ['promocion'], ['promo'], ['codigo', 'promocional'], ['rebaja']],
    found: /\bdescuento|\boferta|\bpromo|\brebaj|\d+ ?%|-\d+ ?%|\bprecio|\d+[.,]\d{2} ?€|€/,
  },
  {
    id: 'joven',
    label: 'público joven',
    kind: 'audience',
    request: [['joven'], ['jovenes'], ['juvenil'], ['gen', 'z'], ['generacion', 'z'], ['adolescentes'], ['millennials']],
    found: /\bjoven|\bjuvenil|\bgen(eracion)? z\b|\badolescen|\bmillennial|\b(18|20|25)[- ]?(a|-) ?(25|30|35)\b/,
  },
];

export function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9%€.,]+/g, ' ')
    .trim();
}

/** Distancia de edición (para «frisay» → «friday»). */
function distance(a: string, b: string): number {
  const row = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let prev = row[0];
    row[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const tmp = row[j];
      row[j] = Math.min(row[j] + 1, row[j - 1] + 1, prev + (a[i - 1] === b[j - 1] ? 0 : 1));
      prev = tmp;
    }
  }
  return row[b.length];
}

/** Una palabra de la petición vale por la esperada si coincide, o con erratas si es larga. «npre» (de
 *  «npre-black») no importa: se busca la secuencia de palabras en cualquier posición. */
function wordMatches(word: string, want: string): boolean {
  if (word === want) return true;
  // Desde 6 letras (2026-10-08): con 5, «saltes» valía por «sales» (rebajas) y «No saltes ninguno» pedía una oferta.
  if (want.length >= 6) return distance(word, want) <= (want.length >= 8 ? 2 : 1);
  return false;
}

/** Lo que la petición pide y no puede perderse. */
export function requestTerms(request: string): RequestTerm[] {
  const words = normalize(request).replace(/[%€.,]/g, ' ').split(/\s+/).filter(Boolean);
  const out: RequestTerm[] = [];
  for (const t of TERMS) {
    const hit = t.request.some((seq) => words.some((_, i) => seq.every((w, k) => i + k < words.length && wordMatches(words[i + k], w))));
    if (hit) out.push({ id: t.id, label: t.label, kind: t.kind });
  }
  return out;
}

function missing(request: string, text: string, kinds: RequestTermKind[]): RequestTerm[] {
  const norm = normalize(text);
  return requestTerms(request).filter((t) => kinds.includes(t.kind) && !TERMS.find((d) => d.id === t.id)!.found.test(norm));
}

/** Lo que pide la petición y el brief no nombra (ocasión, oferta y público). */
export function missingInBrief(request: string, brief: string): RequestTerm[] {
  return missing(request, brief, ['occasion', 'offer', 'audience']);
}

/** Lo que pide la petición y la pieza no nombra en su texto visible. El público no se dice en la pieza: se nota en
 *  el tono, que no se puede medir así. */
export function missingInPiece(request: string, visibleText: string): RequestTerm[] {
  return missing(request, visibleText, ['occasion', 'offer']);
}

/** Frase para Hermes o para el equipo: «Black Friday y público joven». */
export function joinLabels(terms: RequestTerm[]): string {
  const labels = terms.map((t) => t.label);
  return labels.length <= 1 ? labels.join('') : `${labels.slice(0, -1).join(', ')} y ${labels[labels.length - 1]}`;
}

// ---------------------------------------------------------------- la oferta con su cifra (Q1, 2026-10-07)
// «Petición» era el criterio de arte más flojo tras «texto e imagen»: Lacoste (06-10) pedía rebajas y la pieza decía
// «rebajas» sin ningún % ni precio, aunque el precio (100 € → 50 €) estaba en sus notas. La comprobación de arriba
// daba por buena la palabra «rebajas».

/** Ocasiones que son, en sí mismas, una oferta. */
const OFFER_OCCASIONS = new Set(['rebajas', 'black-friday', 'cyber-monday', 'singles-day', 'prime-day']);

/** ¿La petición (o el prompt) pide una oferta? */
export function asksForOffer(text: string): boolean {
  return requestTerms(text).some((t) => t.kind === 'offer' || OFFER_OCCASIONS.has(t.id));
}

/** Cifras de oferta en lo verificado: un descuento («-30 %», «hasta 50 %», «30 % de descuento») o un precio en euros. Un
 *  porcentaje suelto no cuenta («100 % algodón» no es una oferta). */
const VERIFIED_FIGURE =
  /(?:-|hasta (?:un |el )?)\d{1,2} ?%|\d{1,2} ?% (?:de )?(?:dto|descuento|menos|off|rebaja)|\d{1,5}(?:[.,]\d{1,2})? ?(?:€|eur\b|euros\b)|€ ?\d{1,5}(?:[.,]\d{1,2})?/gi;
/** En la pieza basta con que se vea un % o un precio. */
const PIECE_FIGURE = /\d{1,3} ?%|\d{1,5}(?:[.,]\d{1,2})? ?(?:€|eur\b|euros\b)|€ ?\d{1,5}(?:[.,]\d{1,2})?/i;

/** Las cifras de oferta de lo verificado (como mucho 5, sin repetir). */
export function offerFigures(text: string): string[] {
  return [...new Set((text.match(VERIFIED_FIGURE) || []).map((f) => f.replace(/\s+/g, ' ').trim()))].slice(0, 5);
}

/** ¿La pieza muestra algún % o precio? */
export function pieceShowsFigure(text: string): boolean {
  return PIECE_FIGURE.test(text.replace(/&nbsp;|\u00a0/g, ' '));
}
