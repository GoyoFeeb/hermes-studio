# Claude Code: Project Instructions

## Primary Source Of Truth

Read and follow `AGENTS.md` first. It is the Hermes operating agreement and the highest-level
contract for this repository.

## Also Follow

- `.agent/project.md` — architecture, stack, commands, and project structure.
- `.agent/workflows.md` — development workflow, campaign workflow, and handoffs.
- `.agent/skills.md` — approved skills and when to use them.
- `.agent/roles.md` — agent roles, responsibilities, and boundaries.
- `.agent/done-definition.md` — acceptance criteria for implementation work.
- `context.md` and `memory.md` — current project narrative and persistent operational memory.

## Conflict Resolution

1. `AGENTS.md` wins.
2. Then the closest local instruction file.
3. Then `.agent/*` shared framework files.
4. Then this Claude-specific adapter.

## Claude Code-Specific Notes

- Keep changes small, scoped, and verifiable.
- Do not revive the archived React Email pipeline.
- Do not edit `final.html` or `final-inline.html` by hand; rebuild through `engine/build-newsletter.js`.
- Before closing a production campaign, use `npm run production-gate -- --campaign {campaign}`.
- After dependency cleanup, run `npm install` before executing scripts that need `node_modules`.

