/**
 * brandCard.ts — ficha de marca para Studio (2026-10-01, como el "brand kit" de Migma, pero de solo lectura).
 *
 * El brand pack que usa Hermes vive en el Mac del worker (brands/<marca>/tokens/brand-tokens.json y
 * brands/<marca>/design-input/). La copia del servidor puede estar desfasada (el arranque del contenedor no
 * sobrescribe archivos), así que la ficha la resume el worker y la envía a Studio, como las miniaturas.
 *
 * Solo lectura a propósito: el brand pack lo mide el agente 02 (Brand Visual Analyst) con getComputedStyle
 * sobre la web real y cada valor lleva su procedencia. Editarlo a mano desde Studio saltaría esa frontera.
 *
 * Los brand packs no tienen todos el mismo esquema (18 de 34 marcas tienen uno, con versiones 2.2.x): todo
 * se lee con alternativas y se acota, y una marca sin brand pack también tiene ficha (logos y aviso).
 */
import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';

export interface BrandColor {
  labels: string[];
  value: string;
}

export interface BrandCard {
  slug: string;
  /** Nombre legible si el brand pack lo trae ("Adeslas"); si no, Studio usa el suyo. */
  name: string | null;
  hasPack: boolean;
  version: string | null;
  description: string | null;
  /** Dónde y cuándo se midió (texto de procedencia del brand pack). */
  measuredFrom: string | null;
  updatedAt: string | null;
  colors: BrandColor[];
  typography: { family: string | null; display: string | null; webFont: string | null; note: string | null; h1: string | null; body: string | null; source: string | null } | null;
  cta: { background: string | null; text: string | null; radius: string | null; padding: string | null; label: string | null } | null;
  voice: { tone: string | null; formality: string | null; sentenceLength: string | null; mode: string | null; punctuation: string | null; examples: string[]; source: string | null } | null;
  photography: { real: boolean | null; treatment: string | null; source: string | null } | null;
  iconography: { style: string | null; monochrome: boolean | null; color: string | null; implication: string | null } | null;
  darkMode: { status: string | null; note: string | null } | null;
  assets: { logos: string[]; photos: number; ai: number; broken: string[]; mismatched: string[] };
  /** Logo para mostrar (data URI, ≤ LOGO_MAX_BYTES); null si no hay o pesa demasiado. */
  logo: string | null;
  /** El único logo disponible es la versión blanca: se muestra sobre fondo oscuro. */
  logoOnDark: boolean;
}

const LOGO_MAX_BYTES = 150 * 1024;
const COLOR_RE = /^(#[0-9a-f]{3,8}|rgba?\([0-9.,\s%]{5,40}\))$/i;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Json = any;

const str = (v: unknown, max = 300): string | null => {
  if (typeof v === 'number') return String(v);
  if (typeof v !== 'string') return null;
  const t = v.replace(/\s+/g, ' ').trim();
  if (!t) return null;
  return t.length > max ? `${t.slice(0, max - 1).replace(/\s+\S*$/, '')}…` : t;
};
const bool = (v: unknown): boolean | null => (typeof v === 'boolean' ? v : null);
const px = (v: unknown): string | null => (typeof v === 'number' ? `${v}px` : str(v, 40));

export type ImageKind = 'png' | 'jpeg' | 'gif' | 'webp' | 'svg';

/** Formato real por los primeros bytes, no por la extensión. Al hacer la ficha (2026-10-01) aparecieron 4
 *  "imágenes" que eran páginas de error guardadas al fallar una descarga (el logo de Prozis, uno de El Corte
 *  Inglés: "Access Denied") y 6 con la extensión cambiada (JPEG como .png en Toyota, WebP como .jpg en Adeslas). */
export function imageKind(abs: string): ImageKind | null {
  let b: Buffer;
  try {
    const fd = fs.openSync(abs, 'r');
    const buf = Buffer.alloc(4096);
    const n = fs.readSync(fd, buf, 0, 4096, 0);
    fs.closeSync(fd);
    b = buf.subarray(0, n);
  } catch {
    return null;
  }
  return imageKindOf(b);
}

/** Lo mismo sobre los bytes ya leídos (fetch-image.ts comprueba la descarga antes de guardarla). */
export function imageKindOf(b: Buffer): ImageKind | null {
  if (b[0] === 0x89 && b.toString('latin1', 1, 4) === 'PNG') return 'png';
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return 'jpeg';
  if (b.toString('latin1', 0, 4) === 'GIF8') return 'gif';
  if (b.toString('latin1', 0, 4) === 'RIFF' && b.toString('latin1', 8, 12) === 'WEBP') return 'webp';
  const head = b.toString('utf8').toLowerCase();
  return head.includes('<svg') && !head.includes('<html') ? 'svg' : null;
}

const EXT_KIND: Record<string, ImageKind> = { png: 'png', jpg: 'jpeg', jpeg: 'jpeg', gif: 'gif', webp: 'webp', svg: 'svg' };

/** Logos, fotos y lo que es IA en brands/<marca>/design-input (las imágenes con metadatos C2PA de IA no son
 *  assets oficiales). Lo usa también el encargo del worker para decirle a Hermes qué puede usar: lo que no es
 *  una imagen (`broken`) ya no se le ofrece, y lo que tiene la extensión cambiada (`mismatched`) se le avisa. */
export function brandAssets(
  root: string,
  slug: string
): { dir: string; logos: string[]; photos: string[]; ai: string[]; broken: string[]; mismatched: { file: string; kind: ImageKind }[] } {
  const dir = path.join('brands', slug, 'design-input');
  const abs = path.join(root, dir);
  const all = fs.existsSync(abs) ? fs.readdirSync(abs).filter((f) => /\.(png|jpe?g|svg|webp|gif)$/i.test(f)) : [];
  const broken: string[] = [];
  const mismatched: { file: string; kind: ImageKind }[] = [];
  const files = all.filter((f) => {
    const kind = imageKind(path.join(abs, f));
    if (!kind) {
      broken.push(f);
      return false;
    }
    if (EXT_KIND[path.extname(f).slice(1).toLowerCase()] !== kind) mismatched.push({ file: f, kind });
    return true;
  });
  const detected = files.filter((f) => {
    try {
      return fs.readFileSync(path.join(abs, f)).includes('trainedAlgorithmicMedia');
    } catch {
      return false;
    }
  });
  const base = (f: string): string => f.replace(/\.[^.]+$/, '').replace(/-(email|original|raw|crop|v\d+)$/i, '');
  const aiBases = new Set(detected.map(base));
  const ai = files.filter((f) => detected.includes(f) || aiBases.has(base(f)));
  const rest = files.filter((f) => !ai.includes(f));
  return { dir, logos: rest.filter((f) => /logo/i.test(f)), photos: rest.filter((f) => !/logo/i.test(f)), ai, broken, mismatched };
}

const MIME: Record<ImageKind, string> = { png: 'image/png', jpeg: 'image/jpeg', gif: 'image/gif', webp: 'image/webp', svg: 'image/svg+xml' };

/** El logo que mejor se ve en la ficha (sobre fondo blanco): el de email, si no uno negro o en color, nunca la
 *  versión blanca. Solo archivos que de verdad son imágenes; el tipo sale de sus bytes, no de la extensión. */
const WHITE_LOGO = (f: string): boolean => /white|blanco|negativ/i.test(f.replace(/on-white/i, ''));

function pickLogo(root: string, slug: string, logos: string[], svgFromTokens: string | null): { uri: string; onDark: boolean } | null {
  const dir = path.join(root, 'brands', slug, 'design-input');
  const score = (f: string): number =>
    (WHITE_LOGO(f) ? 100 : 0) +
    (/email/i.test(f) ? -2 : 0) +
    (/black|negro|color|dark/i.test(f) ? -1 : 0) +
    (/\.(jpe?g|webp|gif)$/i.test(f) ? 1 : 0);
  const candidates = [...logos].sort((a, b) => score(a) - score(b) || a.length - b.length).map((f) => path.join(dir, f));
  if (svgFromTokens && /^brands\//.test(svgFromTokens)) candidates.push(path.join(root, svgFromTokens));
  for (const file of candidates) {
    try {
      if (!path.resolve(file).startsWith(path.resolve(root, 'brands') + path.sep) || fs.statSync(file).size > LOGO_MAX_BYTES) continue;
      const kind = imageKind(file);
      if (!kind) continue;
      return { uri: `data:${MIME[kind]};base64,${fs.readFileSync(file).toString('base64')}`, onDark: WHITE_LOGO(path.basename(file)) };
    } catch {
      // siguiente candidato
    }
  }
  return null;
}

const COLOR_KEYS: [string[], string][] = [
  [['primary'], 'Principal'],
  [['ctaBackground'], 'Botón · fondo'],
  [['ctaText'], 'Botón · texto'],
  [['textPrimary', 'text.primary'], 'Texto principal'],
  [['textBody', 'text.body'], 'Texto del cuerpo'],
  [['link'], 'Enlaces'],
  [['secondary'], 'Secundario'],
  [['accent'], 'Acento'],
  [['lightBg', 'background.sectionAlt'], 'Fondo claro'],
  [['darkBg', 'background.dark'], 'Fondo oscuro'],
  [['border'], 'Bordes'],
];

function at(obj: Json, dotted: string): unknown {
  return dotted.split('.').reduce((o: Json, k) => (o && typeof o === 'object' ? o[k] : undefined), obj);
}

function brandColors(colors: Json): BrandColor[] {
  const out: BrandColor[] = [];
  for (const [keys, label] of COLOR_KEYS) {
    const value = keys.map((k) => at(colors, k)).find((v) => typeof v === 'string' && COLOR_RE.test(v.trim())) as string | undefined;
    if (!value) continue;
    const norm = value.trim().toUpperCase();
    const same = out.find((c) => c.value.toUpperCase() === norm);
    if (same) same.labels.push(label);
    else out.push({ labels: [label], value: value.trim() });
  }
  return out;
}

/** Nombre legible: solo si el brand pack lo trae como nombre ("Adeslas — Seguro Médico" → "Adeslas"), no el slug. */
function displayName(raw: unknown, slug: string): string | null {
  const t = str(raw, 80);
  if (!t || t.toLowerCase() === slug) return null;
  return t.split(/\s+[—–-]\s+/)[0].trim() || null;
}

export function buildBrandCard(root: string, slug: string): BrandCard {
  const tokensFile = path.join(root, 'brands', slug, 'tokens', 'brand-tokens.json');
  let t: Json = null;
  let updatedAt: string | null = null;
  try {
    t = JSON.parse(fs.readFileSync(tokensFile, 'utf8'));
    updatedAt = fs.statSync(tokensFile).mtime.toISOString();
  } catch {
    t = null;
  }
  const { logos, photos, ai, broken, mismatched } = brandAssets(root, slug);
  const card: BrandCard = {
    slug,
    name: t ? displayName(t.brand, slug) : null,
    hasPack: !!t,
    version: t ? str(t.version, 20) : null,
    description: t ? str(t.description, 400) : null,
    measuredFrom: t ? str(at(t, 'colors.source') ?? at(t, 'typography.source') ?? at(t, 'voice.rhythm.source'), 300) : null,
    updatedAt,
    colors: t?.colors ? brandColors(t.colors) : [],
    typography: null,
    cta: null,
    voice: null,
    photography: null,
    iconography: null,
    darkMode: null,
    assets: {
      logos: logos.slice(0, 20),
      photos: photos.length,
      ai: ai.length,
      broken: broken.slice(0, 20),
      mismatched: mismatched.slice(0, 20).map((m) => `${m.file} (es ${m.kind.toUpperCase()})`),
    },
    logo: null,
    logoOnDark: false,
  };
  const logo = pickLogo(root, slug, logos, t ? str(at(t, 'assets.logoSvg'), 200) : null);
  card.logo = logo?.uri || null;
  card.logoOnDark = !!logo?.onDark;
  if (!t) return card;

  const ty = t.typography || {};
  const webFont = typeof ty.webFont === 'string' ? ty.webFont : ty.webFont?.family;
  card.typography = {
    family: str(ty.family, 200),
    display: str(ty.displayFont, 200),
    webFont: str(webFont, 80),
    note: str(ty.note ?? ty.webFont?.note, 400),
    h1: px(at(ty, 'headline.h1') ?? at(ty, 'hero.h1.size')),
    body: px(at(ty, 'body.size')),
    source: str(ty.source, 300),
  };
  const cta = at(t, 'components.cta') as Json;
  card.cta = {
    background: str(cta?.backgroundColor ?? at(t, 'colors.ctaBackground'), 40),
    text: str(cta?.textColor ?? at(t, 'colors.ctaText'), 40),
    radius: px(cta?.borderRadius ?? at(t, 'radius.cta')),
    padding: str(cta?.padding, 40),
    label: str(at(t, 'voice.ctaDefault'), 80),
  };
  if (card.cta.background && !COLOR_RE.test(card.cta.background)) card.cta.background = null;
  if (card.cta.text && !COLOR_RE.test(card.cta.text)) card.cta.text = null;
  const v = t.voice || {};
  const r = v.rhythm || {};
  card.voice = {
    tone: str(v.tone, 200),
    formality: str(r.formality, 120),
    sentenceLength: str(r.sentenceLength, 200),
    mode: str(r.mode, 300),
    punctuation: str(r.punctuationHabits, 300),
    examples: (Array.isArray(r.examples) ? r.examples : []).map((e: unknown) => str(e, 220)).filter(Boolean).slice(0, 4) as string[],
    source: str(r.source, 300),
  };
  const ph = t.photography;
  card.photography = ph ? { real: bool(ph.usesRealPhotography), treatment: str(ph.treatment, 600), source: str(ph.source, 300) } : null;
  const ic = t.iconography;
  card.iconography = ic ? { style: str(ic.style, 60), monochrome: bool(ic.monochrome), color: str(ic.color, 40), implication: str(ic.componentImplication, 400) } : null;
  const dm = t.darkMode;
  card.darkMode = dm && typeof dm === 'object' ? { status: str(dm.status, 60), note: str(dm.note, 300) } : null;
  return card;
}

/** Huella de la ficha: el worker solo reenvía las que cambian. */
export function cardHash(card: BrandCard): string {
  return crypto.createHash('sha256').update(JSON.stringify(card)).digest('hex').slice(0, 16);
}
