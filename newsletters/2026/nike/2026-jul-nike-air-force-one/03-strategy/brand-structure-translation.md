# Brand Structure Translation — Nike Air Force One → Email

## Mapeo de secciones reales de nike.com (página de producto AF1 '07)

> Este mapeo se basa en `layout.contentRhythm` del brand pack Nike v2.2.4, que documenta que la página de producto de Nike tiene la fotografía como peso visual dominante, texto mínimo, y secciones de detalle de producto. La secuencia email traduce ese ritmo: hero visual → detalle editorial → razones de permanencia → cierre.

| # | Sección real (nike.com) | Tipo en página | Módulo email | Patrón visual email | Justificación |
|---|---|---|---|---|---|
| 1 | Header + navegación + logo swoosh | Navegación/marca | header-logo | Centrado, fondo blanco, logo swoosh | Es la identidad de marca que abre cualquier comunicación Nike |
| 2 | Galería de imágenes del producto (~9 fotos) | Fotografía producto | hero-imagen | Banner a todo el ancho sobre fondo #111111 | La galería es el elemento visual dominante de la página. El email no puede replicar 9 fotos, pero sí una imagen hero que capture la esencia del AF1 |
| 3 | Título "Nike Air Force 1 '07" + categoría + precio $115 | Info producto | intro-cta | Texto centrado + CTA, fondo blanco | En la web el título y precio son texto escueto. En email, este slot cuenta el origen (1982, primera zapatilla con Air) — no replica el precio sino el contexto |
| 4 | Fotografías de detalle (materiales, textura cuero, suela, swoosh) | Galería secundaria | editorial-foto-texto | Imagen 46% + texto 54% | La página muestra múltiples ángulos del producto. Un bloque editorial foto+texto traduce un detalle de diseño con imagen |
| 5 | Características del producto (descripción técnica) | Texto producto | columns-3-beneficios-sin-icono | 3 columnas, sin icono, fondo blanco | Las características de la página (air cushioning, leather upper, rubber sole) se traducen a beneficios aspiracionales sin iconos decorativos |
| 6 | "Add to Bag" CTA + color selector | CTA producto | banda-cierre | Fondo oscuro (#111111) + CTA "Explorar colores" | El CTA principal de compra en la web se traduce al cierre del email, invitando a explorar las opciones de color que la web sí ofrece |
| 7 | Footer (recursos, ayuda, legal) | Navegación secundaria | footer | Fondo gris claro, texto legal | Misma función: cierre con información institucional y legal |

## Secciones omitidas y por qué
| Sección omitida | Razón |
|---|---|
| Selector de talla (size guide + radio buttons) | Interactivo, no traducible a email |
| Reviews | Demasiado denso para email; no es contenido editorial |
| Envío y devoluciones | Información transaccional, no editorial |
| Color selector interactivo | Interactivo; se traduce como mención "en 4 colores" en el CTA |

## Decisiones estructurales que hacen esta newsletter distinta de una plantilla
- El hero usa fondo #111111 (brand primary) en vez del blanco por defecto del patrón — la página real del AF1 tiene fondo blanco infinito en las fotos, pero el email usa contraste oscuro para que el H1 blanco destaque
- Se usa intro-cta + editorial-foto-texto en vez de repetir intro-cta porque la página real tiene fotos de detalle que justifican ambos bloques
- Se omite metric-strip-premium porque el AF1 es un producto cultural, no técnico — sus cualidades no se miden en kW o km/h
