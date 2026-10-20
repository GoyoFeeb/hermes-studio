/**
 * artJudge.ts — lo que la revisión de dirección de arte necesita para juzgar bien (2026-10-16, auditoría de calidad).
 *
 * Lo que fallaba (39 piezas del 08 al 16-10):
 * - Volver a puntuar la misma pieza movía la nota hasta ±4/50 (Novo Resort: identidad y texto_imagen 5 → 4 con las
 *   mismas fotos), y con dos notas sueltas se decidía si la pasada de mejora se quedaba: se quedó en 13 de 39.
 * - La revisión leía el prompt cortado a 3.500 caracteres: en 22 de 24 prompts eso era el rol y la investigación, no
 *   el concepto ni las escenas.
 * - Juzgaba a ojo el tamaño de la letra en una hoja reducida (pedía «más grande» con 15-16 px reales).
 *
 * Aquí: el resumen del brief (briefDigest), las medidas de Studio (judgeFacts) y la comparación antes/después
 * (artCompareQuery, parseArtCompare, compareVerdict), que sustituye a las dos notas sueltas para decidir.
 */
import type { RenderReport } from './renderChecks';
import { COMPARE_BAG_ALIASES, REASON_ALIASES, aliasesFor, asRecord, field, normalizeKey } from './artParse';
import { jsonObjects, redactedSnippet } from './looseJson';

/** Lo que la revisión puede leer del brief o del prompt. */
export const BRIEF_DIGEST_MAX = 3500;

/** Una sección «## N. Título» del brief de Studio (buildBriefPrompt), sin el título. Lo que vaya en la misma línea
 *  tras una raya («## 1. Concepto — la frase») cuenta como contenido. */
function section(brief: string, n: number): string {
  const m = brief.match(new RegExp(`^##\\s*${n}\\.[^\\n—]*(?:—([^\\n]*))?\\n([\\s\\S]*?)(?=^##\\s*\\d+\\.|$(?![\\s\\S]))`, 'm'));
  return m ? `${(m[1] || '').trim()}\n${m[2]}`.trim() : '';
}

/** Resumen para la revisión: concepto, oferta, asunto y escenas del brief de Studio. Sin ese brief (prompt pegado),
 *  los primeros 3.500 caracteres, como hasta ahora. */
export function briefDigest(prompt: string): string {
  const brief = prompt.split('## Instrucciones de entrega')[0].trim();
  const concept = section(brief, 1);
  const scenes = section(brief, 5);
  if (!concept || !scenes) return brief.slice(0, BRIEF_DIGEST_MAX);
  const offer = section(brief, 3).split('\n').find((l) => /^\W*oferta\s*:/i.test(l))?.trim();
  const subject = section(brief, 4);
  const title = brief.match(/^#\s+[^\n]+/m)?.[0] || '';
  const parts = [
    title,
    `Concepto: ${concept}`,
    ...(offer ? [offer.replace(/^\W*/, '')] : []),
    ...(subject ? [`Asunto y preheader: ${subject}`] : []),
    `Escenas:\n${scenes}`,
  ];
  return parts.join('\n\n').slice(0, BRIEF_DIGEST_MAX);
}

/** Medidas de Studio que la revisión no debe juzgar a ojo (las imágenes van reducidas). */
export function judgeFacts(render: Pick<RenderReport, 'fonts' | 'mobile' | 'design' | 'dark'> | null): string[] {
  if (!render) return [];
  const px = (n: number | null): string => (n == null ? 'sin texto corrido' : `${n} px`);
  const f = render.fonts;
  const contrast = [...render.design.errors, ...render.design.warnings].filter((l) => /contraste/i.test(l));
  const dark = render.dark ? [...render.dark.errors, ...render.dark.warnings] : [];
  return [
    `Letra del texto corrido a 600 px: mínima ${px(f.desktop.bodyMin)}, habitual ${px(f.desktop.bodyTypical)}; pie ${px(f.desktop.footerMin)}.`,
    `Letra del texto corrido a 375 px: mínima ${px(f.mobile.bodyMin)}, habitual ${px(f.mobile.bodyTypical)}; pie ${px(f.mobile.footerMin)}.`,
    render.mobile ? `A 375 px: ${render.mobile}` : 'A 375 px nada se sale del ancho.',
    contrast.length ? `Contraste en claro: ${contrast.slice(0, 3).join(' ')}` : 'Contraste en claro: todo el texto pasa 4,5:1 (3:1 en titulares grandes).',
    dark.length ? `Modo oscuro: ${dark.slice(0, 3).join(' ')}` : 'Modo oscuro: todo el texto se lee.',
  ];
}

/** Regla que acompaña a las medidas en las preguntas de la revisión. */
export const FACTS_RULE =
  'Estas medidas son de Studio y mandan: el tamaño de la letra, el contraste y si algo se sale NO los juzgues por las ' +
  'imágenes (van reducidas).';

// --- Comparación antes / después -----------------------------------------------------------------------------------

export type Pick3 = 'A' | 'B' | 'igual';
export interface ArtCompare {
  /** Por criterio, cuál de las dos versiones (A o B, como se enseñaron) es mejor. */
  criterios: Record<string, Pick3>;
  razones: Record<string, string>;
}

export interface CompareImage {
  path: string;
  width: number;
  height: number;
}

export const COMPARE_VISION_QUESTION =
  'Son dos versiones (A a la izquierda, B a la derecha) de la misma newsletter. Describe TODAS las diferencias que ' +
  'veas entre A y B, de arriba abajo: textos, tamaños, espacios, fotos, orden, colores y botones. Si no ves ninguna, ' +
  'dilo. Para cada diferencia, ¿cuál de las dos se lee mejor y tiene más calidad de diseño?';

export function artCompareQuery(
  criteria: Record<string, string>,
  images: { desktop: CompareImage; mobile: CompareImage },
  digest: string,
  textA: string,
  textB: string,
  request?: string,
  facts: { a: string[]; b: string[] } = { a: [], b: [] }
): string {
  const region = (i: CompareImage): string => ` y region [0, 0, ${i.width}, ${i.height}] (la imagen entera)`;
  return [
    'Eres director de arte. Tienes dos versiones de la misma newsletter, A y B: B puede ser una versión retocada de A o ser',
    'idéntica. Vas a decir, criterio por criterio, cuál es mejor. Pasos, sin nada más:',
    `1. Llama a vision_analyze con image_url ${images.desktop.path}${region(images.desktop)} y esta pregunta: «${COMPARE_VISION_QUESTION}»`,
    `2. Llama a vision_analyze con image_url ${images.mobile.path}${region(images.mobile)} y la misma pregunta (es la versión móvil, 375 px).`,
    '   Si una llamada devuelve un error, reintenta UNA vez corrigiendo los parámetros que indique el error.',
    '3. Con lo que te devuelvan, responde SOLO con un JSON, sin texto antes ni después. No uses ninguna otra herramienta.',
    'Si vision_analyze no puede ver las imágenes, responde exactamente {"sin_imagen": true}.',
    '',
    ...(request ? [`Petición original del equipo: «${request}».`] : []),
    `Texto visible de A: «${textA.slice(0, 2000)}»`,
    `Texto visible de B: «${textB.slice(0, 2000)}»`,
    ...(facts.a.length || facts.b.length ? ['', 'Medidas de Studio de A:', ...facts.a.map((l) => `- ${l}`), 'Medidas de Studio de B:', ...facts.b.map((l) => `- ${l}`), FACTS_RULE] : []),
    '',
    'Brief (resumen):',
    digest,
    '',
    'Criterios (qué mirar en cada uno):',
    ...Object.entries(criteria).map(([k, v]) => `- ${k}: ${v}`),
    '',
    'Cómo decidir: «igual» si en ese criterio no ves una diferencia clara o si las dos versiones son idénticas; A o B solo si',
    'puedes señalar qué cambia y dónde. Que una versión sea distinta no la hace mejor. Si dudas, «igual».',
    'Formato exacto: {"criterios": {"peticion": "igual", "texto_imagen": "B", ...todos los criterios}, "razones": {"texto_imagen": ' +
      '"qué cambia y dónde", ...solo los que no sean igual}}',
    'Esquema JSON obligatorio (claves exactas; cada valor es "A", "B" o "igual", no un número):',
    artCompareSchema(Object.keys(criteria)),
  ].join('\n');
}

/** El JSON que tiene que devolver la comparación. */
export function artCompareSchema(criteria: string[]): string {
  const criterios = Object.fromEntries(criteria.map((k) => [k, 'igual']));
  return JSON.stringify({ criterios, razones: { [criteria[0] || 'criterio']: 'qué cambia y dónde' } });
}

/** Segundo intento, sin herramientas, cuando la comparación no era JSON legible. */
export function artCompareRepairPrompt(bad: string, criteria: string[], secrets: string[] = []): string {
  return [
    'Tu respuesta anterior no se pudo leer como JSON con todos los criterios. No llames a ninguna herramienta.',
    'Responde SOLO con un JSON válido, sin markdown y sin texto antes ni después, que cumpla este esquema:',
    artCompareSchema(criteria),
    'Cada valor de "criterios" es "A", "B" o "igual". "razones" solo en los que no sean "igual".',
    'Si no viste las imágenes, responde exactamente {"sin_imagen": true}.',
    '',
    'Respuesta anterior, recortada:',
    redactedSnippet(bad, secrets, 4000),
  ].join('\n');
}

function pickValue(value: unknown): Pick3 | null {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    const row = value as Record<string, unknown>;
    return pickValue(row.pick ?? row.valor ?? row.value ?? row.winner ?? row.gana);
  }
  const text = String(value ?? '').trim().toLowerCase();
  const head = text.match(/^(a|b|igual(?:es)?|empate|equal|tie|same|draw|versi[oó]n a|versi[oó]n b)\b/);
  if (!head) return null;
  if (head[1] === 'a' || head[1] === 'versión a' || head[1] === 'version a') return 'A';
  if (head[1] === 'b' || head[1] === 'versión b' || head[1] === 'version b') return 'B';
  return 'igual';
}

function compareFromRecord(raw: Record<string, unknown>, criteria: string[]): ArtCompare | null {
  const bag = asRecord(field(raw, COMPARE_BAG_ALIASES)) || raw;
  const criterios: Record<string, Pick3> = {};
  const fromValues: Record<string, string> = {};
  for (const k of criteria) {
    const value = field(bag, aliasesFor(k));
    const pick = pickValue(value);
    if (!pick) return null;
    criterios[k] = pick;
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      const reason = (value as Record<string, unknown>).reason ?? (value as Record<string, unknown>).razon ?? (value as Record<string, unknown>).porque;
      if (typeof reason === 'string' && reason.trim()) fromValues[k] = reason.trim().slice(0, 300);
    }
  }
  const reasonsRaw = asRecord(field(raw, REASON_ALIASES)) || {};
  const razones: Record<string, string> = { ...fromValues };
  for (const k of criteria) {
    const reason = field(reasonsRaw, aliasesFor(k));
    if (typeof reason === 'string' && reason.trim()) razones[k] = reason.trim().slice(0, 300);
  }
  for (const [key, value] of Object.entries(reasonsRaw)) {
    if (typeof value === 'string' && value.trim() && !razones[key]) razones[key] = value.trim().slice(0, 300);
  }
  return { criterios, razones };
}

function compareFromMarkdown(text: string, criteria: string[]): ArtCompare | null {
  const flat = text.replace(/```(?:json|javascript|js|markdown|md|text)?[^\n]*\r?\n([\s\S]*?)```/gi, '\n$1\n');
  const canonOf = new Map<string, string>();
  for (const canon of criteria) for (const alias of aliasesFor(canon)) canonOf.set(normalizeKey(alias), canon);
  const criterios: Record<string, Pick3> = {};
  const razones: Record<string, string> = {};
  for (const raw of flat.split('\n')) {
    const row = raw.replace(/\*\*/g, '').replace(/`/g, '').trim().replace(/^[-*+|]\s*/, '');
    const heading = row.match(/^#{1,4}\s+(.+)$/);
    const body = heading ? heading[1] : row;
    const split = body.match(/^([^:]{1,48}?)\s*[:|]\s*(.+)$/);
    if (!split) continue;
    const canon = canonOf.get(normalizeKey(split[1]));
    if (!canon || criterios[canon]) continue;
    const pick = pickValue(split[2]);
    if (!pick) continue;
    criterios[canon] = pick;
    const reason = split[2].replace(/^(a|b|igual|iguales|empate|equal|tie|same|draw|versi[oó]n a|versi[oó]n b)\b\s*[—–:-]?\s*/i, '').trim();
    if (reason && normalizeKey(reason) !== normalizeKey(split[2])) razones[canon] = reason.slice(0, 300);
  }
  if (criteria.some((k) => !criterios[k])) return null;
  return { criterios, razones };
}

/** La comparación; null si falta algún criterio o un valor no es A, B o igual. Tolera vallas, prosa y claves en inglés. */
export function parseArtCompare(output: string, criteria: string[]): ArtCompare | null {
  if (!output?.trim() || !criteria.length) return null;
  const objects = jsonObjects(output);
  for (let i = objects.length - 1; i >= 0; i--) {
    const raw = asRecord(objects[i]);
    if (!raw || raw.sin_imagen === true || raw.no_image === true) continue;
    const parsed = compareFromRecord(raw, criteria);
    if (parsed) return parsed;
  }
  return compareFromMarkdown(output, criteria);
}

/** Criterios que la mejora no puede empeorar aunque gane en otros: lo que rompe la lectura. */
export const COMPARE_GUARD = ['movil', 'oscuro'];

export interface CompareVerdict {
  keep: boolean;
  /** Criterios en los que gana la versión mejorada / la anterior. */
  wins: string[];
  losses: string[];
  reason: string;
}

/** ¿Se queda la mejora? Gana en más criterios de los que pierde y no pierde en móvil ni en oscuro. `afterIs` dice si la
 *  versión mejorada se enseñó como A o como B (el orden se sortea). Empate = se queda la anterior. */
export function compareVerdict(cmp: ArtCompare, afterIs: 'A' | 'B'): CompareVerdict {
  const beforeIs = afterIs === 'A' ? 'B' : 'A';
  const wins = Object.keys(cmp.criterios).filter((k) => cmp.criterios[k] === afterIs);
  const losses = Object.keys(cmp.criterios).filter((k) => cmp.criterios[k] === beforeIs);
  const guarded = losses.filter((k) => COMPARE_GUARD.includes(k));
  const keep = wins.length > losses.length && !guarded.length;
  const list = (l: string[]): string => l.join(', ');
  const reason = keep
    ? `se queda: la comparación la prefiere en ${list(wins)}${losses.length ? ` (pierde en ${list(losses)})` : ''}`
    : guarded.length
    ? `se descarta: pierde en ${list(guarded)}${wins.length ? ` aunque gana en ${list(wins)}` : ''}`
    : !wins.length && !losses.length
    ? 'se descarta: la comparación no ve diferencias que mejoren la pieza'
    : `se descarta: la comparación prefiere la anterior (gana en ${list(wins) || 'nada'}, pierde en ${list(losses) || 'nada'})`;
  return { keep, wins, losses, reason };
}

/** Dos comparaciones con el orden cambiado (2026-10-16): la mejora se queda solo si las dos la prefieren. Con una sola, el
 *  veredicto cambiaba con el orden en 8 de 20 parejas (la versión de la derecha ganaba más). */
export function doubleVerdict(first: CompareVerdict, second: CompareVerdict): { keep: boolean; reason: string } {
  const side = (v: CompareVerdict, i: number): string => `${i ? 'segunda' : 'primera'}: +${v.wins.length}/−${v.losses.length}`;
  if (first.keep && second.keep) {
    const wins = first.wins.filter((k) => second.wins.includes(k));
    return { keep: true, reason: `se queda: las dos comparaciones la prefieren${wins.length ? ` (en las dos gana en ${wins.join(', ')})` : ''}` };
  }
  if (!first.keep && !second.keep) return { keep: false, reason: `se descarta: ninguna de las dos comparaciones la prefiere (${side(first, 0)}; ${side(second, 1)})` };
  return { keep: false, reason: `se descarta: las dos comparaciones no coinciden (${side(first, 0)}; ${side(second, 1)})` };
}
