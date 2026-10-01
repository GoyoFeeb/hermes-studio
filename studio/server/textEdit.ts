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

/** Texto alternativo de una imagen: `index` es su posición entre todas las <img> del documento (desde 0),
 *  igual que la cuenta la vista previa. */
export interface AltEdit {
  index: number;
  before: string;
  after: string;
}

/** Destino de enlace (2026-10-01): cambia TODOS los <a> que apuntan a `before` (y su copia en el VML de Outlook). */
export interface LinkEdit {
  before: string;
  after: string;
}

/** Imagen (2026-10-01): `index` entre todas las <img>; `after` es una URL https o una imagen subida (data URI),
 *  que Studio publica en /assets antes de guardar. */
export interface ImageEdit {
  index: number;
  before: string;
  after: string;
}

/** Destinos válidos: web, correo, teléfono o una variable de la plataforma de envío ({{…}}, *|…|*, %%…%%). */
export const LINK_RE = /^(https?:\/\/[^\s<>"']+|mailto:[^\s<>"']+|tel:[+\d][\d\s-]*|\{\{[^{}]+\}\}|\*\|[A-Z_:]+\|\*|%%[a-z_]+%%|\{%[^%]+%\})$/i;
export const IMAGE_SRC_RE = /^(https:\/\/[^\s<>"']+|data:image\/(png|jpeg|gif|webp);base64,[a-z0-9+/=]+)$/i;

export class TextEditError extends Error {}

type Loc = {
  startOffset: number;
  endOffset: number;
  startTag?: { startOffset: number; endOffset: number };
  endTag?: { startOffset: number };
  attrs?: Record<string, { startOffset: number; endOffset: number }>;
};
type PNode = {
  nodeName: string;
  tagName?: string;
  value?: string;
  attrs?: { name: string; value: string }[];
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

function anchors(root: PNode, out: PNode[] = []): PNode[] {
  for (const c of root.childNodes || []) {
    if (c.tagName === 'a') out.push(c);
    anchors(c, out);
  }
  return out;
}

function images(root: PNode, out: PNode[] = []): PNode[] {
  for (const c of root.childNodes || []) {
    if (c.tagName === 'img') out.push(c);
    images(c, out);
  }
  return out;
}

/** Valor de atributo escapado para ir entre comillas dobles. */
function escapeAttr(text: string): string {
  return escapeText(text).replace(/"/g, '&quot;');
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
  subject?: string | null,
  alts: AltEdit[] = [],
  links: LinkEdit[] = [],
  imageEdits: ImageEdit[] = []
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

  if (alts.length) {
    const imgs = images(doc);
    for (const alt of alts) {
      const img = imgs[alt.index];
      const loc = img?.sourceCodeLocation;
      if (!img || !loc?.startTag) throw new TextEditError('La pieza no coincide con la vista previa (¿ha cambiado mientras editabas?).');
      const current = img.attrs?.find((a) => a.name === 'alt');
      if (normalizeText(current?.value ?? '') !== normalizeText(alt.before)) {
        throw new TextEditError(`El texto alternativo de la imagen ${alt.index + 1} no coincide con el de la pieza: recarga la página y vuelve a editar.`);
      }
      const clean = alt.after.replace(/\s+/g, ' ').trim();
      const attrLoc = loc.attrs?.alt;
      if (attrLoc) replacements.push({ start: attrLoc.startOffset, end: attrLoc.endOffset, text: `alt="${escapeAttr(clean)}"` });
      else {
        const at = loc.startTag.startOffset + 4; // justo después de "<img"
        replacements.push({ start: at, end: at, text: ` alt="${escapeAttr(clean)}"` });
      }
      changes.push({ before: `Texto alternativo de la imagen ${alt.index + 1}: ${normalizeText(current?.value ?? '') || '(sin texto)'}`, after: `Texto alternativo de la imagen ${alt.index + 1}: ${clean || '(vacío: imagen decorativa)'}` });
    }
  }

  for (const link of links) {
    const after = link.after.trim();
    if (!LINK_RE.test(after)) throw new TextEditError(`«${after.slice(0, 80)}» no es un destino válido: usa una dirección que empiece por https://.`);
    const before = decodeBasic(link.before.trim());
    let found = 0;
    for (const a of anchors(doc)) {
      const href = a.attrs?.find((x) => x.name === 'href');
      const loc = a.sourceCodeLocation?.attrs?.href;
      if (!href || !loc || href.value.trim() !== before) continue;
      replacements.push({ start: loc.startOffset, end: loc.endOffset, text: `href="${escapeAttr(after)}"` });
      found++;
    }
    if (!found) throw new TextEditError(`El enlace ${link.before.slice(0, 80)} ya no está en la pieza: recarga la página y vuelve a editar.`);
    // Botones de Outlook (VML): <v:roundrect href="…"> dentro de <!--[if mso]>, con el mismo destino.
    for (const c of comments(doc)) {
      const cl = c.sourceCodeLocation;
      if (!cl || !/^\[if[^\]]*mso/i.test(c.data || '')) continue;
      const raw = html.slice(cl.startOffset, cl.endOffset);
      for (const m of raw.matchAll(/\bhref\s*=\s*"([^"]*)"/gi)) {
        if (decodeBasic(m[1]).trim() !== before) continue;
        const start = cl.startOffset + (m.index ?? 0);
        replacements.push({ start, end: start + m[0].length, text: `href="${escapeAttr(after)}"` });
        outlook++;
      }
    }
    changes.push({ before: `Enlace (${found}): ${before}`, after: `Enlace (${found}): ${after}` });
  }

  if (imageEdits.length) {
    const imgs = images(doc);
    for (const edit of imageEdits) {
      const img = imgs[edit.index];
      const src = img?.attrs?.find((a) => a.name === 'src');
      const loc = img?.sourceCodeLocation?.attrs?.src;
      if (!img || !src || !loc) throw new TextEditError('La pieza no coincide con la vista previa (¿ha cambiado mientras editabas?).');
      if (src.value.trim() !== decodeBasic(edit.before.trim())) {
        throw new TextEditError(`La imagen ${edit.index + 1} no coincide con la de la pieza: recarga la página y vuelve a editar.`);
      }
      const after = edit.after.trim();
      if (!IMAGE_SRC_RE.test(after)) throw new TextEditError(`La imagen ${edit.index + 1} necesita una dirección https:// o un archivo PNG, JPG, GIF o WebP.`);
      replacements.push({ start: loc.startOffset, end: loc.endOffset, text: `src="${after.startsWith('data:') ? after : escapeAttr(after)}"` });
      changes.push({ before: `Imagen ${edit.index + 1}: ${src.value}`, after: `Imagen ${edit.index + 1}: ${after.startsWith('data:') ? '(archivo subido en Studio)' : after}` });
    }
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
