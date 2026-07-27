# Layout — Nike Pegasus 42 Women

## Estructura general
- Ancho máximo: 600px
- Fondo de página: `#111111` (colors.primary — pero el shell usa blanco como base)
- Columnas: centradas (layout.sectionStyle: "centrado")

## Secuencia

### 1. Header-logo
- **Fondo**: `#FFFFFF` (blanco)
- **Logo**: Nike swoosh — usar placeholder HTTPS hasta tener URL real
- **Dimensiones logo**: 80×28px (del brand pack)
- **Padding**: 20px top/bottom

### 2. Hero-imagen
- **Estructura**: Banner de imagen (600×350px, decorativo, sin texto dentro) + Marca como texto + H1 + Subtítulo + CTA
- **Fondo del bloque de texto**: `#111111` (colors.primary) con `background-image:none` (gradients.heroBackground = "none")
- **Display font**: `Helvetica, Arial, sans-serif` (typography.displayFont)
- **Marca**: 24px, 800 weight, blanco, centrado
- **H1**: 28px (mobile: 22px), 800 weight, blanco, centrado
- **Subtítulo**: 15px, 400 weight, `#A0A0A0` (onBrandSecondary), centrado
- **CTA**: 16px, 500 weight, borde-radius 30px, fondo `#111111`, texto `#FFFFFF`
- **Aire**: 30px/38px arriba/abajo del bloque de texto
- **Scrim**: NO aplica — el texto está en filas separadas DEBAJO de la foto, no superpuesto

### 3. Columns-3-beneficios-sin-icono
- **Fondo sección**: `#F5F5F5` (surfaces.sectionLila)
- **Título sección**: 22px, 800 weight, `#111111`, centrado
- **3 tarjetas**: layout 33/33/33
- **Cada tarjeta**: `background:#FFFFFF`, `border: 1px solid #E0E0E0` (borders.card), `border-radius: 0` (radius.card: 0), `box-shadow:none` (shadows.card: "none")
- **Título tarjeta**: 16px, 500 weight, `#111111`
- **Cuerpo tarjeta**: 14px, 400 weight, `#707072` (text.secondary)
- **Sin iconos** — es la variante `-sin-icono` deliberadamente
- **Padding sección**: 52px top, 28px bottom, 24px lateral
- **Highlight** (si se usa): texto a todo el ancho debajo de las 3 columnas

### 4. Banda-cierre
- **Fondo**: `#111111` (colors.deep)
- **Título**: 22px, 800 weight, blanco, centrado
- **Subtítulo**: 15px, 400 weight, `#A0A0A0` (onBrandSecondary), centrado
- **CTA**: mismo estilo que el hero
- **Padding**: 32-40px

### 5. Footer
- **Fondo**: `#F5F5F5` (surfaces.global)
- **Texto legal**: 11px, `#707072` (footer.legal.color)
- **Marca**: 12px, 500 weight, `#111111`
- **Separador**: `#D2D2D7` (footerSeparator)
- **Enlaces**: `[UNSUBSCRIBE_LINK]`, `[PREFERENCES_LINK]` (tokens de plataforma)

## Verificación de ritmo
| # | Sección | Fondo | Alineación | Densidad |
|---|---|---|---|---|
| 1 | Header | Blanco | Centrada | Baja |
| 2 | Hero | Imagen + #111111 | Centrada | Alta |
| 3 | Beneficios | #F5F5F5 | Centrada | Media |
| 4 | Cierre | #111111 | Centrada | Media |
| 5 | Footer | #F5F5F5 | Centrada | Baja |

✅ Sin repetición de fondo+alineación+densidad en consecutivos.
