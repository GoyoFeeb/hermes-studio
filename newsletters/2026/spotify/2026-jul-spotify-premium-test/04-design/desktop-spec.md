# Desktop Spec: Spotify — 2026-jul-spotify-premium-test

Ancho: 600px. Breakpoint: >599px.

## Módulo 1 — header-logo

| Campo | Valor |
|---|---|
| Componente | `header-logo.html` |
| Fondo | #FFFFFF |
| Logo | Placeholder HTTPS (label: "SPOTIFY" como texto) |
| Altura aprox | ~60px |

## Módulo 2 — hero-centrado

| Campo | Valor |
|---|---|
| Componente | `hero-centrado.html` |
| Fondo | gradients.heroBackground (linear-gradient 135deg, #000000 0%, #146C43 100%) |
| Fallback bgcolor | #000000 (colors.primary) |
| BrandName | "SPOTIFY" — texto blanco, tipografía display |
| H1 | "1 mes de Premium gratis" — 32px/700, color onBrandSecondary (#FFFFFF) |
| Subtítulo | "Descubre la música sin límites. Sin anuncios, sin compromiso." — 16px/400, color onBrandSecondary (#FFFFFF) |
| CTA | "Prueba Premium gratis" — pill, #1ED760 bg, #000000 text, 999px radius |
| Padding | 40px 20px |
| Altura aprox | ~320px |

## Módulo 3 — intro-cta-asimetrico

| Campo | Valor |
|---|---|
| Componente | `intro-cta-asimetrico.html` |
| Fondo | #FFFFFF |
| Layout | Título + cuerpo a la izquierda (64%), CTA a la derecha (36%), misma fila |
| Título | "Todo lo que amas de la música, sin interrupciones" — H2 (20px/700/#000000) |
| Cuerpo | 14px/400/#666666 |
| CTA secundario | "Empieza tu mes gratis" — mismo estilo pill que hero |
| Padding | 24px 20px |

## Módulo 4 — columns-3-beneficios-sin-icono

| Campo | Valor |
|---|---|
| Componente | `columns-3-beneficios-sin-icono.html` |
| Fondo | #F5F5F5 (surfaces.sectionLila) |
| Layout | 3 columnas iguales (33/33/33), centradas, sin icono |
| Título sección | "Así suena Premium" — H2 centrado |
| Intro | 14px/400/#666666 centrado |
| Highlight | "Oferta exclusiva para nuevos usuarios de Premium" — badge a todo el ancho (same pattern as institutional) |
| Highlight note | "Solo si no has probado Premium antes. Después, $12.99/mes." |
| Items | 3 tarjetas con título (16px/700/#000000) + cuerpo (14px/400/#666666) |
| Sombra tarjetas | 0 2px 8px rgba(0,0,0,0.06) — shadows.card |
| Padding | 36px 20px |

## Módulo 5 — (omitido: category-grid)

## Módulo 6 — usp-cards-asimetrico

| Campo | Valor |
|---|---|
| Componente | `usp-cards-asimetrico.html` |
| Fondo | #F5F5F5 (surfaces.sectionLila) |
| Layout | Cabecera asimétrica: título+cuerpo a la izquierda, badge a la derecha. Tarjetas abajo (igual que centrado). |
| Título | "La música, sin límites" — H2 |
| Cuerpo cabecera | 14px/400/#666666 |
| Badge | "Música sin límites" — chip compacto a la derecha |
| Items | 3 tarjetas con título (16px/700/#000000) + cuerpo (14px/400/#666666) |
| Sombra tarjetas | 0 2px 8px rgba(0,0,0,0.06) — shadows.card (**⚠️ este es el fix que verificamos**) |
| Padding | 36px 20px |

## Módulo 7 — banda-cierre-asimetrico

| Campo | Valor |
|---|---|
| Componente | `banda-cierre-asimetrico.html` |
| Fondo | gradients.heroBackground (mismo que hero) + colors.deep (#146C43) |
| Layout | Título+cuerpo a la izquierda (62%), CTA a la derecha (38%), misma fila |
| Título | "Prueba Premium gratis" — H2, color onBrandSecondary (#FFFFFF) |
| Cuerpo | "1 mes gratis. Sin compromiso. Descubre por qué millones de personas ya escuchan sin límites." |
| CTA | "Prueba Premium gratis" — mismo estilo que hero |
| Padding | 36px 20px |

## Módulo 8 — footer

| Campo | Valor |
|---|---|
| Componente | `footer.html` |
| Fondo | #F5F5F5 (surfaces.global) |
| Brand name | "Spotify" — 12px/700/#000000 |
| Legal | 11px/400/#666666 — incluye condición de oferta |
| Enlaces | [UNSUBSCRIBE_LINK], [PREFERENCES_LINK] |
| Padding | 24px 20px |
