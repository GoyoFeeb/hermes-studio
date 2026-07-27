# Especificaciones de Diseño — Audi A6 Sportback e-tron

## 1. Layout General

| Propiedad | Valor |
|---|---|
| Ancho máximo | 600 px |
| Ancho móvil | 100% fluido, min 320px |
| Padding horizontal desktop | 32 px |
| Padding horizontal móvil | 20-24 px |
| Alineación base | Izquierda |
| Esquinas | Rectas (border-radius: 0) |
| Sombras | Ninguna |

## 2. Sistema de Espaciado

Basado en múltiplos de 8:

| Contexto | Valor |
|---|---|
| Espacio mínimo interno | 8 px |
| Separación texto-texto | 8-16 px |
| Separación titular-párrafo | 16-20 px |
| Separación párrafo-CTA | 24-32 px |
| Padding módulos compactos | 32-40 px |
| Padding módulos editoriales | 48-64 px |
| Separación entre secciones | 56-80 px |
| Padding header vertical | 22-28 px |
| Padding header horizontal | 28-32 px |

## 3. Tipografía

| Elemento | Font | Size | Weight | Color | Letter-spacing |
|---|---|---|---|---|---|
| Hero H1 | Inter, Arial, sans-serif | 32px (26px mobile) | 300 | #FFFFFF | normal |
| Hero subtitle | Inter, Arial, sans-serif | 16px (14px mobile) | 400 | #FFFFFF | normal |
| Section title (h2) | Inter, Arial, sans-serif | 22px | 400 | #000000 | normal |
| Card title (h3) | Inter, Arial, sans-serif | 16px | 500 | #000000 | normal |
| Body | Inter, Arial, sans-serif | 16px (14px mobile) | 400 | #000000 | normal |
| Body small | Inter, Arial, sans-serif | 14px | 400 | #67707F | normal |
| CTA text | Inter, Arial, sans-serif | 16px | 500 | #FFFFFF | 1px |
| Legal | Arial, sans-serif | 11px | 400 | #67707F | normal |

### Fallback
Usar `Inter, Arial, Helvetica, sans-serif` en todas las propiedades font-family.
Composición debe mantenerse correcta con Arial si Inter no carga.

## 4. Paleta de Colores

| Token | Hex | Uso |
|---|---|---|
| `colors.primary` | #000000 | Color estructural principal |
| `colors.deep` | #101319 | Fondo oscuro editorial (cierre) |
| `colors.white` | #FFFFFF | Blanco técnico, texto sobre oscuro |
| `surfaces.white` | #FCFCFD | Superficie clara predominante |
| `surfaces.global` | #F5F5F5 | Fondo secciones alternas |
| `colors.textPrimary` | #000000 | Texto principal |
| `colors.textSecondary` | #67707F | Texto secundario / legales |
| `colors.border` | #D9D9D9 | Divisores, bordes |
| `colors.ctaBackground` | #000000 | Fondo botón CTA |
| `colors.ctaText` | #FFFFFF | Texto botón CTA |

## 5. Especificaciones por Módulo

### Módulo 1 — Header
- Fondo: `#FCFCFD`
- Logo: Anillos Audi PNG, ancho 72-96px
- Alineación: izquierda
- Padding: 24px vertical, 32px horizontal
- Sin elementos adicionales

### Módulo 2 — Hero
- Imagen a ancho completo (600×350px)
- Texto hero debajo de la imagen (no superpuesto)
- Fondo texto hero: `#101319`
- Padding texto: 48px vertical, 32px horizontal
- CTA principal: negro `#000000`, texto blanco, 16px 36px padding
- CTA secundario: texto blanco, subrayado o outline sutil

### Módulo 3 — Manifiesto
- Fondo: `#FCFCFD`
- Padding: 48px vertical, 32px horizontal
- Título h2 22px/400
- Cuerpo 16px/400
- CTA secundario (text link)

### Módulo 4 — Datos Técnicos
- Fondo: `#F5F5F5`
- 3 columnas iguales
- Cifras grandes (28px/500)
- Etiquetas pequeñas (12px/400, #67707F)
- Divisores verticales de 1px #D9D9D9 entre columnas
- Padding: 40px vertical

### Módulo 5 — Diseño Exterior
- Fondo: `#FCFCFD`
- Imagen horizontal con padding
- Título h2 + cuerpo + CTA (text link)

### Módulo 6 — Interior y Experiencia
- Fondo: `#F5F5F5`
- Título h2 + cuerpo + CTA (text link)
- Imagen conceptual de interior (opcional)

### Módulo 7 — Conversión (cierre)
- Fondo: `#101319`
- Texto: #FFFFFF
- Título h2 22px/400 blanco
- Cuerpo: 16px/400 blanco
- CTA: blanco `#FFFFFF` sobre fondo oscuro, o negro si fondo es más claro
- Padding: 56px vertical

### Módulo 8 — Footer
- Fondo: `#F5F5F5`
- Texto legal: 11px/400 #67707F
- Logo pequeño o nombre de marca
- Enlaces de baja y preferencias

## 6. Responsive

| Breakpoint | Ancho | Cambios |
|---|---|---|
| Desktop | 600px | Layout completo |
| Tablet | 480-599px | Padding reducido a 24px |
| Mobile | <480px | Padding 20px, columnas apiladas, CTA full-width |

### Específico móvil:
- Las 3 columnas técnicas apiladas verticalmente
- CTA a ancho completo
- Texto mínimo 16px en cuerpo
- Botones touch-friendly (min 44px altura)
- Sin scroll horizontal
