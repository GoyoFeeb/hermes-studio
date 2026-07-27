# Especificación de diseño — Tarífalo Compara Energía

## Brand tokens

Los tokens completos están en: `newsletters/2026/newsletter-system/brands/tarifalo/tokens/brand-tokens.json`

### Sistema de color

| Token | Valor | Uso |
|---|---|---|
| `colors.primary` | `#003049` | Header/hero bg, títulos, badges, checks trust bar |
| `colors.deep` | `#002035` | Banda de cierre bg |
| `colors.light` | `#004B6B` | Kicker rules, acentos, eyebrow text |
| `colors.ctaBackground` | `#F77F00` | Botones CTA, enlaces "Ver tarifas" |
| `colors.white` | `#FFFFFF` | Fondos de sección, texto sobre primary |
| `colors.onBrandSecondary` | `#FCE4C8` | Subtítulos sobre fondo de marca |
| `colors.accentHaloLight` | `#FFE0B0` | Halo de círculos de pasos |
| `colors.background.white` | `#FFFFFF` | Fondo secciones pares |
| `colors.background.sectionAlt` | `#FFF1E0` | Fondo sección "Tipos de comparación" |
| `colors.background.exterior` | `#FFF6E7` | Fondo exterior del email |
| `colors.background.trustBar` | `#FFF1E0` | Fondo pill del trust bar |
| `colors.text.primary` | `#333333` | Cuerpo principal |
| `colors.text.secondary` | `#666666` | Texto secundario |
| `colors.borders.card` | `#E0D5C5` | Bordes de tarjetas |
| `surfaces.global` | `#FFF6E7` | Fondo global exterior |
| `surfaces.sectionLila` | `#FFF1E0` | Fondo alterno de sección |
| `surfaces.stepConnector` | `#FFE0B0` | Halo de pasos |

### Tipografía

| Elemento | Font | Tamaño | Peso | Color | Line-height |
|---|---|---|---|---|---|
| H1 hero (on brand) | Sora | 28px (26px mobile) | 800 | #FFFFFF | 1.16 (1.18 mbl) |
| H2 sección | Sora | 22px | 800 | #003049 | 1.2 |
| H2 on brand (cierre) | Sora | 26px | 800 | #FFFFFF | 1.18 |
| H3 tarjeta | Arial | 16px | 700 | #003049 | 1.25 |
| Body | Arial | 14px | 400 | #666666 | 1.5 |
| Eyebrow | Arial | 12px | 700 | #004B6B | 16px |
| CTA | Sora | 19px | 700 | #FFFFFF | 22px |
| Número paso | Arial | 20px | 800 | #FFFFFF | 56px |
| Trust bar | Arial | 12px | 600 | #003049 | 16px |
| Footer brand | Arial | 12px | 600 | #003049 | 1.4 |
| Footer legal | Arial | 11px | 400 | #666666 | 1.4 |
| Enlace tarjeta | Arial | 13px | 700 | #F77F00 | — |

### Espaciado

| Token | Valor | Uso |
|---|---|---|
| `spacing.section` | 40px | Padding vertical de secciones |
| `spacing.hero` | 56px | Padding superior hero |
| `spacing.close` | 48px | Padding banda cierre |

### Radios

| Token | Valor | Uso |
|---|---|---|
| `radius.ctaPill` | 50px | Botones CTA (redondeo completo) |
| `radius.card` | 16px | Esquinas de tarjetas |
| `radius.badgeCircle` | 50% | Badges circulares |

### Sombras

| Token | Valor | Uso |
|---|---|---|
| `shadows.card` | 0 14px 32px rgba(0,48,73,0.08) | Tarjetas de ventajas y lista |
| `shadows.cta` | 0 12px 28px rgba(247,127,0,0.22) | Botones CTA |

## Diseño responsive

- **Breakpoint**: 599px
- **Stack**: Columnas apiladas en mobile (`.mobile-stack`)
- **Padding**: 32px desktop → 24px mobile (`.mobile-pad-sm`)
- **Tamaños de fuente reducidos en mobile**:
  - H1: 28px → 26px
  - H2: 22px → 20px
  - Stat number: 56px → 32px
- **Imágenes**: 100% width en mobile (`.mobile-img`)
- **Divisores verticales**: ocultos en mobile (`.mobile-hide`)

## Anatomía del hero

- Fondo: #003049 con pattern tile
- Layout asimétrico (56%/44% desktop)
- Izquierda: H1 de 28px Sora 800
- Derecha: no se usa stat numérico (Tarífalo no tiene una cifra de marca verificable — se omite la columna stat)
- Subtítulo centrado completo: copy de valor
- CTA clásico con VML bulletproof

## Anatomía de tarjetas

3 tarjetas en grid. Cada tarjeta:
- Borde: 1px solid #E0D5C5
- Radio: 16px
- Sombra: card shadow
- Franja superior: 4px #004B6B
- Icono: 48×48px
- Título: 16px bold #003049
- Body: 14px #666666
- Enlace: #F77F00 (flecha →)

## Anatomía de pasos

3 pasos, centrados. Cada paso:
- Círculo exterior halo: #FFE0B0 (padding 4px)
- Círculo interior: 56×56px #003049
- Número: 20px bold white
- Título: 15px bold #003049
- Body: 14px #666666
- Sin línea conectora entre pasos

## Anatomía de lista

3 items en tarjetas apiladas sobre fondo #FFF1E0:
- Estructura idéntica a las tarjetas de ventajas
- Icono badge: 36px circular sobre #003049
- Título + body por fila

## Anatomía del CTA

- Fondo: #F77F00
- Texto: #FFFFFF Sora 19px bold
- Padding: 17px 36px
- Radio: 50px
- VML bulletproof para Outlook
- Sombra: cta shadow
- Ancho máximo: 280px desktop, full-width mobile

## Anatomía del footer

- Fondo: #FFF6E7
- Borde superior: 2px solid #FFE0B0
- Nombre de marca: 12px 600 #003049
- Tagline: 12px 400 #666666
- Disclosure: 12px #666666
- Enlaces baja/preferencias: 12px underline #666666
- Separador: | en #D4C5B5
- Copyright: 11px #666666
