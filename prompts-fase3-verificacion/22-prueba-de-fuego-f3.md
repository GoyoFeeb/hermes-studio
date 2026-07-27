# PROMPT 22 — Prueba de fuego F3 y cierre

## CONTEXTO

Eres el Orchestrator de Hermes. Los prompts 19-21 escribieron `check-parity.ts`,
`check-control-files.ts` y `production-gate-motor.ts`. Esta ronda demuestra, con evidencia real
(no solo lectura de código), que los 3 fallos históricos del §"Por qué esta fase" del README de
este pack (H1, N1, H5) son irreproducibles hoy — y cierra F3, mismo patrón que el prompt 14
cerró F1 y el 18 cerró F2.

## TAREAS

1. **Recrea el escenario N1 a propósito** (inline desincronizado de su fuente) sobre una copia
   temporal de una campaña real del motor — nunca sobre el original:
   - Copia `newsletters/2026/paraycompara/2026-jul-revision-verano/` a una carpeta temporal.
   - Edita 1 palabra de `09-exports/final-inline.html` a mano (simulando el escenario real: un
     inline tocado después de certificarse).
   - Corre `check-parity.ts` sobre la copia → debe fallar con exit 1, señalando exactamente que
     el hash no coincide.
   - Corre `production-gate-motor.ts` sobre la copia → debe fallar en el Gate 3 (paridad), no
     pasar por error.
   - Borra la carpeta temporal.

2. **Recrea el escenario H1** (varios finales que no coinciden): en la misma copia temporal
   (recreada limpia), genera un segundo build con `--out` a una carpeta distinta dentro de
   `09-exports/` (ej. `09-exports/build-2/`) y confirma que `build-manifest.json` de cada uno
   tiene un hash de datos distinto SOLO si los datos de entrada cambiaron — si no cambiaron,
   confirma que 2 builds consecutivos con el mismo `campaign-data.json` producen el mismo
   `sourceSha256`/`inlineSha256` (determinismo del motor: mismo input → mismo output, byte a
   byte). Esto es lo que hace que "3 finales que no coinciden" deje de ser posible sin que
   alguien lo note: cualquier diferencia entre 2 builds del mismo dato es, por definición, una
   señal de que algo no es determinista, y `check-parity.ts` la expondría.

3. **Recrea el escenario H5** (control files desincronizados): en una copia temporal de una
   campaña con los 4 archivos de control, edita `campaign-status.md` a un estado que no
   corresponde con la última entrada de `task-log.md` (ej. adelántalo a `completed` sin que
   `task-log.md` tenga esa transición). Corre `check-control-files.ts` → debe fallar señalando
   el desajuste exacto. Borra la copia.

4. **Corre el gate completo** (`production-gate-motor.ts`) contra la campaña real
   `2026-jul-revision-verano/` sin modificar nada — documenta el resultado real, sea cual sea
   (recuerda: `isTestCampaign:true` debería hacer que el gate de producción no la certifique
   como lista para producción real, eso es correcto, no un fallo del gate).

5. **Informe**: `docs/f3-verificacion-cerrada.md` (mismo formato que `f1-motor-cerrado.md` y
   `f2-agentes-cerrado.md`): fecha, qué se construyó, evidencia de las 3 recreaciones (2-4) con
   su resultado real, veredicto, limitaciones conocidas (ej. si el sandbox no tiene red real
   para el Gate 5 de assets, decirlo explícitamente).

6. **Cierre de F3**: actualiza `pipeline-skill/references/script-usage.md` si algo quedó sin
   documentar de los prompts 19-21, marca `prompts-fase3-verificacion/README.md` como
   completada.

## RESTRICCIONES

- Todas las recreaciones de fallo son sobre copias temporales, nunca sobre campañas reales —
  bórralas al terminar cada una.
- No modificar `2026-jul-revision-verano/` más allá de dejarla pasar por el gate de solo
  lectura (el gate puede regenerar su `09-exports/` como parte de `production-gate-motor.ts`,
  eso es legítimo — no es una edición manual).
- Si algún gate falla contra la campaña real por un motivo legítimo (ej. `productionReady:
  false`), no se "arregla" la campaña para que pase — se documenta como comportamiento
  correcto del gate.

## CRITERIOS DE ACEPTACIÓN

- [ ] Escenario N1 recreado y detectado por `check-parity.ts` y por el Gate 3 del gate completo
- [ ] Determinismo del motor (H1) verificado con 2 builds idénticos del mismo dato
- [ ] Escenario H5 recreado y detectado por `check-control-files.ts`
- [ ] Gate completo corrido contra `2026-jul-revision-verano/` con resultado real documentado
- [ ] `docs/f3-verificacion-cerrada.md` escrito con fecha, evidencia, veredicto, limitaciones
- [ ] `prompts-fase3-verificacion/README.md` marcado como completado
- [ ] Ninguna carpeta temporal de prueba sobrevive al cierre del prompt
