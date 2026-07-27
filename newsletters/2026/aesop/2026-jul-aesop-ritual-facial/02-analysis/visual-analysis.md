# Visual Analysis: Aesop

## Resumen visual

Aesop es una marca de **tipografía + fotografía de producto + color crema**. Sin adornos, sin iconos, sin modelos, sin promesas. El diseño es casi invisible — el contenido es el diseño.

## Paleta para email

| Uso | HEX | Aplica a |
|---|---|---|
| Fondo general | `#FFFEF2` | Container, secciones |
| Fondo alterno | `#F6F5E8` | Secciones alternas (muy sutil) |
| CTA background | `#252525` | Botones (sólido) |
| CTA text | `#FFFEF2` | Texto dentro de botón |
| Hero/footer background | `#333333` | Hero, banda de cierre, footer primary |
| Body text | `#333333` | Párrafos, navegación, títulos |
| Títulos | `#333333` | H2, H3 |
| Hero text | `#FFFEF2` | Texto sobre fondo oscuro |
| Footer text | `#FFFEF2` | Texto en footer |
| Footer legal | `#999999` | Texto legal |

## Tipografía para email

| Elemento | Font-family | Size | Weight | Color |
|---|---|---|---|---|
| Hero headline | Arial, Helvetica, sans-serif | 28px (22px mobile) | 400 | #FFFEF2 |
| Hero subtitle | Arial, Helvetica, sans-serif | 14px (13px mobile) | 400 | #FFFEF2 |
| Section H2 | Arial, Helvetica, sans-serif | 22px | 700 | #333333 |
| Body | Arial, Helvetica, sans-serif | 14px | 400 | #333333 |
| CTA | Arial, Helvetica, sans-serif | 14px | 400 | #FFFEF2 |
| Footer brand | Arial, Helvetica, sans-serif | 12px | 700 | #FFFEF2 |
| Footer legal | Arial, Helvetica, sans-serif | 11px | 400 | #999999 |

## Notas de contraste WCAG

- CTA (#FFFEF2 sobre #252525): 12.24:1 ✅ PASA
- Body text (#333333) sobre crema (#FFFEF2): 12.46:1 ✅ PASA
- Hero text (#FFFEF2) sobre primary (#333333): 12.46:1 ✅ PASA
- Texto banda de cierre (#FFFEF2) sobre deep (#1A1A1A): 16.24:1 ✅ PASA

## Arquitectura de página observada (Skin Care)

```
┌──────────────────────────────────────────────────────────┐
│  HEADER (fondo #FFFEF2)                                  │
│  [Logo Aesop]  Shop all  Skin Care  Hand & Body  ...     │
├──────────────────────────────────────────────────────────┤
│  HERO DE CATEGORÍA (fondo oscuro con imagen)             │
│  [Imagen de ingrediente/fórmula con overlay]              │
│  "Skin Care" (30px, 400, #FFFEF2)                       │
│  "Skin is ever-changing—it responds to environment..."    │
│  [Discover the new formulation] ─── CTA outline          │
├──────────────────────────────────────────────────────────┤
│  QUICK LINKS (carrusel de subcategorías, fondo #FFFEF2)  │
│  [Img]       [Img]       [Img]       [Img]               │
│  Cleansers   Exfoliants  Toners      Hydrators           │
├──────────────────────────────────────────────────────────┤
│  SECCIÓN EDITORIAL (fondo oscuro)                        │
│  "Our first Retinoid-enriched serum"                     │
│  "Modern science and botanicals intertwine..."           │
│  [Discover the new formulation]                          │
├──────────────────────────────────────────────────────────┤
│  PRODUCTO DESTACADO (fondo crema)                        │
│  [Foto producto]                                          │
│  Resolute Facial Concentrate    $179.00                  │
│  [Add to cabinet]                                        │
├──────────────────────────────────────────────────────────┤
│  RECENT ADDITIONS (carrusel, fondo crema/blanco)         │
│  [Prod] [Prod] [Prod] [Prod]                             │
├──────────────────────────────────────────────────────────┤
│  FOOTER (fondo #252525)                                  │
│  "Subscribe to Aesop communications"                     │
│  "Your best and wisest refuge..." — Ada Lovelace         │
└──────────────────────────────────────────────────────────┘
```
