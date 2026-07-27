# Brief — BMW Experiencia Premium

## Información general

| Campo | Valor |
|-------|-------|
| Cliente | BMW |
| Campaña | `2026-ago-bmw-experiencia-premium` |
| Fecha de envío estimada | 2026-08-01 |
| Tipo | Brand awareness / Aspiracional |
| Patrón sugerido | `fotografia-primero` (confirmado por campañas BMW existentes) |
| Hero | `hero-imagen` (fotografía protagonista — flujo de generación de imagen) |

## Objetivo

Generar una newsletter HTML premium que transmita la identidad de BMW: ingeniería, precisión, sofisticación, tecnología, deportividad premium y lujo contenido. La pieza debe evocar la experiencia BMW incluso sin mostrar el logotipo.

## Dirección de arte solicitada

- Precisión, minimalismo, elegancia
- Tecnología, deportividad premium, lujo contenido
- Limpieza visual, equilibrio, abundante espacio en blanco
- Jerarquía clara — cada elemento con una función
- Fotografía como elemento protagonista
- Sin decoración innecesaria

## Paleta visual solicitada por el usuario

> ⚠️ Los valores que entran en conflicto con el brand pack verificado se resolverán en la fase 02. Ver `brand-analysis.md` para la tabla de discrepancias.

| Color solicitado | Código |
|------------------|--------|
| Blanco | `#FFFFFF` |
| Negro suave | `#111111` |
| Gris oscuro | `#3A3A3A` |
| Gris medio | `#6D6D6D` |
| Gris claro | `#E6E6E6` |
| Gris apoyo | `#F7F7F7` |
| Azul BMW (acento) | `#0066B1` |

**Nota crítica**: El brand pack verificado de BMW (`brands/bmw/tokens/brand-tokens.json` v2.3.1) documenta que `#0066B1` fue explícitamente rechazado como "inventado, no verificado" en su `_changelog` v2.2.0. El CTA real observado en bmw.es es `#1C69D4`. La fuente de verdad es el brand pack.

## Tipografía solicitada

- BMW Type Next (no disponible para email → usar Helvetica Neue, Helvetica, Arial, sans-serif)
- El brand pack usa Titillium Web como display font (webfont importada vía Google Fonts) para heads
- Pesos: 300, 400, 500 (evitar negritas excesivas)

## CTA principal

- Label: Pendiente de definir por Copywriter
- URL candidata: `https://www.bmw.es/es/home.html` — página principal de BMW España (pendiente de confirmación)
- Estilo botón: minimalista, altura visual 48-56px, radio 0px, borde fino (ver brand pack para fuente de verdad)

## Restricciones conocidas

- Es campaña de prueba (`isTestCampaign: true`)
- No inventar claims, URLs, assets CDN ni datos legales
- Datos de fuente pública = "referencia oficial localizada, pendiente de aprobación cliente"
- `productionReady: false` hasta que QA, assets, legal y ESP estén cerrados
- Sin claims de producto no verificados textualmente en bmw.es
- URL principal pendiente de confirmación (ver open-questions.md)
