/**
 * brandCards.ts — fichas de marca que envía el worker desde el Mac (2026-10-01, ver studio/worker/brandCard.ts).
 *
 * Se guardan tal cual las resume el worker (una por marca, en studio/data/brand-cards/<marca>.json), con su
 * huella para que el worker solo reenvíe las que cambian. Llegan con el token del worker, pero su texto sale
 * de los brand packs (y estos de webs de terceros): se acotan tamaños y formatos, y la web lo pinta escapado.
 */
import * as fs from 'fs';
import * as path from 'path';
import { DATA_DIR } from './paths';
import type { BrandCard } from '../worker/brandCard';

const DIR = path.join(DATA_DIR, 'brand-cards');
const SLUG_RE = /^[a-z0-9][a-z0-9-]{0,59}$/;
const HASH_RE = /^[a-f0-9]{16}$/;
const LOGO_RE = /^data:image\/(png|jpeg|webp|svg\+xml);base64,[A-Za-z0-9+/=]+$/;
const MAX_CARD_CHARS = 300 * 1024;

export interface StoredBrandCard {
  card: BrandCard;
  hash: string;
  receivedAt: string;
}

export function knownBrandHashes(): Record<string, string> {
  const out: Record<string, string> = {};
  if (!fs.existsSync(DIR)) return out;
  for (const f of fs.readdirSync(DIR)) {
    if (!f.endsWith('.json')) continue;
    try {
      const stored = JSON.parse(fs.readFileSync(path.join(DIR, f), 'utf8')) as StoredBrandCard;
      if (SLUG_RE.test(stored.card.slug) && HASH_RE.test(stored.hash)) out[stored.card.slug] = stored.hash;
    } catch {
      // ficha ilegible: el worker la volverá a mandar
    }
  }
  return out;
}

/** Guarda las fichas válidas; devuelve cuántas. Una inválida se descarta sin tumbar el resto. */
export function saveBrandCards(raw: unknown): number {
  if (!Array.isArray(raw)) return 0;
  fs.mkdirSync(DIR, { recursive: true });
  let saved = 0;
  for (const entry of raw.slice(0, 20)) {
    const card = entry?.card as BrandCard | undefined;
    const hash = entry?.hash;
    if (!card || typeof card !== 'object' || !SLUG_RE.test(String(card.slug)) || !HASH_RE.test(String(hash))) continue;
    if (card.logo != null && (typeof card.logo !== 'string' || !LOGO_RE.test(card.logo))) card.logo = null;
    const json = JSON.stringify({ card, hash, receivedAt: new Date().toISOString() } satisfies StoredBrandCard);
    if (json.length > MAX_CARD_CHARS) continue;
    const file = path.join(DIR, `${card.slug}.json`);
    const tmp = `${file}.tmp`;
    fs.writeFileSync(tmp, json);
    fs.renameSync(tmp, file);
    saved++;
  }
  return saved;
}

export function readBrandCard(slug: string): StoredBrandCard | null {
  if (!SLUG_RE.test(slug)) return null;
  try {
    return JSON.parse(fs.readFileSync(path.join(DIR, `${slug}.json`), 'utf8')) as StoredBrandCard;
  } catch {
    return null;
  }
}

/** Marcas con ficha guardada (2026-10-05, página «Marcas»). */
export function listBrandCardSlugs(): string[] {
  if (!fs.existsSync(DIR)) return [];
  return fs
    .readdirSync(DIR)
    .filter((f) => f.endsWith('.json'))
    .map((f) => f.slice(0, -5))
    .filter((slug) => SLUG_RE.test(slug));
}

/** Marcas con logo en su ficha y si es la versión blanca (2026-10-05): el historial lo pone en las miniaturas
 *  sin imagen en vez de la inicial. Se recalcula como mucho cada minuto (cada /api/jobs lo consulta). */
let logoIndex: { at: number; map: Map<string, { onDark: boolean; hash: string }> } | null = null;
export function brandLogoIndex(): Map<string, { onDark: boolean; hash: string }> {
  if (logoIndex && Date.now() - logoIndex.at < 60 * 1000) return logoIndex.map;
  const map = new Map<string, { onDark: boolean; hash: string }>();
  if (fs.existsSync(DIR)) {
    for (const f of fs.readdirSync(DIR)) {
      if (!f.endsWith('.json')) continue;
      const stored = readBrandCard(f.slice(0, -5));
      if (stored?.card.logo && LOGO_RE.test(stored.card.logo)) map.set(stored.card.slug, { onDark: !!stored.card.logoOnDark, hash: stored.hash });
    }
  }
  logoIndex = { at: Date.now(), map };
  return map;
}

/** El logo de la ficha como imagen (lo que hay detrás del data URI). */
export function readBrandLogo(slug: string): { type: string; body: Buffer; hash: string } | null {
  const stored = readBrandCard(slug);
  const m = stored?.card.logo?.match(LOGO_RE);
  if (!stored || !m) return null;
  return { type: `image/${m[1]}`, body: Buffer.from(stored.card.logo!.slice(stored.card.logo!.indexOf(',') + 1), 'base64'), hash: stored.hash };
}
