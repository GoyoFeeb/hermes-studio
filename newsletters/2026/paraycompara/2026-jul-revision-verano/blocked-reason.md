# Blocked Reason

## Estado: Bloqueado para producción

### Motivo
La campaña `2026-jul-revision-verano` de Para y Compara está bloqueada para producción real debido a bloqueos que requieren intervención humana fuera del pipeline automático.

### Bloqueos detectados

| # | Bloqueo | Tipo | Responsable |
|---|---|---|---|
| 1 | 8 iconos HTTP 404: no están subidos al CDN (`feebbodigital.com/creativities-library/paraycompara/2026/jul/`) | Assets / CDN | Equipo CDN |
| 2 | `[UNSUBSCRIBE_LINK]` sin resolver en footer | Legal / ESP | Equipo Legal / ESP |
| 3 | `[PREFERENCES_LINK]` sin resolver en footer | Legal / ESP | Equipo Legal / ESP |
| 4 | `[DIRECCIÓN FÍSICA — pendiente del cliente]` sin resolver en legalLine | Legal / ESP | Equipo Legal / ESP |

### Estado del motor
El motor (`engine/`) ha sido validado: schema ✅, build ✅, parity ✅, claims ✅, contraste ✅, column-balance ✅, hero-decision ✅. **No requiere intervención.**

### Acción para desbloquear
Resolver los 4 bloqueos de arriba, actualizar `campaign-data.json` (`isTestCampaign: false`, `productionReady: true`), regenerar con el motor y ejecutar `production-gate` hasta exit 0. Ver `next-steps.md` para detalle accionable.

### Fecha
2026-07-27
