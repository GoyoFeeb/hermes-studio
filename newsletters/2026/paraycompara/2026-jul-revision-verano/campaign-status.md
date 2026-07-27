# Campaign Status

## Campaign

| Campo | Valor |
|---|---|
| Cliente | Para y Compara |
| Campaña | 2026-jul-revision-verano |
| Fecha | 2026-07-27 |
| Estado actual | blocked |

## Current Phase

| Campo | Valor |
|---|---|
| Fase | Export Manager (post-normalización) |
| Agente activo | 09 — Export Manager |
| Objetivo | Normalizar campaña heredada: crear archivos de control, documentar bloqueos, registrar test E2E del motor |

## Completed Phases

- [x] Briefing
- [x] Brand / Visual Analysis
- [x] Newsletter Architecture
- [x] Email Design
- [x] Copy
- [x] Newsletter Data
- [x] HTML Email Development (engine/build-newsletter.js)
- [x] QA
- [x] Export (normalización heredada)

## Test End-to-End del Motor

| Prueba | Resultado |
|---|---|
| `npm run check-engine` | ✅ Motor íntegro (35 archivos coinciden con lock) |
| `engine/build-newsletter.js` — build | ✅ BUILD OK (37.9 KB inline, 0 warnings) |
| `npm run check-parity` — parity | ✅ fuente/inline en paridad |
| `npm run check-control-files` | ❌ Falló (control files no existían) — **resuelto** tras normalización |
| `npm run production-gate` | ❌ Bloqueos esperados (assets 404 + placeholders legales) |

## Open Issues

| ID | Issue | Estado |
|---|---|---|
| B-001 | 8 iconos HTTP 404 en CDN (`feebbodigital.com/creativities-library/paraycompara/2026/jul/`) | 🔴 Bloqueante producción |
| B-002 | `[UNSUBSCRIBE_LINK]` sin resolver en footer | 🔴 Bloqueante producción |
| B-003 | `[PREFERENCES_LINK]` sin resolver en footer | 🔴 Bloqueante producción |
| B-004 | `[DIRECCIÓN FÍSICA — pendiente del cliente]` en legalLine | 🔴 Bloqueante producción |
| B-005 | `isTestCampaign: true`, `productionReady: false` | 🟡 Pendiente desbloqueo de B-001 a B-004 |

## Production Gate Result

```
✅ Gate 0  — engine-integrity
✅ Gate 1  — schema
✅ Gate 2  — parity (pre-build)
✅ Gate 3  — build
✅ Gate 4  — claims (29 reglas)
❌ Gate 5  — assets (8 iconos HTTP 404)
✅ Gate 6  — control-files (creados en normalización)
✅ Gate 7  — column-balance
✅ Gate 8  — brand-pack-completeness (avisos no bloqueantes)
✅ Gate 9  — contrast (10/10 pares sobre umbral)
✅ Gate 10 — production-readiness (sin placeholders de relleno)
✅ Gate 11 — hero-decision

10/12 gates pasan.
Gate 5 (assets) + placeholders legales pendientes → bloquean producción real.
```

## Next Step

Resolver bloqueos de producción: subir 8 assets al CDN y sustituir placeholders legales del footer. Ver `next-steps.md` para detalle por responsable.
