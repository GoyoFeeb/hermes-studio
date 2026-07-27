# Mobile Spec: Spotify — 2026-jul-spotify-premium-test

Ancho: 320-375px. Breakpoint: ≤599px.

## Principios responsive

- Todas las variantes asimétricas apilan en mobile (class="mobile-stack")
- Padding lateral se mantiene en 20px
- Tipografía se escala conforme a los valores mobile de typography.hero.h1.mobile y typography.hero.subtitle.mobile

## Módulo 1 — header-logo

| Campo | Valor |
|---|---|
| Logo | Centrado, igual que desktop. Label "SPOTIFY" centrado si no hay logo real. |
| Padding | 12px 20px |

## Módulo 2 — hero-centrado

| Campo | Valor |
|---|---|
| H1 | 24px/700/1.2 — mobile spec de typography.hero.h1.mobile |
| Subtítulo | 14px — mobile spec de typography.hero.subtitle.mobile |
| CTA | Full-width, tappable. Mismo estilo pill. |
| Padding | 32px 20px 36px |
| BrandName | Se mantiene visible pero más pequeño (adaptación del componente) |

## Módulo 3 — intro-cta-asimetrico

| Campo | Valor |
|---|---|
| Layout | Apilado (mobile-stack): título → cuerpo → CTA, centrados |
| Título | 18px (reducción desde 20px desktop) |
| Cuerpo | 14px |
| CTA | Full-width |
| Padding | 24px 20px |

## Módulo 4 — columns-3-beneficios-sin-icono

| Campo | Valor |
|---|---|
| Layout | 3 columnas apiladas verticalmente (cada una ocupa 100% del ancho) |
| Título sección | 18px |
| Intro | 13px |
| Tarjetas individuales | Cada una con su borde/sombra a ancho completo |
| Padding | 28px 20px |

## Módulo 5 — (omitido)

## Módulo 6 — usp-cards-asimetrico

| Campo | Valor |
|---|---|
| Layout | Cabecera apilada (mobile-stack): título → cuerpo → badge (en ese orden). Tarjetas apiladas. |
| Título | 18px |
| Badge | Se mueve debajo del cuerpo (mobile-stack) |
| Tarjetas | Cada una a ancho completo, con sombra |
| Padding | 28px 20px |

## Módulo 7 — banda-cierre-asimetrico

| Campo | Valor |
|---|---|
| Layout | Apilado (mobile-stack): título → cuerpo → CTA |
| Título | 18px |
| CTA | Full-width |
| Padding | 32px 20px |

## Módulo 8 — footer

| Campo | Valor |
|---|---|
| Layout | Centrado, igual que desktop |
| Legal | 11px |
| Padding | 20px 20px 24px |
