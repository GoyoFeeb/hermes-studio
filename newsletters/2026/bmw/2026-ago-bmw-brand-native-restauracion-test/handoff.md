# handoff.md

| Campo | Valor |
|---|---|
| From | Orchestrator (00) — Preparación de datos de test |
| To | HTML Email Developer (07) / build-newsletter.js |
| Campaña | 2026-ago-bmw-brand-native-restauracion-test |
| Fecha | 2026-08-01 |

## Contexto

Esta campaña es un **test de restauración** del sistema tras el incidente de engine/CHANGELOG.md. Usa la marca BMW con brand pack existente en `brands/bmw/tokens/brand-tokens.json` y el patrón `fotografia-primero`.

## Archivos a leer

- `06-data/campaign-data.json` — datos de campaña completos
- `03-strategy/brand-structure-translation.md` — justificación de estructura brand-native
- `brands/bmw/tokens/brand-tokens.json` — pack de marca BMW

## Acción requerida

Ejecutar build del motor para generar HTML final.

## Constraints

- `isTestCampaign: true` — placeholders CDN aceptables
- `productionReady: false`
- No editar HTML manualmente
- No tocar engine/components/, engine/lib/, engine/schema/

## Riesgos

- Hero banner no generado localmente aún — bannerSrc apunta a placeholder
- Assets CDN no subidos
- Dirección física legal pendiente de cliente

## Output esperado

- `09-exports/final.html`
- `09-exports/final-inline.html`
- `09-exports/build-manifest.json`
