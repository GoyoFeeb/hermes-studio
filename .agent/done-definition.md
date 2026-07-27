# Definition Of Done

A task is done only when all applicable criteria are true.

## Code Quality

- Code follows existing patterns and module boundaries.
- No new dependency is introduced without explicit approval.
- Generated exports are produced by the motor, not edited manually.
- Error messages are actionable and do not hide uncertainty.

## Testing

- `npm test` passes for engine/test-suite changes.
- `node scripts/check-engine-integrity.ts` passes for engine-adjacent changes.
- Campaign builds use `engine/build-newsletter.js`.
- Production closure uses `npm run production-gate -- --campaign {campaign}`.

## Documentation

- Operational docs reflect changed commands, gates, data formats, or workflows.
- `AGENTS.md`, `context.md`, and `memory.md` are synchronized after material changes.
- Historical docs remain identifiable as historical.

## Campaign Integrity

- The four control files are synchronized.
- `campaign-data.json` validates against schema.
- No campaign is production-ready while placeholders, unapproved claims, or unresolved blockers remain.

## Agent Integrity

- The agent states assumptions and verification limits.
- The agent does not cross specialist boundaries without explicit instruction.
- The final summary names changed files, commands run, and residual risk.

