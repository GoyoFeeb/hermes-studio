# Visual Analysis: Spotify

## Colores observados (real, en vivo)

| Elemento | Color observado | Token asignado | Nota |
|---|---|---|---|
| Fondo global del sitio | #000000 (negro puro) | colors.primary, colors.black | Identidad nativa dark-mode — ver darkMode.note |
| CTA principal (pill) | #1ED760 (verde vibrante) + texto #000000 | colors.ctaBackground, colors.ctaText | Verificado en vivo con getComputedStyle |
| Enlaces / hover | #1DB954 (verde clásico histórico) | colors.link, colors.ctaHover | Documentado por fuentes secundarias, no observado directamente en esta sesión |
| Texto secundario (sitio real) | #B3B3B3 (sobre fondo negro) | — (no usable en email claro) | Reemplazado por #666666 (gris AA verificado para fondo claro) |
| Texto de cuerpo (email) | — | #666666 | Decisión derivada, no observada. Mismo gris que el resto del sistema (AA verificado) |

## Paleta adaptada a email (fondo claro)

| Token | Valor | Rol | Uso |
|---|---|---|---|
| colors.primary | #000000 | Negro | Texto de H2, fondo de hero (degradado) |
| colors.ctaBackground | #1ED760 | Verde vibrante | Fondo de botón CTA |
| colors.ctaText | #000000 | Negro | Texto del CTA (10.94:1 sobre verde) |
| colors.deep | #146C43 | Verde oscuro | Fondo de banda de cierre (derivado, pasa 6.45:1 con texto blanco) |
| onBrandSecondary | #FFFFFF | Blanco | Texto sobre primary/deep |
| surfaces.global | #F5F5F5 | Gris claro | Fondo global del email |
| surfaces.white | #FFFFFF | Blanco | Fondo de tarjetas/secciones |
| surfaces.sectionLila | #F5F5F5 | Gris claro | Fondo de secciones alternas (mismo valor que global) |
| gradients.heroBackground | linear-gradient(135deg, #000000 0%, #146C43 100%) | Degradado negro→verde | Fondo del hero |

## Tipografía

| Elemento | Especificación | Token |
|---|---|---|
| Familia display | Helvetica, Arial, sans-serif | typography.displayFont |
| Familia cuerpo | Helvetica, Arial, sans-serif | typography.family |
| H1 hero | 32px / 700 / line-height 1.15 / color #000000 | typography.hero.h1 |
| H2 sección | 20px / 700 / line-height 1.25 / color #000000 | typography.h2Section |
| H3 tarjeta | 16px / 700 / line-height 1.3 / color #000000 | typography.h3Card |
| Body grande | 16px / 400 / line-height 1.5 / color #666666 | typography.bodyLarge |
| Body normal | 14px / 400 / line-height 1.5 / color #666666 | typography.body |
| CTA | 16px / 700 / letter-spacing 0 | typography.cta |

## Botones (CTA)

| Propiedad | Valor |
|---|---|
| Fondo | #1ED760 (colors.ctaBackground) |
| Texto | #000000 (colors.ctaText) |
| Border-radius | 999px (radius.ctaPill) |
| Padding | 12px 28px (components.cta.padding) |
| Sombra | none (shadows.cta) |
| VML | Sí — debe generar v:roundrect para Outlook |
| Contraste | 10.94:1 (✅ PASS — supera 3:1 de texto grande) |

## Fotografía

| Propiedad | Valor |
|---|---|
| Usa fotografía real | ✅ Sí |
| Tratamiento | Alto contraste, iluminación dramática de estudio. Isotipo de barras de sonido recortado y superpuesto como máscara sobre la foto |
| Fuente | Observado en spotify.com/us/premium/ el 2026-07-24 |

## Iconografía

| Propiedad | Valor |
|---|---|
| Estilo | isotipo-máscara (el propio isotipo de Spotify como único elemento icónico) |
| Monocromo | Sí |
| Implicación para componente | Sin iconGlyph decorativo. Usar columns-3-beneficios-sin-icono |

## Composición (layout)

| Propiedad | Valor |
|---|---|
| sectionStyle | asimetrico |
| Ritmo estructural | 10 secciones reales en la landing (header navegación → hero rotativo → línea producto → pares feature → bloque social → contenido adicional → compatibilidad → bloque editorial → tarjetas precio → footer) |
| Peso fotografía | Dominante |
| Densidad iconos | Nula (solo el isotipo como máscara) |

## Contraste WCAG (ya verificado: 7/7)

| Combinación | Ratio | Resultado |
|---|---|---|
| #000000 / #FFFFFF (texto primario sobre blanco) | 21.00:1 | ✅ PASS |
| #666666 / #FFFFFF (body sobre blanco) | 5.12:1 | ✅ PASS |
| #666666 / #F5F5F5 (texto secundario sobre fondo sección) | 4.07:1 | ✅ PASS |
| #FFFFFF / #000000 (texto hero sobre primary) | 21.00:1 | ✅ PASS |
| #FFFFFF / #146C43 (texto banda cierre sobre deep) | 6.45:1 | ✅ PASS |
| #000000 / #1ED760 (CTA texto sobre fondo) | 10.94:1 | ✅ PASS |
| #FFFFFF / #1ED760 (opcional — texto inverso CTA) | 1.45:1 | ⚠️ No usar (no aplica — CTA oficial usa texto negro) |
