# Assets Notes: Spotify — 2026-jul-spotify-premium-test

## Estado de assets

| Asset | Estado | Acción |
|---|---|---|
| Logo Spotify (wordmark + isotipo) | ❌ No capturado (assets.logo vacío) | Usar label:"SPOTIFY" como texto. Capturar PNG oficial en build futuro. |
| Hero banner | ❌ Placeholder (PENDING-CDN-UPLOAD) | No se usa hero-imagen. El hero usa degradado bulletproof (no necesita imagen). |
| Iconos de beneficio | ❌ No aplica | Spotify no usa iconografía decorativa. columns-3-beneficios-sin-icono. |

## Decisión de variante de icono (por módulo)

Según el contrato de `04-email-designer.md` §"Elegir variante de icono", cada módulo con campo de icono debe tener su variante decidida contra `iconography.style`/`componentImplication` del brand pack:

| Módulo | Variante elegida | Motivo |
|---|---|---|
| columns-3-beneficios | **-sin-icono** | `iconography.componentImplication`: "Para columns-3-beneficios/usp-cards: preferir imágenes reales o omitir iconografía decorativa antes que forzar iconGlyph de emoji genérico — no encaja con el tono de marca ni con lo observado en el sitio real." |
| usp-cards | **-sin-icono-asimetrico** (corregido 2026-07-24 — ver `engine/CHANGELOG.md`) | El schema SÍ exigía `icon` en `usp-cards`/`-asimetrico` (afirmación anterior de este documento era incorrecta); se creó la variante `usp-cards-sin-icono-asimetrico` para poder aplicar el mismo criterio que en columns-3-beneficios sin forzar emoji. Cabecera asimétrica (título+cuerpo a la izquierda, badge a la derecha) + tarjetas sin icono (barrita de color en vez de glifo). |

## Referencia fotográfica

Si en el futuro se genera hero-imagen, el tratamiento fotográfico debe seguir:
- `photography.treatment`: alto contraste, iluminación dramática de estudio
- Isotipo de barras de sonido como máscara gráfica sobre la foto (no icono aparte)
- Fondos oscuros o negros, contraste entre sujeto iluminado y fondo

## Tamaños y formatos

| Asset | Ancho | Alto | Formato | Peso estimado |
|---|---|---|---|---|
| Logo (cuando se tenga) | 110px | 32px | PNG-24 | ~4 KB |
| Hero banner (cuando se genere) | 600px | 350px | PNG/JPG | ~80 KB |

## Notas de producción

- **CTA texto negro sobre verde**: #000000 sobre #1ED760. Verificar que el motor respeta `colors.ctaText` (#000000) y no lo sobreescribe a blanco (como ocurre con otras marcas). Esto es lo que verificamos específicamente.
- **Sombra en tarjetas**: `shadows.card` = `0 2px 8px rgba(0,0,0,0.06)`. Verificar en final.html que aparece en los elementos correspondientes de columns-3-beneficios-sin-icono y usp-cards.
- **Degradado hero+banda-cierre**: el mismo gradients.heroBackground se aplica a ambos componentes. Verificar que se ve en ambos.
