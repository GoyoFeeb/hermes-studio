# validate-claims — Rule Reference (29 rules)

## Severity levels

| Severity | Normal mode | Production mode |
|---|---|---|
| Critical (🔴) | Error → exit 1 | Error → exit 1 |
| High (🟠) | Error → exit 1 | Error → exit 1 |
| Medium (🟡) | Warning → exit 0 | Error → exit 1 |

## 🔴 Critical (9) — financial/legal claims

| Pattern | Label | Recommendation |
|---|---|---|
| `interes(es)?\s*cero` | intereses cero | Usar TAE/TIN real. Validar con legal. |
| `sin\s*intereses?` | sin intereses | No usar sin validación financiera. |
| `financiación\s*asegurada` | financiación asegurada | No prometer aprobación financiera. |
| `aprobación\s*inmediata` | aprobación inmediata | No prometer sin verificación de crédito. |
| `aprobado\s*al\s*instante` | aprobado al instante | No prometer aprobación inmediata. |
| `garantizad[oa]` | garantizado | Evitar salvo confirmación explícita. |
| `sin\s*condiciones?` | sin condiciones | Toda oferta tiene condiciones. |
| `entrega\s*garantizada` | entrega garantizada | No prometer plazos no confirmados. |
| `stock\s*garantizado` | stock garantizado | No prometer disponibilidad. |

## 🟠 High (14) — technical / unvalidated claims

| Pattern | Label | Recommendation |
|---|---|---|
| `tracción\s*trasera` | tracción trasera | Especificación técnica. Validar con cliente. |
| `tracción\s*integral` | tracción integral | Especificación técnica. Validar con cliente. |
| `potencia\b(?: máximo\|nominal\|fiscal)?` | potencia | Cifra técnica. Validar con cliente. |
| `consumo\s+(?:de\s+)?(?:combustible\|carburante\|energ[íi]a\|el[ée]ctrico)` | consumo (técnico) | Cifra técnica. Validar con cliente. |
| `velocidad\s*máxima` | velocidad máxima | Especificación técnica. Validar con cliente. |
| `0\s*a\s*100` | 0 a 100 | Prestación concreta. Validar con cliente. |
| `acelera\s*de` | acelera de | Prestación concreta. Validar con cliente. |
| `t[ée]cnica?\s*de\s*última\s*generación` | última generación | Claim fuerte. Usar "tecnología [marca]". |
| `experiencia\s*de\s*conducción\s*única` | experiencia única | Usar "experiencia dinámica". |
| `el\s*m[áa]s\s*deportivo` | el más deportivo | Comparativo. No usar sin evidencia. |
| `el\s*m[áa]s\s*eficiente` | el más eficiente | Comparativo. No usar sin evidencia. |
| `l[íi]der\s*del\s*segmento` | líder del segmento | Claim no respaldado. |
| `prestaciones?\s*concretas?` | prestaciones concretas | Validar con cliente. |
| `mejor\s*(del\s*mercado\|en\s*su\s*clase\|relaci[óo]n\s*calidad\|precio)` | mejor (comparativo) | Comparativo no respaldado. |

## 🟡 Medium (6) — marketing claims

| Pattern | Label | Recommendation |
|---|---|---|
| `edición\s*limitada` | edición limitada | Solo si es real y confirmada. |
| `última\s*oportunidad` | última oportunidad | Urgencia falsa. Evitar. |
| `exclusivo\s*por\s*tiempo\s*limitado` | exclusivo tiempo limitado | Validar con cliente. |
| `sin\s*letra\s*pequeña` | sin letra pequeña | Toda oferta tiene condiciones. |
| `mejor\s*oferta` | mejor oferta | Usar "oferta" sin calificativo. |
| `mejor\s*precio` | mejor precio | Usar "precio" sin calificativo. |

## Common false-positive exclusions

- **`consumo`** standalone (Spanish for "consumer/consumption") — excluded unless followed by `combustible`, `carburante`, `energía`, or `eléctrico`. "Decisiones de consumo" (consumer decisions) is safe.
- **`potencia`** standalone — only flagged if followed by `máxima`, `nominal`, or `fiscal`.
- Claims inside metadata.warning, production-blockers, or technical notes are NOT scanned — only active content (subjectLine, preheader, content.*, cta.text, link labels) is checked.

## Adding new rules

Rules are `ClaimRule` objects with:
- `pattern`: RegExp (case-insensitive, applied with `.test()`)
- `severity`: `'critical' | 'high' | 'medium'`
- `label`: short human-readable name
- `recommendation`: what to use instead

Place in `scripts/validate-claims.ts` in the `CLAIM_RULES` array.
