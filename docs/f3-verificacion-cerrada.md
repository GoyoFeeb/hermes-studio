# F3 — Verificación: cerrada

**Fecha de cierre:** 2026-07-21

**Veredicto:** APTO — los 3 fallos históricos (H1, N1, H5) son irreproducibles de forma
silenciosa con las herramientas de esta fase. Se encontró y corrigió 1 defecto real en la
propia herramienta durante la prueba de fuego (ver §3).

## Qué se construyó

| Prompt | Entregable |
|---|---|
| 19 | `scripts/check-parity.ts` — auditoría independiente fuente/inline (recalcula hashes y conteos desde disco, nunca confía ciegamente en `build-manifest.json`) |
| 20 | `scripts/check-control-files.ts` — sincronización de los 4 archivos de control, con verificación externa (estado `completed` exige `09-exports/final.html` real en disco) |
| 21 | `scripts/production-gate-motor.ts` — gate de 6 pasos para campañas del motor (schema → paridad pre-build → build → claims → assets → control files) + `scripts/lib/claim-rules.ts` (29 reglas extraídas de `validate-claims.ts`, compartidas sin duplicación) |
| 22 | Esta prueba de fuego y cierre |

`production-gate.ts` (pipeline React Email) y `validate-newsletter.ts`/`check-links.ts` no se
modificaron en su comportamiento — `validate-claims.ts` se refactorizó para importar las reglas
desde `lib/claim-rules.ts`, verificado sin cambio de output (misma cuenta de "29 reglas", mismo
resultado contra `2026-jul-ahorra-fibra-movil`, antes y después del cambio).

## Evidencia de las 3 recreaciones (prompt 22)

Todas sobre copias temporales en `/tmp/`, borradas al terminar cada prueba — ninguna campaña
real fue tocada.

### N1 — inline desincronizado de su fuente

1. Copia de `2026-jul-revision-verano/` a `/tmp/f3-test-n1`, 1 palabra editada a mano en
   `final-inline.html`.
2. `check-parity.ts` standalone → `exit 1`, hash exacto reportado. ✅
3. `production-gate-motor.ts` → **primer intento: `exit 1` en general, pero el Gate de
   paridad reportaba ✅ (falso negativo)**. Diagnóstico: el Gate de build corría ANTES que el
   de paridad, y el build siempre regenera `09-exports/` desde cero — así que la manipulación
   manual quedaba sobrescrita (y por tanto "arreglada") antes de que la auditoría de paridad
   llegara a mirarla. Es el mismo patrón de fondo que causó N1 originalmente: una comprobación
   que en la práctica nunca podía fallar.
4. **Corregido**: se invirtió el orden de los gates 2 y 3 en `production-gate-motor.ts` — la
   auditoría de paridad (`check-parity.ts`) ahora corre SIEMPRE antes del build, sobre el
   export tal cual está en disco en ese momento. Re-verificado: con el orden corregido, el
   gate completo detecta la manipulación correctamente (`❌ Gate: parity (pre-build)`).
5. Campaña limpia re-verificada tras el cambio: los 5 gates que no dependen de archivos de
   control siguen en ✅ (ver §"Gate corrido contra la campaña real" abajo).

### H1 — determinismo del motor (múltiples finales que no coinciden)

2 builds consecutivos de `campaign-data.json` de `2026-jul-revision-verano` a carpetas de
salida distintas (`/tmp/f3-build-a`, `/tmp/f3-build-b`): `sourceSha256` e `inlineSha256`
idénticos entre ambos manifests, y `diff` byte a byte de `final.html`/`final-inline.html` sin
ninguna diferencia. El motor es determinista — mismo dato de entrada, mismo output exacto — lo
que hace que "3 HTML finales que no coinciden" sea estructuralmente imposible mientras el
input no cambie; cualquier divergencia entre 2 builds del mismo dato sería, por definición, un
bug del motor detectable por esta misma prueba.

### H5 — control files desincronizados

Sobre copia de `2026-jul-ahorra-fibra-movil/` (`completed`, con los 4 archivos reales):
declarar `completed` en `campaign-status.md` tras eliminar `09-exports/final.html` → `exit 1`,
mensaje exacto señalando que el estado no corresponde con lo que hay en disco. Confirma el
mismo resultado ya obtenido en el prompt 20 con una recreación independiente.

## Gate corrido contra la campaña real (`2026-jul-revision-verano`)

Tras la corrección del orden de gates:

| Gate | Resultado |
|---|---|
| 1. schema | ✅ |
| 2. parity (pre-build) | ✅ |
| 3. build | ✅ |
| 4. claims (29 reglas) | ✅ |
| 5. assets HTTP 200 | ✅ (con aviso: 15/15 URLs sin respuesta por `getaddrinfo EAI_AGAIN` — el sandbox no tiene salida DNS al CDN real; distinguido explícitamente de un asset roto, no verificado en vez de falsamente aprobado) |
| 6. control-files | ❌ — la campaña no tiene `campaign-status.md`/`task-log.md`/`handoff.md`/`next-steps.md` porque se creó directamente con datos + build, sin pasar por el pipeline completo de agentes |

**Resultado real, no forzado**: `exit 1`, "NOT ready for production" — correcto. No se crearon
los 4 archivos de control para esta campaña solo para hacer pasar el gate (restricción
explícita del prompt 21/22): esta campaña de demostración nunca pasó por 00-Orchestrator, así
que el gate reportando su ausencia es el comportamiento esperado, no un defecto.

## Limitaciones conocidas

- El Gate 5 (assets) no pudo verificar HTTP 200 real contra el CDN en este entorno (sin salida
  DNS) — el gate lo distingue de un fallo real y no lo trata como aprobado, pero tampoco puede
  dar una certificación positiva genuina de los assets en este sandbox. En un entorno con red
  de salida, este mismo gate sí haría la verificación real.
- `production-gate-motor.ts` y `production-gate.ts` son 2 scripts paralelos que un operador
  debe elegir a mano según qué pipeline usa la campaña (presencia de `campaign-data.json` vs.
  `newsletter-data.json`). No hay todavía un despachador único que detecte automáticamente cuál
  correr — queda como mejora futura, fuera de alcance de F3.
- `check-control-files.ts` valida el formato observado hoy (tabla "Estado actual" + checklist
  opcional "## Completed Phases"). Si el formato de los archivos de control evoluciona más
  (como ya ocurrió entre el template y la campaña piloto madura), el script necesitará
  actualizarse — no es un contrato congelado.
- Ninguno de los 3 scripts nuevos está todavía enlazado en `package.json` como script npm —
  se ejecutan directamente con `npx tsx`, documentado en `pipeline-skill/references/script-usage.md`.

## Siguiente fase

F4 (Limpieza: archivar React Email y restos) y F5 (prueba real end-to-end) siguen pendientes,
según el orden del plan (`docs/auditoria-total-y-plan-transformacion-2026-07-17.md` §4).
