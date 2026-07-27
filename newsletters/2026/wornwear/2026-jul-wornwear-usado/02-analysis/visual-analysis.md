# Visual Analysis: Patagonia Worn Wear

## Resumen visual

Worn Wear es una marca de **2 colores + fotografía**. Su lenguaje visual se basa en:
1. **Naranja #FA4616** — único acento cromático. Solo para titulares importantes y CTAs
2. **Beige #EFE7DA** — fondo alternante, textura visual cálida
3. **Fotografía lifestyle** — outdoor real, personas, equipo, garajes, montaña

No usa degradados, sombras, iconos decorativos, ilustraciones ni emblemas.

## Arquitectura de página observada

```
┌──────────────────────────────────────────────────────────┐
│  HEADER (fondo blanco)                                   │
│  [WORN WEAR logo]  Shop  Trade-In    🔍 🛒              │
├──────────────────────────────────────────────────────────┤
│  HERO SPLIT (PESO VISUAL MUY ALTO)                      │
│  ┌──────────────────┐ ┌────────────────────────────────┐│
│  │ Fondo beige       │ │ Fotografía lifestyle (50%)     ││
│  │ #EFE7DA           │ │ Escalada en garaje             ││
│  │ "Put Used to Use" │ │                                ││
│  │ (naranja 40px)    │ │                                ││
│  │ [texto body]      │ │                                ││
│  │ [CTA naranja pill]│ │                                ││
│  └──────────────────┘ └────────────────────────────────┘│
├──────────────────────────────────────────────────────────┤
│  CATEGORY GRID (4 cols, fondo blanco)                    │
│  [Foto]      [Foto]        [Foto]      [Foto]            │
│  Web Specials Repaired     Re-Tool     Kids & Baby       │
├──────────────────────────────────────────────────────────┤
│  NEW ARRIVALS (fondo blanco)                             │
│  [Prod aislado] [Prod aislado] [Prod aislado] [Prod]     │
│  Nombre · Color · $Precio                                │
├──────────────────────────────────────────────────────────┤
│  "YOUR GEAR DESERVES CREDIT" (fondo #1A1A1A)            │
│  Título blanco 48px centrado                             │
│  [CTA blanco pill + texto negro] "Trade In"              │
├──────────────────────────────────────────────────────────┤
│  SECCIÓN INFORMATIVA (fondo blanco)                      │
│  "Worn Wear® allows you to trade in..."                  │
├──────────────────────────────────────────────────────────┤
│  VIDEO / FOOTER                                          │
│  Footer negro 4 columnas                                 │
└──────────────────────────────────────────────────────────┘
```

## Tratamiento de imágenes

| Tipo | Características |
|---|---|
| Hero lifestyle | Documental, exterior, iluminación natural, cálida |
| Categoría | Foto a ancho completo, persona o escena outdoor |
| Producto | Aislado sobre blanco puro, recortado, sin sombra |
| Relación aspecto hero | ~1420×1220px (casi cuadrado en web, adaptar a 600×340 en email) |

## Adaptación a email

### Retos identificados

| Aspecto | Web | Email |
|---|---|---|
| Hero split text/foto | 50/50 row | En email, apilar verticalmente (mobile-first) |
| Header con navegación | 3 columnas (logo, nav, iconos) | Solo logo + label legal mínimo |
| Category grid | 4 columnas | 2 columnas en mobile, 3 en desktop |
| Product slider | Carrusel horizontal | Grid estático de 2×2 o 3 productos |
| Video | Embed | No compatible — omitir o screenshot |

### Paleta para email

| Uso | HEX | Aplica a |
|---|---|---|
| Fondo general | `#FFFFFF` | Container, cards |
| Fondo alterno | `#EFE7DA` | Secciones alternas |
| CTA background | `#FA4616` | Botones principales |
| CTA text | `#FFFFFF` | Texto dentro de botón |
| Hero/footer background | `#000000` | Banda de cierre, footer |
| Body text | `#494949` | Párrafos |
| Títulos | `#000000` | H1, H2, H3 |
| Accent / links | `#FA4616` | Enlaces, titulares hero |
| Footer text | `#FFFFFF` | Texto en footer |
| Footer legal | `#999999` | Texto legal en footer |

### Tipografía para email

| Elemento | Font-family | Size | Weight | Color |
|---|---|---|---|---|
| Hero headline | Arial, Helvetica, sans-serif | 32px (24px mobile) | 500 | #FA4616 |
| Hero subtitle | Arial, Helvetica, sans-serif | 16px (14px mobile) | 300 | #494949 |
| Section H2 | Arial, Helvetica, sans-serif | 22px | 500 | #000000 |
| Body | Arial, Helvetica, sans-serif | 14px | 300 | #494949 |
| CTA | Arial, Helvetica, sans-serif | 16px | 500 | #000000 |
| Footer brand | Arial, Helvetica, sans-serif | 12px | 700 | #FFFFFF |
| Footer legal | Arial, Helvetica, sans-serif | 11px | 300 | #999999 |

### Notas de contraste WCAG

- CTA (negro #000000 sobre naranja #FA4616): 5.95:1 ✅ PASA AA (4.5:1). **Decisión consciente**: la web real usa blanco (3.53:1, falla). Se adopta negro por accesibilidad en email, mismo criterio que Spotify (negro sobre verde).
- Body text (#494949) sobre blanco (#FFFFFF): 9.00:1 ✅ PASA
- Body text (#494949) sobre beige (#EFE7DA): 7.34:1 ✅ PASA
- Subtítulo hero (#FFFFFF) sobre primary (#000000): 21:1 ✅ PASA
- Texto banda de cierre (#FFFFFF) sobre deep (#1A1A1A): 17.40:1 ✅ PASA
