# Next Steps

## Fase actual

Export Manager (normalización de campaña heredada) — Archivos de control creados ✅

## Próximas acciones — Bloqueos de producción

### 🎯 Bloqueo CDN — Subir assets al CDN
**Responsable:** Equipo CDN / Assets

- [ ] Subir `icon-tarifa-movil.png` a `https://feebbodigital.com/creativities-library/paraycompara/2026/jul/`
- [ ] Subir `icon-tarifa-fibra.png` a `https://feebbodigital.com/creativities-library/paraycompara/2026/jul/`
- [ ] Subir `icon-tarifa-convergente.png` a `https://feebbodigital.com/creativities-library/paraycompara/2026/jul/`
- [ ] Subir `icon-tarifa-tv.png` a `https://feebbodigital.com/creativities-library/paraycompara/2026/jul/`
- [ ] Subir `icon-aspecto-datos.png` a `https://feebbodigital.com/creativities-library/paraycompara/2026/jul/`
- [ ] Subir `icon-aspecto-cobertura.png` a `https://feebbodigital.com/creativities-library/paraycompara/2026/jul/`
- [ ] Subir `icon-aspecto-paquetes.png` a `https://feebbodigital.com/creativities-library/paraycompara/2026/jul/`
- [ ] Subir `icon-aspecto-condiciones.png` a `https://feebbodigital.com/creativities-library/paraycompara/2026/jul/`

### 🎯 Bloqueo Legal / ESP — Placeholders del footer
**Responsable:** Equipo Legal / ESP

- [ ] Sustituir `[UNSUBSCRIBE_LINK]` por URL real de baja del ESP
- [ ] Sustituir `[PREFERENCES_LINK]` por URL real de preferencias del ESP
- [ ] Sustituir `[DIRECCIÓN FÍSICA — pendiente del cliente]` por dirección legal real de Para y Compara

### 🎯 Cierre de producción
**Responsable:** Responsable de campaña

- [ ] Verificar que los 8 assets responden HTTP 200
- [ ] Verificar que los 3 placeholders legales están resueltos
- [ ] Cambiar `isTestCampaign` a `false` en `06-data/campaign-data.json`
- [ ] Cambiar `productionReady` a `true` en `06-data/campaign-data.json`
- [ ] Regenerar con: `node engine/build-newsletter.js --data ... --out ...`
- [ ] Ejecutar `npm run production-gate -- --campaign ...` → debe salir exit 0
- [ ] Obtener aprobación humana final antes del envío

### 🛠 Tarea técnica — Endurecer production-readiness contra placeholders legales

**Descripción:**
El script `scripts/check-production-readiness.ts` actualmente considera `[UNSUBSCRIBE_LINK]` y `[PREFERENCES_LINK]` como merge-tags legítimos de ESP y los excluye explícitamente de la detección (`SKIP_KEYS` en línea 35, regex `^\[[A-Z_]+\]$` en línea 67). Aunque esto es correcto para la mayoría de ESPs, deja sin detectar placeholders como `[DIRECCIÓN FÍSICA — pendiente del cliente]` (tiene espacios interiores) cuando `productionReady: false`.

**Mejora propuesta:**
- Si `productionReady: true` y `isTestCampaign: false`, detectar cualquier valor que empiece por `[` en campos del footer, incluyendo merge-tags de ESP que no estén documentados en un allowlist explícito.
- Si `productionReady: false` o `isTestCampaign: true`, mantener el comportamiento actual (avisos no bloqueantes).
- El checker del footer debería validar que `unsubscribeUrl`, `preferencesUrl` y `legalLine` contengan URLs/direcciones reales, no tokens de merge.

**Ubicación:** `scripts/check-production-readiness.ts`
**Prioridad:** 🟡 Media (no bloquea el motor, mejora la seguridad)
**Cuándo hacerlo:** Cuando el proyecto tenga un backlog técnico activo o antes de la primera campaña real de producción.

## Build result

| Métrica | Valor |
|---|---|
| BUILD | ✅ OK |
| Módulos | 7/7 (hero-asimetrico, trust-bar, card-tarifa, pasos, lista-premium, banda-cierre, footer) |
| Inline size | 37.9 KB (límite 90 KB) |
| Warnings | 0 |
| VML | 4 roundrects |
| Tables | 51/51 balanced |
| Brand pack | paraycompara v2.2.6 |
| Patrón | saving |

## Issues abiertos

| ID | Issue | Responsable | Severidad |
|---|---|---|---|
| B-001 | 8 iconos HTTP 404 en CDN | Equipo CDN | 🔴 Bloqueante |
| B-002 | `[UNSUBSCRIBE_LINK]` sin resolver | Legal / ESP | 🔴 Bloqueante |
| B-003 | `[PREFERENCES_LINK]` sin resolver | Legal / ESP | 🔴 Bloqueante |
| B-004 | `[DIRECCIÓN FÍSICA]` sin resolver | Legal / ESP | 🔴 Bloqueante |
| B-005 | `isTestCampaign`, `productionReady` flags | Resp. campaña | 🟡 Post-bloqueos |
| T-001 | Endurecer production-readiness contra placeholders legales | Backend / DevOps | 🟡 Media |
