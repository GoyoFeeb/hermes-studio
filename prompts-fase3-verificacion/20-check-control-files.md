# PROMPT 20 — check-control-files.js: sincronización de los 4 archivos de control

## CONTEXTO

Eres el Orchestrator de Hermes. Continúa F3 (prompt 19 ya escribió `check-parity.ts`). Este
prompt cierra el Defecto H5 (`docs/re-auditoria-sistema-hermes-2026-07-17.md`): nunca existió
un script que verificara que `campaign-status.md`, `task-log.md`, `handoff.md` y
`next-steps.md` cuentan la misma historia. La propia re-auditoría lo señala: "el Defecto N1 es
exactamente el tipo de fallo que ese script habría atrapado" — un desajuste entre lo que un
archivo de control decía y lo que realmente había pasado.

`agents/00-orchestrator.md` (F2) ya describe, en su "Checklist de cierre de ronda", qué debería
verificar este script cuando exista. Este prompt lo hace real.

## TAREAS

1. **Crea `scripts/check-control-files.ts`**, mismo estilo que los scripts existentes.

   ```bash
   npx tsx scripts/check-control-files.ts --campaign newsletters/{year}/{client}/{campaign}
   ```

2. **Verificaciones** (basadas en qué debería ser cierto si los 4 archivos están realmente
   sincronizados — define el formato exacto de cada archivo si no está ya fijado en ningún
   sitio, y documéntalo en el propio script):
   - Los 4 archivos existen.
   - `campaign-status.md` declara un estado (`created`, `briefing`, `analysis`, `strategy`,
     `design`, `copy`, `data`, `development`, `qa`, `export`, `completed` — la lista de estados
     de `pipeline-skill/references/agent-roles.md`) y ese estado es uno de los válidos.
   - La última entrada de `task-log.md` corresponde a una transición HACIA el estado declarado
     en `campaign-status.md` (no a un estado anterior — señal de que el estado no se actualizó
     tras la última transición real).
   - `handoff.md` apunta al agente que corresponde al estado actual (el siguiente en la
     secuencia 00→09), no a uno ya superado ni a uno futuro fuera de orden.
   - Si `next-steps.md` tiene entradas, cada una tiene responsable asignado (agente o humano) —
     una entrada sin responsable es en sí misma un fallo (regla de `00-orchestrator.md`:
     "ningún pendiente sobrevive sin entrada... con responsable").
   - Si la campaña está en fase `qa` o posterior, y hay un `08-qa/return.md`, verifica que
     `campaign-status.md` refleja que volvió a una fase anterior (no puede decir `export` si
     hay una devolución de QA sin resolver).

3. **Formato de salida**: igual que los demás scripts — lista de errores/avisos, exit 0/1. Si
   el formato de alguno de los 4 archivos no está estandarizado todavía en ninguna campaña real
   existente, documenta el formato mínimo que este script espera (una sección al final del
   propio script o un comentario de cabecera) para que los agentes de F2 puedan ajustarse a él.

4. **Pruébalo** contra al menos 1 campaña real (ej.
   `newsletters/2026/paraycompara/2026-jul-ahorra-fibra-movil/`, que ya tiene los 4 archivos de
   una campaña completa) y reporta el resultado tal cual, sin forzar que pase si no pasa —
   si encuentra un desajuste real en esa campaña, lo documenta como hallazgo (no lo corrige,
   ver restricciones).

## RESTRICCIONES

- No modificar los 4 archivos de control de ninguna campaña real — solo leerlos. Si el script
  encuentra un desajuste real al probarlo, se documenta como hallazgo en el propio informe de
  prueba, no se arregla la campaña.
- No inventar un formato completamente nuevo para los 4 archivos si ya existe uno de facto en
  las campañas reales — obsérvalo primero (`grep`/lectura de los archivos existentes) y
  formaliza ESE formato, no uno ideal sin verificar contra la realidad.
- No tocar `check-parity.ts` (prompt 19) ni `production-gate.ts` (prompt 21).

## CRITERIOS DE ACEPTACIÓN

- [ ] `scripts/check-control-files.ts` creado, ejecutable con `npx tsx`
- [ ] Verifica existencia + consistencia cruzada de los 4 archivos (no solo que existan)
- [ ] El formato esperado de cada archivo está documentado y basado en el uso real observado,
      no inventado
- [ ] Probado contra al menos 1 campaña real, con el resultado real reportado (pase o fallo)
- [ ] Documentado en `pipeline-skill/references/script-usage.md`
