# Pack de prompts — Fase 2: los Agentes

Serie de 4 prompts para que **Hermes** escriba `agents/` — los 10 archivos de agente reales
definidos en `docs/auditoria-total-y-plan-transformacion-2026-07-17.md` (§3.1). Continúa la
numeración de `prompts-fase1-motor/` (11-14): estos son 15-18.

## Por qué esta fase

F1 cerró con veredicto APTO: el motor (`engine/`) reproduce la calidad premium de la pieza
validada. Pero el motor solo sirve si alguien sabe operarlo con el criterio correcto.
Hoy ese criterio vive en la cabeza de quien ejecuta la sesión — F2 lo pone por escrito en
archivos ejecutables, para que no se reinvente ni se degrade entre sesiones (síntoma ya
diagnosticado en §2.2 del plan: "los agentes no existen, así que el criterio no se aplica dos
veces igual").

## Corrección de conteo respecto al plan

El plan (§4, fila F2) dice "escribir los 9 archivos `agents/*.md`", pero la propia tabla del
plan (§3.1) lista 10 filas: `00` Orchestrator + `01`-`09`. Se trata como una imprecisión de
conteo en el documento, no como una instrucción de omitir uno — este pack produce los **10**
archivos de la tabla §3.1, incluido `00-orchestrator.md`.

## Prerequisito (F1)

- [x] `engine/` completo y con veredicto APTO (`docs/f1-motor-cerrado.md`)
- [x] `patterns/saving.md` existe (único patrón por ahora — regla anti-aspiracional, no crear más)

## Orden

| # | Prompt | Agentes que escribe | Estado |
|---|---|---|---|
| 15 | `15-agentes-00-03-orquestacion-y-brief.md` | `00-orchestrator`, `01-briefing-strategist`, `02-brand-visual-analyst`, `03-newsletter-architect` | ✅ completado |
| 16 | `16-agentes-04-06-diseno-copy-datos.md` | `04-email-designer`, `05-copywriter`, `06-data-specialist` | ✅ completado |
| 17 | `17-agentes-07-09-motor-qa-export.md` | `07-html-email-developer`, `08-qa-specialist`, `09-export-manager` | ✅ completado |
| 18 | `18-verificacion-y-cierre-f2.md` | Ninguno nuevo — audita los 10, cierra la fase | ✅ completado — 2 desajustes menores encontrados y corregidos |

## Fase 2 — CERRADA (2026-07-20)

Los 4 prompts se ejecutaron en orden. Los 10 archivos de `agents/` están escritos y auditados.
Detalle completo de la auditoría de cierre (consistencia de cadena, hallazgos corregidos,
limitaciones conocidas) en `docs/f2-agentes-cerrado.md`.

## Fuentes de verdad para cada prompt

- **Base de los 10 contratos**: `pipeline-skill/references/agent-roles.md` (00-09, diseñado
  para React Email — hay que reescribir 07, extender 00/02/03/04/06/08/09, dejar 01/05 casi
  igual).
- **Criterios de cierre por fase**: `pipeline-skill/references/phase-gates.md` — base de la
  sección "Block if" / criterios de aceptación de cada agente.
- **El motor**: `engine/README.md`, `engine/CHANGELOG.md`, `engine/components/INVENTORY.md`,
  `patterns/saving.md` — de aquí sale el criterio premium codificado que heredan 03/04/07, y
  el contrato real de 07 (ya no genera JSX, ejecuta `build-newsletter.js`).
- **Claims safety**: `scripts/validate-claims.ts` (29 reglas, 3 niveles) — agente 05.
- **Render/QA**: `scripts/render-preview.js` + receta del stub `libXdamage.so.1`
  (`engine/CHANGELOG.md`, prompt 14) — agente 08.

## Reglas de oro del pack

- **Cada archivo de agente debe ser ejecutable de verdad**: qué lee (rutas exactas), qué
  escribe (rutas exactas), criterios de bloqueo verificables (no "debe ser bueno" — condiciones
  binarias), a quién entrega. Un agente sin esto es la misma aspiracionalidad que ya se
  diagnosticó en `agentes/` (vacío) — no se repite el error.
- **No inventar scripts que no existen.** `check-parity.js` y `check-control-files.js` son de
  F3 (todavía no escritos). Si un agente necesita esa verificación, el contrato dice
  explícitamente "F3 introducirá `check-parity.js`; hasta entonces, verificar a mano con
  `build-manifest.json` (hashes) y la auto-verificación de `lib/verify.js`" — nunca se finge
  que el script ya existe.
- **07 ya no es "React Email Developer".** Es `07-html-email-developer.md`: opera
  `engine/build-newsletter.js`. Solo escribe HTML nuevo cuando el componente no existe en
  `engine/components/`, y en ese caso el entregable es un componente nuevo del motor (con su
  entrada en `MODULE_ADAPTERS`, su `oneOf` de schema, su línea en `patterns/{género}.md`) — no
  HTML suelto dentro de la campaña.
- **Un prompt por sesión, captura antes de cerrar** — misma disciplina que F1.
- **Ningún cambio en el motor ni en campañas reales durante F2.** Este pack solo escribe
  `agents/*.md` (documentación/contrato). Si al escribir un contrato se descubre que el motor
  necesita algo que no tiene, se anota como hallazgo en el archivo de agente y en
  `engine/CHANGELOG.md` — no se corrige aquí (ese es el alcance de otro prompt).
