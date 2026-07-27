# Brand Analysis — Rolex (observado en rolex.com/es/watches/datejust)

## Identidad de marca

Rolex se posiciona como icono atemporal, no como novedad estacional. El copy real de la ficha de producto nunca vende "lo nuevo" — vende continuidad e historia ("Presentado en 1945", "un icono de la relojería, siempre reinventado"). No hay precio visible en ninguna pantalla observada. El registro es formal (usted), sin urgencia, sin superlativos publicitarios baratos ("el mejor", "increíble") — el peso de la marca hace el trabajo, el copy solo lo enmarca.

## Personalidad

Elegante, reservada, segura de sí misma, aspiracional sin ser efusiva. La comunicación no persuade activamente — describe, y confía en que la fotografía y la calidad del objeto hagan el resto. Esto es una diferencia estructural importante frente a marcas como Nike o BMW (también en este sistema): Rolex no usa nunca modo imperativo en su copy de producto.

## Procedencia de cada dimensión

| Dimensión | Procedencia | Detalle |
|---|---|---|
| Colores | **Observado** | `getComputedStyle` + custom properties CSS (`--green`, `--dark-green`, `--rolex-gold`, `--light-black`, etc.) sobre rolex.com/es/watches/datejust, 2026-07-25 |
| Tipografía | **Observado** | `getComputedStyle` sobre H1, párrafo editorial, botón CTA, etiqueta de acordeón — familia real "Helvetica Now Text" (no embebible), pesos 300/700 reales |
| Forma de CTA | **Observado** | `border-radius:50px` en el botón "Configurar" — pastilla real, no inferencia |
| Fotografía | **Observado** | Scroll completo de la página — macro de producto, luz de estudio direccional, sin personas |
| Iconografía | **Observado** | Únicos SVG del sitio son iconos de interfaz (menú/búsqueda/localizador/favoritos), cero iconos de contenido |
| Ritmo de voz | **Observado** | Copy real citado en `brands/rolex/tokens/brand-tokens.json` → `voice.rhythm.examples` |
| Ritmo estructural | **Observado** | Scroll completo documentado en `layout.contentRhythm` del pack (6 tipos de sección, 2 marcadas explícitamente no traducibles) |

Ninguna dimensión de este pack es inferencia sin marcar — donde no hubo evidencia directa (logo descargable, ej.), se declaró como pendiente en `00-brief/open-questions.md` (Q-004), no como una aproximación.

## Implicación directa para el diseño de la campaña

1. El CTA de la campaña debe ser la pastilla sólida estándar del motor (`cta-bulletproof.html`) — no hay evidencia para justificar `text-link` ni `block`.
2. Ningún módulo debe usar iconGlyph/emoji — todos los módulos con campo de icono deben usar la variante `-sin-icono`.
3. La estructura debe ejercitar composición asimétrica (`layout.sectionStyle: "asimetrico"` en el pack) en al menos hero y cierre — es el patrón real observado, no una preferencia de diseño.
4. El copy debe evitar imperativos y exclamaciones — afirmación declarativa, formal.
5. Si la campaña usa `hero-imagen`, el prompt de generación debe seguir `photography.treatment` al detalle (luz direccional, sombra diagonal, profundidad de campo mínima, sin personas) — es el elemento más distintivo y más fácil de generar mal (ilustración genérica) de toda la marca.
