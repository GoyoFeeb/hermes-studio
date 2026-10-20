/**
 * selfAudit.ts — la autoauditoría tiene que acabar en `notas.md` (2026-10-20).
 *
 * DeepSeek V4 Flash (chat_completions, provider custom:nous-api, Hermes Agent 0.22.2) cierra el
 * turno con el markdown en el mensaje y a menudo no llama a write_file. El worker solo miraba el
 * disco, así que una autoauditoría completa en stdout se perdía. El encargo nombra la ruta exacta
 * y esta plantilla; si el archivo no aparece, se recupera de marcadores o de una valla.
 */
import * as fs from 'fs';
import * as path from 'path';

export const NOTES_BEGIN = '<<<NOTAS>>>';
export const NOTES_END = '<<<FIN NOTAS>>>';

/** Plantilla de una newsletter nueva. Los títulos no se cambian: el respaldo los reconoce. */
export const NOTES_TEMPLATE = `# Autoauditoría

## 1. Concepto y titular
- Concepto: (una frase)
- Titular: (el titular principal de la pieza)
- Cómo deriva el titular del concepto: (si no deriva, corrige el titular en newsletter.html antes de entregar)

## 2. Fuentes
- (cada precio, cifra, nombre de modelo o dato técnico de la pieza, con su URL oficial; lo que no tenga fuente no puede estar en la pieza: quítalo o reescríbelo)

## 3. Imágenes
- (cada imagen: origen — URL oficial, brand pack o generada con IA —, la escena donde va y qué se ve en ella)

## 3b. Tipografía, colores y módulo
- Tipografía y origen: (web oficial o brand pack)
- Colores y origen: (cada color con su origen)
- Módulo propio del concepto:

## 4. Comprobaciones
- check-newsletter: (resultado y qué corregiste)
- Revisión de la hoja de render-newsletter: (qué corregiste)

## 5. Preguntas de autoauditoría
- (cada pregunta del prompt con su respuesta)
`;

export const MOBILE_NOTES_TEMPLATE = `# Notas

## Cambios
- (qué cambiaste para que la pieza quepa a 375 px, sin tocar textos, imágenes ni enlaces)

## Comprobaciones
- 375 px:
- 600 px:
- check-newsletter --retoque:
`;

export const REVISION_NOTES_TEMPLATE = `# Notas

## Cambios
- (qué cambiaste y dónde)

## Fuentes
- (la fuente de cada dato nuevo; si no la hay, no entra en la pieza)

## Imágenes
- (el origen de cada imagen nueva)

## No aplicado
- (lo que no pudiste aplicar y por qué)
`;

export type NotesKind = 'new' | 'revision' | 'mobile-fix';

export function notesTemplate(kind: NotesKind = 'new'): string {
  if (kind === 'mobile-fix') return MOBILE_NOTES_TEMPLATE;
  if (kind === 'revision') return REVISION_NOTES_TEMPLATE;
  return NOTES_TEMPLATE;
}

/** Ruta relativa a la raíz del repo, que es el cwd de `hermes chat` y de write_file. */
export function notesRel(outputDir: string): string {
  return `${outputDir.replace(/\\/g, '/').replace(/\/+$/, '')}/notas.md`;
}

/** Líneas del encargo: ruta exacta, plantilla exacta y la marca por si write_file no se ejecuta. */
export function notesFileRule(outputDir: string, template: string): string[] {
  const rel = notesRel(outputDir);
  return [
    `- Escribe el archivo exacto \`${rel}\` con write_file (ruta relativa a la raíz del repo; no otro nombre ni solo el chat).`,
    '  Rellena esta plantilla sin cambiar los títulos:',
    ...template.trimEnd().split('\n').map((line) => `  ${line}`),
    `  Si write_file no llega a ejecutarse, responde con el mismo markdown entre ${NOTES_BEGIN} y ${NOTES_END}.`,
  ];
}

/** Turno de recuperación cuando, terminada la pieza, `notas.md` no está en disco. */
export function selfAuditPrompt(outputDir: string, kind: NotesKind = 'new'): string {
  const rel = notesRel(outputDir);
  const template = notesTemplate(kind).trimEnd();
  return [
    `Falta el archivo exacto \`${rel}\`. Es obligatorio y tiene que existir en disco.`,
    `Escríbelo AHORA con write_file. La ruta tiene que ser exactamente \`${rel}\` (relativa a la raíz del repo).`,
    'No anuncies que lo vas a escribir: llama a write_file. No uses otra carpeta ni otro nombre.',
    'Rellena esta plantilla sin cambiar los títulos:',
    '',
    template,
    '',
    'Si la herramienta no llega a ejecutarse, la respuesta final tiene que ser solo el markdown relleno, entre estas marcas y sin texto fuera:',
    NOTES_BEGIN,
    template,
    NOTES_END,
    kind === 'new'
      ? 'Si algo de la plantilla no se cumple en la pieza, corrige newsletter.html antes y dilo en el apartado que corresponda.'
      : 'No rehagas la pieza: entrega el archivo de notas.',
  ].join('\n');
}

function cleanNotes(text: string): string {
  return text.replace(/^\s*session_id:.*$/gim, '').trim();
}

function looksLikeNotes(text: string): boolean {
  const body = text.trim();
  const headings = body.match(/^#{1,3}\s+\S.+$/gm) || [];
  if (headings.length < 2 || body.length < 40) return false;
  if (/<!doctype|<\s*html[\s>]/i.test(body)) return false;
  return /autoauditor|concepto|fuentes|im[aá]genes|comprobacion|cambios|titular|notas/i.test(body);
}

/**
 * Saca la autoauditoría del mensaje final de Hermes. Primero las marcas, luego la última valla
 * que parezca notas y, si no, el mensaje entero cuando ya trae los títulos.
 */
export function extractSelfAudit(output: string): string | null {
  if (!output?.trim()) return null;
  const marked = output.match(new RegExp(`${NOTES_BEGIN}[ \\t]*\\r?\\n?([\\s\\S]*?)\\r?\\n?${NOTES_END}`));
  if (marked) {
    const body = cleanNotes(marked[1]);
    if (looksLikeNotes(body)) return body;
  }
  const fences = [...output.matchAll(/```(?:markdown|md|notas|text)?[^\n]*\r?\n([\s\S]*?)```/gi)];
  for (let i = fences.length - 1; i >= 0; i--) {
    const body = cleanNotes(fences[i][1]);
    if (looksLikeNotes(body)) return body;
  }
  const whole = cleanNotes(output);
  // Sin marcas ni valla solo vale si el mensaje es la plantilla (el chat de DeepSeek suele ser otra cosa).
  if (looksLikeNotes(whole) && /^#\s+(autoauditor[ií]a|notas)\b/im.test(whole)) return whole;
  return null;
}

function freshNotes(notesFile: string, started: number): boolean {
  try {
    const stat = fs.statSync(notesFile);
    if (started && stat.mtimeMs < started) return false;
    return fs.readFileSync(notesFile, 'utf8').trim().length > 0;
  } catch {
    return false;
  }
}

/** ¿Hay un notas.md de este trabajo, con texto? Un archivo vacío o anterior no cuenta. */
export function notesAreReady(notesFile: string, started: number): boolean {
  return freshNotes(notesFile, started);
}

/**
 * Si falta `notas.md`, lo escribe a partir del mensaje. No pisa un archivo de este trabajo.
 * Devuelve el texto guardado, o null si no había notas legibles o el archivo ya estaba.
 */
export function recoverSelfAudit(notesFile: string, output: string, started = 0): string | null {
  if (freshNotes(notesFile, started)) return null;
  const body = extractSelfAudit(output);
  if (!body) return null;
  fs.mkdirSync(path.dirname(notesFile), { recursive: true });
  fs.writeFileSync(notesFile, body.endsWith('\n') ? body : `${body}\n`, 'utf8');
  return body;
}
