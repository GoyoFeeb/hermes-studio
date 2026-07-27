# Layout: Spotify — 2026-jul-spotify-premium-test

## Parámetros globales

| Parámetro | Valor | Token |
|---|---|---|
| Ancho máximo | 600px | layout.maxWidth |
| Breakpoint móvil | 599px | layout.mobileBreakpoint |
| Fondo global | #F5F5F5 | surfaces.global |
| Fondo contenedor | #FFFFFF | surfaces.white |
| Familia tipográfica | Helvetica, Arial, sans-serif | typography.family |
| SectionStyle | asimetrico | layout.sectionStyle |

## Paleta de marca (todos trazables a tokens)

| Token | Valor | Uso |
|---|---|---|
| colors.primary | #000000 | Fondo de hero (degradado), texto H2, texto secciones |
| colors.ctaBackground | #1ED760 | Fondo de botones CTA |
| colors.ctaText | #000000 | Texto de botón CTA (⚠️ NO cambiar a blanco — es el valor real verificado) |
| colors.deep | #146C43 | Fondo de banda de cierre (derivado, pasa 6.45:1) |
| onBrandSecondary | #FFFFFF | Texto sobre colors.primary y colors.deep |
| surfaces.white | #FFFFFF | Fondo de header, intro, footer (parte superior) |
| surfaces.sectionLila | #F5F5F5 | Fondo de beneficios (columns-3-beneficios-sin-icono) y usp-cards |
| surfaces.global | #F5F5F5 | Fondo de footer |
| gradients.heroBackground | linear-gradient(135deg, #000000 0%, #146C43 100%) | Fondo de hero y banda-cierre |

## Tipografía global

| Elemento | Tamaño / Peso / Color | Token |
|---|---|---|
| H1 hero | 32px / 700 / #000000 | typography.hero.h1 |
| Subtítulo hero | 16px / 400 / #666666 | typography.hero.subtitle |
| H2 sección | 20px / 700 / #000000 | typography.h2Section |
| H3 tarjeta | 16px / 700 / #000000 | typography.h3Card |
| Body grande | 16px / 400 / #666666 | typography.bodyLarge |
| Body normal | 14px / 400 / #666666 | typography.body |
| CTA | 16px / 700 / #000000 | typography.cta |
| Footer legal | 11px / 400 / #666666 | typography.footer.legal |
| Footer brand | 12px / 700 / #000000 | typography.footer.brand |

## Espaciado

| Contexto | Valor | Token |
|---|---|---|
| Padding interior sección | 24px 20px | spacing.innerSection |
| Padding hero | 40px 20px | spacing.hero |
| Separación entre secciones | 36px | spacing.section |
| CTA vertical | 20px 0 | spacing.cta |

## Radios

| Elemento | Valor | Token |
|---|---|---|
| Botón CTA | 999px | radius.ctaPill |
| Tarjetas | 8px | radius.card |

## Sombras

| Elemento | Valor | Token |
|---|---|---|
| Tarjetas | 0 2px 8px rgba(0,0,0,0.06) | shadows.card |
| CTA | none | shadows.cta |

## Ritmo editorial (regla dura — ninguna sección consecutiva repite fondo+alineación+densidad)

| # | Sección | Fondo | Alineación | Densidad |
|---|---|---|---|---|
| 1 | header-logo | Blanco | Centrada | Baja |
| 2 | hero-centrado | gradiente (black→green) + black | Centrada | Media |
| 3 | intro-cta-asimetrico | Blanco | Asimétrica (H1 izq, CTA der) | Baja |
| 4 | columns-3-beneficios-sin-icono | #F5F5F5 (sectionLila) | Centrada | Media |
| 5 | usp-cards-asimetrico | #F5F5F5 (sectionLila) | Asimétrica (título izq, badge der; tarjetas centradas) | Media |
| 6 | banda-cierre-asimetrico | gradiente (black→green) + deep | Asimétrica (título izq, CTA der) | Media |
| 7 | footer | #F5F5F5 (global) | Centrada | Baja |

**Verificación de ritmo:** 3→4 cambia de Blanco→#F5F5F5 y de Asimétrica→Centrada ✅. 4→5 mismo fondo #F5F5F5 pero cambia de Centrada→Asimétrica (densidad compensation: ambas son Media, pero la alineación cambia — único caso aceptable según institutional.md §7.4). 5→6 cambia fondo y alineación ✅. 6→7 cambia fondo y densidad ✅.
