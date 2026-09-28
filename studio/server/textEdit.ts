/**
 * textEdit.ts — retoques de texto al instante, sin Hermes (2026-09-28).
 *
 * El equipo edita el texto sobre la vista previa (studio/web/textedit.js) y Studio manda solo lo que ha
 * cambiado: para cada trozo de texto, dónde está (ruta de elementos desde <body> y "hueco" entre hijos) y
 * cómo era y cómo queda. Aquí se aplica sobre el HTML publicado tocando SOLO esos trozos: el resto de la
 * pieza queda byte a byte igual (comentarios condicionales de Outlook, VML, entidades, formato). No se
 * regenera el HTML con un serializador, que reescribiría la pieza entera.
 *
 * Mismo modelo que el navegador: parse5 es un analizador HTML conforme a la especificación, así que el
 * árbol de <body> es el mismo que ve la vista previa.
 *  - ruta: índices entre los hijos que son ELEMENTOS, desde <body>.
 *  - hueco k: el texto entre el separador k-1 y el k, donde separadores son los hijos elemento o comentario
 *    (hueco 0 = antes del primero). Varios nodos de texto seguidos cuentan como uno.
 */
import { parse } from 'parse5';

export interface TextEdit {
  path: number[];
  gap: number;
  before: string;
  after: string;
}

export class TextEditError extends Error {}

type Loc = { startOffset: number; endOffset: number; startTag?: { endOffset: number }; endTag?: { startOffset: number } };
type PNode = {
  nodeName: string;
  tagName?: string;
  value?: string;
  /** Contenido de un comentario (parse5 lo guarda en `data`). */
  data?: string;
  childNodes?: PNode[];
  sourceCodeLocation?: Loc | null;
};

/** Donde el texto no se ve o no es texto de la pieza. */
const RAW_TEXT = /^(style|script|title|textarea|noscript|xmp|iframe|noembed|noframes|template)$/i;

const isElement = (n: PNode): boolean => !!n.tagName;
const isText = (n: PNode): boolean => n.nodeName === '#text';

/** Para comparar y para mostrar: sin nbsp ni caracteres invisibles (el relleno del preheader). */
export function normalizeText(text: string): string {
  return text
    .replace(/[\u200b-\u200d\u034f\u00ad\ufeff]/g, '')
    .replace(/\u00a0/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Texto nuevo como HTML: escapado, y los caracteres invisibles como entidad (se leen en el código). */
export function escapeText(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\u00a0/g, '&nbsp;')
    .replace(/\u200c/g, '&zwnj;')
    .replace(/\u200d/g, '&zwj;')
    .replace(/\u00ad/g, '&shy;')
    .replace(/[\u200b\u034f\ufeff]/g, (c) => `&#${c.charCodeAt(0)};`);
}

function find(root: PNode, name: string): PNode | null {
  for (const c of root.childNodes || []) {
    if (c.tagName === name) return c;
    const deep = find(c, name);
    if (deep) return deep;
  }
  return null;
}

interface Gap {
  text: string;
  start: number;
  end: number;
}

/** Huecos de texto de un elemento, con su rango en el HTML original. */
function gapsOf(el: PNode): Gap[] {
  const loc = el.sourceCodeLocation;
  if (!loc) throw new TextEditError('No se puede localizar ese elemento en el HTML.');
  const gaps: Gap[] = [];
  // Un hueco vacío se inserta justo después del separador anterior (o de la etiqueta de apertura).
  let cursor = loc.startTag ? loc.startTag.endOffset : loc.startOffset;
  let cur: Gap = { text: '', start: cursor, end: cursor };
  for (const child of el.childNodes || []) {
    const cl = child.sourceCodeLocation;
    if (isText(child)) {
      if (!cl) throw new TextEditError('No se puede localizar ese texto en el HTML.');
      if (!cur.text && cur.start === cursor) cur.start = cl.startOffset;
      cur.text += child.value || '';
      cur.end = cl.endOffset;
      cursor = cl.endOffset;
    } else {
      if (!cl) throw new TextEditError('No se puede localizar ese elemento en el HTML.');
      gaps.push(cur);
      cursor = cl.endOffset;
      cur = { text: '', start: cursor, end: cursor };
    }
  }
  gaps.push(cur);
  return gaps;
}

function comments(root: PNode, out: PNode[] = []): PNode[] {
  for (const c of root.childNodes || []) {
    if (c.nodeName === '#comment') out.push(c);
    else comments(c, out);
  }
  return out;
}

function decodeBasic(raw: string): string {
  return raw
    .replace(/&nbsp;/gi, '\u00a0')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&#(\d+);/g, (_m, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_m, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&amp;/gi, '&');
}

/**
 * Outlook de escritorio pinta los botones desde su propia copia en VML, dentro de <!--[if mso]>: el texto
 * del botón está dos veces (en la de Nike, «Hacerla tuya» y «Descubre el impulso»). Si solo se cambiara el
 * <a>, Outlook seguiría mostrando el texto viejo. Se cambia también cada texto de esos bloques que sea
 * exactamente el de antes.
 */
function outlookCopies(doc: PNode, html: string, before: string, after: string): { start: number; end: number; text: string }[] {
  const target = normalizeText(before);
  if (target.length < 2) return [];
  const out: { start: number; end: number; text: string }[] = [];
  for (const c of comments(doc)) {
    const loc = c.sourceCodeLocation;
    if (!loc || !/^\[if[^\]]*mso/i.test(c.data || '')) continue;
    const raw = html.slice(loc.startOffset, loc.endOffset);
    for (const m of raw.matchAll(/>([^<>]+)</g)) {
      if (normalizeText(decodeBasic(m[1])) !== target) continue;
      const segStart = loc.startOffset + (m.index ?? 0) + 1;
      const lead = m[1].match(/^\s*/)?.[0] ?? '';
      const trail = m[1].match(/\s*$/)?.[0] ?? '';
      out.push({ start: segStart, end: segStart + m[1].length, text: lead + escapeText(normalizeText(after)) + trail });
    }
  }
  return out;
}

function elementAt(body: PNode, path: number[]): PNode {
  let el = body;
  for (const i of path) {
    const next = (el.childNodes || []).filter(isElement)[i];
    if (!next) throw new TextEditError('La pieza no coincide con la vista previa (¿ha cambiado mientras editabas?).');
    el = next;
  }
  return el;
}

/**
 * Aplica los retoques. `subject`: nuevo contenido de <title> (el asunto), si cambia.
 * Devuelve el HTML nuevo y la lista de cambios aplicados (para las notas y "Qué ha cambiado").
 */
export function applyTextEdits(
  html: string,
  edits: TextEdit[],
  subject?: string | null
): { html: string; changes: { before: string; after: string }[]; outlookCopies: number } {
  const doc = parse(html, { sourceCodeLocationInfo: true }) as unknown as PNode;
  const body = find(doc, 'body');
  if (!body) throw new TextEditError('La pieza no tiene <body>.');

  const replacements: { start: number; end: number; text: string }[] = [];
  const changes: { before: string; after: string }[] = [];
  let outlook = 0;

  for (const edit of edits) {
    const el = elementAt(body, edit.path);
    if (RAW_TEXT.test(el.tagName || '')) throw new TextEditError('Ese texto no se puede editar aquí.');
    const gap = gapsOf(el)[edit.gap];
    if (!gap) throw new TextEditError('La pieza no coincide con la vista previa (¿ha cambiado mientras editabas?).');
    if (normalizeText(gap.text) !== normalizeText(edit.before)) {
      throw new TextEditError(`El texto «${normalizeText(edit.before).slice(0, 60)}» no coincide con el de la pieza: recarga la página y vuelve a editar.`);
    }
    replacements.push({ start: gap.start, end: gap.end, text: escapeText(edit.after) });
    changes.push({ before: normalizeText(gap.text), after: normalizeText(edit.after) });
    const copies = outlookCopies(doc, html, gap.text, edit.after);
    replacements.push(...copies);
    outlook += copies.length;
  }

  if (subject != null) {
    const title = find(doc, 'title');
    const clean = subject.replace(/\s+/g, ' ').trim();
    if (!clean) throw new TextEditError('El asunto no puede quedar vacío.');
    if (title?.sourceCodeLocation?.startTag && title.sourceCodeLocation.endTag) {
      const start = title.sourceCodeLocation.startTag.endOffset;
      const end = title.sourceCodeLocation.endTag.startOffset;
      const old = (title.childNodes || []).map((c) => c.value || '').join('');
      if (normalizeText(old) !== clean) {
        replacements.push({ start, end, text: escapeText(clean) });
        changes.push({ before: `Asunto: ${normalizeText(old)}`, after: `Asunto: ${clean}` });
      }
    } else {
      const head = find(doc, 'head');
      const at = head?.sourceCodeLocation?.startTag?.endOffset;
      if (at == null) throw new TextEditError('La pieza no tiene <head> donde poner el asunto.');
      replacements.push({ start: at, end: at, text: `<title>${escapeText(clean)}</title>` });
      changes.push({ before: 'Asunto: (sin asunto)', after: `Asunto: ${clean}` });
    }
  }

  replacements.sort((a, b) => b.start - a.start);
  for (let i = 1; i < replacements.length; i++) {
    if (replacements[i].end > replacements[i - 1].start) throw new TextEditError('Hay dos cambios sobre el mismo texto.');
  }
  let out = html;
  for (const r of replacements) out = out.slice(0, r.start) + r.text + out.slice(r.end);
  return { html: out, changes, outlookCopies: outlook };
}
