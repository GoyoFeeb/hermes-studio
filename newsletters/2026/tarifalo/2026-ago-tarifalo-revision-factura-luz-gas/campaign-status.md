# Campaign Status

## Campaign

| Campo | Valor |
|---|---|
| Cliente | Tarífalo |
| Campaña | 2026-ago-tarifalo-revision-factura-luz-gas |
| Fecha | 2026-08-01 |
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
| Q-001 | Assets de iconos en dominio de Tarifalo (`tarifalo.com/wp-content/.../2023/03/`) — pueden dejar de funcionar si Tarifalo cambia su estructura | ⚠️ Riesgo conocido |
| Q-002 | Footer: `[UNSUBSCRIBE_LINK]`, `[PREFERENCES_LINK]` sin resolver | 🔴 Bloqueante producción |
| Q-003 | Footer: `[DIRECCIÓN FÍSICA — pendiente del cliente]` sin resolver | 🔴 Bloqueante producción |
| Q-004 | `isTestCampaign: true`, `productionReady: false` | 🟡 Pendiente desbloqueo |
| Q-005 | Discrepancias de identidad visual documentadas (tipografía Sora vs Poppins/Capitana, colores secundarios) — brand pack prevalece | 🟢 No bloqueante |

## Next Step

Ejecutar el build del motor y verificar con production-gate. Ver `next-steps.md` para detalle.
