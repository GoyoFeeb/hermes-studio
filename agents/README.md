# agents/ — los 10 agentes del motor (00-09)

Estos archivos definen el pipeline de 10 fases del **motor por línea de comandos** (`engine/`, `campaign-data.json`,
`npm run production-gate`): Orchestrator, Briefing Strategist, Brand Visual Analyst, Newsletter Architect, Email
Designer, Copywriter, Data Specialist, HTML Email Developer, QA Specialist y Export Manager. Siguen siendo la
referencia de ese flujo y de `AGENTS.md`.

**Hermes Studio no los usa** desde el 2026-10-05 (antes, solo por API con `PIPELINE_ENABLED=true`). Una
newsletter de Studio pasa por estos pasos, todos en `studio/`:

| Paso | Quién | Dónde |
|---|---|---|
| Identidad de la marca medida en su web (si no hay brand pack) | worker, sin IA — el método del agente 02 | `studio/worker/measureBrand.ts` |
| Brief creativo (concepto, escenas, identidad, datos con fuente) | Hermes | `buildBriefPrompt` en `studio/server/standalone.ts` |
| Newsletter sobre la base técnica de email | Hermes | `buildHermesPrompt` + `studio/hermes/email-base.html` |
| Arreglos mecánicos y comprobación (móvil, espacios, legibilidad, enlaces, Outlook…) | worker, sin IA — el papel del agente 08 | `studio/worker/inspect.ts` (y `npm run check-newsletter`) |
| Una ronda corta de corrección, si queda algo | Hermes, sesión nueva | `runJob` en `studio/worker/hermes-worker.ts` |
| Revisión de dirección de arte (opcional) | Hermes, sesión nueva | `runJob` |
| «Pedir cambios» / «Adaptar a móvil» | Hermes | `buildRevisionPrompt` / `buildMobileFixPrompt` |

Si en algún momento se decide retirar el motor de la terminal, estos archivos pasan a `_archive/` junto con él.
Hasta entonces no se tocan desde Studio.
