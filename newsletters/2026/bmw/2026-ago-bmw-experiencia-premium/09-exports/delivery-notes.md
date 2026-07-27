# Delivery Notes — BMW Experiencia Premium

## Resumen de entrega

| Campo | Valor |
|-------|-------|
| Campaña | 2026-ago-bmw-experiencia-premium |
| Cliente | BMW |
| Patrón | `fotografia-primero` |
| Hero | `hero-imagen` |
| Build | ✅ 2026-07-27 |
| Engine integrity | ✅ |
| Parity check | ✅ |
| Control files | ✅ |
| Inline size | 19.9 KB |
| Status | Prueba interna (`isTestCampaign: true`) |

## Archivos entregados

| Archivo | Ruta |
|---------|------|
| Campaign data | `06-data/campaign-data.json` |
| HTML fuente | `09-exports/final.html` |
| HTML inline | `09-exports/final-inline.html` |
| Build manifest | `09-exports/build-manifest.json` |

## Pendientes para producción

| # | Bloqueo | Responsable |
|---|---------|-------------|
| B1 | **Hero banner no generado** — OpenAI billing limit (cuota agotada). Regenerar con `npm run generate-hero-image` tras reponer crédito. | Usuario |
| B2 | **Subir hero banner al CDN** — tras generación, subir a `feebbodigital.com/creativities-library/bmw/...` | Usuario |
| B3 | **Logo BMW no capturado** — capturar PNG desde `bmw.es` y subir al CDN. Actualizar `logoSrc` en campaign-data.json. | Usuario |
| B4 | **Links unsubscribe/preferences** — configurar con el ESP y reemplazar `[UNSUBSCRIBE_LINK]` / `[PREFERENCES_LINK]`. | Cliente |
| B5 | **Dirección física** — proporcionar dirección legal real para el footer. | Cliente |
| B6 | **Campaign URL** — confirmar que `https://www.bmw.es/es/home.html` es la URL correcta para el envío. | Cliente |

## Para producción

Cuando todos los blockers estén resueltos:
1. Actualizar `isTestCampaign: false` y `productionReady: true` en campaign-data.json
2. Reconstruir con el motor: `node engine/build-newsletter.js --data ... --out ...`
3. Ejecutar `npm run production-gate-motor -- --campaign ...`
4. Confirmar exit 0 en todos los 12 gates
