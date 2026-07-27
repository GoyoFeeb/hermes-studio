# Delivery Notes: 2026-jul-wornwear-usado

## Datos de envío

| Campo | Valor |
|---|---|
| Campaña | 2026-jul-wornwear-usado |
| Cliente | Patagonia Worn Wear |
| Patrón | fotografia-primero |
| Estado | isTestCampaign: true, productionReady: false |
| Build | ✅ BUILD OK — 19.8 KB inline, 0 warnings |
| Production gate | ✅ 11/11 passed |

## Archivos entregados

| Archivo | Descripción |
|---|---|
| `09-exports/final.html` | HTML fuente (con VML, media queries) |
| `09-exports/final-inline.html` | HTML con CSS inline (preparado para envío) |
| `09-exports/final-preview.png` | Previsualización desktop (600×2000px) |
| `09-exports/build-manifest.json` | Manifiesto del build con checksums |
| `09-exports/delivery-notes.md` | Este documento |

## Resumen de la pieza

**Asunto:** Worn Wear. Tu Patagonia de segunda mano.
**Preheader:** El mismo equipo Patagonia que conoces, a un precio más justo. Respaldado por Patagonia.
**CTA principal:** Descubrir novedades → wornwear.patagonia.com (con UTM por módulo)
**Módulos:** header-logo → hero-imagen → intro-cta → columns-3-beneficios-sin-icono → banda-cierre-asimetrico → footer

## Claims verificados

✅ Sin cifras ambientales, sin precios, sin urgencia, sin exclusividad, sin comparativos sin fuente.
✅ CTA contraste: 5.95:1 (negro #000000 sobre naranja #FA4616) — decisión de accesibilidad documentada.
✅ H1 hero: naranja #FA4616 (corregido en motor).
✅ Columnas equilibradas: 1.50x ratio.

## Pendientes para producción real

| # | Item | Responsable | Acción |
|---|---|---|---|
| 1 | Hero banner: reemplazar `https://PENDING-CDN-UPLOAD/hero-banner.png` por asset real | Cliente/Dev | Subir foto lifestyle outdoor a CDN + actualizar campaign-data.json |
| 2 | Logo: migrar de wornwear.patagonia.com a CDN propio | Cliente/Dev | Mantener mismo PNG o usar versión local |
| 3 | fromEmail: reemplazar `test-wornwear@internal-newsletter.es` | Cliente | Ej. `news@wornwear.patagonia.com` |
| 4 | fromName: reemplazar `Patagonia Worn Wear (test)` | Cliente | Ej. `Worn Wear` |
| 5 | Footer legal: reemplazar `[DIRECCIÓN FÍSICA — pendiente del cliente]` | Cliente | Dirección registrada de Patagonia Worn Wear |
| 6 | Footer disclosure: reemplazar texto de prueba | Cliente | Texto legal real |
| 7 | `isTestCampaign`: cambiar a `false` | Dev | Antes de producción real |
| 8 | `productionReady`: cambiar a `true` | Dev | Antes de producción real |

## Preview visual

![Vista previa desktop](final-preview.png)

## Notas adicionales

- El H1 del hero se renderiza correctamente en naranja (#FA4616) — el motor fue corregido para leer `typography.hero.h1.color` del brand pack.
- El CTA usa texto negro (#000000) sobre fondo naranja (#FA4616) — decisión de accesibilidad documentada en brands/wornwear/tokens/brand-tokens.json _changelog v2.2.1.
- La newsletter no contiene iconos decorativos ni emojis — coherente con la identidad visual de Worn Wear (100% fotografía + tipografía).
- No incluye cifras de impacto ambiental, precios ni porcentajes de descuento — policy de la campaña.
