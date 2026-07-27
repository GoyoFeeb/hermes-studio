# Visual Analysis — BMW X1 (observado en bmw.es)

## Paleta de colores (computada con getComputedStyle)

| Uso | Color | Hex | Observado en |
|-----|-------|-----|-------------|
| CTA principal (azul BMW) | `rgb(28, 105, 212)` | `#1C69D4` | Botón "Configuración y precio" en hero |
| Texto CTA principal | `rgb(255, 255, 255)` | `#FFFFFF` | Mismo botón |
| Body text | `rgb(38, 38, 38)` | `#262626` | Párrafo principal sobre fondo blanco |
| Hero title light | `rgb(255, 255, 255)` | `#FFFFFF` | "Gama BMW X1" en hero |
| Fondo página | — | `#FFFFFF` | Fondo general del sitio |
| Fondos alternos | — | `#F4F4F4` (estimado) | Secciones de contraste ligero |
| Footer | — | Gris claro | Pie de página |

## Tipografía (computada con getComputedStyle)

| Elemento | Fuente | Tamaño | Peso |
|----------|--------|--------|------|
| H1 hero | `bmwTypeNextWeb` → `Arial, Helvetica, sans-serif` | 35px | 300 (light) |
| H2 | `bmwTypeNextWeb` → `Arial, Helvetica, sans-serif` | Variable | 300 (light) |
| Body | `bmwTypeNextWeb` → `Arial, Helvetica, sans-serif` | 18px | 300 (light) |
| CTA | `bmwTypeNextWeb` → `Arial, Helvetica, sans-serif` | 15px | 500 (medium) |

**Nota email:** `bmwTypeNextWeb` no es segura en email. Se usará **Arial/Helvetica** como fallback, consistente con la propia cadena de fuentes de BMW.

## Botones (computado)

| Propiedad | Valor |
|-----------|-------|
| Background | `#1C69D4` (azul BMW) |
| Text color | `#FFFFFF` |
| Font size | 15px |
| Font weight | 500 (medium) |
| Border radius | 3px |
| Padding | 4px 24px (puede variar por contenedor) |
| Shape | Rectangular, ligeramente redondeado |
| Text transform | none |

## Composición de la newsletter (email)

- **Email width:** 600px estándar
- **Header:** Logo BMW centrado, blanco o pequeño sobre fondo blanco
- **Hero:** Imagen del X1 a sangre (full-bleed dentro del contenedor de 600px), con titular y CTA superpuestos o debajo
- **Alternancia:** Secciones blancas y de gris claro (#F4F4F4) para variedad visual
- **Modelos:** Si se muestran variantes, formato mosaico limpio sin bordes de tarjeta
- **Tipografía limpia:** Sin sombras, sin barras decorativas, sin bordes de tarjeta — BMW usa el contenido y la fotografía como único adorno
