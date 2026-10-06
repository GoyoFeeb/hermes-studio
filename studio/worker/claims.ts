/**
 * claims.ts — afirmaciones comerciales de riesgo, comprobadas contra lo verificado (2026-10-06, opción 3: lo valioso
 * del agente 05 entra en Studio).
 *
 * Las 30 reglas del motor (`scripts/lib/claim-rules.ts`) venían de las campañas de coches (potencia, 0 a 100,
 * tracción…) y en Studio solo daban un aviso. Faltaba lo típico del retail: «envío gratis», «-30 %», «solo hoy»,
 * «últimas unidades». Aquí se suman esas y se comprueban contra lo verificado: la sección «Datos verificados» del brief
 * (sin «Fuera de la pieza») y la ficha de producto. Una afirmación crítica que no está ahí, tal cual y con la misma
 * cifra, es error y vuelve a Hermes; las técnicas del motor (high/medium) siguen como aviso, porque daban falsos
 * positivos («potencia» en la ficha técnica de una moto).
 *
 * El archivo del motor no se toca: lo usan sus scripts y está bajo su candado de integridad (check-engine).
 */
import { CLAIM_RULES, type ClaimRule } from '../../scripts/lib/claim-rules';

/** Retail y email: lo que una newsletter de producto promete con más facilidad sin tenerlo confirmado. */
export const STUDIO_CLAIM_RULES: ClaimRule[] = [
  { pattern: /\benv[íi]os?\s+(?:gratis|gratuitos?)\b|\bgastos\s+de\s+env[íi]o\s+gratis\b|\benv[íi]o\s+sin\s+coste\b/i, severity: 'critical', label: 'envío gratis',
    recommendation: 'Solo con el umbral y las condiciones verificados en la web (p. ej. «a partir de 29,99 €»).' },
  { pattern: /\b(?:gratis|gratuit[oa]s?|de\s+regalo|te\s+regalamos)\b/i, severity: 'critical', label: 'gratis / regalo',
    recommendation: 'Solo si la promoción está verificada; si no, quítalo.' },
  { pattern: /(?:^|[\s(])-\s?\d{1,2}\s?%|\bhasta\s+(?:un\s+)?-?\d{1,2}\s?%|\b\d{1,2}\s?%\s*(?:de\s+)?(?:dto|descuento)\b/i, severity: 'critical', label: 'descuento',
    recommendation: 'Solo con el porcentaje verificado en la web o en el brief.' },
  { pattern: /\bahorra(?:s|r)?\s+(?:hasta\s+)?\d/i, severity: 'critical', label: 'ahorra X',
    recommendation: 'Cifra de ahorro sin fuente: quítala o pon la verificada.' },
  { pattern: /\bsolo\s+hoy\b|\b[úu]ltimas\s+unidades\b|\bagot[áa]ndose\b|\bquedan\s+pocas?\b|\bpor\s+tiempo\s+limitado\b|\bhasta\s+agotar\s+(?:existencias|stock)\b/i, severity: 'critical', label: 'urgencia',
    recommendation: 'Urgencia o escasez solo si la fecha o el stock están confirmados.' },
  { pattern: /\bprecio\s+(?:m[áa]s\s+bajo|m[íi]nimo)\b|\bal\s+mejor\s+precio\b/i, severity: 'critical', label: 'precio más bajo',
    recommendation: 'Comparativo de precio sin respaldo: usa el precio verificado sin calificativo.' },
  { pattern: /\bel\s+m[áa]s\s+vendid[oa]\b|\bn[º°o]\.?\s?1\b|\bn[úu]mero\s+(?:1|uno)\b|\bbest\s?seller\b/i, severity: 'high', label: 'el más vendido / nº 1',
    recommendation: 'Comparativo sin evidencia: quítalo salvo que la marca lo publique.' },
];

export const ALL_CLAIM_RULES: ClaimRule[] = [...CLAIM_RULES, ...STUDIO_CLAIM_RULES];

const OUT_OF_PIECE = /fuera\s+de\s+la\s+pieza|pendiente|no\s+verificad|no\s+cites|no\s+pongas|no\s+se\s+encontr/i;

/** Lo verificado de un encargo: la sección «Datos verificados» del brief (hasta «Fuera de la pieza» o «Pendiente») y
 *  la ficha de producto, sin sus líneas de «no cites». Con un prompt pegado sin esa sección, el brief entero menos las
 *  líneas de pendientes (lo escribió el equipo). */
export function verifiedSource(prompt: string, productNote = ''): string {
  const brief = prompt.split('## Instrucciones de entrega')[0];
  const lines = brief.split('\n');
  const start = lines.findIndex((l) => /^#{2,3}\s*3\.?\s*Datos verificados/i.test(l));
  let picked: string[];
  if (start >= 0) {
    picked = [];
    for (const l of lines.slice(start)) {
      if (picked.length && /^#{1,3}\s/.test(l)) break;
      if (OUT_OF_PIECE.test(l)) break;
      picked.push(l);
    }
  } else {
    picked = lines.filter((l) => !OUT_OF_PIECE.test(l));
  }
  const sheet = productNote.split('\n').filter((l) => !OUT_OF_PIECE.test(l));
  return [...picked, ...sheet].join('\n').trim();
}

const norm = (s: string): string => s.toLowerCase().replace(/\s+/g, ' ');

/** ¿Está la afirmación en lo verificado? La misma expresión y, si lleva cifras, las mismas cifras. */
function isVerified(rule: ClaimRule, match: string, verified: string): boolean {
  const v = norm(verified);
  const digits = match.match(/\d+(?:[.,]\d+)?/g) || [];
  // Un porcentaje vale si ese mismo porcentaje está en lo verificado, escrito como sea («-20 %» ↔ «descuento del 20 %»).
  if (/%/.test(match) && digits.length) return digits.every((d) => new RegExp(`(^|[^\\d])${d.replace('.', '\\.')}\\s?%`).test(v));
  if (!rule.pattern.test(verified)) return false;
  if (!digits.every((d) => v.includes(d))) return false;
  // La misma expresión, no otra de la misma regla («te regalamos» no queda verificado por un «envío gratis»). Con
  // tolerancia a plurales, género y tildes: «gratuitos» vale si lo verificado dice «gratuito».
  const plain = (t: string): string => norm(t).normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const pv = plain(verified);
  const words = plain(match).split(/[^a-z0-9]+/).filter((w) => w.length >= 4);
  return words.every((w) => pv.includes(w.length > 5 ? w.slice(0, -2) : w));
}

export interface ClaimFindings {
  errors: string[];
  warnings: string[];
  verified: string[];
}

/** Afirmaciones de riesgo del texto visible. `verified` sin definir = no hay contexto (pieza suelta o antigua): todo
 *  es aviso, como hasta ahora. Formato «label» (severidad): …contexto… — recomendación (lo usa locate.js). */
export function claimFindings(text: string, verified?: string): ClaimFindings {
  const out: ClaimFindings = { errors: [], warnings: [], verified: [] };
  // Tramos ya cubiertos: «envío gratis» y el «gratis» que lleva dentro son la misma afirmación.
  const covered: [number, number][] = [];
  for (const rule of ALL_CLAIM_RULES) {
    const flags = rule.pattern.flags.includes('g') ? rule.pattern.flags : rule.pattern.flags + 'g';
    for (const m of text.matchAll(new RegExp(rule.pattern.source, flags))) {
      const i = m.index || 0;
      const end = i + m[0].length;
      if (covered.some(([a, b]) => i < b && end > a)) continue;
      covered.push([i, end]);
      const ctx = text.slice(Math.max(0, i - 40), end + 40).trim();
      if (verified !== undefined && isVerified(rule, m[0], verified)) {
        const msg = `«${m[0].trim()}» verificado en el brief o la ficha de producto.`;
        if (!out.verified.includes(msg)) out.verified.push(msg);
        continue;
      }
      const line = `«${rule.label}» (${rule.severity}): …${ctx}… — ${rule.recommendation}`;
      if (verified !== undefined && rule.severity === 'critical') out.errors.push(`${line} No está en los datos verificados: quítalo o reescríbelo sin esa afirmación.`);
      else out.warnings.push(line);
    }
  }
  return out;
}

/** La regla para los encargos (newsletter y brief). */
export const CLAIMS_PIECE_RULE = [
  '- Afirmaciones comerciales (Studio las comprueba contra lo verificado): «gratis», «envío gratis», «-X %», «ahorra X €»,',
  '  «garantizado», «sin condiciones», «solo hoy», «últimas unidades», «por tiempo limitado», «precio más bajo» y',
  '  comparativos («el mejor», «el más…», «líder», «nº 1») SOLO si están en «Datos verificados» del brief o en la ficha',
  '  de producto, con la misma cifra. Si no, reescribe sin la afirmación: un dato inventado bloquea la pieza.',
];

export const CLAIMS_BRIEF_RULE =
  '- Afirmaciones comerciales (gratis, envío gratis, descuentos, urgencia, garantías, comparativos): solo si las verificas en ' +
  'la web oficial y van en la sección 3, con su cifra y su URL; si no, a «Fuera de la pieza». La newsletter no podrá usar ' +
  'ninguna que no esté ahí.';

/** Archivo con lo verificado, en `_trabajo/` junto a la pieza (lo escribe el worker; lo lee inspect.ts). */
export const VERIFIED_FILE = 'datos-verificados.md';
