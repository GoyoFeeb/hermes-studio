# Dual-Validation Audit Pattern

> **[PARCIALMENTE SUPERSEDED — banner añadido 2026-07-28]** La metodología (campaña ficticia →
> campaña con datos reales → comparar → mejorar) sigue siendo un patrón válido de validación,
> aplicable también al motor actual. Los ejemplos/comandos concretos citados son del pipeline
> React Email archivado — para el motor vigente, el equivalente es correr
> `production-gate-motor.ts` contra una campaña de prueba y una campaña real y comparar.

## Why

Running two complete 00→09 pipeline cycles — one with placeholder/fictitious data and one with real (public or client-provided) data — before committing to a production campaign uncovers mechanical issues, missing automation, and wrong assumptions.  Comparing the two runs in a structured audit document turns the lessons into reusable knowledge.

## Pattern steps

### Phase 1 — Fictitious test (sanity check)

Create a throwaway campaign with clearly fictitious data (no real client, no real URLs, no real assets).  Mark it `isTestCampaign: true` throughout.

1. Run the full 00→09 pipeline.
2. Note every manual correction the agent had to make (claim rewording, component patching, script debugging).
3. Document blockers that would have blocked even a real campaign (missing fromEmail, placeholder footer links, no logo asset).
4. Fix any script or component bugs found during the run immediately.
5. Close the campaign as `completed — prueba interna`.

**Deliverable:** A running list of improvements (#1, #2, …).

### Phase 2 — Real-data test (integration)

Create a second campaign with data sourced from a genuine client (their public website, published brochures, real URLs).  Still mark it `isTestCampaign: true` since the client has not formally approved the campaign.

1. Re-run the full pipeline.
2. Apply the improvements identified in Phase 1.
3. Note NEW issues that only appear with real data (financial disclaimers, technical claims needing rewording, CRM placeholder detection gaps).
4. Create `scripts/` or `--flag` enhancements for any pattern that repeated manually (e.g. `validate-claims` script, `check-links --strict`).
5. Close as `completed — prueba interna`.

### Phase 3 — Audit (compare & improve)

Create a formal audit document comparing the two runs:

| Dimension | Fictitious (OCU) | Real-data (BMW) | Delta |
|---|---|---|---|
| Blockers found | N | M | Which ones differed? |
| Script improvements | List | List | What was automated after? |
| Claim corrections | List | List | What rules were added to validate-claims? |
| Component changes | List | List | What was learned about the template? |

**Deliverable:** `docs/pipeline-audit-<clientA>-vs-<clientB>.md`

The audit should end with:
- A ranked list of remaining improvements (priority, impact, status)
- A 16+ item production-readiness checklist
- A conclusion on whether the pipeline is validated for test vs. production use

## Concrete examples

| Dimension | OCU (Phase 1) | BMW (Phase 2) |
|---|---|---|
| Client type | Fictitious (OCU — consumer org) | Real public data (BMW España — automotive) |
| Initial state | Blocked at agent 01 (no inputs) | Fluids from start (full brief provided) |
| Component changes | 1 (HeaderBlock) | 0 |
| Claim corrections needed | 2 ("gratuita", "puedes ahorrar") | 0 (15 rules respected proactively) |
| Scripts created after | export-html, preview-html | validate-claims, check-links --strict, validate-newsletter --production |
| Blockers at close | 10 | 11 (more categories: financial validation, client approval, brand guide) |
| Audit output | — | `docs/pipeline-audit-bmw-vs-ocu.md` |

## When to use this pattern

- Before the first real production campaign for a new client.
- After any major pipeline change (new agent, new script, new component library).
- Quarterly as a health check.

## When NOT to use

- For a straightforward template-based campaign that matches an already-audited client profile.
- When the pipeline has been stable and audit docs already exist from a similar client vertical.
