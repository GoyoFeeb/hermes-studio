# Layout: 2026-jul-wornwear-usado

## Composición visual general

```
┌──────────────────────────────────────────────────┐
│  HEADER (fondo blanco #FFFFFF)                    │
│  ┌────────────────────────────────────────────┐   │
│  │        [WORN WEAR logo PNG]               │   │
│  │             patagonia                      │   │
│  └────────────────────────────────────────────┘   │
│  Densidad: BAJA · Alineación: CENTRADA            │
├──────────────────────────────────────────────────┤
│  HERO (fondo foto banner + primary #000000)      │
│  ┌────────────────────────────────────────────┐   │
│  │       FOTO LIFESTYLE OUTDOOR (600×280)     │   │
│  │         (banner decorativo, sin texto)      │   │
│  └────────────────────────────────────────────┘   │
│  ┌────────────────────────────────────────────┐   │
│  │  PATAGONIA WORN WEAR (brand name, 12px)    │   │
│  │  [H1 — naranja #FA4616, 32px, weight 500]  │   │
│  │  [Subtítulo — gris #494949, 16px, w300]    │   │
│  │  ┌──────────────────────────────┐          │   │
│  │  │  CTA PRINCIPAL (pill naranja │          │   │
│  │  │  #FA4616, texto #000000)     │          │   │
│  │  └──────────────────────────────┘          │   │
│  └────────────────────────────────────────────┘   │
│  Densidad: ALTA (foto protagonista) · CENTRADA    │
├──────────────────────────────────────────────────┤
│  INTRO (fondo blanco #FFFFFF)                    │
│  ┌────────────────────────────────────────────┐   │
│  │  [Título intro — 22px, weight 500, #000]   │   │
│  │  [Body intro — 14px, w300, #494949]        │   │
│  │  [CTA secundario outline — 14px]            │   │
│  └────────────────────────────────────────────┘   │
│  Densidad: BAJA · Alineación: CENTRADA            │
├──────────────────────────────────────────────────┤
│  BENEFICIOS (fondo beige #EFE7DA)                │
│  ┌────────────────────────────────────────────┐   │
│  │  [Título sección — 22px, w500, #000]       │   │
│  │                                             │   │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐      │   │
│  │  │▬ barrita│ │▬ barrita│ │▬ barrita│      │   │
│  │  │ Título  │ │ Título  │ │ Título  │      │   │
│  │  │ Body    │ │ Body    │ │ Body    │      │   │
│  │  └─────────┘ └─────────┘ └─────────┘      │   │
│  │  (2-4 items, N lo decide Copy)             │   │
│  │                                             │   │
│  │  ┌─ HIGHLIGHT CARD (borde 1px, fondo ─┐   │   │
│  │  │  blanco) — highlight + highlightNote│   │   │
│  │  └─────────────────────────────────────┘   │   │
│  └────────────────────────────────────────────┘   │
│  Densidad: MEDIA · Alineación: CENTRADA           │
├──────────────────────────────────────────────────┤
│  BANDA DE CIERRE (fondo deep #1A1A1A)             │
│  ┌────────────────────────────────────────────┐   │
│  │  [Título cierre — 22px, w500, #FFFFFF]     │   │
│  │  [Body cierre — 14px, w300, #FFFFFF]       │   │
│  │                                             │   │
│  │  ┌─────────────────────────┐               │   │
│  │  │  CTA PRINCIPAL (pill    │               │   │
│  │  │  naranja #FA4616,       │               │   │
│  │  │  texto #000000)         │               │   │
│  │  └─────────────────────────┘               │   │
│  └────────────────────────────────────────────┘   │
│  Densidad: MEDIA · Alineación: IZQUIERDA (asimetrico)│
├──────────────────────────────────────────────────┤
│  FOOTER (fondo beige #EFE7DA)                    │
│  ┌────────────────────────────────────────────┐   │
│  │  Patagonia Worn Wear (brand, 12px, 700)    │   │
│  │  Used Patagonia® Clothing & Gear (tagline)  │   │
│  │  [disclosure placeholder]                   │   │
│  │  [UNSUBSCRIBE_LINK] · [PREFERENCES_LINK]    │   │
│  └────────────────────────────────────────────┘   │
│  Densidad: BAJA · Alineación: CENTRADA            │
└──────────────────────────────────────────────────┘
```

## Verificación de ritmo (regla dura §2 de fotografia-primero.md)

Ninguna sección consecutiva puede repetir la misma combinación fondo+alineación+densidad:

| # | Sección | Fondo | Alineación | Densidad | Cambia vs anterior |
|---|---|---|---|---|---|
| 1 | header-logo | Blanco | Centrada | Baja | — |
| 2 | hero-imagen | #000000+foto | Centrada | Alta | ✅ Fondo + Densidad |
| 3 | intro-cta | Blanco | Centrada | Baja | ✅ Fondo + Densidad |
| 4 | columns-3-beneficios-sin-icono | #EFE7DA | Centrada | Media | ✅ Fondo |
| 5 | banda-cierre-asimetrico | #1A1A1A | Izquierda | Media | ✅ Fondo + Alineación |
| 6 | footer | #EFE7DA | Centrada | Baja | ✅ Fondo + Alineación + Densidad |

**Resultado: ✅ Todas las transiciones tienen al menos un cambio. La regla se cumple.**

## Esquema de colores por sección

| Sección | Fondo | Texto principal | Texto secundario | CTA bg | CTA text |
|---|---|---|---|---|---|
| Header | #FFFFFF | #000000 | — | — | — |
| Hero | #000000 + foto | #FA4616 (H1) | #494949 (sub) | #FA4616 | #000000 |
| Intro | #FFFFFF | #000000 | #494949 | outline #000000 | #000000 |
| Beneficios | #EFE7DA | #000000 | #494949 | — | — |
| Banda cierre | #1A1A1A | #FFFFFF | #FFFFFF | #FA4616 | #000000 |
| Footer | #EFE7DA | #000000 | #494949 | — | — |
