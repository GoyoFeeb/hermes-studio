# Visual Analysis: Para y Compara — 2026-jul-ahorra-fibra-movil

## Especificaciones visuales para la newsletter

### Paleta recomendada

| Uso en newsletter | Color | Hex | Nota |
|---|---|---|---|
| Fondo general del email | Blanco | `#FFFFFF` | Estándar para newsletters |
| Fondo del body del email | Gris claro | `#F7F0F7` | Coherente con web |
| Título principal (Hero) | Morado primario | `#792771` | Color marca |
| Texto del cuerpo | Gris oscuro | `#333333` | Legibilidad email |
| Botón CTA primario | Naranja CTA | `#F85842` | Mismo CTA que en web |
| Texto del botón CTA | Blanco | `#FFFFFF` | Contraste sobre naranja |
| Botones secundarios | Blanco con borde morado | `#FFFFFF` + `#792771` | Pill shape |
| Enlaces | Naranja CTA | `#F85842` | Coherente con web |
| Texto secundario / footer | Gris claro | `#A38EA1` | Texto legal, metadatos |
| Divisores | Gris claro | `#E0E0E0` | Estándar email |

### Tipografía para email

| Elemento | Fuente | Tamaño | Peso |
|---|---|---|---|
| Título principal | Alexandria, Arial, sans-serif | 28-32px | Bold (700) |
| Subtítulo | Alexandria, Arial, sans-serif | 16-18px | Normal (400) |
| Cuerpo de texto | Arial, Helvetica, sans-serif | 15-16px | Normal (400) |
| CTA botón | Arial, sans-serif | 14-16px | Bold (600) |
| Footer / legal | Arial, sans-serif | 11-12px | Normal (400) |

> **Nota:** Alexandria es la fuente de la web pero puede no estar disponible en clientes de email. Usar Arial como principal para la newsletter con Alexandria como preferencia si el cliente lo aprueba y se configura mediante @import o enlace.

### Estilos de botón CTA

| Propiedad | Valor |
|---|---|
| Fondo | `#F85842` |
| Texto | Blanco (`#FFFFFF`) |
| Radio de borde | 30px |
| Padding | 12px 28px |
| Font size | 16px |
| Font weight | 600 |
| Alineación | Centro |

### Estilos de tarjetas / secciones

| Propiedad | Valor |
|---|---|
| Fondo de tarjeta | Blanco (`#FFFFFF`) |
| Borde de tarjeta | 1px solid `#E0E0E0` |
| Radio de borde | 6px |
| Padding interior | 16px |
| Sombra | Ninguna (estándar email) |

### Espaciados

| Elemento | Valor |
|---|---|
| Padding de sección | 24px |
| Margen inferior entre bloques | 16px |
| Margen inferior entre párrafos | 12px |
| Ancho máximo de contenedor | 600px |

### Assets necesarios

| Asset | Estado |
|---|---|
| Logo Para y Compara (formato PNG/JPEG, alta resolución) | **[NO DISPONIBLE]** |
| Iconos de servicios (móvil, fibra, TV) | **[NO DISPONIBLE]** — pueden usarse iconos genéricos |
| Imagen hero | **[NO DISPONIBLE]** — placeholder o texto sin imagen |
| Capturas del comparador | **[NO DISPONIBLE]** |

## Notas para el desarrollo

- Todos los colores deben inlinearse para compatibilidad con clientes de email
- No usar JavaScript
- Usar VML para bordes redondeados en botones si se requiere compatibilidad Outlook
- Las imágenes deben tener dimensiones explícitas (width + height) y alt text
- La fuente Alexandria requiere @import en el head del HTML para clientes que lo soporten

Especificación basada en análisis visual de https://paraycompara.com/ (2026-07-09). **[PENDIENTE DE CONFIRMACIÓN por el cliente]**