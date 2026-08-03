# Delivery Notes — Adidas Premium Run

## Campaign Overview

| Campo | Valor |
|---|---|
| Marca | Adidas |
| Campaña | 2026-jul-adidas-premium-run |
| Patrón | fotografia-primero |
| Estado | Test (isTestCampaign: true) |
| Brand pack | brands/adidas/tokens/brand-tokens.json v2.2.0 |
| Build | 2026-07-28 |

## Files

| Archivo | Ruta | Tamaño |
|---|---|---|
| final.html (source) | 09-exports/final.html | ~1937 KB (con base64 embebido) |
| final-inline.html (production) | 09-exports/final-inline.html | ~1937 KB (con base64 embebido) |
| Build manifest | 09-exports/build-manifest.json | — |
| campaign-data.json | 06-data/campaign-data.json | — |

## Componentes incluidos

1. header-logo → adidas
2. hero-imagen → "OWN YOUR RUN" + CTA
3. editorial-foto-texto → Imagen + "Built to Move"
4. columns-3-beneficios-sin-icono → 3 pilares de marca
5. banda-cierre → "Own Your Run" + CTA final
6. footer → Legal

## Assets generados

| Asset | Ruta local | Estado |
|---|---|---|
| Hero banner | brands/adidas/design-input/hero-banner-email.jpg | ✅ Generado (187 KB, 1200px JPG) |
| Editorial | brands/adidas/design-input/editorial-email.jpg | ✅ Generado (56 KB, 600px JPG) |
| Logo | — | ⏳ Pendiente de obtener PNG |

## To-Do post-entrega

1. Subir imágenes a CDN, actualizar URLs en campaign-data.json
2. Ejecutar `node scripts/embed-images-base64.js --undo --campaign ...` para restaurar PENDING tras CDN
3. Obtener y subir logo PNG de Adidas
4. Confirmar dirección física y disclosure legal
5. Cambiar isTestCampaign → false, productionReady → true
