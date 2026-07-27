# Handoff — v5-premium evolution

| Campo | Valor |
|---|---|
| From | 00 Orchestrator |
| To | (futura revisión o nueva campaña) |
| Fecha | 2026-07-17 (fuente única declarada tras auditoría estructural) |

## Context

Evolución premium sobre la campaña 2026-jul-ahorra-fibra-movil de Para y Compara. Fases A–F (2026-07-13) cubrieron el core técnico y el sistema multibrand. Rondas G1–G8.1 (07-13 a 07-16) evolucionaron la estética sobre `final-premium-v2.html`. Rondas Hermes 01-07 (07-15 a 07-17) añadieron rediseño de hero, ritmo editorial, assets/tipografía, y QA final.

**2026-07-17 — Auditoría estructural (Prompt 08):** se detectaron 3 HTML finales no coincidentes. Se archivaron los linajes muertos y se declaró `v5-premium/final-premium-v2.html` (copiado a `09-exports/final.html`) como única fuente de verdad.

## Source of Truth (desde 2026-07-17)

| Archivo | Rol |
|---|---|
| `v5-premium/final-premium-v2.html` | Fuente editable (diseño) |
| `09-exports/final.html` | Copia oficial para envío (idéntica a v2.html) |
| `09-exports/final-inline.html` | Versión inline para envío |

## Files to Read

- `v5-premium/final-premium-v2.html` — archivo fuente vigente
- `v5-premium/redesign-summary.md` — resumen de rondas 02-05
- `_archive/README.md` — qué se archivó y por qué
- `09-exports/assets/ASSETS_PRODUCCION.md` — assets pendientes de subir al CDN

## Constraints

- 3 advertencias en outlook-qa.md por falta de acceso a Outlook/Litmus real
- El `production-gate` valida `06-data/newsletter-data.json`, no el HTML final — la re-certificación del 17-jul documenta explícitamente esta limitación
- Los patrones premium del core no incluyen todavía los ajustes de las rondas G1–G8.1 + Hermes 01-07 — extracción a `engine/components/` es F1 del plan de transformación, todavía no iniciada

## Required Action

Bloqueos de producción (dependen del cliente, sin cambios):
- fromEmail, isTestCampaign, productionReady — placeholders
- Enlaces de baja/preferencias — placeholders
- Dirección física legal — placeholder

**2026-07-20 — Prompt 09 ejecutado:** `brands/paraycompara/tokens/brand-tokens.json` fusionado a v2.2.0 (rondas G1-G8.1 incorporadas, 3 conflictos + 2 hallazgos adicionales verificados contra `09-exports/final.html`, detalle en el `_changelog` del propio archivo). `v5-premium/design-tokens-premium.json` marcado `_superseded`. Prerequisito de F0 cerrado — el siguiente paso del plan (`docs/auditoria-total-y-plan-transformacion-2026-07-17.md`) es F1: motor único, prompts ya escritos en `prompts-fase1-motor/` (11 a 14).