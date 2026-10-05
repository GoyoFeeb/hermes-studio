/**
 * autoFix.ts — arreglos técnicos que el worker aplica solo, sin devolverle la pieza a Hermes (2026-10-05).
 *
 * Auditoría de agentes del 2026-10-05: las rondas de corrección retoman una sesión de 70+ acciones y cada una
 * tarda minutos (Calvin Klein: 23 min por un padding). Lo que es mecánico — y siempre se arregla igual — no
 * necesita criterio: se arregla aquí y Hermes solo recibe lo que sí lo necesita.
 *
 * Qué arregla (sin tocar el diseño en claro):
 * - Declaración de modo oscuro (<meta name="color-scheme"> y supported-color-schemes): solo si la pieza ya trae su
 *   @media (prefers-color-scheme: dark). Sin estilos oscuros, declararlo no basta y lo decide Hermes.
 * - Ajuste de 96 ppp de Outlook en <head> y los xmlns de Office que necesita.
 * - Atributo width en las <img> que no lo tienen, con el ancho al que se pintan (Outlook las pinta a su tamaño real).
 * - box-sizing:border-box en elementos con width:100% y padding en línea (sin él miden el 100 % más el padding y se
 *   salen en móvil: El Corte Inglés, Calvin Klein).
 * - Enlace de baja: si hay un enlace cuyo texto es «baja»/«unsubscribe», su href pasa a {{unsubscribe_url}}.
 * - Imágenes locales de más de 600 KB: se reducen a 1200 px de ancho y se comprimen (compressLocalImages).
 */
import * as fs from 'fs';
import sharp from 'sharp';
import { resolveLocal, IMAGE_MAX_BYTES } from './renderChecks';

export interface FixResult {
  html: string;
  /** Una línea por arreglo, para notas.md y el registro del trabajo. */
  applied: string[];
}

const PPI_BLOCK =
  '<!--[if mso]><noscript><xml><o:OfficeDocumentSettings><o:AllowPNG/><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript><![endif]-->';

function insertInHead(html: string, snippet: string): string {
  if (/<\/head>/i.test(html)) return html.replace(/<\/head>/i, `${snippet}\n</head>`);
  return html;
}

/** Etiqueta <img> completa aunque un atributo lleve «>» dentro (un SVG incrustado sin codificar). */
export const IMG_TAG = /<img\b(?:[^>"']|"[^"]*"|'[^']*')*>/gi;

/** ¿Tiene el atributo? Sin mirar dentro del src: un SVG incrustado lleva su propio width=… (Siroko). */
export function hasAttr(tag: string, name: string): boolean {
  return new RegExp(`\\s${name}\\s*=`, 'i').test(tag.replace(/\b(src|style|alt)\s*=\s*("[^"]*"|'[^']*')/gi, ''));
}

/** `imgWidths`: ancho pintado de cada <img> en orden (renderChecks), para las que no llevan width. */
export function autoFix(input: string, imgWidths: number[] = []): FixResult {
  let html = input;
  const applied: string[] = [];

  // Modo oscuro: declarar lo que la pieza ya define.
  const darkCss = /prefers-color-scheme\s*:\s*dark/i.test(html);
  const metas = [...html.matchAll(/<meta\b[^>]*name\s*=\s*["']?(color-scheme|supported-color-schemes)["']?[^>]*>/gi)];
  if (darkCss && !metas.some((m) => /dark/i.test(m[0]))) {
    for (const m of metas) html = html.replace(m[0], '');
    html = insertInHead(html, '<meta name="color-scheme" content="light dark">\n<meta name="supported-color-schemes" content="light dark">');
    applied.push('Declarado el modo oscuro en <head> (la pieza ya tenía sus estilos oscuros).');
  }

  // Outlook: 96 ppp y espacios de nombres de Office.
  if (!/PixelsPerInch/i.test(html) && /<\/head>/i.test(html)) {
    html = insertInHead(html, PPI_BLOCK);
    applied.push('Añadido el ajuste de 96 ppp para Outlook.');
  }
  if (/<o:|<v:/i.test(html)) {
    html = html.replace(/<html\b([^>]*)>/i, (tag, attrs: string) => {
      let extra = '';
      if (!/xmlns:o\s*=/i.test(attrs)) extra += ' xmlns:o="urn:schemas-microsoft-com:office:office"';
      if (!/xmlns:v\s*=/i.test(attrs)) extra += ' xmlns:v="urn:schemas-microsoft-com:vml"';
      return extra ? `<html${attrs}${extra}>` : tag;
    });
  }

  // width en las imágenes (el orden de imgWidths es el de las <img> del documento).
  let index = -1;
  let widthFixed = 0;
  html = html.replace(IMG_TAG, (tag) => {
    index++;
    if (hasAttr(tag, 'width')) return tag;
    // width en el estilo (no max-width): al principio o tras «;» o un espacio.
    const styleW = tag.match(/\bstyle\s*=\s*["']\s*(?:[^"']*?[;\s])?width\s*:\s*(\d+)px/i)?.[1];
    const w = Number(styleW) || imgWidths[index] || 0;
    if (!w) return tag;
    widthFixed++;
    return tag.replace(/^<img\b/i, `<img width="${Math.round(w)}"`);
  });
  if (widthFixed) applied.push(`Atributo width en ${widthFixed} imagen(es) (Outlook las pintaba a su tamaño real).`);

  // box-sizing en celdas fluidas con padding.
  let boxFixed = 0;
  html = html.replace(/\bstyle\s*=\s*(["'])([^"']*)\1/gi, (whole, q: string, style: string) => {
    if (!/(^|;)\s*width\s*:\s*100%/i.test(style) || !/(^|;)\s*padding(-left|-right)?\s*:\s*[^;]*[1-9]/i.test(style)) return whole;
    if (/box-sizing/i.test(style)) return whole;
    boxFixed++;
    const sep = style.trim().endsWith(';') || !style.trim() ? '' : ';';
    return `style=${q}${style}${sep}box-sizing:border-box;${q}`;
  });
  if (boxFixed) applied.push(`box-sizing:border-box en ${boxFixed} elemento(s) con width:100% y padding (se salían en móvil).`);

  // Enlace de baja que ya existe pero apunta a otro sitio.
  if (!/\{\{\s*unsubscribe_url\s*\}\}/.test(html)) {
    let done = false;
    html = html.replace(/<a\b([^>]*)>([\s\S]*?)<\/a>/gi, (whole, attrs: string, inner: string) => {
      if (done) return whole;
      const text = inner.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().toLowerCase();
      if (!/^(darse de baja|date de baja|dar(te|se)? de baja|baja|unsubscribe|cancelar (la )?suscripci[oó]n)\b/.test(text)) return whole;
      done = true;
      const newAttrs = /\bhref\s*=/i.test(attrs) ? attrs.replace(/\bhref\s*=\s*(["'])[^"']*\1/i, 'href="{{unsubscribe_url}}"') : `${attrs} href="{{unsubscribe_url}}"`;
      return `<a${newAttrs}>${inner}</a>`;
    });
    if (done) applied.push('El enlace de baja apunta ahora a {{unsubscribe_url}}.');
  }

  return { html, applied };
}

const MAX_IMAGE_WIDTH = 1200;

/** Reduce y comprime las imágenes locales de la pieza que pesan más de 600 KB (sobrescribe el archivo, en la
 *  carpeta del trabajo; si la imagen está fuera de ella —p. ej. en brands/— no se toca). */
export async function compressLocalImages(html: string, htmlDir: string, root: string): Promise<string[]> {
  const applied: string[] = [];
  const seen = new Set<string>();
  for (const m of html.matchAll(/<img\b[^>]*\bsrc\s*=\s*["']([^"']+)["']/gi)) {
    const file = resolveLocal(m[1], htmlDir, root);
    if (!file || seen.has(file) || !file.startsWith(htmlDir + '/')) continue;
    seen.add(file);
    const before = fs.statSync(file).size;
    if (before <= IMAGE_MAX_BYTES || !/\.(jpe?g|png|webp)$/i.test(file)) continue;
    try {
      const img = sharp(file).rotate().resize({ width: MAX_IMAGE_WIDTH, withoutEnlargement: true });
      const meta = await sharp(file).metadata();
      const out = /\.png$/i.test(file)
        ? await img.png({ compressionLevel: 9, palette: !meta.hasAlpha ? false : true, quality: 85 }).toBuffer()
        : /\.webp$/i.test(file)
          ? await img.webp({ quality: 82 }).toBuffer()
          : await img.jpeg({ quality: 82, mozjpeg: true }).toBuffer();
      if (out.length < before) {
        fs.writeFileSync(file, out);
        applied.push(`${file.slice(htmlDir.length + 1)}: ${Math.round(before / 1024)} → ${Math.round(out.length / 1024)} KB.`);
      }
    } catch {
      // si sharp no puede, se queda como está (el inspector de peso lo avisa)
    }
  }
  return applied.length ? [`Imágenes comprimidas: ${applied.join(' ')}`] : [];
}
