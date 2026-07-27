# Layout — BMW Experiencia Premium

## Parámetros globales

| Parámetro | Valor | Token |
|-----------|-------|-------|
| Ancho máximo | 600px | `layout.maxWidth` |
| Estilo de sección | centrado | `layout.sectionStyle` |
| Fondo global | `#F4F4F4` | `surfaces.global` |
| Fondo alterno | `#F4F4F4` | `surfaces.sectionLila` |
| Fondo blanco | `#FFFFFF` | `surfaces.white` |
| Fondo oscuro (cierre) | `#000000` | `colors.deep` |
| Color header | `#FFFFFF` / `#000000` | `components.header.backgroundColor` / `components.header.textColor` |

## Tipografía global

| Contexto | Fuente | Tamaño | Peso | Color |
|----------|--------|--------|------|-------|
| Display (headings hero) | `'Titillium Web', Arial, Helvetica, sans-serif` | Variable por módulo | Variable | Variable |
| Body | `Arial, Helvetica, sans-serif` | Variable por módulo | 400 | `#262626` |
| Legal/footer | `Arial, Helvetica, sans-serif` | 11px | 400 | `#6F6F6F` |

## Web font

- Fuente: Titillium Web (Google Fonts)
- Pesos importados: 300, 400, 700
- Método: `@import` en `_shell.html`
- Fallback: Arial, Helvetica, sans-serif

## Botones

| Propiedad | Valor | Token |
|-----------|-------|-------|
| Background | `#1C69D4` | `colors.ctaBackground` |
| Text color | `#FFFFFF` | `colors.ctaText` |
| Font size | 15px | `typography.cta.size` |
| Font weight | 500 | `typography.cta.weight` |
| Letter spacing | 0.5px | `typography.cta.letterSpacing` |
| Border radius | 3px | `radius.ctaPill` |
| Padding | 12px 28px | `components.cta.padding` |
| Silueta | Pastilla sólida (pill) | Default (no hay `components.cta.style` en el pack) |

## Espaciado

| Contexto | Valor | Token |
|----------|-------|-------|
| Sección vertical | 40px | `spacing.section` |
| Hero vertical | 48px | `spacing.hero` |
| Interno sección | 28px 20px | `spacing.innerSection` |
| CTA vertical | 20px 0 | `spacing.cta` |
| Entre cards | 16px | `spacing.medium` |
| Entre párrafos | 8px | `spacing.small` |

## Bordes y sombras

| Contexto | Valor | Token |
|----------|-------|-------|
| Radio de imagen | 0px | `radius.image` |
| Radio de card | 0px | `radius.card` |
| Sombra de card | none | `shadows.card` |
| Sombra de CTA | none | `shadows.cta` |
| Borde de card | `#D2D2D7` | `colors.border` |
| Borde de footer | `#D2D2D7` | `colors.borders.footer` |

## Ritmo editorial verificado

| Secuencia | Fondo | Alineación | Densidad | Cambia respecto a anterior |
|-----------|-------|-----------|----------|---------------------------|
| 1. header-logo | Blanco | Centrada | Baja | — |
| 2. hero-imagen | Imagen (banner) | Centrada | Alta | ✅ Fondo + densidad |
| 3. intro-cta | Blanco (`#FFFFFF`) | Centrada | Baja | ✅ Fondo + densidad |
| 4. columns-3-beneficios-sin-icono | Alterno (`#F4F4F4`) | Centrada | Media | ✅ Fondo |
| 5. banda-cierre | Oscuro (`#000000`) | Centrada | Media | ✅ Fondo |
| 6. footer | Global (`#F4F4F4`) | Centrada | Baja | ✅ Fondo + densidad |
