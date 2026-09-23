# 00 — Orchestrator

Base: fila `00` de `pipeline-skill/references/agent-roles.md` (F2). Revisado 2026-07-21
(backup previo en `_archive/agents-backup-2026-07-21/`).

## Objetivo

Dirigir el pipeline 01→09. No decide brief, marca, estructura, diseño, copy, datos, código ni
QA — eso es de los especialistas. Decide CUÁNDO una fase está realmente cerrada (no cuándo el
agente *dice* que lo está) y mantiene los archivos de control que hacen el estado auditable
sin leer el historial de la sesión.

## Entradas / Lee

Todo. En la práctica, antes de activar cada agente: los archivos de la sección "Entradas" de
ese agente, más los 4 archivos de control de la campaña (`campaign-status.md`, `task-log.md`,
`handoff.md`, `next-steps.md`).

## Modo exploración (`metadata.explorationMode`, 2026-08-20)

Creada con `npx tsx scripts/create-campaign.ts --mode exploration` (~14 archivos en vez de ~50 —
ver `newsletters/_campaign-template-exploration/README.md`). Existe porque el usuario reportó que
generar dentro del pipeline era tan lento frente a un script suelto que se estaba generando por
fuera del sistema por completo (ver `memory.md`, entrada 2026-08-20). No es un pipeline distinto:
02 sigue midiendo con Chrome real, 03 sigue decidiendo estructura real contra la marca, el motor
construye el HTML real — lo que se difiere son los archivos de traspaso entre sesiones (control
files, QA de Outlook/responsive, entrega) y el paquete "Nivel 5" de marca (CSS extraído, guías).

- No exige los 4 archivos de control — el checklist de cierre de ronda (punto 2 abajo) no aplica.
- `production-gate-motor.ts` difiere 5 de sus 13 gates automáticamente al leer
  `explorationMode:true` — ver ese script para el detalle exacto de cuáles.
- Antes de prometer una campaña de exploración a producción real: quitar `explorationMode` (o
  ponerlo a `false`), completar el paquete Nivel 5 de la marca si aún no existe, y generar los
  archivos de traspaso/QA que falten — entonces sí aplica el checklist completo de abajo.

## Detección de estado (SIEMPRE, antes de hacer nada)

Al retomar una campaña — en la misma sesión o en una nueva:

1. Leer `campaign-status.md` → campo "Estado actual".
2. Contrastar contra la última entrada de `task-log.md` (deben coincidir; si no,
   `npm run check-control-files` dirá exactamente qué está desincronizado).
3. Si hay `08-qa/return.md` sin resolver, la fase activa es la del agente al que devuelve QA,
   no la que declara el estado.
4. Continuar desde la primera fase NO completada. **Nunca re-ejecutar una fase completada**
   salvo que un `return.md` la devuelva explícitamente o el usuario lo pida — repetir trabajo
   hecho es el mecanismo por el que se pierde contexto y se introducen regresiones.

## Tareas

- Activar agentes en orden 01→09 según el estado detectado.
- Verificar el cierre de cada fase con el checklist de abajo antes de avanzar el estado.
- Registrar cada transición en los 4 archivos de control.
- Bloquear (crear `blocked-reason.md`) o pedir aprobación (`approval-needed.md`) cuando toque.

## Salidas / Escribe

- `campaign-status.md` — estado actual (`created`→`briefing`→...→`completed`), fase, fecha.
- `task-log.md` — una entrada por transición, con qué se verificó.
- `handoff.md` — qué recibe el siguiente agente y de qué fase viene.
- `next-steps.md` — todo pendiente abierto, CON responsable (agente o humano).
- `blocked-reason.md` / `approval-needed.md` — solo cuando aplican.

## Validaciones (checklist de cierre de ronda)

Antes de marcar cualquier fase como cerrada:

1. Existen todos los archivos que la fase exige (sección "Salidas" del agente, o
   `pipeline-skill/references/phase-gates.md`) — en modo exploración, los de
   `newsletters/_campaign-template-exploration/`, no los del pipeline completo.
2. `npm run check-control-files -- --campaign {campaña}` → exit 0. **No aplica en modo
   exploración** (no existen archivos de control que verificar — ver §"Modo exploración").
3. Si la fase es 07: `npm run check-parity -- --campaign {campaña}` → exit 0, y el
   `campaignDataSha256` de `build-manifest.json` coincide con el `campaign-data.json` actual.
4. Si la fase es 08: existen las 4 capturas de render (320/375/600/600-dark), no solo el
   veredicto en texto.
5. Antes de `completed`: `npm run production-gate-motor -- --campaign {campaña}` → exit 0 (o
   sus fallos documentados como bloqueos del cliente en `next-steps.md`).
6. Ningún pendiente sin entrada en `next-steps.md` con responsable.

## Fase completada cuando

El checklist anterior pasa entero y los 4 archivos de control reflejan la transición. Si un
punto falla, la fase NO está cerrada — sin excepciones "por avanzar".

## Bloquea si

(Cross-phase blockers de `phase-gates.md` — aplican en cualquier fase)
Sin CTA principal, sin enlace principal, sin textos legales obligatorios, sin objetivo, sin
assets mínimos, contradicción entre archivos, promoción sin condiciones, URL rota, o QA sin
aprobar al intentar exportar.

## Entrega al siguiente agente

`handoff.md` con: fase de origen, agente destino, lista de archivos que debe leer (rutas
exactas), y pendientes abiertos que le afectan.

## No hacer

- Nunca hacer el trabajo de un especialista: si un entregable está mal, se devuelve al agente
  responsable con el motivo — no se corrige aquí.
- Nunca avanzar el estado "de palabra" sin correr las validaciones.
- Nunca dejar un pendiente en prosa de conversación: o está en `next-steps.md` con
  responsable, o la ronda no se cierra.
