# Brand-Structure Translation — Adidas → Email

## Real page: adidas.com/us/men (2026-07-28)

| # | Sección real | Tipo | Módulo email | Justificación |
|---|---|---|---|---|
| 1 | Header + logo + búsqueda | navegación texto | header-logo | El logo de Adidas (performance badge o wordmark) es el ancla visual — esencial para reconocimiento de marca |
| 2 | Banner hero promocional | foto-full con headline | hero-imagen | La página de categoría abre con fotografía de atleta/producto a todo el ancho con headline bold — traducción directa a hero-imagen |
| 3 | Grid de productos (foto + nombre + precio) | foto+texto repetido | editorial-foto-texto | Los productos en grid alternan fotografía y texto. El bloque editorial captura la esencia foto+texto del grid sin replicar el catálogo |
| 4 | Descripción de categoría (SEO text) | texto breve | columns-3-beneficios-sin-icono | La descripción de categoría presenta argumentos de marca en texto estructurado — los 3 beneficios traducen el mensaje de valor |
| 5 | CTA final (ver colección) | botón conversión | banda-cierre | Cierre con CTA directo — mismo patrón que el hero pero con mensaje de cierre |
| 6 | Footer (enlaces + legal) | navegación utility | footer | Enlaces legales y de suscripción |

## Decisiones estructurales

1. **Hero fotográfico**: La página real de Adidas usa fotografía de alto impacto como elemento visual dominante. Traducción directa a hero-imagen con headline bold en uppercase — idéntico al sitio real.

2. **Bloque editorial**: En lugar de repetir intro-cta (text-only), usamos editorial-foto-texto porque el grid de productos real es foto+texto, no texto solo. Esto también diferencia la newsletter de una plantilla genérica.

3. **Sin intro-cta**: La página real no tiene un bloque de texto de transición entre el hero y el contenido. Para ser fiel a la marca, omitimos intro-cta en favor de ir directamente al contenido visual.

4. **Sin iconos**: La página real de Adidas no usa iconos decorativos de beneficio. Las variantes `-sin-icono` son consistentes con la identidad minimalista de la marca.

5. **CTA cuadrado (block style)**: Observado mediante getComputedStyle — los botones de Adidas tienen border-radius: 0px. El style "block" del motor es la traducción correcta.

6. **Esto no es una plantilla genérica**: La secuencia header-logo → hero-imagen → editorial-foto-texto → columns-3-beneficios-sin-icono → banda-cierre → footer es específica de Adidas porque:
   - Usa editorial-foto-texto como segundo módulo (no intro-cta text-only)
   - No repite intro-cta en ningún punto
   - Usa el patrón fotografia-primero con sus restricciones naturales (sin iconos, sin hero-centrado)
