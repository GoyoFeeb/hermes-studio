# Visual Analysis — Nike Pegasus 42 (observado en nike.com)

## Paleta de colores (computada con getComputedStyle)

| Uso | Color | Hex | Observado en |
|-----|-------|-----|-------------|
| Texto principal (H1, precios) | `rgb(17, 17, 17)` | `#111111` | Título "Nike Pegasus 42", precios |
| Texto secundario (categoría, body) | `rgb(112, 112, 114)` | `#707072` | "Men's Road Running Shoes", body text |
| CTA primario (fondo) | `rgb(17, 17, 17)` | `#111111` | Botón "Write a Review" (pill) |
| CTA primario (texto) | `rgb(255, 255, 255)` | `#FFFFFF` | Texto del botón |
| CTA secundario (fondo) | `rgb(245, 245, 245)` | `#F5F5F5` | Botones de acción secundaria |
| CTA secundario (texto) | `rgb(17, 17, 17)` | `#111111` | Texto botón secundario |
| Fondo página | — | `#FFFFFF` | Fondo general |
| Fondo secciones | — | `#FFFFFF` | Todas las secciones sobre blanco |
| "Highly Rated" badge | — | #111111 texto, transparente bg | Badge de producto |
| "Recycled Materials" badge | — | Rojo óxido (~#C25E5E) | Badge de sostenibilidad |

## Tipografía (computada con getComputedStyle)

| Elemento | Fuente | Tamaño | Peso | Color |
|----------|--------|--------|------|-------|
| H1 producto | `Helvetica Now Display Medium` → `Helvetica, Arial, sans-serif` | 20px | 500 | #111111 |
| H2 categoría | `Helvetica Now Text` → `Helvetica, Arial, sans-serif` | 16px | 400 | #707072 |
| Body text | `Helvetica Now Text Medium` → `Helvetica, Arial, sans-serif` | 12-16px | 500 | #707072 |
| CTA button | `Helvetica Now Text` → `Helvetica, Arial, sans-serif` | 16px | 500 | #FFFFFF / #111111 |
| Badge "Highly Rated" | `Helvetica Now Text` → `Helvetica, Arial, sans-serif` | 14px | 500 | #111111 |

**Nota email:** Nike usa `Helvetica Now Display/Text` (fuentes propietarias). No son seguras en email. Fallback: **Helvetica, Arial, sans-serif** — la cadena de fuentes de Nike ya incluye estos fallbacks.

## Botones / CTAs (computado)

| Propiedad | CTA Primario | CTA Secundario |
|-----------|-------------|----------------|
| Background | `#111111` | `#F5F5F5` |
| Text color | `#FFFFFF` | `#111111` |
| Font size | 16px | 16px |
| Font weight | 500 (medium) | 500 (medium) |
| Border radius | 30px (pill) | 30px (pill) |
| Padding | 12px 24px | 12px |
| Shape | Pill / Cápsula | Pill / Cápsula |

## Composición de la newsletter (email)

- **Email width:** 600px estándar
- **Header:** Logo Nike (swoosh) centrado sobre blanco
- **Hero:** Imagen del Pegasus 42 a sangre, con titular y CTA superpuestos o debajo
- **Contenido:** Fotografía primero, texto mínimo. 1-2 secciones de características técnicas con imagen + texto corto.
- **Colores:** Blanco (#FFFFFF) como fondo dominante. Negro (#111111) para texto y CTAs.
- **Sin adornos:** Nike no usa sombras, degradados decorativos, ni barras de acento. El swoosh y la fotografía son los únicos elementos visuales.
- **CTAs en pill:** 30px border-radius, fondo negro, texto blanco.
