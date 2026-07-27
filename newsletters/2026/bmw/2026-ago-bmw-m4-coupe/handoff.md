# Handoff

## From

Agente anterior: 00 — Orchestrator (flujo completo 01→06 completado)

## To

Agente siguiente: 07 — HTML Email Developer (engine/build-newsletter.js)

## Context

Campaña del BMW M4 Competition Coupé. Pipeline de datos completo: brief, brand analysis, architecture, copy y campaign-data.json listos. Patrón fotografia-primero (mismo que campaña X1). Pendiente: build del motor y producción.

## Files to Read

- `00-brief/brief.md` — Brief con objetivo, CTA, claims
- `02-analysis/brand-analysis.md` — 13 discrepancias documentadas vs guía del usuario
- `03-strategy/module-selection.md` — Arquitectura de módulos
- `05-copy/body-copy.md` — Copy completo
- `06-data/campaign-data.json` — Datos fuente (6 módulos)
- `brands/bmw/tokens/brand-tokens.json` — Brand pack v2.3.1

## Required Action

1. Ejecutar `node engine/build-newsletter.js --data ... --out ...`
2. Verificar con `npm run check-engine, check-parity, check-control-files, production-gate`

## Known Issues

| # | Issue | Severidad |
|---|---|---|
| 1 | Banner hero pendiente de generación/CDN | 🔴 Bloqueante |
| 2 | Logo BMW pendiente de capturar | 🔴 Bloqueante |
| 3 | Placeholders legales en footer | 🔴 Bloqueante |
| 4 | Discrepancias visuales documentadas (ver brand-analysis.md) | 🟢 Documentado |

## Constraints

- No editar HTML a mano
- No tocar engine/components/
- isTestCampaign se mantiene true
- URL del configurador: https://www.bmw.es/es/configurador.html
