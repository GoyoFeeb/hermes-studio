# Visual Analysis: New Balance — new-balance-premium

## 1. Colores

### Paleta principal

| Color | Hex | Uso | Fuente |
|---|---|---|---|
| NB Red (primary) | `#CF0A2C` | Acentos, enlaces, rojo signature marca | Observada |
| Almost Black (cta/text) | `#151415` | CTAs, titulares, texto principal | Observada (getComputedStyle) |
| White | `#FFFFFF` | Fondos, fondo de producto aislado | Observada |
| Light Gray | `#F2F2F3` | Fondos de sección alternativa | Observada (--nb-color-neutral-100) |
| Medium Gray | `#DEE0E1` | Bordes, separadores suaves | Observada (--nb-color-neutral-200) |
| Body Text | `#4C4D4F` | Texto de cuerpo | Observada |
| Secondary Text | `#737B82` | Texto secundario, footer, legal | Observada (--nb-color-gray) |
| Deep/Dark | `#231F20` | Fondos oscuros, hover states | Observada |

### Evaluación email

| Aspecto | Nota |
|---|---|
| Outlook compatibilidad | Alta — colores sólidos, sin degradados, fondos blancos |
| Contraste | Excelente — CTA #151415/#FFFFFF: ~20:1 (WCAG AAA). Body #4C4D4F/#FFFFFF: >7:1 |

## 2. Tipografías

| Tipo | Fuente real (web) | Peso real | Tamaño real | Fallback email |
|---|---|---|---|---|
| Display editorial (H2 campaña) | ITC Garamond W01 | 500 | 20-40px | Georgia, 'Times New Roman', serif |
| Navegación/UI | Proxima Nova W01 | 300-400 | 12-16px | 'Helvetica Neue', Helvetica, Arial, sans-serif |
| CTA | Proxima Nova W01 | 300 | 14px | Helvetica, Arial, sans-serif |
| Precios | Proxima Nova W01 | 300 | 14px | Helvetica, Arial, sans-serif |
| Subcategorías | Proxima Nova W01 | 500 uppercase | 12px (0.8px ls) | Helvetica, Arial, sans-serif |

### Fallback stack recomendado

```css
/* Display/Editorial (titulares campaña) */
font-family: 'Georgia', 'Times New Roman', serif;

/* Cuerpo, UI, navegación, CTAs */
font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
```

## 3. Botones y CTAs

| Propiedad | Valor | Fuente |
|---|---|---|
| Forma | Rectangular con esquinas ligeramente redondeadas | getComputedStyle |
| Color fondo | #151415 | getComputedStyle |
| Color texto | #FFFFFF | getComputedStyle |
| Font | 14px / 300 weight | getComputedStyle |
| Padding | 16px vertical / 12px horizontal | getComputedStyle |
| Border-radius | 2px | getComputedStyle |
| Letter-spacing | normal | getComputedStyle |
| Text-transform | none | getComputedStyle |
| CTA secundario (text link) | Texto sin fondo, mismo color #151415 | Observado |

## 4. Iconografía

New Balance **NO utiliza iconografía decorativa ni emojis** en su comunicación de producto o marca. La fotografía es el único elemento visual decorativo. Esto es coherente con su filosofía minimalista y editorial.

**Implicación para el motor:** usar SIEMPRE variantes `-sin-icono` de todos los componentes. No incluir iconGlyph en ningún módulo.

## 5. Fotografía e imágenes

- **Estilo dominante:** Fotografía real de alta calidad
- **Hero:** Lifestyle — atletas reales en movimiento (running) o con producto
- **Producto:** Aislado sobre fondo blanco infinito, perfil lateral 3/4
- **Iluminación:** Natural difusa, sin sombras duras
- **Composición:** Limpia, con espacio negativo generoso
- **Colorimetría:** Colores precisos, sin sobresaturación
- **No usa:** Renders 3D, ilustraciones, fotografía de stock genérica

## 6. Composición y jerarquía visual

```
ANCHO COMPLETO (600px)
┌─────────────────────────────────┐
│  Header: Logo NB + nav minimal  │  Fondo blanco
├─────────────────────────────────┤
│  HERO: Fotografía lifestyle     │  A sangre, imagen protagonista
│  + titular editorial breve      │  Titular en serif
│  + CTA negro                    │  Botón #151415
├─────────────────────────────────┤
│  BLOQUE EDITORIAL:              │  Foto + texto corto
│  "An expression of our running  │  Estilo editorial revista
│   heritage"                     │
├─────────────────────────────────┤
│  GRID PRODUCTOS: 2-3 cols       │  Producto sobre blanco
│  nombre + precio                │  Sin iconos
├─────────────────────────────────┤
│  BANDA CIERRE: Foto categoría   │  "Explora..."
│  + CTA                          │
├─────────────────────────────────┤
│  FOOTER: Legal, enlaces, redes  │  Texto gris #737B82
└─────────────────────────────────┘
```

## 7. Tono visual general

New Balance comunica con **seguridad silenciosa** y **autenticidad**. No hay exclamaciones, superlativos vacíos ni urgencia artificial. El tono es:

- **Editorial** — como una revista de running y lifestyle
- **Aspiracional pero alcanzable** — personas reales, no modelos inalcanzables
- **Confident, not loud** — la marca sabe lo que es
- **Heritage-forward** — orgullosa de su legado, pero siempre innovando

## 8. Resumen de adaptabilidad email

| Dimensión | Adaptabilidad | Nota |
|---|---|---|
| Colores | Alta | Blanco + negro + rojo acento — paleta universal |
| Tipografías | Media | Dos familias de pago, bien resueltas con fallbacks |
| Botones | Alta | CTA negro estándar, fácil implementación VML |
| Imágenes | Alta | Fotografía real, sin dependencias técnicas |
| Composición | Alta | Minimalista, fotografía protagonista, aire para respirar |
