# Layout — Audi A6 Sportback e-tron

## Parámetros globales

| Parámetro | Valor | Token |
|-----------|-------|-------|
| Ancho máximo | 600px | `layout.maxWidth` |
| Breakpoint mobile | 599px | `layout.mobileBreakpoint` |
| Fondo general | #FCFCFD (off-white) | `surfaces.white` |
| Color texto primario | #000000 | `colors.textPrimary` |
| Color texto body | #000000 | `colors.textBody` |
| Color texto secundario | #67707F | `colors.textSecondary` |
| Color enlaces | #000000 | `colors.link` |
| Familia tipográfica | Arial, Helvetica, sans-serif | `typography.family` |
| Web font | Inter (300/400/700) | `typography.webFont` |

## Paleta de secciones

| Sección | Fondo | Token |
|---------|-------|-------|
| Header, editoriales | #FCFCFD (off-white) | `surfaces.white` |
| Hero | Imagen generada (banner) | `hero-imagen` |
| Stats / Beneficios | #F5F5F5 (gris claro) | `surfaces.sectionLila` |
| Banda de cierre | #101319 (negro profundo) | `colors.deep` |
| Footer | #F5F5F5 | `surfaces.global` |

## Tipografía por nivel

| Nivel | Tamaño | Peso | Altura línea | Color | Token |
|-------|--------|------|-------------|-------|-------|
| Hero H1 | 32px (desktop) / 26px (mobile) | 300 (light) | 1.15 | #FFFFFF | `typography.hero.h1` |
| Hero subtitle | 16px (desktop) / 14px (mobile) | 400 | 1.4 | #FFFFFF | `typography.hero.subtitle` |
| Section H2 (editorial title) | 22px | 400 | 1.25 | #000000 | `typography.h2Section` |
| Body editorial | 16px | 400 | 1.55 | #000000 | `typography.bodyLarge` |
| Stats title (número) | 22px | 400 | 1.25 | #000000 | `typography.h2Section` |
| Stats body (etiqueta) | 14px | 400 | 1.5 | #000000 | `typography.body` |
| Banda-cierre title | 22px | 400 | 1.25 | #FFFFFF | (sobre fondo oscuro) |
| Banda-cierre body | 16px | 400 | 1.4 | #FFFFFF | (sobre fondo oscuro) |
| CTA label | 16px | 500 | — | #FFFFFF | `typography.cta` |
| Footer legal | 11px | 400 | 1.4 | #67707F | `typography.footer.legal` |

## Botón CTA

| Propiedad | Valor | Token |
|-----------|-------|-------|
| Forma | Pastilla sólida (cuadrada) | `components.cta.style` (pack: no declara → default pastilla sólida) |
| Fondo | #000000 | `components.cta.backgroundColor` |
| Texto | #FFFFFF | `components.cta.textColor` |
| Padding | 16px 36px | `components.cta.padding` |
| Border-radius | 0 | `components.cta.borderRadius` |
| Letter-spacing | 1px | `typography.cta.letterSpacing` |
| VML | Sí (bulletproof) | `components.cta.vml` |

## Ritmo editorial verificado

Ninguna sección consecutiva repite la misma combinación fondo+alineación+densidad:

| # | Sección | Fondo | Alineación | Densidad |
|---|---------|-------|-----------|----------|
| 1 | header-logo | #FCFCFD | Centrada | Baja |
| 2 | hero-imagen | Imagen real | Centrada | Alta |
| 3 | editorial-foto-texto | #FCFCFD | Izquierda (img 46% / text 54%) | Media |
| 4 | editorial-foto-texto-inverso | #FCFCFD | Izquierda (text 46% / img 54%) | Media |
| 5 | columns-3-beneficios-sin-icono | #F5F5F5 | Centrada | Media |
| 6 | banda-cierre | #101319 | Centrada | Media |
| 7 | footer | #F5F5F5 | Centrada | Baja |

✅ Ritmo editorial verificado — no hay dos secciones consecutivas iguales.
