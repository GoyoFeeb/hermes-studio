# Controlled Campaign Pattern — BMW Serie 1 (2026-jul-bmw-serie-1-oferta-controlada)

## Session reference

Full end-to-end campaign executed 2026-07-05. 10 pipeline actions from creation to export. Used the kickoff template (`docs/first-real-campaign-kickoff-template.md`) and the operational checklist (`docs/first-real-campaign-checklist.md`).

## Quick stats

| Metric | Value |
|---|---|
| Pipeline actions | 10 (00→09) |
| Days | 1 |
| Claims prohibidos | 20 |
| Claims permitidos | 11 |
| Blockers identified | 12 |
| Components modified | 0 |
| HTML final | 18.8 KB |
| Production gate | ❌ 2/3 (expected) |

## Claim pre-embedding pattern

Claims were defined BEFORE any agent ran — at the briefing/architecture phase, not discovered during copy review:

```
00 (creation)  → define prohibidos + permitidos in 00-brief/requirements.md
01 (briefing)  → validate brief against claim list
02 (visual)    → no visual claims
03 (arch)      → claims-guardrails.md with both lists
04 (design)    → no claim injection
05 (copy)      → write only against permitidos list; check prohibidos
06 (data)      → validate-claims script confirms 0 violations
07 (react)     → no copy changes
08 (qa)        → claim-safety-review.md confirms 0 violations
09 (export)    → production-gate confirms claims clean
```

## Task-log preservation

During DemoSolar (predecessor campaign), task-log.md was overwritten twice losing 4 accumulated entries. **BMW controlled campaign preserved all 10 entries** by using the read → append → write pattern on every phase transition.

Safe pattern:
```
1. read_file(task-log.md)        → extract existing entries
2. construct new entry           → with agent, action, date, files, validations
3. write_file(task-log.md)       → full accumulated content
```

## Campaign-status 6-section pattern

Never drop a section when advancing phases. Always include:

1. Campaign metadata table
2. Current Phase table
3. Completed Phases checklist (keep ALL previous checkmarks)
4. Open Issues bullet list (preserve between phases, only remove resolved)
5. Production Gate Status table (with `⏳` for not-yet-run gates)
6. Next Step

## Production gate results (BMW controlled)

| Gate | Result | Detail |
|---|---|---|
| validate-newsletter --production | ❌ | 5 errors (isTestCampaign, productionReady, fromEmail, 2 placeholders) |
| check-links --strict | ❌ | 4 errors (fromEmail + 3 placeholders) |
| validate-claims --production | ✅ | 0 claims, 29 rules |
| **Global** | **❌** | 2/3 gates fail — expected for test campaign |

## Blockers (12)

| Sev | Count | Examples |
|---|---|---|
| 🔴 Critical | 9 | isTestCampaign, productionReady, fromEmail, 3 CRM placeholders, logo, legal validation, commercial approval |
| 🟠 High | 2 | hero image, brand guide |
| 🟡 Medium | 1 | icons/decision pending |

## Key commands summary

```bash
# Create
npm run create-campaign -- --year 2026 --client bmw --client-name "BMW España" --campaign 2026-jul-bmw-serie-1-oferta-controlada --date 2026-07-05 --cta "Solicitar una oferta" --url "..." --force

# Prepare
npm run prepare-react-email -- --campaign newsletters/2026/bmw/2026-jul-bmw-serie-1-oferta-controlada

# Validate (phase 06+)
npm run validate-newsletter -- --campaign ... 
npm run validate-claims -- --campaign ...
npm run check-links -- --campaign ...

# Export (phase 09)
npm run export-html -- --campaign ... --inline --force
npm run preview-html -- --campaign ... --force --width 600 --height 2200

# Production gate (final validation)
npm run production-gate -- --campaign ...
```
