# Component Inventory — Engine

> Extraído de: `newsletters/2026/paraycompara/2026-jul-ahorra-fibra-movil/v5-premium/final-premium-v2.html`
> Fecha: 2026-07-17

## Componentes

| Componente | Origen (líneas) | Campos de datos | Tokens |
|---|---|---|---|
| `_shell.html` | 1-67 | subject, preheader | colors.global, colors.white |
| `preheader.html` | 59-62 | preheader | — |
| `hero.html` | 69-167 | brand.logoUrl/alt/width/height, title, stat.number, stat.label, cta.href, cta.text | colors.primary, colors.ctaBackground, colors.white, colors.subtitleOnBrand, typography.displayFont, radius.ctaPill |
| `trustBar.html` | 169-227 | items[*].label | colors.primary, colors.white, colors.border, colors.sectionLila |
| `tarifasHeader.html` | 228-248 | section.eyebrow, section.title, section.body | colors.light, colors.primary, colors.bodySecondary, typography.displayFont |
| `cardTarifa.html` | 252-262 (repetible x4) | icon, title, body, link, moduleId | colors.primary, colors.light, colors.ctaBackground, colors.border, colors.bodySecondary, radius.card, typography.displayFont |
| `pasos.html` | 309-412 | section.eyebrow, section.title, items[*].number, items[*].title, items[*].body | colors.light, colors.primary, colors.white, colors.bodySecondary, surfaces.stepConnector, typography.displayFont |
| `listaPremium.html` | 414-540 | section.eyebrow, section.title, items[*].icon, items[*].title, items[*].body, items[*].moduleId | colors.primary, colors.light, colors.white, colors.bodySecondary, colors.sectionLila, colors.border, radius.card |
| `bandaCierre.html` | 542-578 | section.title, section.body, cta.href, cta.text | colors.ctaBackground, colors.white, colors.subtitleOnBrand, colors.deep, radius.ctaPill, typography.displayFont |
| `footer.html` | 580-619 | legal.unsubscribe, legal.preferences, legal.address, brand.name, brand.tagline, legal.year | colors.primary, colors.bodySecondary, colors.deep, colors.border, colors.white, colors.global |
| `ctaBulletproof.html` | 130-156 (parcial) | cta.href, cta.text, cta.moduleId, cta.width | colors.ctaBackground, colors.white, radius.ctaPill, typography.displayFont |

## Conteos de verificación (fuente)

| Elemento | Fuente | Componentes (pendiente build) |
|---|---|---|
| `<table>` | 51 | ? |
| `v:roundrect` | 4 | ? |
| h1 | 1 | ? |
| h2 | 4 | ? |
| h3 | 9 | ? |
| `<img>` | 9 | ? |
| Enlaces UTM | 8 | ? |

> La columna "Componentes" se rellenará cuando el build script (prompt 12) ensamble la pieza desde los componentes y verifique la paridad exacta contra la fuente.