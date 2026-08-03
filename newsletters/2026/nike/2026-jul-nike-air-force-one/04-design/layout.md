# Layout — Nike Air Force One Relanzamiento

## Estructura general

```
┌──────────────────────────────────────────────────┐
│                 header-logo                       │
│            Fondo: #FFFFFF | Centrado              │
│            Logo: swoosh PNG (120×42px)            │
│            Padding: 16px arriba/abajo             │
├──────────────────────────────────────────────────┤
│                 hero-imagen                       │
│            Fondo: #111111 | Centrado              │
│            Banner AF1 (600×350px)                 │
│            H1: #FFFFFF | 28px | Inter 500         │
│            Subtitle: #707072 | 16px | Inter 400   │
│            CTA: #111111 bg / #FFFFFF text         │
│            Padding sección: 40px                  │
├──────────────────────────────────────────────────┤
│                 intro-cta                         │
│            Fondo: #FFFFFF | Centrado              │
│            Copy breve (≤40 words)                 │
│            Texto: #111111 | 14px | Inter 400      │
│            Padding sección: 36px                  │
│            Sin CTA propio (usa hero o cierre)     │
├──────────────────────────────────────────────────┤
│            editorial-foto-texto                   │
│            Fondo: #F5F5F5 | Imagen izq / Texto der│
│            Imagen AF1 detalle (276×276px, 46%)    │
│            Eyebrow: "DETALLE" | #707072 | 11px    │
│            Título: #111111 | 16px | Inter 500     │
│            Body: #707072 | 14px | Inter 400       │
│            CTA contextual (text link)             │
│            Padding sección: 36px                  │
├──────────────────────────────────────────────────┤
│        columns-3-beneficios-sin-icono             │
│            Fondo: #FFFFFF | Centrado              │
│            3 columnas iguales, sin icono          │
│            Título: #111111 | 16px | Inter 500     │
│            Body: #707072 | 14px | Inter 400       │
│            Highlight box abajo (opcional)         │
│            Padding sección: 36px                  │
├──────────────────────────────────────────────────┤
│                banda-cierre                       │
│            Fondo: #111111 | Centrado              │
│            Texto: #FFFFFF | 20px | Inter 500      │
│            CTA: #111111 bg / #FFFFFF text, pill   │
│            Padding sección: 32px                  │
├──────────────────────────────────────────────────┤
│                   footer                          │
│            Fondo: #F5F5F5 | Centrado              │
│            Tagline: #111111 | 12px | Inter 500    │
│            Legal: #707072 | 11px | Inter 400      │
│            Padding sección: 24px                  │
└──────────────────────────────────────────────────┘
```

## Ritmo visual
El layout alterna fondos para mantener ritmo visual: blanco → oscuro hero → blanco → gris sección → blanco → oscuro cierre → gris footer. Este patrón evita monotonía y da peso visual diferenciado a cada sección.

## Notas de trazabilidad a la página real
- **hero sobre fondo oscuro:** La página real usa fondo blanco infinito en las fotos. El email invierte a fondo oscuro (#111111) para que el texto blanco del H1 tenga contraste — decisión de email compatibility, no copia directa de la web.
- **editorial-foto-texto con fondo gris:** La página real muestra fotos de detalle sobre fondo blanco. El gris (#F5F5F5) aísla visualmente este bloque en el email y le da identidad propia dentro del ritmo.
- **Bandas oscuras (hero + cierre):** Misma técnica que la página real usa en overlays de video — usar el negro Nike (#111111) como fondo para que el producto visual destaque.
