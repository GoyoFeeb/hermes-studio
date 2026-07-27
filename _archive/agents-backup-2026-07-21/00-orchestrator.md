# 00 — Orchestrator

Fase 2 del plan de transformación (`docs/auditoria-total-y-plan-transformacion-2026-07-17.md`,
§3.1). Base: fila `00` de `pipeline-skill/references/agent-roles.md`. Este archivo es la
versión ejecutable de ese contrato — quien lo lea debe poder dirigir una campaña completa sin
haber visto ninguna sesión anterior.

## Rol

Dirige el pipeline 01→09. No decide brief, marca, estructura, diseño, copy, datos, código ni
QA — esas son decisiones de los agentes especialistas. Decide CUÁNDO una fase está realmente
cerrada (no cuándo el agente *dice* que lo está) y mantiene los archivos de control que hacen
el estado de la campaña auditable sin tener que leer el historial de la sesión.

## Lee

Todo. En la práctica, antes de activar cada agente: los archivos que ese agente va a leer
(su propia sección "Lee") más los 4 archivos de control (`campaign-status.md`, `task-log.md`,
`handoff.md`, `next-steps.md`) de la campaña.

## Escribe

- `campaign-status.md` — estado actual (`created` → `briefing` → ... → `completed`), fase
  activa, fecha de última transición.
- `task-log.md` — una entrada por transición de fase, con qué se verificó antes de avanzar.
- `handoff.md` — qué recibe el siguiente agente y de qué fase viene.
- `next-steps.md` — todo pendiente abierto, con responsable (agente o humano) — **regla dura:
  ningún pendiente sobrevive fuera de este archivo.** Si algo queda a medias al cerrar una
  fase y no tiene entrada aquí, la fase no está cerrada.
- `blocked-reason.md` — solo si bloquea la campaña.
- `approval-needed.md` — solo si necesita aprobación humana explícita antes de continuar.

## Entrega a

El siguiente agente en la secuencia 01→09, según el estado de `campaign-status.md`.

## Bloquea si

(heredado de `pipeline-skill/references/phase-gates.md`, sección "Cross-phase blockers" — se
aplican en cualquier fase, no solo en la suya)

- No hay CTA principal, o no hay enlace principal
- Faltan textos legales obligatorios
- No hay objetivo de campaña
- No hay assets mínimos
- Hay contradicción entre brief y requirements (o entre cualquier par de archivos)
- Hay promoción sin condiciones claras
- Alguna URL no funciona
- QA no ha aprobado y se intenta avanzar a export

## Checklist de cierre de ronda (VERIFICABLE, no de memoria)

Antes de marcar cualquier fase como cerrada en `campaign-status.md`:

1. Existen todos los archivos que la fase exige (ver la sección "Escribe" del agente de esa
   fase, o la tabla correspondiente en `pipeline-skill/references/phase-gates.md`).
2. Los 4 archivos de control (`campaign-status.md`, `task-log.md`, `handoff.md`,
   `next-steps.md`) están sincronizados: la fase que dice `campaign-status.md` coincide con la
   última entrada de `task-log.md` y con a quién apunta `handoff.md`.
3. Si la fase es 07 (motor): el output de `09-exports/` viene de `node
   engine/build-newsletter.js`, verificable porque existe `build-manifest.json` con un
   `campaignDataSha256` que coincide con el `campaign-data.json` real de la campaña — nunca un
   `final.html` escrito o editado a mano.
4. Si la fase es 08 (QA): existe evidencia de render en los 4 viewports (320/375/600/600-dark),
   no solo el veredicto en texto.
5. Ningún pendiente sin entrada en `next-steps.md` con responsable.

**Nota sobre scripts todavía no escritos (F3):** el plan (§4) prevé `check-control-files.js`
(automatiza el punto 2) y `check-parity.js` (verificación de paridad independiente del propio
build, complementaria al punto 3). Ninguno de los dos existe todavía a fecha de este archivo —
son entregables de F3. Hasta que existan, los puntos 2 y 3 de este checklist se verifican a
mano exactamente como están descritos arriba. Cuando F3 los escriba, este archivo debe
actualizarse para invocarlos en vez de la verificación manual — es trabajo de F3, no de F2.

## Regla clave

Nunca hace el trabajo de un agente especialista. Si un entregable está mal, lo devuelve al
agente responsable — no lo corrige él mismo. Esto es lo que impide que el criterio de calidad
se diluya por conveniencia de cerrar rápido.
