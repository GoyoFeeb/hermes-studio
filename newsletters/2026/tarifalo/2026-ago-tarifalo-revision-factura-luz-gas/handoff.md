# Handoff

## From

Agente anterior: 00 — Orchestrator (flujo completo 01→06 completado en preparación única)

## To

Agente siguiente: 07 — HTML Email Developer (engine/build-newsletter.js)

## Context

Campaña de Tarífalo para revisión estacional de factura de luz y gas. Pipeline de datos completo: brief, brand analysis, architecture, copy y campaign-data.json están listos. Pendiente: build del motor y ejecución de production-gate.

## Files to Read

- `00-brief/brief.md` — Brief con objetivo, CTA, claims prohibidos
- `02-analysis/brand-analysis.md` — Discrepancias visuales documentadas
- `03-strategy/module-selection.md` — Arquitectura de módulos
- `05-copy/body-copy.md` — Copy completo por módulo
- `06-data/campaign-data.json` — Datos fuente (6 módulos: hero-marca-tarifalo, card-tarifa-3, pasos, lista-premium, banda-cierre, footer)
- `brands/tarifalo/tokens/brand-tokens.json` — Brand pack v2.2.5

## Required Action

1. Ejecutar `node engine/build-newsletter.js --data ... --out ...`
2. Verificar con `npm run check-engine`
3. Verificar con `npm run check-parity`
4. Verificar con `npm run check-control-files`
5. Verificar con `npm run production-gate`

## Known Issues

| # | Issue | Severidad |
|---|---|---|
| 1 | Icons en CDN de Tarifalo (wp-content/2023/03/) — pueden romperse si cambia estructura | 🟡 Media |
| 2 | Placeholders legales en footer | 🔴 Bloqueante producción |
| 3 | Discrepancias tipográficas (Poppins/Capitana solicitadas vs Sora/Arial real) | 🟢 Documentado |

## Constraints

- No editar HTML a mano
- No tocar engine/components/
- isTestCampaign se mantiene true
- CTA "Comparar ahora" en hero y banda de cierre
