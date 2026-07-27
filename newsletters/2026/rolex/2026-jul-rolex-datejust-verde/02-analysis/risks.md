# Risks — Rolex Datejust (adaptación a email)

## Riesgos de marca

| ID | Riesgo | Impacto | Mitigación |
|----|--------|---------|------------|
| R-001 | Fuente `Helvetica Now Text` no disponible en email | Alto — la identidad tipográfica exacta no se reproduce | `@font-face` real con Archivo (sustituto citado) vía `typography.webFont`; degrada a Arial/Helvetica en clientes sin soporte (Gmail web, Outlook clásico) — mismo patrón ya validado para Worn Wear/Nike/BMW |
| R-002 | Contraste 300/700 (light/bold) puede no renderizar el peso 300 en todos los clientes de email (algunos ignoran `font-weight:300` y caen a regular/400) | Medio | Aceptado como degradación conocida — el contraste sigue existiendo entre 300/400 y 700, solo se atenúa, no desaparece |
| R-003 | Sin logo real descargable de la corona Rolex en esta ronda (SVG inline, no asset CDN) | Medio | Placeholder documentado en `assets.logo`, igual que el resto de marcas del sistema sin guía formal — Q-004 en `open-questions.md` |
| R-004 | Hero con fotografía real necesita reproducir con precisión la luz direccional dura y la profundidad de campo mínima — un hero genérico de "reloj sobre fondo blanco" traicionaría la marca tan claramente como el bug de ilustración forzada corregido para Worn Wear | Alto | `photography.treatment` en el pack es deliberadamente específico (luz, sombra, profundidad de campo) para que el prompt de `generate-hero-image` no pueda quedarse en genérico |

## Riesgos técnicos

| ID | Riesgo | Impacto | Mitigación |
|----|--------|---------|------------|
| R-005 | Generación de hero-imagen requiere `OPENAI_API_KEY` y Playwright — no disponibles en el sandbox de Cowork (sin salida de red general) | Alto (bloquea el asset, no el pipeline) | Mismo patrón que Worn Wear: se documenta el comando exacto para que el usuario lo ejecute en su máquina local; el resto del pipeline avanza con placeholder `PENDING-CDN-UPLOAD` |
| R-006 | Outlook no soporta `border-radius` → el CTA pastilla cae a rectangular en Outlook de escritorio clásico | Bajo | Ya cubierto por el bloque VML de `cta-bulletproof.html` (`arcsize="50%"`) — deuda conocida y documentada del motor, no específica de esta marca |
| R-007 | `typography.cta.letterSpacing: "normal"` — verificar que no repite el bug de letter-spacing sin unidad corregido en la ronda anterior | Bajo, ya mitigado | `"normal"` es un valor CSS válido por sí mismo (no es un número sin unidad) — no aplica el bug de `normalpx`/unitless; verificado en build |

## Riesgos de contenido

| ID | Riesgo | Impacto | Mitigación |
|----|--------|---------|------------|
| R-008 | No hay datos de producto confirmados por un cliente real (precio, referencia, disponibilidad, calibre) | Alto — NO incluirlos | Campaña de descubrimiento de marca: CTA "Descubrir el Datejust", sin datos técnicos ni precio, mismo patrón que BMW X1 |
| R-009 | Tentación de forzar el vocabulario de CTA no-píldora (`text-link`/`block`) solo para "demostrar" que el motor lo soporta | Alto si se cede — sería fabricar una diferenciación de marca sin evidencia | Ya resuelto: el pack NO declara `components.cta.style`; el hallazgo ("Rolex es 100% pastilla") queda documentado como resultado honesto, no como limitación de la prueba |
| R-010 | La campaña es `isTestCampaign` — no hay dirección ni enlaces de baja reales | Bajo | Placeholders estándar, no bloquea el avance de fase |
