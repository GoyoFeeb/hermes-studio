# Layout — BMW X1 "Descubre"

## Parámetros globales

| Parámetro | Valor | Token/Origen |
|-----------|-------|-------------|
| Email width | 600px | `layout.emailWidth` |
| Mobile breakpoint | 599px | `layout.mobileBreakpoint` |
| Sección | Centrada | `layout.sectionStyle: "centrado"` |
| Fondo global | #FFFFFF | `surfaces.global` |
| Fuente título | Arial, Helvetica, sans-serif | `typography.displayFont` |
| Fuente cuerpo | Arial, Helvetica, sans-serif | `typography.family` |

## Paleta de colores aplicada por módulo

La paleta completa está en `brands/bmw/tokens/brand-tokens.json` — aquí solo se listan los tokens que cada módulo consume.

| Token | Hex | Uso |
|-------|-----|-----|
| `colors.primary` | #000000 | Títulos, texto header-logo.label, texto benefitsSection.title, texto banda-cierre (no se usa como fondo — fondo del hero-imagen sí) |
| `colors.light` | #1C69D4 | header-logo label text (eyebrow/kicker), acento decorativo |
| `colors.text.body` | #262626 | Texto de cuerpo (body, benefits.body) |
| `colors.text.secondary` | #6F6F6F | Subtítulos, intro-cta body, footer text |
| `colors.onBrandSecondary` | #A0A0A0 | Subtítulo sobre fondos oscuros (hero-imagen si aplica, banda-cierre body) |
| `colors.ctaBackground` | #1C69D4 | Fondo del botón CTA |
| `colors.ctaText` | #FFFFFF | Texto del botón CTA |
| `colors.deep` | #000000 | Fondo de banda-cierre |
| `colors.borders.card` | #D2D2D7 | Línea separadora debajo de header-logo |
| `surfaces.sectionLila` | #F4F4F4 | Fondo de columns-3-beneficios |
| `surfaces.global` | #F4F4F4 | Fondo del footer |
| `surfaces.white` | #FFFFFF | Fondo de header-logo, intro-cta |

## Ritmo editorial (verificado)

| # | Módulo | Fondo | Alineación | Densidad |
|---|--------|-------|-----------|----------|
| 1 | header-logo | #FFFFFF | Centrada | Baja |
| 2 | hero-imagen | #000000 (primary) + imagen | Centrada | Media |
| 3 | intro-cta | #FFFFFF | Centrada | Baja |
| 4 | columns-3-beneficios | #F4F4F4 (sectionLila) | Centrada | Media |
| 5 | banda-cierre | #000000 (deep) | Centrada | Media |
| 6 | footer | #F4F4F4 (global) | Centrada | Baja |

**Regla dura cumplida:** ninguna sección consecutiva repite fondo+alineación+densidad.
1→2: fondo cambia (blanco→negro), densidad sube
2→3: fondo cambia (negro→blanco), densidad baja
3→4: fondo cambia (blanco→gris), densidad sube
4→5: fondo cambia (gris→negro), densidad igual (aceptable porque fondo es la variable principal)
5→6: fondo cambia (negro→gris), densidad baja
