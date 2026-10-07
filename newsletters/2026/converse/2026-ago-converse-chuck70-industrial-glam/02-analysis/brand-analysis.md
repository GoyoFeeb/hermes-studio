# Brand Analysis: Converse — 2026-ago-converse-chuck70-industrial-glam

## Identidad de marca

| Campo | Valor | Fuente |
|---|---|---|
| Marca | Converse (The Converse Rubber Company, Malden MA, 1908) | Cronología oficial (converse.com/uk/en/landing-converse-history) |
| Propietario | Nike, Inc. (desde 2003) | Cronología oficial — entrada "SWOOSHED 2003" |
| Silueta icónica | Chuck Taylor All Star (1917 Non-Skid → 1919 All Star → 1934 firma de Chuck Taylor) | Cronología oficial |
| Modelo de la campaña | Chuck 70 — lanzado **2013** ("built off of the 1970s Chuck Taylor All Star design") | Cronología oficial — entrada "THROWBACK, LOOK FORWARD 2013" |
| Edición | Chuck 70 Industrial Glam — acabado envejecido, piel bruñida, cadena metálica, mediasuela desgastada, OrthoLite | PDP ES A18326C |
| Posicionamiento | Heritage + streetwear premium + cultura (basket, skate, música, arte) | Observación del sitio |
| Mercado de la pieza | España (converse.com/es) | Brief |

## Identidad visual real (extraída con browser el 2026-08-21)

| Elemento | Valor real | Fuente (getComputedStyle / CSS vars) |
|---|---|---|
| Fuente de todo el sitio | `"proxima nova", proxima-nova, Helvetica, Arial, sans-serif` | body, h1, botones del PDP |
| Body | 14px / 400 | body |
| H1 home (hero) | 60px / 700 | h1 de la home |
| H1 ficha producto | 20px / 600 | h1 del PDP |
| Botón "Añadir al carro" | 14px / 600, **bg #000000**, texto #FFFFFF, **border-radius 0px**, padding 16px, border 1px solid #000 | getComputedStyle del botón real en PDP A18326C |
| Link contextual "Más información" | 12px / 600, color #757575, subrayado | getComputedStyle |
| Header | Fondo blanco, wordmark negro (SVG inline 120×15) | DOM del site |
| Nav | Fondo **negro** | getComputedStyle nav |
| Footer | #F4F4F4 (--wildsand) | CSS var del site |
| CSS vars clave | --black #000, --codgray #1b1b1b, --paleslate #d3d2d3, --wildsand #f4f4f4, --mercury #e5e5e5, --boulder #757575, --dustygray #9b9b9b, --punch #d62929, --monza #e00a15, --milanored #bf0f07, --bilbao #138410, --buttercup #f5a623 | :root del CSS del site |
| Tipografía display | --font-family-drukwide: "druk-wide" (declarada pero NO usada en páginas observadas) | CSS var — no usarla |
| Logo | Wordmark "Converse" (2017-) con estrella; negro sobre blanco; en nav es blanco sobre negro | SVG real del header + Wikimedia |

## Decisiones de token (documentadas)

1. **CTA invertido**: la web usa botón negro sólido sobre blanco; el motor pinta la banda del hero con `colors.primary` (negro), donde un botón negro sería invisible → el CTA primario del email es **blanco con texto negro** (tratamiento real de la marca: nav negro + texto blanco, tiles oscuros con CTA claro). Contraste 21:1 AAA. El estilo negro real queda en el CTA secundario (outline negro sobre blanco).
2. **radius 0 en todo**: botón real verificado border-radius:0px.
3. **`components.cta.style: "default"`** — no "block": el botón real no lleva flecha "→" (cta-block-bulletproof la fuerza). La esquina cuadrada se logra con `radius.ctaPill: 0`.
4. **Fuentes**: Proxima Nova es de pago → fallback Arial/Helvetica/sans-serif (el mismo stack de la web real). Sin @import.
5. **Sin iconos**: variantes -sin-icono obligatorias; patrón fotografia-primero.

## Estado

- Brand pack creado: `brands/converse/tokens/brand-tokens.json` v2.2.0 — **check-brand-pack-completeness: OK**
- Todos los valores: [INFERIDOS — PENDIENTES DE CONFIRMACIÓN CLIENTE] (datos públicos observados)
- Logo: SVG real del header guardado en `brands/converse/design-input/logo-header.svg` + respaldo Wikimedia verificado
