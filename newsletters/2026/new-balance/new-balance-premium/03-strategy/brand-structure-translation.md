# Brand Structure Translation: New Balance — new-balance-premium

## Reference page
**URL:** newbalance.com (observado 2026-07-28)
**Brand pack:** brands/new-balance/tokens/brand-tokens.json v2.2.0
**contentRhythm:** Página de newbalance.com observada el 2026-07-28 — Hero con fotografía lifestyle, grid de productos, bloques editoriales foto+texto, categorías, footer (documentado en brand-tokens.json layout.contentRhythm)
**brandStructure:** compositionArchetype: editorial-foto-texto, signatureSections: hero→hero-imagen, editorial foto+texto→editorial-foto-texto, grid productos→columns-3-beneficios-sin-icono (documentado en brand-tokens.json layout.brandStructure)

## Real page sections → Email module mapping

| # | Real page section | Real page type | Translates? | Email module | Why |
|---|---|---|---|---|---|
| 1 | Header: NB logo + nav (Men/Women/Kids/Sale) | Navigation bar | ✅ Yes | `header-logo` | Versión simplificada para email — solo logo + tagline. La navegación completa no traduce a email (sin hover/interacción) |
| 2 | Hero section: fotografía lifestyle a sangre + titular editorial | Fotografía protagonista | ✅ Yes | `hero-imagen` | New Balance usa fotografía lifestyle como hero principal. La imagen es el mensaje. El titular va debajo, no superpuesto (consistente con hero-imagen.html) |
| 3 | "Trending for Back to School" — grid de productos (9060, Ellipse, 530, Trackside) | Grid producto | ✅ Yes | `columns-3-beneficios-sin-icono` | Grid limpio sin iconos. Producto aislado sobre fondo blanco. Los 2-4 items se adaptan a columns-3 con nombre + descripción breve |
| 4 | "The 530" — bloque editorial: foto pila de zapatillas + titular "An expression of our running heritage" | Editorial foto+texto | ✅ Yes | `editorial-foto-texto` | La web real alterna bloques editoriales donde la fotografía lifestyle comparte espacio con texto breve. Refleja el ADN editorial de NB |
| 5 | "Trackside Apparel" — bloque editorial: foto modelo + titular + CTA | Editorial foto+texto | ✅ Yes | `editorial-foto-texto-inverso` | Segundo bloque editorial con orden inverso (texto → imagen) para variar ritmo visual |
| 6 | Categorías (Men/Women/Kids) con foto modelo + botón CTA | Categorías | ✅ Partial | `banda-cierre` | Las categorías individuales no traducen 1:1 a email. La banda-cierre funciona como CTA de exploración general |
| 7 | "Top sale styles" — grid productos oferta | Grid producto | ❌ No | — | No usar promociones/sale — la campaña es editorial premium, no promocional |
| 8 | Footer: links legales, redes sociales, newsletter signup | Footer | ✅ Yes | `footer` | Versión simplificada: legal, tagline, enlaces de baja |

## Omitted sections

| Section | Why omitted |
|---|---|
| "Top sale styles" | La campaña es premium editorial, no promocional. Las ofertas/sale contradicen el tono aspiracional |
| "Recommended for you" (personalized recommendations) | Basado en datos de usuario — no disponible para campaña de test |
| "Fearlessly Independent" (brand mission footer) | No traduce a email sinonicamente. El tagline "We're In It For The Long Run" se usa en tagline del footer |
| Navegación completa con dropdowns | No hay hover/interacción en email. Solo logo + link a web |

## Structural decisions making this newsletter distinct from a template

1. **Dos bloques editoriales `editorial-foto-texto` consecutivos** — es intencional replicar la estructura de newbalance.com, que alterna fotografía lifestyle + texto breve. Uno con imagen a la izquierda, otro con imagen a la derecha para variar ritmo visual.
2. **Sin intro-cta** — saltamos el módulo de intro porque el hero-imagen + el primer bloque editorial ya establecen el contexto. Añadir intro-cta sería relleno.
3. **Sin metric-strip-premium** — New Balance no es una marca técnica/automotriz con métricas que presentar en strip.
4. **columns-3-beneficios-sin-icono con los 3 valores de marca** — no es un grid de productos sino los 3 pilares: rendimiento, herencia, estilo.
5. **Secuencia real**: `header-logo → hero-imagen → editorial-foto-texto → editorial-foto-texto-inverso → columns-3-beneficios-sin-icono → banda-cierre → footer`
