# Campaign Status

## Campaign

| Campo | Valor |
|---|---|
| Cliente | BMW |
| Campaña | 2026-ago-bmw-m4-coupe |
| Modelo | BMW M4 Competition Coupé |
| Fecha | 2026-08-15 |
| Estado actual | development |

## Current Phase

| Campo | Valor |
|---|---|
| Fase | HTML Email Development |
| Agente activo | 07 — HTML Email Developer |
| Objetivo | Ejecutar engine/build-newsletter.js y verificar con production-gate |

## Completed Phases

- [x] Briefing
- [x] Brand / Visual Analysis
- [x] Newsletter Architecture
- [x] Email Design
- [x] Copy
- [x] Newsletter Data
- [ ] HTML Email Development (engine/build-newsletter.js)
- [ ] QA
- [ ] Export

## Open Issues

| ID | Issue | Estado |
|---|---|---|
| Q-001 | Banner hero (hero-imagen) pendiente de generación/subida a CDN (`PENDING-CDN-UPLOAD`) | 🔴 Bloqueante producción |
| Q-002 | Logo BMW pendiente de capturar de bmw.es (`PENDING-BMW-LOGO`) | 🔴 Bloqueante producción |
| Q-003 | Footer: `[UNSUBSCRIBE_LINK]`, `[PREFERENCES_LINK]`, dirección física sin resolver | 🔴 Bloqueante producción |
| Q-004 | `isTestCampaign: true`, `productionReady: false` | 🟡 Pendiente desbloqueo |
| Q-005 | Discrepancias de identidad visual documentadas (azul #1C69D4 vs #0066B1, tipografía, tamaños) — brand pack prevalece | 🟢 Documentado |

## Next Step

Ejecutar el build del motor y verificar con production-gate. Ver `next-steps.md` para detalle.
