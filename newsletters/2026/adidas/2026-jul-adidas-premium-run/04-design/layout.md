# Layout — Adidas Premium Run

## Estructura General

```
┌────────────────────────────────┐
│         HEADER LOGO            │  #FFFFFF bg, 24px padding top/bottom
│      [adidas performance]      │  Logo centrado, max-width 100px
├────────────────────────────────┤
│                                │
│        HERO IMAGEN             │  600×400px, fotografía real
│   "IMPOSSIBLE IS NOTHING"      │  H1 blanco, 30px, uppercase, tracking 3.5px
│   "Descubrir colección" ▶      │  CTA negro #000000, texto blanco, block style
│                                │
├────────────────────────────────┤
│                                │
│         INTRO CTA              │  #FFFFFF bg, 20px padding
│   Texto breve de transición    │  Body #767677, 14px
│   "Explorar running"           │  CTA texto negro, sin fondo
│                                │
├────────────────────────────────┤
│                                │
│    EDITORIAL FOTO TEXTO        │  46% imagen / 54% texto
│   [imagen] | Texto producto    │  #FFFFFF bg
│                                │
├────────────────────────────────┤
│                                │
│   BENEFICIOS SIN ICONO         │  #F5F5F5 bg (sectionLila)
│   [Arg 1] [Arg 2] [Arg 3]     │  3 columnas, texto centrado
│                                │
├────────────────────────────────┤
│                                │
│        BANDA CIERRE            │  #000000 bg
│   "Own Your Run"               │  H2 blanco, 22px uppercase
│   "Descubrir colección" ▶      │  CTA blanco sobre negro
│                                │
├────────────────────────────────┤
│                                │
│         FOOTER                 │  #000000 bg, texto #98999B
│   Enlaces | Social | Legal     │  11px, centrado
└────────────────────────────────┘
```

## Colores por módulo

| Módulo | Fondo | Texto principal | Texto secundario |
|---|---|---|---|
| header-logo | #FFFFFF | #000000 | — |
| hero-imagen | Imagen | #FFFFFF | #FFFFFF (subtitle) |
| intro-cta | #FFFFFF | #000000 | #767677 |
| editorial-foto-texto | #FFFFFF | #000000 | #767677 |
| columns-3-beneficios-sin-icono | #F5F5F5 | #000000 | #767677 |
| banda-cierre | #000000 | #FFFFFF | #FFFFFF |
| footer | #000000 | #FFFFFF | #98999B |

## Tipografía

| Elemento | Fuente | Tamaño | Peso | Transform | Tracking |
|---|---|---|---|---|---|
| Hero H1 | 'Montserrat', sans-serif | 30px | 700 | uppercase | 3.5px |
| Hero subtitle | Helvetica, Arial | 16px | 400 | normal | normal |
| Section H2 | 'Montserrat', sans-serif | 22px | 700 | uppercase | 3px |
| Card H3 | 'Montserrat', sans-serif | 16px | 700 | uppercase | 2px |
| Body | Helvetica, Arial | 14px | 400 | normal | normal |
| CTA text | Helvetica, Arial | 16px | 700 | none | normal |
| Legal | Helvetica, Arial | 11px | 400 | normal | normal |

## Espaciados

- Sección: 36px padding vertical
- Entre bloques: 24px
- Inner section padding: 24px 20px
- CTA padding: 0px 16px (block style)
- Mínimo hero height: 48px (CTA min-height)

## Responsive (≤599px)

- Hero H1: 24px
- Hero subtitle: 14px
- Secciones: 24px padding vertical
- Columnas de beneficios: apiladas en móvil
- CTA: full width en móvil
- Imágenes: 100% width, auto height
