# INVENTORY — engine/components/

> **RESTAURADO 2026-07-21** tras el incidente tarifalo (ver `engine/CHANGELOG.md`, entrada
> "INCIDENTE"). El INVENTORY original de F1 (con rangos de línea de la extracción) no era
> recuperable; este documento lo sustituye con el contrato vigente de cada componente,
> verificado contra `lib/assemble.js` (MODULE_ADAPTERS, intacto) y el schema. La restauración
> de los componentes es byte-exacta en output: los builds reproducen los sha256 de los 3
> build-manifests preexistentes.

> **Conteos de ítems (2026-07-24):** `columns-3-beneficios` (y variantes), `usp-cards` (y
> variantes) y `pasos` admiten **2-4 ítems**; el adaptador los reparte en filas equilibradas y
> calcula ancho/padding de celda en JS (`balancedRows`/`withCellGeometry` en `lib/assemble.js`).
> Antes estaban clavados a exactamente 3 con `items[0..2]` escritos a mano en la plantilla.
> `trust-bar` y `card-tarifa-3` siguen fijos a 3 — motivo en `patterns/institutional.md` §11.

> **Vocabulario de formas de CTA (2026-07-25):** además de la píldora sólida
> (`cta-bulletproof.html`) y la píldora outline (`cta-secondary-bulletproof.html`), el motor tiene
> 2 siluetas más: `cta-text-link-bulletproof.html` (texto subrayado + flecha, sin cápsula) y
> `cta-block-bulletproof.html` (bloque sólido de esquina recta, `border-radius:0` fijo). Un pack
> las activa con `components.cta.style` / `components.ctaSecondary.style` = `"text-link"` |
> `"block"` — `resolveIncludeAlias()` en `lib/assemble.js` intercepta el `{{include:...}}`
> "canónico" y lee el archivo alternativo, sin tocar ninguna plantilla que ya incluya el CTA. Sin
> ese campo (el caso de las 9 marcas reales a día de hoy), no cambia nada. **No se activa nunca
> por preferencia estética** — solo cuando el agente 02 verifica con Chrome que el sitio real de
> la marca usa ese tratamiento como CTA deliberado (comprobado y descartado para Worn Wear/Nike/
> BMW en esta misma ronda: las 3 usan píldora real — ver engine/CHANGELOG.md).

| Componente | Datos que consume | Notas |
|---|---|---|
| `_shell.html` | `subject`, `preheader` + `{{slot:body}}` + `{{slot:fontface}}` | Envoltorio: doctype/head/preheader/tabla exterior. Tokens: surfaces.global, colors.background.white. `{{slot:fontface}}` (2026-07-25) inyecta el `@font-face` real de la marca si el pack declara `typography.webFont` — ver `buildFontFaceCSS()` en `lib/assemble.js` |
| `hero-asimetrico.html` | `hero.h1`, `hero.stat.{number,label}`, `hero.subtitle`, `cta.*` (via include) | Incluye el logo (assets.logo/logoAlt/logoWidth/logoHeight) y el tile (assets.headerPatternTile) |
| `cta-bulletproof.html` | `cta.href`, `cta.label` (scope del PADRE) | Parcial VML+fallback PRIMARIO — pastilla sólida. Tamaño 100% por token desde 2026-07-24 (antes `padding:17px 36px`/`font-size:19px` fijos para las 8 marcas — ver engine/CHANGELOG.md, "CTAs siempre enormes"): `padding:{{token:components.cta.padding}}`, `font-size:{{token:typography.cta.size}}`, `font-weight:{{token:typography.cta.weight}}`, `letter-spacing:{{token:typography.cta.letterSpacing}}`, `border-radius:{{token:radius.ctaPill}}` (ya tokenizado desde antes). Rango real actual: 14px/adeslas a 19px/paraycompara. VML (Outlook clásico) sigue con height/width fijos — deuda conocida. Usado por hero-*/banda-cierre-* (el ask principal del email). **2026-07-25:** ya no fuerza `width:100%` en desktop (se ajusta al texto — ver "por qué se sigue viendo genérico" en el CHANGELOG); `letterSpacing` debe venir del pack como valor CSS completo (`"normal"` o `"Npx"`), no como número puro |
| `cta-secondary-bulletproof.html` | `cta.href`, `cta.label` (scope del PADRE) | Parcial VML+fallback SECUNDARIO (2026-07-24, ronda "jerarquía de CTA") — outline/ghost, transparente, borde+texto en `colors.primary`, más pequeño (`padding:12px 28px`, `font-size:14px`). Usado por `intro-cta*.html`/`category-grid*.html` (CTA contextual, no el ask principal). **2026-07-25:** ya no fuerza `width:100%` en desktop, mismo fix que el primario |
| `cta-text-link-bulletproof.html` | `cta.href`, `cta.label` (scope del PADRE) | Silueta TERCERA de CTA (2026-07-25) — texto subrayado + flecha "→", sin cápsula de color. Tokens: `colors.primary` (texto), `typography.displayFont`, `typography.cta.size/weight/letterSpacing`. Sin bloque VML (un link de texto no necesita el parche de Outlook clásico). Se activa vía `components.cta.style`/`components.ctaSecondary.style` = `"text-link"` — ver nota de arriba |
| `cta-block-bulletproof.html` | `cta.href`, `cta.label` (scope del PADRE) | Silueta CUARTA de CTA (2026-07-25) — bloque sólido, `border-radius:0` fijo (NO lee `radius.ctaPill` — el punto es una silueta distinta a la píldora, no una píldora de radio bajo). Misma flecha "→" dentro del bloque. Se activa vía `components.cta.style` = `"block"` — ver nota de arriba |
| `trust-bar.html` | `trustItems[0..2].text` | **Exactamente 3** — único módulo de lista que sigue fijo tras la ronda de conteos variables (2026-07-24): sus ítems van separados por una `<td width="1">` que el último no lleva, y generalizarlo exige rehacer el separador. Ver `patterns/institutional.md` §11 |
| `card-tarifa.html` | `cardsSection.{eyebrow,title,subtitle}` + `cards[0..3].{icon,title,body,href,linkLabel}` | Grid 2×2 FIJO de 4 (limitación conocida) |
| `pasos.html` | `stepsSection.{eyebrow,title}` + `steps[].{number,title,body}` (via `{{#each}}`) | **2-4** desde 2026-07-24 (antes exactamente 3) |
| `lista-premium.html` | `listSection.{eyebrow,title}` + `listItems[]` (`icon`,`title`,`body` sin prefijo, via `{{#each}}`) | 3-4 ítems (rango variable verificado en F5) |
| `banda-cierre.html` | `closing.{title,body}`, `cta.*` (via include) | Fondo colors.deep |
| `footer.html` | `footer.{brandName,tagline,disclosure,unsubscribeUrl,preferencesUrl,legalLine}` | — |
| `header.html` | — | STUB no usado (logo vive en hero-asimetrico, decisión F1) |
| `hero-centrado.html` | `hero.{brandName,h1,subtitle,cta}` | Variante sin cifra de marca ni logo PNG (2026-07-21) |
| `hero-imagen.html` | `hero.{bannerSrc,bannerAlt,brandName,h1,subtitle,cta}` | Híbrido: arte generado (sin texto) + copy vivo (2026-07-21) |
| `card-tarifa-3.html` | `cardsSection.{eyebrow,title,subtitle}` + `cards[0..2].*` | Variante de card-tarifa para exactamente 3 (2026-07-21) |
| `header-logo.html` | `header.{logoSrc,logoAlt,logoWidth,logoHeight,label}` | Patrón `institutional` (2026-07-22) — cabecera separada del hero |
| `intro-cta.html` | `intro.{title,body}` + `cta.*` | Patrón `institutional` (2026-07-22) |
| `columns-3-beneficios.html` | `beneficiosSection.{title,highlight,highlightNote}` + `beneficiosRows[].items[].*` (columnas) / `beneficios[]` (apiladas) — agrupado por el adaptador desde `items[]` plano | Patrón `institutional` (2026-07-22). **2-4 ítems** desde 2026-07-24. Highlight a nivel de sección, nunca por columna |
| `category-grid.html` | `gridSection.{title,intro}` + `rows[].items[].*` (agrupado por el adaptador desde `categories[]` plano) + `cta.*` | Patrón `institutional` (2026-07-22). 2-8 ítems, 3 por fila |
| `usp-cards.html` | `uspSection.{eyebrow,title,body,badge}` + `uspRows[].items[].*` (columnas) / `usp[]` (apiladas) — agrupado por el adaptador desde `items[]` plano | Patrón `institutional` (2026-07-22). **2-4 ítems** desde 2026-07-24 |
| `hero-marca-tarifalo.html` | `hero.{brandName,h1,subtitle,cta}` (mismo adaptador que `hero-centrado`, vía el fallback regex `hero-marca-*` en `assemble.js`) | Hero de marca generado con Claude design (2026-07-21) para Tarífalo — navy + naranja de acción, kicker sobre la marca, franja inferior de acento |
| `category-grid-img.html` | Igual que `category-grid.html` | Variante con icono real `<img>` por categoría en vez de emoji — para marcas cuyo `iconography.style` documenta iconos reales de marca (ver `agents/02-brand-visual-analyst.md` §3) |
| `intro-cta-asimetrico.html` | Igual que `intro-cta.html` (mismo adaptador — Nivel 2, ver `engine/CHANGELOG.md`) | Título+cuerpo a la izquierda (64%), CTA a la derecha (36%), misma fila. Decisión de marca vía `layout.sectionStyle` (`patterns/institutional.md` §7) |
| `columns-3-beneficios-asimetrico.html` | Igual que `columns-3-beneficios.html` (mismo adaptador — Nivel 2) | 3 filas apiladas, icono en halo a la izquierda + texto a su derecha (mismo lenguaje visual que `lista-premium.html`/`pasos.html`, pero en fila) |
| `columns-3-beneficios-sin-icono.html` | Igual que `columns-3-beneficios.html` salvo que `items[]` no lleva `icon` | Variante sin icono (2026-07-24, campaña BMW) — para marcas cuyo `iconography.componentImplication` desaconseja emoji/iconGlyph y no hay assets de icono reales que anclar. Ver `patterns/institutional.md` §7.1 y `patterns/fotografia-primero.md` |
| `usp-cards-asimetrico.html` | Igual que `usp-cards.html` (mismo adaptador — Nivel 2) | Rediseñado 2026-07-24 (`patterns/institutional.md` §9): eyebrow en su fila, título + chip de insignia shrink-to-fit (no columna de igual peso) en la siguiente, cuerpo a todo el ancho debajo; las 3 tarjetas no cambian |
| `banda-cierre-asimetrico.html` | Igual que `banda-cierre.html` (mismo adaptador — Nivel 2) | Rediseñado 2026-07-24 (`patterns/institutional.md` §9): título+cuerpo a todo el ancho arriba, CTA suelto debajo alineado a la izquierda con ancho fijo (280px desktop, 100% mobile) — ya no comparte esqueleto de 2 columnas con `hero-asimetrico.html` |
| `usp-cards-sin-icono.html` | Igual que `usp-cards.html` salvo que `items[]` no lleva `icon` (sustituido por una barrita de color de 24x2px) | Variante sin icono (2026-07-24, campaña Spotify) — para marcas cuyo `iconography.componentImplication` desaconseja emoji/iconGlyph. Mismo motivo que `columns-3-beneficios-sin-icono.html` |
| `usp-cards-sin-icono-asimetrico.html` | Igual que `usp-cards-asimetrico.html` salvo que `items[]` no lleva `icon` | Combina la cabecera asimétrica REDISEÑADA de `usp-cards-asimetrico.html` (ver arriba) con las tarjetas sin icono de `usp-cards-sin-icono.html` (2026-07-24, campaña Spotify) |

Las 4 variantes `-asimetrico`, `columns-3-beneficios-sin-icono` y las 2 variantes
`usp-cards-sin-icono*` comparten el mismo adaptador que su contraparte centrada/con-icono — el
layout cambia solo en la plantilla `.html`, nunca en la forma del dato. Detalle completo de
cuándo elegir cada una en `patterns/institutional.md` §7
y `patterns/fotografia-primero.md` §6.

Verificación de integridad: `npm run check-engine` (contra `engine/components.lock.json`).
