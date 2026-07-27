/**
 * lib/claim-rules.ts — Las 29 reglas de claims prohibidos/de riesgo, extraídas de
 * validate-claims.ts (prompt 21, F3, `prompts-fase3-verificacion/`) para poder reutilizarse
 * tal cual desde el gate del motor (`production-gate-motor.ts`) sin duplicar la lista y
 * arriesgarse a que las dos copias diverjan con el tiempo.
 *
 * Refactorización sin efecto observable: `validate-claims.ts` importa `CLAIM_RULES` y
 * `scanField` de aquí en vez de definirlos localmente — mismo comportamiento, mismas 29
 * reglas, mismo output. Verificado en el prompt 21 corriendo `validate-claims.ts` antes/después
 * del cambio contra la misma campaña y comparando el resultado byte a byte.
 */

export interface ClaimRule {
  pattern: RegExp;
  severity: 'critical' | 'high' | 'medium';
  label: string;
  recommendation: string;
}

export const CLAIM_RULES: ClaimRule[] = [
  // ── Críticos: financieros/legales ──────────────────────────────────────
  { pattern: /\binteres(es)?\s*cero\b/i, severity: 'critical', label: 'intereses cero',
    recommendation: 'Usar TAE/TIN real sin prometer "cero". Validar con legal.' },
  { pattern: /\bsin\s*intereses?\b/i, severity: 'critical', label: 'sin intereses',
    recommendation: 'No usar sin validación financiera. Preferir TAE/TIN real.' },
  { pattern: /\bfinanciación\s*asegurada\b/i, severity: 'critical', label: 'financiación asegurada',
    recommendation: 'No prometer aprobación financiera.' },
  { pattern: /\baprobación\s*inmediata\b/i, severity: 'critical', label: 'aprobación inmediata',
    recommendation: 'No prometer aprobación sin verificación de crédito.' },
  { pattern: /\baprobado\s*al\s*instante\b/i, severity: 'critical', label: 'aprobado al instante',
    recommendation: 'No prometer aprobación inmediata.' },
  { pattern: /\bgarantizad[oa]\b/i, severity: 'critical', label: 'garantizado',
    recommendation: 'Evitar salvo que el brief confirme garantía explícita.' },
  { pattern: /\bsin\s*condiciones?\b/i, severity: 'critical', label: 'sin condiciones',
    recommendation: 'No usar. Toda oferta tiene condiciones.' },
  { pattern: /\bentrega\s*garantizada\b/i, severity: 'critical', label: 'entrega garantizada',
    recommendation: 'No prometer plazos de entrega no confirmados.' },
  { pattern: /\bstock\s*garantizado\b/i, severity: 'critical', label: 'stock garantizado',
    recommendation: 'No prometer disponibilidad no confirmada.' },

  // ── Altos: técnicos no validados ───────────────────────────────────────
  { pattern: /\btracción\s*trasera\b/i, severity: 'high', label: 'tracción trasera',
    recommendation: 'Especificación técnica. Validar con cliente antes de usar.' },
  { pattern: /\btracción\s*integral\b/i, severity: 'high', label: 'tracción integral',
    recommendation: 'Especificación técnica. Validar con cliente antes de usar.' },
  { pattern: /\bpotencia\b(?:\s+(?:máxima|nominal|fiscal))?/i, severity: 'high', label: 'potencia',
    recommendation: 'Cifra técnica. No usar sin validación del cliente.' },
  { pattern: /\bconsumo\s+(?:de\s+)?(?:combustible|carburante|energ[íi]a|el[ée]ctrico)\b/i, severity: 'high', label: 'consumo',
    recommendation: 'Cifra técnica. No usar sin validación del cliente.' },
  { pattern: /\bvelocidad\s*máxima\b/i, severity: 'high', label: 'velocidad máxima',
    recommendation: 'Especificación técnica. Validar con cliente.' },
  { pattern: /\b0\s*a\s*100\b/i, severity: 'high', label: '0 a 100',
    recommendation: 'Prestación concreta. Validar con cliente.' },
  { pattern: /\bacelera\s*de\b/i, severity: 'high', label: 'acelera de',
    recommendation: 'Prestación concreta. Validar con cliente.' },
  { pattern: /\bt[ée]cnica?\s*de\s*última\s*generación\b/i, severity: 'high', label: 'última generación',
    recommendation: 'Claim fuerte no validado. Usar "tecnología [marca]" en su lugar.' },
  { pattern: /\bexperiencia\s*de\s*conducción\s*única\b/i, severity: 'high', label: 'experiencia única',
    recommendation: 'Claim aspiracional no validado. Usar "experiencia dinámica".' },
  { pattern: /\bel\s*m[áa]s\s*deportivo\b/i, severity: 'high', label: 'el más deportivo',
    recommendation: 'Comparativo no respaldado. No usar sin evidencia.' },
  { pattern: /\bel\s*m[áa]s\s*eficiente\b/i, severity: 'high', label: 'el más eficiente',
    recommendation: 'Comparativo no respaldado. No usar sin evidencia.' },
  { pattern: /\bl[íi]der\s*del\s*segmento\b/i, severity: 'high', label: 'líder del segmento',
    recommendation: 'Claim de liderazgo no respaldado.' },
  { pattern: /\bprestaciones?\s*concretas?\b/i, severity: 'high', label: 'prestaciones concretas',
    recommendation: 'Especificación técnica. Validar con cliente.' },
  { pattern: /\bmejor\s*(del\s*mercado|en\s*su\s*clase|relaci[óo]n\s*calidad|precio)\b/i,
    severity: 'high', label: 'mejor (comparativo)',
    recommendation: 'Comparativo no respaldado. No usar sin evidencia.' },

  // ── Medios: marketing fuerte ──────────────────────────────────────────
  { pattern: /\bedición\s*limitada\b/i, severity: 'medium', label: 'edición limitada',
    recommendation: 'Usar solo si el producto tiene una edición limitada real confirmada.' },
  { pattern: /\búltima\s*oportunidad\b/i, severity: 'medium', label: 'última oportunidad',
    recommendation: 'Urgencia falsa. Evitar salvo que el brief confirme escasez real.' },
  { pattern: /\bexclusivo\s*por\s*tiempo\s*limitado\b/i, severity: 'medium', label: 'exclusivo tiempo limitado',
    recommendation: 'Urgencia comercial. Validar con cliente antes de usar.' },
  { pattern: /\bsin\s*letra\s*pequeña\b/i, severity: 'medium', label: 'sin letra pequeña',
    recommendation: 'Puede inducir a error. Toda oferta tiene condiciones.' },
  { pattern: /\bmejor\s*oferta\b/i, severity: 'medium', label: 'mejor oferta',
    recommendation: 'Comparativo no respaldado. Usar "oferta" sin calificativo.' },
  { pattern: /\bmejor\s*precio\b/i, severity: 'medium', label: 'mejor precio',
    recommendation: 'Comparativo no respaldado. Usar "precio" sin calificativo.' },
];

export interface MatchResult {
  rule: ClaimRule;
  fieldPath: string;
  contextText: string;
}

export function scanField(fieldPath: string, value: string | undefined | null, matches: MatchResult[]): void {
  if (!value || typeof value !== 'string') return;
  for (const rule of CLAIM_RULES) {
    const match = value.match(rule.pattern);
    if (match) {
      const idx = match.index || 0;
      const start = Math.max(0, idx - 30);
      const end = Math.min(value.length, idx + match[0].length + 30);
      const context = (start > 0 ? '...' : '') + value.substring(start, end) + (end < value.length ? '...' : '');
      matches.push({ rule, fieldPath, contextText: context });
    }
  }
}
