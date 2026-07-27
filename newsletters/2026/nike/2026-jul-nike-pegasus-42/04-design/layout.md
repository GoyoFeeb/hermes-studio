# Layout — Nike Pegasus 42

## Parámetros globales

| Parámetro | Valor | Token/Origen |
|-----------|-------|-------------|
| Email width | 600px | `layout.emailWidth` |
| Mobile breakpoint | 599px | `layout.mobileBreakpoint` |
| Sección | Centrada | `layout.sectionStyle: "centrado"` |
| Fondo global | #FFFFFF | `surfaces.white` |
| Fuente título | Helvetica, Arial, sans-serif | `typography.displayFont` |
| Fuente cuerpo | Helvetica, Arial, sans-serif | `typography.family` |

## Paleta de colores aplicada por módulo

| Token | Hex | Uso |
|-------|-----|-----|
| `colors.primary` | #111111 | Títulos, header-logo.label, body de beneficios |
| `colors.light` | #111111 | header-logo label text (eyebrow/kicker) |
| `colors.text.body` | #707072 | Texto de cuerpo secundario |
| `colors.text.secondary` | #707072 | Subtítulos, intro-cta body, footer text |
| `colors.onBrandSecondary` | #A0A0A0 | Subtítulo sobre fondos oscuros |
| `colors.ctaBackground` | #111111 | Fondo del botón CTA |
| `colors.ctaText` | #FFFFFF | Texto del botón CTA |
| `colors.deep` | #111111 | Fondo de banda-cierre |
| `colors.borders.card` | #E0E0E0 | Línea separadora header-logo |
| `surfaces.sectionLila` | #F5F5F5 | Fondo de card-tarifa-3 |
| `surfaces.global` | #F5F5F5 | Fondo del footer |

## Ritmo editorial (verificado)

| # | Módulo | Fondo | Alineación | Densidad |
|---|--------|-------|-----------|----------|
| 1 | header-logo | #FFFFFF | Centrada | Baja |
| 2 | hero-imagen | #111111 (primary) + imagen | Centrada | Media |
| 3 | intro-cta | #FFFFFF | Centrada | Baja |
| 4 | card-tarifa-3 | #F5F5F5 (sectionLila) | Centrada | Media |
| 5 | banda-cierre | #111111 (deep) | Centrada | Media |
| 6 | footer | #F5F5F5 (global) | Centrada | Baja |

**Regla dura cumplida:** ninguna sección consecutiva repite fondo+alineación+densidad.
