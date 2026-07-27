# Agent Workflows

## Standard Development Workflow

### Phase 1: Understand

- Read the user request and identify whether the target is engine, scripts, docs, campaigns, or brand packs.
- Read `AGENTS.md`, `context.md`, and `memory.md` before material changes.
- Inspect existing code and docs before planning.

### Phase 2: Plan

- Keep the plan short and scoped.
- Identify files to modify and tests to run.
- Flag any action that would touch real campaign exports or archived pipeline files.

### Phase 3: Implement

- Use existing project patterns.
- Do not add dependencies unless explicitly approved.
- Do not edit generated exports by hand.
- Keep documentation changes synchronized with code changes.

### Phase 4: Verify

- Run the narrowest relevant checks first.
- Run `npm test` for engine logic or test-suite changes.
- Run `node scripts/check-engine-integrity.ts` when `engine/` is touched.
- Run `npm run production-gate -- --campaign {campaign}` before production closure.

### Phase 5: Summarize

- Report changed files, verification commands, and residual risks.
- If tests could not run because dependencies were pruned, state that plainly.

## Hermes Campaign Workflow

Campaign work follows agents 00-09:

```text
Briefing -> Brand Analysis -> Architecture -> Design -> Copy -> Data -> Build -> QA -> Export
```

Each transition must keep the four control files synchronized. A phase is not complete because an
agent says so; it is complete only when its required files exist and validate.

## Hand-Off Rules

- Handoffs name the next owner and required files to read.
- Agents do not cross specialist boundaries.
- The Orchestrator inspects and redirects; it does not silently fix specialist output.

## Special Workflows

### Engine Change

1. Run `node scripts/check-engine-integrity.ts`.
2. Make the minimal engine change.
3. Add or update tests.
4. Run `npm test`.
5. Update `engine/CHANGELOG.md` and regenerate lock only for intentional engine changes.

### Documentation Synchronization

1. Update operational docs (`AGENTS.md`, `context.md`, `memory.md`) first.
2. Update derived docs or skill references that Hermes reads during execution.
3. Avoid editing historical audits except to add explicit "historical" notes when needed.

