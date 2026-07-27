# Layout — Rolex Datejust "Una fecha para recordar"

## Parámetros globales

| Parámetro | Valor | Token/Origen |
|-----------|-------|-------------|
| Email width | 600px | `layout.emailWidth` |
| Mobile breakpoint | 599px | `layout.mobileBreakpoint` |
| Sección | Asimétrica | `layout.sectionStyle: "asimetrico"` — evidencia real en `02-analysis/visual-analysis.md` |
| Fondo global | #F8F8F8 | `surfaces.global` |
| Fuente título/CTA | 'Archivo', Helvetica, Arial, sans-serif (peso 700) | `typography.displayFont` + `typography.webFont` |
| Fuente cuerpo | 'Archivo', Helvetica, Arial, sans-serif (peso 300) | mismo `webFont`, peso ligero — contraste 300/700 es firma real de la marca |

## Paleta de colores aplicada por módulo

Paleta completa en `brands/rolex/tokens/brand-tokens.json` — aquí solo los tokens que cada módulo consume.

| Token | Hex | Uso |
|-------|-----|-----|
| `colors.primary` | #127749 | Fondo del bloque de texto de hero-imagen, CTA, acentos de título |
| `colors.ctaBackground` | #127749 | Fondo del botón CTA (pastilla sólida) |
| `colors.ctaText` | #FFFFFF | Texto del botón CTA |
| `colors.deep` | #0B3E27 | Fondo de banda-cierre-asimetrico |
| `colors.textPrimary` / `colors.text.primary` | #212121 | Títulos, H2, H3 |
| `colors.text.secondary` | #666666 (corregido, ver `_changelog` del pack — v1.0.1) | Body de intro-cta-asimetrico, columns-3-beneficios-sin-icono, footer |
| `colors.onBrandSecondary` | #ECECEC (corregido, ver `_changelog` del pack — v1.0.1) | Subtítulo de hero-imagen sobre `colors.primary`; body de banda-cierre-asimetrico sobre `colors.deep` |
| `surfaces.sectionLila` | #F8F8F8 | Fondo de columns-3-beneficios-sin-icono |
| `surfaces.global` | #F8F8F8 | Fondo del footer |
| `surfaces.white` | #FFFFFF | Fondo de header-logo, intro-cta-asimetrico |
| `colors.borders.card` | #D4D4D4 | Borde de la insignia de highlight en columns-3-beneficios-sin-icono |

## Ritmo editorial (verificado)

| # | Módulo | Fondo | Alineación | Densidad |
|---|--------|-------|-----------|----------|
| 1 | header-logo | #FFFFFF | Centrada | Baja |
| 2 | hero-imagen | Imagen a sangre + #127749 (primary) debajo | Centrada | Alta |
| 3 | intro-cta-asimetrico | #FFFFFF | Asimétrica | Baja |
| 4 | columns-3-beneficios-sin-icono | #F8F8F8 (sectionLila) | Centrada | Media |
| 5 | banda-cierre-asimetrico | #0B3E27 (deep) | Asimétrica | Media |
| 6 | footer | #F8F8F8 (global) | Centrada | Baja |

**Regla dura cumplida:** ninguna sección consecutiva repite fondo+alineación+densidad (detalle en `03-strategy/structure.md`).

## Contraste WCAG (calculado, script Node ad hoc — luminancia relativa WCAG 2.x)

| Combinación | Contexto | Tamaño/peso | Umbral | Ratio real | Resultado |
|---|---|---|---|---|---|
| `#FFFFFF` / `#127749` | Texto del CTA / H1 de hero sobre fondo primary | 15-34px/700 | Normal o grande según módulo | 5.58:1 | ✅ PASS |
| `#212121` / `#FFFFFF` | Body/H2 sobre blanco | cualquiera | 4.5:1 | 16.10:1 | ✅ PASS |
| `#666666` / `#FFFFFF` | Texto secundario sobre blanco (intro-cta-asimetrico) | 15px/400 | 4.5:1 | 5.74:1 | ✅ PASS |
| `#666666` / `#F8F8F8` | Texto secundario / footer, beneficios (peor caso) | 12-13px/400 | 4.5:1 | 5.41:1 | ✅ PASS |
| `#FFFFFF` / `#0B3E27` | H1 de banda-cierre sobre fondo deep | 22px/700 | 3:1 (grande, bold ≥18.66px) | 12.12:1 | ✅ PASS |
| `#ECECEC` / `#0B3E27` | Body de banda-cierre sobre fondo deep | 15px/300 | 4.5:1 | 10.26:1 | ✅ PASS |
| `#ECECEC` / `#127749` | Subtítulo de hero-imagen sobre fondo primary | 15px/300 | 4.5:1 | 4.73:1 | ✅ PASS (ajustado — ver `_changelog` del pack v1.0.1, margen pequeño pero suficiente, no bajar más el valor) |
| `#212121` / `#F8F8F8` | H2 de sección sobre sectionLila | 22px/700 | 3:1 | 15.16:1 | ✅ PASS |

Las dos combinaciones que fallaban en la primera pasada (`#767676`/`#F8F8F8` = 4.28:1 y `#D4D4D4`/`#127749` = 3.77:1) se corrigieron en el pack (v1.0.1) en vez de aprobarse "por estar cerca" — ver `brands/rolex/tokens/brand-tokens.json` → `_changelog`.
