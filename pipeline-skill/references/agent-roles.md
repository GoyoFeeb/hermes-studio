# Agent Roles — Full Reference

## 00 — Orchestrator

| Aspect | Detail |
|---|---|
| Phase | Coordination (no own deliverables) |
| Role | Direct the pipeline, maintain control files, activate agents in order, verify phase outputs |
| Writes | `campaign-status.md`, `task-log.md`, `handoff.md`, `next-steps.md`, `blocked-reason.md` (if blocking), `approval-needed.md` (if asking) |
| Reads | Everything — all campaign files, all agent files |
| Block if | CTA missing, main link missing, legal texts missing, objective missing, no assets, contradiction, promo without conditions, URL broken, QA not approved |
| Key rule | Never do a specialist agent's work. If deliverable is wrong, send it back — don't fix it. |

## 01 — Briefing Strategist

| Aspect | Detail |
|---|---|
| State | `briefing` |
| Inputs | Raw user info: brief text, landing URLs, screenshots, links, legal docs, previous newsletters |
| Writes | `00-brief/brief.md`, `00-brief/requirements.md`, `00-brief/source-links.md`, `00-brief/open-questions.md` |
| Handoff to | 02 — Brand Visual Analyst |
| Block if | No client, no objective, no CTA, no main link, no legal restrictions (when applicable) |
| Key rule | Never invent information. Extract faithfully. Mark contradictions. |

## 02 — Brand Visual Analyst

| Aspect | Detail |
|---|---|
| State | `analysis` |
| Inputs | brief, requirements, visual assets, landing pages, brand guidelines |
| Writes | `02-analysis/brand-analysis.md`, `02-analysis/visual-analysis.md`, `02-analysis/risks.md` |
| Handoff to | 03 — Newsletter Architect |
| Block if | No visual inputs, client/mark not identifiable, irreconcilable visual contradictions |
| Key rule | Distinguish documented identity from observed identity from inference. Never invent colours, fonts, or styles. |

## 03 — Newsletter Architect

| Aspect | Detail |
|---|---|
| State | `strategy` |
| Inputs | Brief, visual analysis, brand analysis, risks |
| Writes | `03-strategy/campaign-angle.md`, `03-strategy/message-hierarchy.md`, `03-strategy/module-selection.md`, `03-strategy/structure.md` |
| Handoff to | 04 — Email Designer |
| Block if | No CTA, no campaign objective, fewer than 2 usable inputs from previous phase |
| Key rule | Compact structure (3-7 modules). CTA in first third. Each module has a function. No visual decisions. No copy. |

## 04 — Email Designer

| Aspect | Detail |
|---|---|
| State | `design` |
| Inputs | Strategy files, analysis files, brief files |
| Writes | `04-design/layout.md`, `04-design/desktop-spec.md`, `04-design/mobile-spec.md`, `04-design/assets-notes.md` |
| Handoff to | 05 — Copywriter |
| Block if | No visual analysis, no architecture, no colour palette, no button style, no container width |
| Key rule | Specifications in concrete values (hex, px). Outlook evaluated per module. Mobile evaluated per module. No code. |

## 05 — Copywriter

| Aspect | Detail |
|---|---|
| State | `copy` |
| Inputs | Design specs, strategy, brief, analysis |
| Writes | `05-copy/subject-lines.md`, `05-copy/preheaders.md`, `05-copy/body-copy.md`, `05-copy/cta-options.md` |
| Handoff to | 06 — Newsletter Data Specialist |
| Block if | No brief, no architecture, no design spec with text slots, no CTA |
| Key rule | Min 3 subject lines. Legal/prices/promos verbatim. No invented claims. Consistency: subject → preheader → headline → CTA. |

## 06 — Newsletter Data Specialist

| Aspect | Detail |
|---|---|
| State | `data` |
| Inputs | Body copy, CTAs, module structure, visual specs |
| Writes | `06-data/newsletter-data.json`, `06-data/newsletter-data.ts` |
| Handoff to | 07 — React Email Developer |
| Block if | No body copy, no visual specs, no module structure, JSON invalid, CTA href missing |
| Key rule | JSON is the single source of truth. Each module = one block in modules[]. Field names must match component props. |

## 07 — React Email Developer

> **[SUPERSEDED — F4, 2026-07-21]** Este contrato describe el pipeline React Email, archivado
> en F4 del plan de transformación (ver `_archive/f4-react-email-pipeline/README.md`). El rol
> vigente es `agents/07-html-email-developer.md` (F2): ya no escribe código React, ejecuta
> `engine/build-newsletter.js`. Esta tabla se conserva porque fue la base documentada de la que
> partió el contrato nuevo (ver "Cambio de fondo" en `agents/07-html-email-developer.md`), no
> por seguir vigente.

| Aspect | Detail |
|---|---|
| State | `development` |
| Inputs | newsletter-data.json, design specs, architecture |
| Writes | `07-code/react-email/` (components, newsletter.tsx, styles.ts) |
| Handoff to | 08 — Email QA Specialist |
| Block if | No newsletter-data.json, JSON invalid, TSX errors, missing critical images without fallback |
| Key rule | Consume JSON as sole data source. One component per module type. No hardcoded data. Inline styles only. |

## 08 — Email QA Specialist

| Aspect | Detail |
|---|---|
| State | `qa` / `corrections` |
| Inputs | HTML render, JSON, components, design specs, brief |
| Writes | `08-qa/visual-qa.md`, `08-qa/responsive-qa.md`, `08-qa/outlook-qa.md`, `08-qa/links-qa.md`, `08-qa/final-checklist.md`, `08-qa/return.md` (if returning) |
| Handoff to | 09 — Export Manager (if approved) or responsible agent (if corrections) |
| Block if | Critical error: legal texts wrong, prices wrong, CTA without href, image without src, JSON invalid, subject/preheader empty |
| Key rule | Evaluate, don't fix. Classify errors (critical/high/medium/low). Assign to correct agent. Only export if approved. |

## 09 — Export Manager

| Aspect | Detail |
|---|---|
| State | `export` → `completed` |
| Inputs | HTML render, JSON, assets, QA final-checklist |
| Writes | `09-exports/final.html`, `09-exports/final-inline.html` (optional), `09-exports/final-preview.png`, `09-exports/assets/` (optional), `09-exports/delivery-notes.md` |
| Handoff to | None — end of pipeline. Marks campaign as `completed`. |
| Block if | QA not approved, render fails, critical images inaccessible, unsubscribe/preferences links missing |
| Key rule | Only export if QA approved. No content changes. Verify all links and images. Document everything in delivery-notes. |
