# Structure: New Balance — new-balance-premium

## Información general

| Campo | Valor |
|---|---|
| Cliente | New Balance |
| Campaña | new-balance-premium |
| Total módulos | 7 |
| CTA principal | Descubrir |
| Posición del CTA | Módulo 2 (hero) + Módulo 6 (cierre) |
| Patrón | fotografia-primero |

## Estructura visual (desktop)

```
┌─────────────────────────────────┐
│   Módulo 1 — header-logo        │  Fondo blanco
├─────────────────────────────────┤
│   Módulo 2 — hero-imagen        │  Banner fotográfico a sangre
│   Titular: "The Running Collection"   │  Copy debajo del banner
│   Subtítulo + CTA                │
├─────────────────────────────────┤
│   Módulo 3 — editorial-foto-texto │  Foto izquierda (46%) | Texto derecha (54%)
│   "Nuevos colores, mismo espíritu"  │
├─────────────────────────────────┤
│   Módulo 4 — editorial-foto-texto-inverso │  Texto izquierda | Foto derecha
│   "120 años de herencia"         │
├─────────────────────────────────┤
│   Módulo 5 — columns-3-beneficios-sin-icono │  Fondo #F2F2F3
│   Rendimiento | Herencia | Estilo │  3 valores de marca
├─────────────────────────────────┤
│   Módulo 6 — banda-cierre        │  Fondo #231F20
│   "We're In It For The Long Run" │
│   CTA: "Descubrir"               │
├─────────────────────────────────┤
│   Módulo 7 — footer              │  Fondo #F5F5F5
│   Legal, tagline, enlaces        │
└─────────────────────────────────┘
```

## Secuencia detallada

| Módulo | Nombre | Función | Imagen | Texto | CTA | Ritmo |
|---|---|---|---|---|---|---|
| 1 | header-logo | Identidad marca | Logo NB 120x30 | Tagline "New Balance" | No | Bajo |
| 2 | hero-imagen | Impacto visual + contexto | Banner 600x350 | H1: "The Running Collection" / Subtítulo | "Descubrir" | Alto |
| 3 | editorial-foto-texto | Bloque editorial 1 | Foto lifestyle 276x368 | "Nuevos colores, mismo espíritu" + body | No | Medio |
| 4 | editorial-foto-texto-inverso | Bloque editorial 2 | Foto producto 276x368 | "120 años de herencia" + body | No | Medio |
| 5 | columns-3-beneficios-sin-icono | Valores de marca | No | 3 pilares con título + body | No | Medio |
| 6 | banda-cierre | Cierre + conversión | No | "We're In It For The Long Run" + body | "Descubrir" | Medio |
| 7 | footer | Legal, enlaces | No | Tagline, legal, baja | No | Bajo |

## Comportamiento responsive

| Módulo | Desktop | Mobile | Notas |
|---|---|---|---|
| 1 | Centrado, logo 120px | Centrado, logo 100px | |
| 2 | Banner 600x350 | Banner 100% ancho, altura auto | |
| 3 | Foto 46% izq + texto 54% der | Foto arriba, texto abajo | Stack vertical en mobile |
| 4 | Texto 54% izq + foto 46% der | Foto arriba, texto abajo | Stack vertical en mobile |
| 5 | 3 columnas iguales | Stack vertical 1 columna | Sin iconos |
| 6 | Centrado, fondo oscuro | Centrado, fondo oscuro | |
| 7 | Centrado, texto pequeño | Centrado, texto pequeño | |

## Riesgos estructurales

| ID | Riesgo | Severidad | Módulo |
|---|---|---|---|
| SR-001 | Banner hero PENDING-CDN-UPLOAD — no visible hasta CDN real | Media | 2 |
| SR-002 | Dos fuentes distintas sin webFont (serif + sans) | Baja | Global |
| SR-003 | Sin iconos — variante -sin-icono asegura consistencia | Baja | 5 |
