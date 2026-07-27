# Handoff

## From

Agente anterior: 00 — Orchestrator (normalización de campaña heredada)

## To

Responsables externos al pipeline automático:
- **Equipo CDN / Assets** — subir iconos a feebbodigital.com
- **Equipo Legal / ESP** — sustituir placeholders de footer
- **Responsable de campaña** — cambiar flags de producción

## Context

Campaña heredada `2026-jul-revision-verano` de Para y Compara. Se ejecutó un test end-to-end completo contra el motor (engine/build-newsletter.js) el 2026-07-27. El motor funciona correctamente: schema, build, parity, claims, contraste, column-balance y hero-decision pasan sin errores.

La campaña se encontraba sin archivos de control. Se han creado los 4 archivos estandarizados como parte de la normalización. El estado actual es `blocked` por bloqueos de producción que requieren intervención humana.

## Files to Read

- `06-data/campaign-data.json` — Datos fuente v1.0.0, `isTestCampaign: true`
- `09-exports/final.html` — HTML build output (37.9 KB inline)
- `09-exports/final-inline.html` — HTML con CSS inline
- `09-exports/build-manifest.json` — Build manifest (7 módulos, 0 warnings)
- `brands/paraycompara/tokens/brand-tokens.json` v2.2.6 (bajo `newsletters/2026/newsletter-system/`)
- `campaign-status.md` — Estado detallado
- `next-steps.md` — Pendientes accionables

## Required Action

### Para el equipo CDN / Assets
Subir los siguientes 8 iconos al CDN en `feebbodigital.com/creativities-library/paraycompara/2026/jul/`:
1. `icon-tarifa-movil.png`
2. `icon-tarifa-fibra.png`
3. `icon-tarifa-convergente.png`
4. `icon-tarifa-tv.png`
5. `icon-aspecto-datos.png`
6. `icon-aspecto-cobertura.png`
7. `icon-aspecto-paquetes.png`
8. `icon-aspecto-condiciones.png`

### Para el equipo Legal / ESP
- Sustituir `[UNSUBSCRIBE_LINK]` por la URL real de baja del ESP.
- Sustituir `[PREFERENCES_LINK]` por la URL real de preferencias del ESP.
- Sustituir `[DIRECCIÓN FÍSICA — pendiente del cliente]` por la dirección legal real de Para y Compara.

### Para el responsable de campaña
- Una vez resueltos todos los bloqueos: cambiar `isTestCampaign` a `false` y `productionReady` a `true` en `06-data/campaign-data.json`.
- Regenerar con `node engine/build-newsletter.js --data ... --out ...`.

## Constraints

- No editar manualmente `09-exports/final.html` ni `final-inline.html` (check-parity detecta cambios).
- El motor (`engine/`) no requiere ninguna intervención — validado y correcto.
- No cambiar `isTestCampaign` ni `productionReady` antes de que todos los bloqueos estén resueltos.

## Known Issues

| # | Issue | Responsable | Severidad |
|---|---|---|---|
| 1 | 8 iconos HTTP 404 en CDN | Equipo CDN / Assets | 🔴 Bloqueante |
| 2 | `[UNSUBSCRIBE_LINK]` sin resolver | Equipo Legal / ESP | 🔴 Bloqueante |
| 3 | `[PREFERENCES_LINK]` sin resolver | Equipo Legal / ESP | 🔴 Bloqueante |
| 4 | `[DIRECCIÓN FÍSICA]` sin resolver | Equipo Legal / ESP | 🔴 Bloqueante |
| 5 | `isTestCampaign: true`, `productionReady: false` | Resp. campaña | 🟡 Post-bloqueos |

## Expected Output

- CDN: 8 iconos accesibles HTTP 200.
- Footer: 3 placeholders legales sustituidos por URLs/dirección reales.
- `campaign-data.json`: `isTestCampaign: false`, `productionReady: true`.
- Rebuild del motor → producción.
