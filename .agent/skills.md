# Allowed Skills & When To Use

## project-context

Use when the repository needs an AI-readable canonical project context or onboarding prompt.
Output should be a compact Markdown context file, not a replacement for `context.md`.

## project-docs

Use to create or update `AGENTS.md`, `context.md`, and `memory.md`. In Hermes, preserve the
specialized orchestrator contract in `AGENTS.md` and update only stale sections.

## common-init

Use to initialize or repair the shared multi-agent framework: `CLAUDE.md` and `.agent/*`. Do not
overwrite Hermes' existing `AGENTS.md`; treat it as the constitution.

## common-update

Use after material changes to architecture, commands, gates, roadmap, dependencies, or campaign
workflow. Update persistent docs with dates and reasons.

## case-to-report

Use to convert a business/product case into a technical report. For Hermes itself, the report
describes the newsletter production system, actors, requirements, test strategy, and risks.

## report-to-roadmap

Use only for an initial roadmap. If a roadmap already exists, do not create a duplicate; point to
the existing roadmap and update it only if the user explicitly asks for roadmap-update behavior.

## roadmap-to-plan

Use to turn the active roadmap into `tasks.json` and `TASKS.md` for autonomous implementation.
Keep task descriptions aligned with the real stack and current completion state.

## code-implementation

Use for scoped changes to engine, scripts, schemas, tests, or campaign templates. Success means
tests and relevant gates pass or limitations are documented.

## documentation

Use when operational instructions, skill references, or generated reports drift from current
code. Documentation is part of the deliverable when it changes agent behavior.

## debugging

Use when a script, gate, build, or campaign render fails. Start from reproducible commands and
add regression tests when the failure is in reusable code.

