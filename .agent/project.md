# Project Architecture & Standards

## Tech Stack

- Language: Node.js 18+ / TypeScript for scripts; CommonJS JavaScript inside `engine/`.
- Package manager: npm.
- Rendering: deterministic custom HTML email engine in `engine/build-newsletter.js`.
- Validation: `ajv` for `campaign-data.json`, engine self-verification, and production gate scripts.
- Email CSS: `juice` for inline CSS.
- Visual tooling: `playwright` for previews, `sharp` for image processing.
- Testing: `node --test` via `npm test`; no Vitest/Jest dependency.

## Project Structure

```text
agents/                         Hermes phase contracts, 00-09
brands/                         root brand packs
engine/                         deterministic HTML email motor
engine/components/              locked component library
engine/lib/                     token, pattern, assemble, verify logic
engine/schema/                  campaign-data schema and example
newsletters/_campaign-template/ reusable campaign scaffold
newsletters/{year}/{client}/    campaigns
patterns/                       newsletter genre grammars
pipeline-skill/                 Hermes pipeline skill reference
scripts/                        CLI checks, gates, image helpers, campaign scaffold
docs/                           audits, roadmaps, operational references
.agent/                         agent-neutral collaboration framework
```

## Key Architectural Principles

- `campaign-data.json` is the source of truth for renderable campaign content.
- The motor writes no partial outputs: build, inline, and verify complete in memory before disk writes.
- `production-gate` is an alias of `production-gate-motor`, the real close gate.
- Archived React Email artifacts in `_archive/` are historical references only.
- New patterns and components are added only when a real campaign needs them.

## Commands

```bash
npm install
npm test
npm run create-campaign -- --year 2026 --client example --campaign 2026-jul-example
npm run build-newsletter -- --data newsletters/2026/example/2026-jul-example/06-data/campaign-data.json --out newsletters/2026/example/2026-jul-example/09-exports/
npm run check-engine
npm run production-gate -- --campaign newsletters/2026/example/2026-jul-example
```

## Important Conventions

- Campaign path: `newsletters/{year}/{client}/{campaign}/`.
- Campaign data path: `06-data/campaign-data.json`.
- Control files: `campaign-status.md`, `task-log.md`, `handoff.md`, `next-steps.md`.
- Do not write `[PENDIENTE]` in JSON fields; use empty strings only where schema permits.
- Keep brand packs at version `>= 2.2.0`.

## Testing Expectations

- Run `npm test` before closing engine logic changes.
- Run `node scripts/check-engine-integrity.ts` before and after touching `engine/`.
- Run campaign-specific gates before marking any campaign `completed`.
- If `node_modules` has been pruned from a deliverable, run `npm install` before test execution.

