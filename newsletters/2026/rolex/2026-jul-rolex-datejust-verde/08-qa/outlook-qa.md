# Outlook QA (VML/mso) — Rolex Datejust "Una fecha para recordar"

**Sin acceso real a Outlook de escritorio/Litmus en este entorno** — se declara como advertencia,
no se finge verificación (mismo criterio que el resto del sistema aplica a esta limitación desde
antes de esta campaña).

## Verificación estática del HTML fuente

- **Bloques VML (`v:roundrect`):** 6 presentes en `final.html` — uno por cada CTA renderizado con `cta-bulletproof.html`/`cta-secondary-bulletproof.html` (hero, intro-cta-asimetrico ×1 secundario, banda-cierre-asimetrico), cada uno con su condicional `<!--[if mso]>...<![endif]-->` correctamente emparejado.
- **`mso-line-height-rule:exactly`** presente en los bloques de texto principales (H1, subtítulo, CTAs) — mitigación estándar del motor para el interlineado de Outlook clásico.
- **Colores VML:** `strokecolor`/`fillcolor` de los bloques `v:roundrect` usan `{{token:colors.ctaBackground}}` → `#127749`, coincide con el fallback HTML del mismo botón — sin discrepancia de color entre la versión VML y la versión estándar.
- **Deuda conocida heredada (no específica de Rolex):** el bloque VML sigue con `height:52px;width:280px` fijos para todas las marcas (ver comentario de cabecera de `cta-bulletproof.html`) — en Rolex, cuyo padding real es `16px 32px` (más generoso que el de otras marcas), la cápsula de Outlook clásico puede quedar ligeramente menor que el botón HTML real. Mismo riesgo ya documentado y aceptado como deuda técnica del motor en `engine/CHANGELOG.md`, no un problema nuevo introducido por esta campaña.

## `@font-face` en Outlook clásico

Outlook de escritorio clásico (motor de render Word) ignora `@font-face` — el CTA/H1/eyebrow (peso 700) y el body (peso 300) caen al fallback `Helvetica, Arial, sans-serif` de `typography.displayFont`. Es degradación esperada, documentada en `brands/rolex/tokens/brand-tokens.json` → `typography.family.note`, no una regresión.

## Hallazgos

Ninguno nuevo. La única deuda (tamaño fijo del VML) es heredada del motor y ya está documentada — no bloquea, no es específica de esta campaña.
