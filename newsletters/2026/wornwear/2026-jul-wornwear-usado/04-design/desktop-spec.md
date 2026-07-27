# Desktop Spec: 2026-jul-wornwear-usado (600px)

## Contenedor general

| Propiedad | Valor |
|---|---|
| Email width | 600px |
| Container bg | #FFFFFF |
| Font family | Arial, Helvetica, sans-serif |
| Mobile breakpoint | 599px |

## 1. Header (header-logo.html)

| Propiedad | Valor | Token |
|---|---|---|
| Background | #FFFFFF | — |
| Padding | 20px 24px | — |
| Logo src | WW_Logo_Website.png | assets.logo |
| Logo width | 150px | assets.logoWidth |
| Logo height | 42px | assets.logoHeight |
| Logo alt | "Patagonia Worn Wear®" | assets.logoAlt |
| Label | "WORN WEAR" inline | — |
| Alineación | Centrada | — |

## 2. Hero (hero-imagen.html)

### Banner de imagen

| Propiedad | Valor |
|---|---|
| Foto width | 600px |
| Foto height | 280px (auto) — ver assets-notes.md |
| Background foto | color primario #000000 |
| Alt text | Descriptivo de la escena (ej. "Persona organizando equipo de escalada en garaje") |
| Display | block |

### Contenido textual (sobre #000000)

| Propiedad | Valor | Token |
|---|---|---|
| Background | #000000 | colors.primary |
| Padding | 36px 32px 40px | — |
| Brand name | "Patagonia Worn Wear" | — |
| Brand name size | 12px, weight 700, letter-spacing 3px, uppercase | — |
| Brand name color | #FFFFFF | colors.onBrandSecondary |
| H1 size | 32px | typography.hero.h1.size |
| H1 weight | 500 | typography.hero.h1.weight |
| H1 color | #FA4616 | typography.hero.h1.color |
| H1 line-height | 1.2 | — |
| H1 margin-bottom | 8px | — |
| Subtítulo size | 16px | typography.hero.subtitle.size |
| Subtítulo weight | 300 | typography.hero.subtitle.weight |
| Subtítulo color | #494949 | typography.hero.subtitle.color |
| Subtítulo line-height | 1.4 | — |
| Subtítulo margin-bottom | 20px | — |

### CTA del hero

| Propiedad | Valor | Token |
|---|---|---|
| Background | #FA4616 | colors.ctaBackground |
| Text color | #000000 | colors.ctaText |
| Font size | 16px | typography.cta.size |
| Font weight | 500 | typography.cta.weight |
| Letter spacing | -0.2px | typography.cta.letterSpacing |
| Border radius | 40px | components.cta.borderRadius |
| Padding | 9px 28px | components.cta.padding |
| Display | block (email) | — |
| Text decoration | none | — |
| utm_content | hero | — |
| VML | Sí (cta-bulletproof) | — |

## 3. Intro (intro-cta.html)

| Propiedad | Valor | Token |
|---|---|---|
| Background | #FFFFFF | — |
| Padding | 40px 32px | spacing.section |
| Título size | 22px | typography.h2Section.size |
| Título weight | 500 | typography.h2Section.weight |
| Título color | #000000 | typography.h2Section.color |
| Título line-height | 1.25 | — |
| Body size | 14px | typography.body.size |
| Body weight | 300 | typography.body.weight |
| Body color | #494949 | typography.body.color |
| Body line-height | 1.5 | — |
| CTA style | Secondary (outline) | — |
| CTA color | #000000 | colors.primary (CTA secundario) |
| CTA border | 1px solid #000000 | — |
| CTA border-radius | 40px | — |
| CTA padding | 12px 28px | — |
| Alineación | Centrada | — |
| utm_content | intro | — |

## 4. Beneficios (columns-3-beneficios-sin-icono.html)

| Propiedad | Valor | Token |
|---|---|---|
| Background | #EFE7DA | surfaces.sectionLila |
| Padding superior | 52px | — |
| Padding inferior | 52px | — |
| Padding lateral | 24px | — |
| Título sección size | 22px | typography.h2Section.size |
| Título sección weight | 500 | — |
| Título sección color | #000000 | colors.primary |
| Nº ítems | 2-4 (lo decide Copy) | — |
| Ancho por columna | 33% (3 items), 50% (2 items) | — |
| Barrita decorativa | 28×2px, #D3D4D5 (colors.light) | — |
| Item title size | 15px, weight 700 | — |
| Item title color | #000000 | colors.primary |
| Item body size | 13px, weight 300 | — |
| Item body color | #494949 | colors.text.secondary |
| Highlight card bg | #FFFFFF | — |
| Highlight card border | 1px solid #D3D4D5 | colors.borders.card |
| Highlight card radius | 0px | radius.card |
| Highlight title size | 14px, weight 700 | — |
| Highlight title color | #000000 | colors.primary |
| Highlight note size | 11px, weight 300 | — |
| Highlight note color | #494949 | colors.text.secondary |
| Alineación | Centrada | — |

## 5. Banda de cierre (banda-cierre-asimetrico.html)

| Propiedad | Valor | Token |
|---|---|---|
| Background | #1A1A1A | colors.deep |
| Padding | 44px 32px | — |
| Título size | 22px | typography.h2Section.size |
| Título weight | 500 | — |
| Título color | #FFFFFF | colors.onBrandSecondary |
| Título line-height | 1.25 | — |
| Body size | 14px | typography.body.size |
| Body weight | 300 | — |
| Body color | #FFFFFF | colors.onBrandSecondary |
| Body line-height | 1.5 | — |
| CTA background | #FA4616 | colors.ctaBackground |
| CTA text | #000000 | colors.ctaText |
| CTA style | Pill, 40px radius | — |
| CTA padding | 9px 28px | — |
| CTA width | 280px (fijo en desktop) | — |
| CTA display | block | — |
| Alineación contenido | Izquierda (asimetrico) | — |
| utm_content | cierre | — |
| VML | Sí (cta-bulletproof) | — |

## 6. Footer (footer.html)

| Propiedad | Valor | Token |
|---|---|---|
| Background | #EFE7DA | surfaces.global |
| Brand name | "Patagonia Worn Wear" | — |
| Brand size | 12px, weight 700 | typography.footer.brand |
| Brand color | #000000 | — |
| Tagline | "Used Patagonia® Clothing & Gear" | — |
| Tagline size | 11px, weight 300 | typography.footer.legal |
| Tagline color | #494949 | — |
| Disclosure | [PLACEHOLDER — PENDIENTE] | — |
| Unsubscribe | [UNSUBSCRIBE_LINK] | — |
| Preferences | [PREFERENCES_LINK] | — |
| Padding | 28px 24px 20px | — |
| Alineación | Centrada | — |
