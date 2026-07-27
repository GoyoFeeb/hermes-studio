# Plan de Implementación — Hermes Newsletter System

## Cómo usar este plan

Eres Claude Code (u otro agente) trabajando en `sistema-final`. Lee primero `AGENTS.md`,
`context.md`, `memory.md`, `CLAUDE.md` y `.agent/project.md`. Después lee `tasks.json` completo.

## Estado del plan

Este plan fue sincronizado el 2026-07-27 con `roadmap-to-plan` sobre el roadmap activo
`docs/roadmap-deuda-tecnica.md`. `report-to-roadmap` detectó que ya existía un roadmap, así que
no se creó uno duplicado.

La Fase 0 ya está cerrada en el estado actual del repositorio:

- `create-campaign.ts` tiene fallback `EACCES`.
- El template crea `06-data/campaign-data.json`.
- `production-gate` apunta a `production-gate-motor`.
- Los scripts React Email quedan bajo `legacy:*`.
- `npm test` usa `node --test`.
- `CLAUDE.md` y `.agent/*` inicializan el marco común multiagente.
- `docs/hermes-newsletter-system-context.md` y `docs/hermes-newsletter-system-report.md` existen.

La Fase 1 queda cerrada salvo `task_1_2`, que sigue bloqueada por diseño:

- Documentación `card-tarifa` sincronizada: 4 y 3 tarjetas soportadas; solo falta 2.
- Contraste del enlace secundario de `card-tarifa*` resuelto con `colors.primary`.
- Bug "Antes de decidir" reclasificado: histórico en HTML viejo, no vigente en motor.
- `check-column-balance.ts` bloquea títulos de cierre de más de 45 caracteres.
- `card-tarifa-2.html` no se crea hasta que una campaña real lo necesite.

## Instrucciones de ejecución

1. Implementa desde `phase_1` salvo que el usuario pida rehacer Fase 0.
2. Dentro de cada fase, respeta `dependencies`.
3. Antes de marcar una tarea como `done`, ejecuta su `verification_command`.
4. Si `node_modules` fue eliminado del entregable, ejecuta `npm install` antes de `npm test` o scripts npm.
5. No edites `final.html` ni `final-inline.html` a mano.
6. No revivas el pipeline React Email archivado.
7. No desbloquees `task_1_2` sin confirmación explícita de una campaña real que necesite 2 tarjetas.

## Stack técnico

- Node.js 18+ / TypeScript con `tsx`.
- Motor propio en `engine/`.
- `ajv` para schema, `juice` para inline CSS.
- Playwright/Sharp para previews e imágenes.
- Tests con `node --test`.

## Estructura esperada

```text
AGENTS.md
CLAUDE.md
.agent/
context.md
memory.md
docs/roadmap-deuda-tecnica.md
docs/hermes-newsletter-system-context.md
docs/hermes-newsletter-system-report.md
engine/
scripts/
newsletters/_campaign-template/06-data/campaign-data.json
tasks.json
```

## Variables de entorno necesarias

Ninguna nueva. Para flujos de hero con Claude puede requerirse `ANTHROPIC_API_KEY`, según
`scripts/hero-design/`, pero no aplica al plan de deuda técnica actual.
