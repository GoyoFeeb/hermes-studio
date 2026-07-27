# Brand Visual Analysis — Tarífalo

## Resumen

Análisis de identidad visual de Tarífalo. El brand pack existente (`brands/tarifalo/tokens/brand-tokens.json` v2.2.5) es la fuente de verdad operativa. Se documentan discrepancias entre la identidad visual solicitada y el brand pack real.

## Discrepancias documentadas

| Aspecto | Solicitado por usuario | Brand pack real (v2.2.5) | Decisión |
|---|---|---|---|
| Color primario | #003049 | #003049 | ✅ Coincide |
| Azul marino secundario | #004568 | Light: #004B6B, Deep: #002035 | 🟡 Usar valores del pack: #004B6B (light) y #002035 (deep) |
| Naranja acento | #F77F00 | #F77F00 (ctaBackground) | ✅ Coincide |
| Crema/beige | #FCEDD4 | sectionLila: #FFF1E0, global: #FFF6E7 | 🟡 Usar valores del pack |
| Tipografía títulos | Poppins bold 700-800 | Sora 700/800 (displayFont) | 🟡 Prevalece el pack: Sora |
| Tipografía cuerpo | Capitana | Arial, Helvetica, sans-serif | 🟡 Prevalece el pack: Arial |
| Botón border-radius | 28px | 30px (radius.ctaPill) | 🟡 Prevalece el pack: 30px |
| Botón padding | 12px 40px | 12px 40px (components.cta.padding) | ✅ Coincide |

## Tokens clave usados

| Token | Valor | Uso |
|---|---|---|
| colors.primary | #003049 | Fondo hero, header, deep sections |
| colors.deep | #002035 | Banda de cierre |
| colors.ctaBackground | #F77F00 | Botones CTA |
| colors.ctaText | #002035 | Texto sobre CTA (accesible: 6.35:1) |
| colors.subtitleOnBrand | #FCE4C8 | Subtítulo sobre fondo primary |
| surfaces.sectionLila | #FFF1E0 | Fondo de secciones alternas |
| surfaces.global | #FFF6E7 | Fondo exterior del email |
| gradients.heroBackground | linear-gradient(135deg, #003049 0%, #002035 100%) | Gradiente del hero |
| typography.displayFont | 'Sora','Segoe UI',Arial,Helvetica,sans-serif | Títulos |
| typography.family | Arial, Helvetica, sans-serif | Cuerpo |
| radius.ctaPill | 30 | Border-radius de CTA |
| assets.logo | https://tarifalo.com/wp-content/uploads/2023/02/tarifalo-logo-svg-vf.svg | Logo wordmark |
| components.cta.padding | 12px 40px | Padding del botón CTA |

## Hero elegido

`hero-marca-tarifalo` — hero específico de Tarifalo (diseñado con Claude Design). Fondo navy con gradiente, brand name + H1 + subtitle + CTA naranja. No requiere cifra de marca ni imagen CDN. Mismo hero usado en campaña `2026-jul-comparar-luz-gas`.
