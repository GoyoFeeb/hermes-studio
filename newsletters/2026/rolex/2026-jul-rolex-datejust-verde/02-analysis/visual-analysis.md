# Visual Analysis — Rolex Datejust (observado en rolex.com/es/watches/datejust)

## Paleta de colores (computada — custom properties CSS + getComputedStyle)

| Uso | Color | Hex | Observado en |
|-----|-------|-----|-------------|
| CTA principal / acento de marca | `rgb(18, 119, 73)` | `#127749` | `--green`, custom property CSS del sitio; fondo real del botón "Configurar" |
| Verde oscuro (hover/dark surfaces) | `rgb(11, 62, 39)` | `#0B3E27` | `--dark-green` |
| Verde claro (acento secundario) | `rgb(36, 154, 100)` | `#249A64` | `--light-green` |
| Oro Rolex (acento de material, NO de UI) | `rgb(146, 108, 28)` | `#926C1C` | `--rolex-gold` |
| Texto principal | `rgb(33, 33, 33)` | `#212121` | `--light-black`; H1 y body sobre fondo blanco |
| Texto secundario/body | `rgb(118, 118, 118)` | `#767676` | `--dark-grey` |
| Borde sutil | `rgb(212, 212, 212)` | `#D4D4D4` | `--grey`; borde del CTA outline |
| Fondo alterno claro | `rgb(248, 248, 248)` | `#F8F8F8` | `--light-grey` |
| Fondo alterno claro 2 | `rgb(236, 236, 236)` | `#ECECEC` | `--another-light-grey` |
| Blanco puro | `rgb(255, 255, 255)` | `#FFFFFF` | `--pure-white` |

## Tipografía (computada con getComputedStyle)

| Elemento | Fuente real | Tamaño | Peso | Letter-spacing |
|----------|--------|--------|------|------|
| H1 ("Datejust") | `"Helvetica Now Text", Helvetica, Arial, sans-serif` | 83px (desktop grande) | 700 | normal |
| Eyebrow ("OYSTER PERPETUAL") | misma familia | ~14px (observado visualmente, mayúsculas, tracking amplio) | ~700 (visual) | ancho (observado visualmente) |
| Body editorial | misma familia | 19.4px | **300 (light)** | normal |
| CTA / etiquetas de acordeón | misma familia | 14-16px | 700 | normal |

**Nota email:** `Helvetica Now Text` tiene licencia comercial (Monotype), no embebible. Sustituto real elegido: **Archivo** (Google Fonts) — ver `brands/rolex/tokens/brand-tokens.json` → `typography.webFont.note` para la cita completa de por qué Archivo y no Inter (ya usado para Nike, que corre sobre la misma fuente real).

**Firma tipográfica real de la marca:** contraste deliberado 300/700 — titulares y CTA en negrita, cuerpo de texto en light. Es un patrón consistente en las 4 instancias observadas, no una única muestra — se traduce directamente a `typography.weights.regular: 300` en el pack.

## Botones (computado)

| Propiedad | Valor real observado |
|-----------|-------|
| Background | `#127749` (verde Rolex sólido) |
| Text color | `#FFFFFF` |
| Font size | 16px |
| Font weight | 700 |
| Border radius | **50px — pastilla completa** |
| Padding | 8px 16px (botón de navegación, pequeño); variantes mayores en CTA de página tienen más padding |
| Shape | Pastilla (pill) — confirmado, no redondeado parcial |
| Variante secundaria | Translúcida/outline sobre fotografía ("Ver el vídeo") — misma forma de pastilla, tratamiento distinto |
| Text transform | none |

**No se encontró ningún CTA de texto plano ni de bloque de esquina recta en toda la navegación observada** — el vocabulario de forma de Rolex es monolíticamente pastilla.

## Fotografía

Macro de producto, estudio, una sola fuente de luz direccional dura, sombra diagonal larga sobre superficie neutra gris-azulada, profundidad de campo mínima (solo bisel/esfera/ventanilla de fecha en foco), reflejos reales de metal y cristal, sin personas ni contexto lifestyle. Detalle completo en `brands/rolex/tokens/brand-tokens.json` → `photography.treatment`.

## Composición de la newsletter (email)

- **Email width:** 600px estándar
- **Header:** corona Rolex centrada (SVG dorado/negro), pequeña
- **Hero:** fotografía macro del reloj a sangre, eyebrow + H1 superpuestos, composición asimétrica en la sección editorial siguiente (título izquierda, cuerpo derecha)
- **Alternancia:** blanco / gris muy claro (#F8F8F8) — sin secciones oscuras salvo un posible cierre en verde oscuro (#0B3E27) como acento final, coherente con el patrón `banda-cierre` ya soportado
- **Sin iconos en ningún módulo** — todo módulo con campo de icono debe usar variante `-sin-icono`
- **Sin bordes de tarjeta, sin sombras** (`shadows.card: "none"`) — la fotografía y el peso tipográfico son el único adorno, mismo principio que BMW/Nike pero sin siquiera iconos de interfaz decorativos
