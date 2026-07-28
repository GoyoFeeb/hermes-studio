# Phase Gates — Exit Criteria Checklist

## Phase 01 — Briefing (agent: 01-Briefing Strategist)

| Condition | Type | Detail |
|---|---|---|
| `00-brief/brief.md` exists | Mandatory | Must contain client, objective, CTA, main link |
| `00-brief/requirements.md` exists | Mandatory | Legal, commercial, technical requirements |
| `00-brief/source-links.md` exists | Mandatory | All reference URLs with verification status |
| Client identified | Mandatory | If missing → blocked |
| Campaign objective defined | Mandatory | If missing → blocked |
| CTA principal defined | Mandatory | If missing → blocked |
| Main link provided | Mandatory | If missing → blocked |
| Legal/commercial restrictions documented | Mandatory | If applicable and missing → blocked |
| Non-critical gaps resolved | Optional | If missing → open-questions.md |

## Phase 02 — Brand/Visual Analysis (agent: 02-Brand Visual Analyst)

| Condition | Type | Detail |
|---|---|---|
| `02-analysis/brand-analysis.md` exists | Mandatory | Brand identity overview |
| `02-analysis/visual-analysis.md` exists | Mandatory | Colours, typography, buttons, composition |
| `02-analysis/risks.md` exists | Mandatory | Email adaptation risks documented |
| Colour palette documented | Mandatory | If missing → blocked |
| Button style documented or observed | Mandatory | If missing → blocked |
| Visual tone described | Mandatory | |
| Image style noted | Mandatory | |
| Email adaptation limitations assessed | Mandatory | |
| Every claim has a source | Mandatory | Documented, observed, inferred, or unknown |
| Contradictions flagged | Mandatory | |

## Phase 03 — Newsletter Architecture (agent: 03-Newsletter Architect)

| Condition | Type | Detail |
|---|---|---|
| `03-strategy/campaign-angle.md` exists | Mandatory | Campaign angle defined |
| `03-strategy/message-hierarchy.md` exists | Mandatory | Messages ordered by priority (1-4) |
| `03-strategy/module-selection.md` exists | Mandatory | Each module justified |
| `03-strategy/structure.md` exists | Mandatory | Structure diagram, sequence table, responsive behaviour |
| Module count in range (3-7) | Recommended | If exceeded, must be justified |
| CTA principal in first third | Mandatory | |
| Each module has a clear function | Mandatory | |
| Desktop/mobile behaviour evaluated | Mandatory | |
| No visual decisions (colours, typography, sizes) | Mandatory | |
| No copy written | Mandatory | |
| No sensitive data modified | Mandatory | |
| Structural risks documented | Mandatory | |

## Phase 04 — Email Design (agent: 04-Email Designer)

| Condition | Type | Detail |
|---|---|---|
| `04-design/layout.md` exists | Mandatory | Global parameters, palette, typography |
| `04-design/desktop-spec.md` exists | Mandatory | Per-module desktop specs |
| `04-design/mobile-spec.md` exists | Mandatory | Per-module mobile specs |
| `04-design/assets-notes.md` exists | Mandatory | Assets with sizes and specs |
| Container width defined | Mandatory | If missing → blocked |
| Paddings defined per module | Mandatory | |
| Responsive behaviour defined per module | Mandatory | |
| Image sizes defined per module | Mandatory | |
| Reusable modules identified | Mandatory | |
| Outlook limitations evaluated per module | Mandatory | |
| Visual analysis respected | Mandatory | |
| Architecture respected | Mandatory | |
| No code written | Mandatory | |

## Phase 05 — Copy (agent: 05-Copywriter)

| Condition | Type | Detail |
|---|---|---|
| `05-copy/subject-lines.md` exists | Mandatory | Min 3 options |
| `05-copy/preheaders.md` exists | Mandatory | For each subject line |
| `05-copy/body-copy.md` exists | Mandatory | Complete per-module copy |
| `05-copy/cta-options.md` exists | Mandatory | Options for each CTA |
| Legal texts copied verbatim | Mandatory | If missing → blocked |
| Prices/promos copied verbatim | Mandatory | If missing → blocked |
| Consistency: subject → preheader → headline → CTA | Mandatory | |
| No invented claims or benefits | Mandatory | |
| Character limits respected | Mandatory | Or documented as risk |
| All CTAs have associated links | Mandatory | |
| All images have alt text | Mandatory | |

## Phase 06 — Structured Data (agent: 06-Newsletter Data Specialist)

> **[SUPERSEDED — F1/F2, 2026-07-21; banner añadido 2026-07-28]** Este gate describe el formato
> de datos del pipeline React Email archivado. El gate vigente valida
> `06-data/campaign-data.json` contra `engine/schema/campaign-data.schema.json` (ajv) — ver
> `agents/06-data-specialist.md`. `newsletter-data.json`/`.ts` no se usan en el motor actual.

| Condition | Type | Detail |
|---|---|---|
| `06-data/newsletter-data.json` exists | Mandatory (histórico) | Vigente: `06-data/campaign-data.json` |
| `06-data/newsletter-data.ts` exists | Mandatory (histórico) | El motor actual no usa `.ts` de datos |
| JSON is syntactically valid | Mandatory | If invalid → blocked |
| All architecture modules present | Mandatory | |
| Module order matches structure | Mandatory | |
| Every CTA has non-empty href | Mandatory | |
| Every image has src and alt | Mandatory | |
| Legal texts copied verbatim | Mandatory | |
| No null fields without justification | Mandatory | |
| Field names match component props | Recommended | |
| Types match JSON structure | Recommended | |

## Phase 07 — React Email Development (agent: 07-React Email Developer)

> **[SUPERSEDED — F4, 2026-07-21]** Pipeline archivado, ver
> `_archive/f4-react-email-pipeline/README.md`. Gate vigente: `agents/07-html-email-developer.md`
> (ejecuta `engine/build-newsletter.js`) — criterios de bloqueo en ese archivo, no aquí.

| Condition | Type | Detail |
|---|---|---|
| `07-code/react-email/newsletter.tsx` exists | Mandatory | Entry component |
| All module types have a component | Mandatory | |
| `tsc --noEmit` passes | Mandatory | If fails → blocked |
| No hardcoded content (texts, colours, links) | Mandatory | |
| No broken imports | Mandatory | |
| Images have width and height | Mandatory | |
| CTAs have href | Mandatory | |
| Styles are inline-compatible | Mandatory | |
| Layout uses Section/Row/Column | Mandatory | |
| Missing component modules show fallback | Recommended | |

## Phase 08 — QA (agent: 08-Email QA Specialist)

| Condition | Type | Detail |
|---|---|---|
| `08-qa/visual-qa.md` exists | Mandatory | Desktop visual review |
| `08-qa/responsive-qa.md` exists | Mandatory | Mobile review |
| `08-qa/outlook-qa.md` exists | Mandatory | Outlook compatibility |
| `08-qa/links-qa.md` exists | Mandatory | Links, CTAs, images |
| `08-qa/final-checklist.md` exists | Mandatory | 40-item checklist |
| No critical errors | Mandatory | If found → blocked |
| Decision documented | Mandatory | Approved / Returned / Blocked |
| Return.md generated if returning | Mandatory | For corrections flow |

### QA Severity definitions

| Level | Meaning | Action |
|---|---|---|
| **Critical** | Newsletter cannot be sent. Functional or legal error. | Block campaign. |
| **High** | Severe impact on experience or message. | Return to responsible agent. |
| **Medium** | Notable but non-blocking. Affects visual quality. | Register and suggest fix. |
| **Low** | Minor. Improvable but not urgent. | Register as enhancement. |

### Critical error examples

- Legal text incorrect, incomplete, or altered
- Price wrong
- Promotion discount wrong
- Main CTA has no href
- Critical image has no src
- JSON invalid or unrenderable
- Subject or preheader empty
- Unsubscribe/preferences links broken
- Newsletter has no main CTA

## Phase 09 — Export (agent: 09-Export Manager)

> **[Nota añadida 2026-07-28]** `final.html`/`final-inline.html` los genera siempre
> `engine/build-newsletter.js` (nunca a mano). `final-preview.png` no lo produce el motor —
> las capturas responsive (320/375/600/600-dark) las genera QA (agente 08) por separado, ver
> `docs/qa-process.md`. Ver `agents/09-export-manager.md` para el contrato vigente completo.

| Condition | Type | Detail |
|---|---|---|
| QA approved (handoff with ✅) | Mandatory | If not → blocked |
| `09-exports/final.html` exists | Mandatory | Generado por `engine/build-newsletter.js`, nunca a mano |
| `09-exports/final-inline.html` exists | Mandatory | El motor lo genera siempre en la misma ejecución |
| `09-exports/final-preview.png` exists | Opcional | No lo produce el motor — ver capturas QA (agente 08) |
| `09-exports/delivery-notes.md` exists | Mandatory | |
| No empty hrefs in final HTML | Mandatory | |
| All image URLs accessible | Mandatory | |
| Campaign marked completed | Mandatory | In campaign-status.md |
| Known limitations documented | Mandatory | In delivery-notes.md |

## Cross-phase blockers (any phase → blocked)

| Condition | Source |
|---|---|
| No CTA principal | brief |
| No main link | brief |
| Missing mandatory legal texts | brief / requirements |
| No campaign objective | brief |
| No minimum assets | inputs / analysis |
| Brief/requirements contradiction | any |
| Promotion without clear conditions | brief |
| Non-functional URL | any |
| Structure approval missing when required | strategy |
| QA not approved before export | qa → export gate |
