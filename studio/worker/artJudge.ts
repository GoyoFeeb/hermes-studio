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
  ].join('\n');
}

/** El JSON de la comparación; null si falta algún criterio o un valor no es A, B o igual. */
export function parseArtCompare(output: string, criteria: string[]): ArtCompare | null {
  const start = output.indexOf('{');
  const end = output.lastIndexOf('}');
  if (start < 0 || end <= start) return null;
  try {
    const raw = JSON.parse(output.slice(start, end + 1)) as { criterios?: Record<string, unknown>; razones?: Record<string, unknown> };
    const criterios: Record<string, Pick3> = {};
    for (const k of criteria) {
      const v = String(raw.criterios?.[k] ?? '').trim().toLowerCase();
      if (v === 'a') criterios[k] = 'A';
      else if (v === 'b') criterios[k] = 'B';
      else if (v === 'igual' || v === 'iguales' || v === 'empate') criterios[k] = 'igual';
      else return null;
    }
    const razones: Record<string, string> = {};
    for (const [k, v] of Object.entries(raw.razones || {})) if (typeof v === 'string' && v.trim()) razones[k] = v.trim().slice(0, 300);
    return { criterios, razones };
  } catch {
    return null;
  }
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
