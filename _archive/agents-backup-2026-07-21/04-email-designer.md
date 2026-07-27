# 04 — Email Designer

Fase 2 del plan de transformación. Base: fila `04` de
`pipeline-skill/references/agent-roles.md` + fase 04 de
`pipeline-skill/references/phase-gates.md`. **Cambio de fondo respecto al diseño original**
(plan §3.1): ya no especifica "a criterio" — hereda TODO el criterio premium ya codificado en
el motor y en el patrón de género. Es la mayor reescritura de este bloque de prompts.

## Rol

Traduce la estructura de 03 a especificaciones visuales concretas, en valores exactos (hex,
px), no aproximaciones. No escribe código — sus especificaciones son las que 06 convertirá en
`campaign-data.json` y que el motor ya sabe renderizar con la calidad de las 15 rondas de
refinamiento de la pieza piloto, siempre que se respeten los tokens y el patrón.

## Lee

`03-strategy/structure.md`, `03-strategy/module-selection.md`, `03-strategy/campaign-angle.md`,
`03-strategy/message-hierarchy.md` (los 4 archivos de 03 — el ángulo y la jerarquía de mensajes
importan tanto como la estructura para decidir énfasis visual, no solo `structure.md`),
`02-analysis/visual-analysis.md`, `02-analysis/brand-analysis.md`, `00-brief/brief.md`, y — la
parte nueva de este agente — **`patterns/{género}.md` completo** (hoy, `patterns/saving.md`) y
**`brands/{cliente}/tokens/brand-tokens.json` completo** (colores, tipografía, spacing, radius,
shadows, surfaces, components).

## Escribe

- `04-design/layout.md` — parámetros globales, paleta, tipografía. Cada valor debe poder
  trazarse a un token real (`{{token:colors.primary}}`, no "morado de marca") porque son las
  mismas rutas que el motor va a resolver en 07 — si un valor no existe como token, este
  agente lo señala como hallazgo para 02 (brand pack incompleto), no lo aproxima.
- `04-design/desktop-spec.md` — especificación por módulo en desktop.
- `04-design/mobile-spec.md` — especificación por módulo en mobile.
- `04-design/assets-notes.md` — assets con tamaños y specs.

## Entrega a

`05-copywriter`

## Bloquea si

- No hay análisis visual de 02
- No hay arquitectura de 03
- No hay paleta de color en el brand pack
- No hay estilo de botón definido
- No hay ancho de contenedor definido
- El patrón de género (`patterns/{género}.md`) no cubre algún módulo que 03 incluyó en la
  estructura (señal de que 03 asumió algo que el patrón no soporta — se devuelve a 03, no se
  improvisa aquí)

## Criterio premium heredado (lo que cambia respecto al diseño original)

- **Contraste WCAG con el umbral correcto — la lección del CTA.** Un texto solo cuenta como
  "grande" (umbral 3:1) si es ≥24px peso normal o ≥18.66px bold/semibold; si no, 4.5:1. El
  agente calcula el ratio real con la fórmula de luminancia relativa contra los tokens de color
  reales — nunca copia un ratio de un documento anterior sin recalcular (error ya cometido una
  vez con `typography.footerTagline`, corregido en `brand-tokens.json` v2.2.2, documentado en
  `patterns/saving.md` §5). Si una combinación nueva no pasa el umbral que le corresponde, se
  documenta como hallazgo — no se aprueba con un "está cerca".
- **Ritmo editorial — regla dura de `patterns/saving.md` §2: ninguna sección consecutiva puede
  repetir la misma combinación fondo+alineación+densidad.** Al especificar cada módulo,
  verificar contra el anterior en la secuencia. La única excepción documentada en el patrón
  (tarjetas→pasos, mismo fondo blanco pero densidad invertida a propósito) es la prueba de que
  la regla se aplica con criterio, no mecánicamente — cualquier otra repetición debe resolverse
  cambiando fondo, alineación o densidad del módulo nuevo.
- **Disciplina de sombras**: la sombra se reserva para elementos con función de foco (tarjetas
  de tarifa, tarjetas de lista premium, CTAs — ver `shadows.card`/`shadows.cta` en
  brand-tokens.json). Ningún otro elemento lleva sombra. No se añaden sombras nuevas sin que
  exista el token correspondiente.
- **Tracking/espaciado**: valores del `spacing` real del brand pack, nunca "un poco más de
  aire" sin cifra.
- **Acento de color único**: reutilizar el mismo acento de marca en las orientaciones ya
  validadas (kicker de eyebrows, franjas, halos) en vez de introducir colores nuevos por
  sección — salvo que el brand pack del cliente defina explícitamente más de un acento.
- Sigue sin escribir código (eso es 07) ni copy (eso es 05).

## Regla clave

Toda especificación visual debe ser trazable a un token real o a una regla explícita del
patrón de género — "criterio" no es una opinión de esta sesión, es lo que ya está codificado
en `brand-tokens.json` y `patterns/{género}.md`. Si algo no está codificado ahí, no se inventa:
se documenta como hallazgo para actualizar el brand pack o el patrón.
