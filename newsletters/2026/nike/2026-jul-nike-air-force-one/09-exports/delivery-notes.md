# Delivery Notes — Nike Air Force One Relanzamiento

## Resumen de entrega

| Campo | Valor |
|---|---|
| Campaña | 2026-jul-nike-air-force-one |
| Cliente | Nike |
| Producto | Nike Air Force 1 '07 |
| Tipo | Test campaign (isTestCampaign: true) |
| Estado | ✅ Aprobado (production gate: 12/13 gates ✅) |
| Fecha de exportación | 2026-07-29 |

## Archivos generados

| Archivo | Ruta |
|---|---|
| HTML fuente | `newsletters/2026/nike/2026-jul-nike-air-force-one/09-exports/final.html` |
| HTML inline | `newsletters/2026/nike/2026-jul-nike-air-force-one/09-exports/final-inline.html` |
| Build manifest | `newsletters/2026/nike/2026-jul-nike-air-force-one/09-exports/build-manifest.json` |
| Hero image (full) | `brands/nike/design-input/hero-banner.png` (416 KB) |
| Hero image (email) | `brands/nike/design-input/hero-banner-email.jpg` (93 KB, 1200px JPG) |
| Editorial image | `brands/nike/design-input/editorial-af1-detail.png` (1.3 MB) |
| Logo | `brands/nike/design-input/logo-nike-email.png` (1.6 KB, 160×56px) |
| Logo SVG source | `brands/nike/design-input/nike-swoosh.svg` |

## Pendientes para producción

| # | Tarea | Responsable |
|---|---|---|
| 1 | Subir hero-banner-email.jpg y editorial-af1-detail.png al CDN | Cliente/equipo |
| 2 | Subir logo-nike-email.png al CDN | Cliente/equipo |
| 3 | Reemplazar `PENDING-CDN-UPLOAD` por URLs CDN reales en campaign-data.json | 07 — HTML Developer |
| 4 | Reemplazar `[DIRECCIÓN FÍSICA]` por dirección real de Nike | Cliente |
| 5 | Reemplazar `[UNSUBSCRIBE_LINK]` y `[PREFERENCES_LINK]` por tokens del ESP | Cliente/equipo |
| 6 | Cambiar `isTestCampaign` a `false` y `productionReady` a `true` | 09 — Export Manager |

## Production gate result
```
12/13 gates ✅, 1 gate ⚠️ esperado:
- parity (pre-build): falló porque embed-images modificó archivos post-build.
  Solución: después de subir al CDN, ejecutar build fresco + production-gate sin embed-images intermedio.
```

## Brand pack actualizado
- **Versión:** v2.2.4 (logo swoosh capturado)
- **Ruta:** `brands/nike/tokens/brand-tokens.json`
