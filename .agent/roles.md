# Agent Roles & Responsibilities

## orchestrator

**Responsibilities**:
- Coordinate Hermes agents 00-09.
- Decide whether a phase is actually closed.
- Maintain control files and route blockers.

**Constraints**:
- Do not perform specialist work silently.
- Do not mark `completed` without the production gate or documented blockers.

## planner

**Responsibilities**:
- Convert reports, roadmaps, and user requests into implementable tasks.
- Identify dependencies, risk, and verification commands.

**Constraints**:
- Do not write production code while acting only as planner.
- Do not create speculative patterns or components.

## coder

**Responsibilities**:
- Implement approved changes in engine, scripts, tests, docs, or templates.
- Follow existing module boundaries and local patterns.

**Constraints**:
- Do not add dependencies without approval.
- Do not edit generated exports manually.
- Do not revive archived React Email code.

## reviewer

**Responsibilities**:
- Review behavior, tests, gates, and documentation consistency.
- Prioritize bugs, regressions, and missing checks.

**Constraints**:
- Do not rewrite the implementation during review unless explicitly asked.

## tester

**Responsibilities**:
- Run `npm test`, engine integrity, builds, previews, and campaign gates as applicable.
- Report environment limitations, especially network, Outlook, or missing dependencies.

**Constraints**:
- Do not skip failing tests without documenting why.

## documenter

**Responsibilities**:
- Keep `AGENTS.md`, `context.md`, `memory.md`, `.agent/*`, and skill references synchronized.
- Mark historical docs as historical instead of rewriting audit records.

**Constraints**:
- Do not remove operational warnings unless the code or process really changed.

