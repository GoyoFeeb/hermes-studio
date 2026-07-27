# Structure: 2026-jul-wornwear-usado

## Datos de campaña

| Campo | Valor |
|---|---|
| Cliente | Patagonia Worn Wear |
| Campaña | 2026-jul-wornwear-usado |
| Patrón | `fotografia-primero` |
| Hero | `hero-imagen` |
| Section style | `asimetrico` (basado en el hero SPLIT real de la web) |
| Color primario (fondo hero/banda) | `#000000` |
| Color cierre (deep) | `#1A1A1A` |
| Color sección alterna | `#EFE7DA` (beige) |
| CTA background | `#FA4616` (naranja marca) |
| CTA text | `#000000` (negro — accesibilidad) |

## Secuencia de módulos

```
┌─────────────────────────────────────────────────────┐
│ 1. header-logo.html                                 │
│    Fondo: #FFFFFF                                   │
│    Logo: WW_Logo_Website.png (150×42px)             │
│    Label: "WORN WEAR"                               │
│    Etiqueta: "patagonia"                            │
│    Ancla — obligatorio                              │
├─────────────────────────────────────────────────────┤
│ 2. hero-imagen.html                                 │
│    Fondo: #000000 (colors.primary)                  │
│    Foto banner: pendiente de generar                │
│    Brand name: Patagonia Worn Wear                  │
│    H1: [PENDIENTE — lo escribe Copy]               │
│    Subtítulo: [PENDIENTE — lo escribe Copy]        │
│    CTA: [PENDIENTE — lo escribe Copy]              │
│    utm_content: hero                                │
│    Ancla — obligatorio                              │
├─────────────────────────────────────────────────────┤
│ 3. intro-cta.html                                   │
│    Fondo: #FFFFFF                                   │
│    Título: [PENDIENTE — lo escribe Copy]           │
│    Body: [PENDIENTE — lo escribe Copy]             │
│    CTA: [PENDIENTE — lo escribe Copy]              │
│    utm_content: intro                               │
│    Opcional — transición contextual                 │
├─────────────────────────────────────────────────────┤
│ 4. columns-3-beneficios-sin-icono.html              │
│    Fondo: #EFE7DA (surfaces.sectionLila)           │
│    Título sección: [PENDIENTE — lo escribe Copy]   │
│    Nº de beneficios: abierto (2-4), lo determina   │
│      05 según cuántas razones defendibles tenga    │
│      con copy real — no rellenar para llegar a 3.  │
│      Si solo hay 2 razones genuinas, el motor las  │
│      renderiza en 1 fila de 2 columnas al 50%.     │
│    Highlight + HighlightNote: [PENDIENTE]          │
│    Opcional — 3 razones para comprar usado         │
├─────────────────────────────────────────────────────┤
│ 5. banda-cierre-asimetrico.html                     │
│    Fondo: #1A1A1A (colors.deep)                    │
│    Título: [PENDIENTE — lo escribe Copy]           │
│    Body: [PENDIENTE — lo escribe Copy]             │
│    CTA: [PENDIENTE — lo escribe Copy]              │
│    utm_content: cierre                              │
│    Ancla — obligatorio                              │
│    Variante asimetrica (sectionStyle del pack)      │
├─────────────────────────────────────────────────────┤
│ 6. footer.html                                      │
│    Fondo: #EFE7DA (surfaces.global)                │
│    brandName: "Patagonia Worn Wear"                 │
│    tagline: "Used Patagonia® Clothing & Gear"       │
│    disclosure: [PLACEHOLDER — test campaign]        │
│    Ancla — siempre                                  │
└─────────────────────────────────────────────────────┘
```

## Orden justificado contra contentRhythm

El orden de módulos se compone contra el `layout.contentRhythm` observado en wornwear.patagonia.com el 2026-07-24:

| Posición | Módulo email | Sección web que replica | Cita de contentRhythm |
|---|---|---|---|
| 1 | header-logo | "HEADER: Logo 'WORN WEAR' + navegación — fondo blanco" | El logo sobre blanco replica la cabecera real. |
| 2 | hero-imagen | "HERO SPLIT (PESO VISUAL MUY ALTO): headline naranja + fotografía lifestyle" | La foto banner sigue siendo el elemento de mayor peso visual, como en la web. El texto va debajo sobre negro, no sobre beige, porque `fotografia-primero` usa primary como fondo de texto (no replica el beige del hero). |
| 3 | intro-cta | Transición post-hero | La web real pasa del hero directamente a categorías. En email, se necesita una transición breve que contextualice qué es Worn Wear — especialmente para quien no conoce la submarca. |
| 4 | columns-3-beneficios-sin-icono | "NEW ARRIVALS SLIDER: producto aislado... título centrado" y "CATEGORY GRID: 4 columnas con fotografía" | No tenemos assets de producto para replicar esas secciones. En su lugar, se ofrecen 3 beneficios de comprar usado, sobre el beige #EFE7DA que la web usa como fondo de marca. El beige conecta visualmente con el hero real de la web. |
| 5 | banda-cierre-asimetrico | "'YOUR GEAR DESERVES CREDIT' (PESO VISUAL ALTO): Banda de fondo oscuro (#1A1A1A), título grande blanco, CTA" | La sección más distintiva de la web después del hero. Se replica casi literal: banda oscura, titular, CTA. Variante asimétrica porque la web tiene un diseño asimétrico general. |
| 6 | footer | "FOOTER NEGRO: 4 columnas, fondo negro (#000000), texto blanco" | Footer con placeholders legales. El fondo del footer usa surfaces.global (#EFE7DA) por diseño del patrón, no el negro real de la web (el patrón fotografia-primero no tiene variante de footer oscuro). |

## Claims prohibidos (sección obligatoria)

| ID | Claim prohibido | Tipo | Consecuencia |
|---|---|---|---|
| CP-01 | Cifras de impacto ambiental (CO₂, agua, residuos, etc.) | 🔴 Bloqueante | Sin fuente verificada en el brief |
| CP-02 | Porcentajes de descuento o ahorro ("hasta un X%") | 🔴 Bloqueante | Precios variables del catálogo de usado |
| CP-03 | "Gratuito", "Free", "Sin coste" | 🔴 Bloqueante | No aplica al modelo de negocio |
| CP-04 | Urgencia ("ahora", "últimas unidades", "no te lo pierdas") | 🟡 Precaución | No hay escasez confirmada |
| CP-05 | Exclusividad ("solo para ti", "exclusivo") | 🟡 Precaución | Sin personalización real (isTestCampaign) |
| CP-06 | Comparativos ("mejor que", "más barato que", "líder en") | 🔴 Bloqueante | Sin evidencia documentada |
| CP-07 | "Misma garantía que nuevo" (solo si se verifica textual en la web) | 🟡 Precaución | Copiar textual de wornwear.patagonia.com si existe, no parafrasear |
| CP-08 | Cifras de ahorro económico calculadas | 🔴 Bloqueante | Precios variables, no hay cifra de ahorro verificada |

## Notas técnicas

- **Hero-imagen**: El arte se genera mediante `npm run generate-hero-image`. Si falla (sin API key / sin internet), el bannerSrc se deja como placeholder explícito y se documenta como bloqueo en 09-exports/production-blockers.md. NO se cambia a hero-centrado.
- **utm_content por módulo**: Se incrusta directamente en cada `cta.href` del campaign-data.json (el schema `utm` solo documenta la convención a nivel de campaña).
- **Logo**: Solo disponible en PNG con fondo blanco. No usar en banda de cierre (fondo oscuro). El footer usa texto plano, no logo.
