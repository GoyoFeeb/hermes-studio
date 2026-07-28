---
name: newsletter-pipeline
description: >-
  Multi-agent newsletter production pipeline. Orchestrator-driven system with
  specialized agents for briefing, brand analysis, architecture, design, copy,
  structured data, React Email development, QA, and export. Strict phase order,
  handoff protocol, and campaign status tracking.
category: creative
---

> **[PARCIALMENTE SUPERSEDED — F4, 2026-07-21; corregido 2026-07-28]** Este documento describe el
> pipeline original (agentes 00-09 sobre React Email). Los contratos de agente reales y vigentes
> están SIEMPRE en `agents/*.md` (F2, ver `docs/f2-agentes-cerrado.md`) — ante cualquier
> contradicción entre este archivo y `agents/*.md`, `agents/*.md` gana. 00-05 siguen el diseño de
> aquí casi sin cambios. **06 SÍ cambió de fondo, no solo 07**: produce
> `06-data/campaign-data.json` (schema `engine/schema/campaign-data.schema.json`), no
> `newsletter-data.json`/`.ts` — ver `agents/06-data-specialist.md`, que lo prohíbe explícitamente.
> **07 ya no genera código React** — ejecuta el motor (`engine/build-newsletter.js`, F1,
> `docs/f1-motor-cerrado.md`), y 08/09 tienen añadidos (render obligatorio, verificación de
> assets). El pipeline React Email en sí (plantilla, `export-html.tsx`, `prepare-react-email.ts`)
> se archivó en F4 — `_archive/f4-react-email-pipeline/README.md`. Las secciones de este archivo
> sobre estrategia, briefing, análisis de marca, arquitectura y copy (00-05) siguen siendo una
> referencia válida; las secciones sobre formato de datos (06), React Email (07), y el
> "Production gate (3-script validation)" de más abajo son **históricas y NO deben seguirse** —
> el cierre real vigente es `npm run production-gate` = alias de `production-gate-motor` (13
> gates), ver `pipeline-skill/references/script-usage.md` (al día) en vez de
> `references/production-gate.md` (histórico).

# Newsletter Pipeline

## Trigger

Use this skill when:

- The user asks you to build or set up a multi-agent newsletter production system.
- You need to create a structured campaign workflow from brief to export.
- You are asked to define agent roles, phase gates, handoffs, or deliverables for a newsletter pipeline.
- The user references a `00-orchestrator.md` system pattern and wants to extend or replicate it.

## Architecture

The system has **10 agents** (00–09), each with a single responsibility. Agents never cross boundaries — the orchestrator enforces phase order, handoffs carry context between phases, and each phase must produce its deliverables before the next starts.

### Agent roles

| ID | Agent | Responsibility | Writes to |
|---|---|---|---|
| 00 | Orchestrator | Direct the pipeline, maintain control files | campaign-status.md, handoff.md, task-log.md |
| 01 | Briefing Strategist | Structure raw inputs into a clear brief | 00-brief/ |
| 02 | Brand Visual Analyst | Analyze brand identity, colors, typography, email adaptation | 02-analysis/ |
| 03 | Newsletter Architect | Define modular structure, message hierarchy, CTA placement | 03-strategy/ |
| 04 | Email Designer | Convert architecture into visual/technical email specs | 04-design/ |
| 05 | Copywriter | Write subject lines, preheaders, body copy, CTAs | 05-copy/ |
| 06 | Newsletter Data Specialist | ⚠️ Produce **`06-data/campaign-data.json`** (NOT `newsletter-data.json`/`.ts` — that format is dead, see `agents/06-data-specialist.md`) | 06-data/ |
| 07 | HTML Email Developer ⚠️ (NOT "React Email Developer" — see `agents/07-html-email-developer.md`) | Execute `engine/build-newsletter.js` — never writes React/HTML by hand | 09-exports/ (via the engine) |
| 08 | Email QA Specialist | Review visual, responsive, links, Outlook, accessibility | 08-qa/ |
| 09 | Export Manager | Prepare final HTML, inlined HTML, preview, assets | 09-exports/ |

### Phase order (never skip)

```
Briefing (01)
  → Brand/Visual Analysis (02)
  → Newsletter Architecture (03)
  → Email Design (04)
  → Copy (05)
  → Structured Data (06)
  → React Email Development (07)
  → QA (08)
  → Export (09)
```

Each phase has strict **exit criteria**. The orchestrator verifies deliverables exist before advancing. If deliverables are missing or fail quality gates, work is sent back to the responsible agent.

## Campaign directory structure

⚠️ **Este diagrama es histórico (pipeline React Email).** El vigente: `06-data/campaign-data.json`
(no `newsletter-data.json`/`.ts`), `07-code/` recibe el output del motor (`09-exports/` vía
`engine/build-newsletter.js`, no `react-email/`), y `09-exports/` no genera `final-preview.png`/
`export-summary.md`/`production-blockers.md` como parte del motor — ver `newsletters/_campaign-template/`
para la estructura real actual.

```
campaign-name/
  00-brief/          — brief.md, requirements.md, source-links.md
  01-inputs/         — raw materials, assets, screenshots
  02-analysis/       — brand-analysis.md, visual-analysis.md, risks.md
  03-strategy/       — campaign-angle.md, message-hierarchy.md, module-selection.md, structure.md
  04-design/         — layout.md, desktop-spec.md, mobile-spec.md, assets-notes.md
  05-copy/           — subject-lines.md, preheaders.md, body-copy.md, cta-options.md
  06-data/           — newsletter-data.json, newsletter-data.ts   [HISTÓRICO — hoy: campaign-data.json]
  07-code/           — react-email/                                [HISTÓRICO — hoy: no aplica, el motor escribe directo a 09-exports/]
  08-qa/             — visual-qa.md, responsive-qa.md, outlook-qa.md, links-qa.md, final-checklist.md
  09-exports/        — final.html, final-inline.html, final-preview.png, assets/, delivery-notes.md, export-summary.md, production-blockers.md
  README.md
  campaign-status.md
  handoff.md
  task-log.md
```

## Control files

### campaign-status.md

Tracks campaign state. States: `created → briefing → analysis → strategy → design → copy → data → development → qa → corrections → export → completed | blocked`.

```md
# Campaign Status
## Campaign
Cliente:
Campaña:
Fecha:
Estado actual:

## Current Phase
Fase:
Agente activo:
Objetivo:

## Completed Phases
- [ ] Briefing
- [ ] Brand / Visual Analysis
- [ ] Newsletter Architecture
- ...

## Open Issues
## Next Step
```

### handoff.md

Written by the completing agent, consumed by the orchestrator to activate the next agent. Sections: From, To, Context, Files to Read, Required Action, Constraints, Risks, Expected Output.

### task-log.md

Records key decisions per date: Action, Agent responsible, Files affected, Result, Pending.

## Key principles

- **Order by phase**: never skip a phase. Each builds on the last.
- **Separation of responsibilities**: agents do not cross boundaries. Copywriter does not write code. Developer does not redesign. QA does not re-implement.
- **Trazabilidad (traceability)**: every phase leaves written files. A phase is not complete without its deliverables.
- **Never delete existing data ("no borres nada")**: when creating or modifying campaigns, archives, or directories, never delete or overwrite existing files unless the user explicitly and unambiguously authorises it with `--force` or equivalent opt-in. When in doubt, create an `_archive` directory and move files there instead of deleting.
- **Email compatibility first**: Outlook, Gmail, mobile, web-safe fallbacks, VML for button shapes, no JS, inline CSS, explicit image dimensions, alt text on every image.
- **Sensitive data stewardship**: prices, legal terms, promotions, dates — copy verbatim, never modify without explicit instruction.
- **Fresh start per campaign**: each campaign is self-contained in its own directory. No shared state between campaigns.

## Campaign execution pattern (agent runtime)

When an agent is activated by the orchestrator:

1. **Read the handoff** — the `handoff.md` file contains Context, Files to Read, Required Action, Constraints, Risks, and Expected Output. Start here.
2. **Read all referenced files** — brief, previous-phase analysis, strategy, etc. Build context before producing anything.
3. **Write deliverables** — produce the files listed in Expected Output for this phase. Follow the formats defined in the agent's own SKILL.md.
4. **Write the next handoff** — prepare `handoff.md` for the NEXT agent with the same structure (From, To, Context, Files to Read, Required Action, Constraints, Risks, Expected Output).
5. **Sync all 4 control files** — when advancing a phase, update ALL four simultaneously:
   - `campaign-status.md` — new state, current phase, completed phases, open issues, next step
   - `task-log.md` — new entry with action, agent, files affected, result, pending
   - `handoff.md` — overwrite with the handoff for the next agent
   - `next-steps.md` — phase, dependencies, next concrete actions

   A common mistake is updating only `campaign-status.md` and forgetting the other three. The four files must stay consistent at every state transition.

6. **Report to orchestrator** — the Orchestrator output section at the end of each agent's SKILL.md describes the summary format.

## Blocking and unblocking flow

When essential information is missing, the campaign is set to `blocked`:

1. The active agent documents WHAT is missing in `00-brief/open-questions.md` using the structured `[Q-NNN]` format:
   ```
   ### [Q-001] — Título de la pregunta
   **Pregunta:** [texto claro y accionable]
   **Contexto:** [por qué es necesaria esta información]
   **Impacto:** [Alto / Medio / Bajo]
   **Destinatario:** [Usuario / Cliente / Agente posterior]
   ```
2. `campaign-status.md` is updated to `blocked` with all open issues listed.
3. `task-log.md` records the blocking event.
4. `handoff.md` is paused — set To to (Pausado — pendiente de inputs del usuario).
5. `next-steps.md` lists exactly what information is needed to unblock.

When inputs arrive:
1. The agent processes them, updates the phase deliverables.
2. `open-questions.md` marks each question as Resuelta (or keeps open if still unanswered).
3. If critical gaps remain -> stay blocked. If resolved -> advance to next phase.
4. Sync all 4 control files on the transition.

The critical blockers that always block:
- Campaign objective
- CTA principal (text)
- Main URL (href)
- Offer/promotion/message
- Legal texts or explicit "no aplica" confirmation

## Handling real-client data from public/official sources (agent 01 and 02 pattern)

When a campaign has real client data (product specs, prices, technical claims, URLs) sourced from public channels — the client's own website, published brochures, press releases — but no **internal client approval** for use in the newsletter:

### Source-link phrasing precision

Never use "verificada" or "confirmed" for URLs or data that come from a public/official source but lack explicit client sign-off. Prefer:

| Phrase to avoid | Phrase to use | When |
|---|---|---|
| "✅ Verificada (web oficial)" | "✅ Referencia oficial localizada. Pendiente de aprobación cliente." | URL is real but client hasn't approved its use in the campaign |
| "Verificada" | "Localizada en fuente pública. Pendiente de validación interna." | General data from public sources |
| "Confirmed" | "Referenced from public source. Pending internal client validation." | English equivalent |

### Technical claims from public sources

A manufacturer's public website may list technical specs (engine power, drivetrain type, fuel consumption, dimensions, materials). **Do not copy these claims into the newsletter** without explicit client approval, even if they appear authoritative. The reasons:

- The model variant or region may differ from what the campaign targets.
- The client may have a different marketing angle that should take precedence.
- Outdated or superseded specs may cause rework or legal exposure.
- The client's legal/comms team must approve every claim in the final newsletter.

**Safe approach:** Describe benefits at the experiential level, not the technical level. Compare:

| Unsafe (technical) | Safe (experiential) |
|---|---|
| "Motorizaciones eficientes con tracción trasera o integral" | "Conducción dinámica — Experiencia de conducción con comportamiento ágil y enfoque deportivo, pendiente de validación técnica final por cliente." |
| "156 CV con consumo mixto de 5.2L/100km" | "Rendimiento eficiente — Pendiente de confirmación de especificaciones con el cliente." |
| "Pantalla curva de 10.25 pulgadas con iDrive 8" | "Tecnología a bordo — Sistemas de asistencia y conectividad, pendiente de detalle técnico por cliente." |

### Rapid processing when brief is complete (agent 01)

When the user provides a full brief (objective, CTA, URL, asunto, preheader, audience, tone, legal references, modules), agent 01 can process it in one cycle and advance without blocking. In this case:

1. Confirm all critical fields are present (objective, CTA, URL, legal or "no aplica").
2. Fill `00-brief/brief.md` with the structured data.
3. Register open questions only for items confirmed missing (e.g., fromEmail, baja link).
4. Document production blockers clearly in `00-brief/open-questions.md` and `02-analysis/risks.md`.
5. Advance the campaign as "test internal" — do NOT set `productionReady: true` or `isTestCampaign: false` until blockers are resolved.
6. Sync all 4 control files (campaign-status, task-log, handoff, next-steps) for the advance.

### Example: BMW Serie 1 campaign

The BMW España campaign had:
- **Confirmed:** objective, CTA, URL (official BMW site), asunto, preheader, audience, tone, product name, financing figures from public site.
- **Pending production (recorded as open questions + risks):** fromEmail, baja/preferencias links, logo, hero image, financing validation, brand guide, commercial/legal approval.
- **Handled:** the campaign advanced to `analysis` for test internals. No blocked state. All production blockers recorded in separate files for future resolution.
- **Key lessons:** URL marked as "referencia oficial localizada, pendiente de aprobación cliente" not "verificada". Technical specs (drivetrain) replaced with experiential language. Architecture designed to work without any assets.

## Handling missing references (agent 02 pattern)

When Brand Visual Analysis has no real references (no landings, no captures, no brand guide, no assets):

1. **Document everything as unknown or inferred** — mark every element's source clearly.
2. **Provide conservative defaults** — neutral palette, web-safe fonts, standard button style. Never invent brand-specific values.
3. **Flag every value that needs validation** — include a future-validation section in visual-analysis.md.
4. **Create comprehensive risks.md** — document the absence of references as high severity, the risk of inventing identity as another, and fictitious/not-for-production as critical.
5. **Allow advancement** — the analysis is partial but non-blocking if the brief has enough information to proceed with inferred values. Future phases and production will need real references.

## Key principles (extended)

- **Mark fictitious/test campaigns clearly**: every deliverable for a test campaign must note it is not for production. The risks.md should include a critical-severity risk for this.
- **Sync all 4 control files on phase transitions**: campaign-status.md, task-log.md, handoff.md, and next-steps.md must be updated together. Updating only one creates inconsistency.

## Copy claim safety (agent 05)

When writing copy for any campaign, these rules prevent misleading claims:

- **"Gratuito" / "free"** must be confirmed in the brief. Never assume a tool, service, or offer is free unless the user explicitly stated it. Use neutral phrasing like "herramienta de ayuda" instead of "herramienta gratuita" when the cost is not documented.
- **"Puedes ahorrar X" / "you can save X"** implies a guaranteed outcome. Use "podrías ahorrar" / "you could save" (conditional) unless the brief provides specific, confirmed figures and a guarantee.
- **"Gran ahorro" / "big savings"** is vague and hyperbolic. Prefer specific, cautious phrasing: "detectar oportunidades de mejora" / "identify opportunities to improve."
- **Urgency ("ahora", "últimas unidades", "oferta limitada")** requires explicit brief confirmation. Never invent scarcity.
- **Exclusivity ("solo para ti", "edición limitada")** requires explicit brief confirmation.
- **Comparatives ("mejor", "más barato", "líder")** require documented evidence or explicit client approval.
- Every claim must trace back to the brief. If the brief doesn't say it, the copy shouldn't either. Register any desirable-but-unconfirmed angle as a risk in `body-copy.md` and as an open question — do not write it.
- **Do NOT mark copy as `Estado: Final` for test campaigns.** When the campaign has `isTestCampaign: true` or any unresolved production blockers (missing assets, unapproved URLs, pending legal validation), the copy state must read `Estado: Aprobado para prueba interna / pendiente validación cliente`. This applies to every module's status line in `body-copy.md`. The `Estado: Final` label implies client approval for production use, which is false as long as blockers remain. Reserve `Estado: Final` for campaigns where `isTestCampaign: false` AND `productionReady: true` AND no unresolved blockers exist.

When the user later corrects an over-claim (e.g. "cambia gratuita por de ayuda", "cambia puedes por podrías"), patch the copy files and log the correction in task-log.md so it feeds back into the pattern.

### Pre-embedding claim restrictions at architecture phase

Ideally, claim restrictions should be defined **before** copy is written — at the Architecture (03) or Design (04) phase — not discovered during copy review. The DemoSolar campaign demonstrated this pattern:

```md
# Documented in brief/requirements from the start:

Claims prohibidos (15):
  ahorro garantizado, instalación gratis, subvención garantizada,
  ... (list specific to the client/industry)

Claims seguros permitidos (7):
  estudio personalizado, energía solar para tu vivienda, ...
```

Benefits of pre-embedding:
- The Copywriter (agent 05) has immediate guardrails and doesn't waste time writing text that will be rejected.
- validate-claims (which runs at phase 06 and 09) never fires false positives on content that was never written.
- The architecture (agent 03) can reject modules that would require prohibited claims (e.g. pricing block when no prices are allowed).
- Handoffs from 03→04→05 carry the restriction list, so every agent downstream operates within the same boundary.

When to use: **every campaign**, but especially campaigns with regulatory constraints (finance, healthcare, energy, automotive) or campaigns where the client hasn't pre-approved marketing claims.

## QA decision levels (test vs production)

QA must distinguish TWO levels of approval, never just "approved":

| Level | Tag | Meaning |
|---|---|---|
| Approved for internal test | ✅ Prueba interna | Campaign is functional. All components render. CTAs work. Structure is valid. But placeholders, test flags, or missing assets block real sending. |
| Approved for production | ✅ Producción | All blockers resolved. No placeholders. Real URLs, real assets, real legal texts. productionReady=true. isTestCampaign=false. Ready to send to users. |

When QA approves only for test:
- `campaign-status.md` must say: `Tipo de cierre: prueba interna` / `Producción: bloqueada`
- `09-exports/production-blockers.md` must list every blocker with severity, file path, and action required
- `09-exports/export-summary.md` must document the "test only" scope
- The `return.md` file lists future actions for production but does NOT block advancement to export for test

Production blockers to always check:

| Severity | Examples |
|---|---|
| 🔴 Critical | URL ficticia, logo ausente, footer placeholder, fromEmail vacío, isTestCampaign=true, productionReady=false, datos ficticios |
| 🟠 High | Iconos ausentes, paleta inferida no validada, sin imágenes |
| 🟡 Medium | Benefits-grid sin apilado mobile, sin hero image, enlaces sin UTM |

If no critical blockers exist AND real assets are present, QA can approve for production.

## After-narrative state

When a test-run-through of the full pipeline (00→09) is complete but the output HTML was not rendered (because no `export-html` script existed at the time):

1. Document clear notes in the conversation narrative explaining what was done and what is pending.
2. The four control files (campaign-status.md, task-log.md, handoff.md, next-steps.md) must all reflect `completed` status for the test, and list the export-html script as a pending system improvement.
3. `09-exports/production-blockers.md` documents the concrete blockers for a production run.
4. `09-exports/export-summary.md` provides an overview of every phase's output with state labels.
5. The test campaign remains as a reference and should NOT be repurposed as a real campaign — create a new one when real inputs arrive.

- **Orchestrator doing the specialist's work**: the orchestrator should inspect and redirect, not edit JSON, TSX, or HTML directly. If a deliverable is wrong, send it back to the agent responsible.
- **Skipping phases under time pressure**: a newsletter without design or QA will fail on Outlook and look inconsistent. Hold the line.
- **Letting the developer redesign**: if the React Email developer changes layout, colors, or module order, send it back to the designer.
- **Missing handoff context**: the next agent needs to know what was decided and what files to read. A bare "do your job" handoff causes rework.
- **Orchestrator generating blocked-reason.md incorrectly**: block only when essential info is truly unavailable. For non-critical gaps, use open-questions and continue.
- **React Email React.FC components returning `<div>` or native `<h2>`/`<p>`**: email HTML needs Section/Heading/Text from `@react-email/components`. Native elements bypass React Email's table-to-<div> conversion helpers. Always use the library's components.
- **HeaderBlock silently returns null when no image**: if `HeaderBlock`'s props only accept `image` and `settings`, a header module with only `content.title` (no `image`) silently renders nothing — no error, no output. When the JSON contains `{ "type": "header", "content": { "title": "OCU" } }` without an `image` field, the component must be extended to accept `content` and render `content.title` as a text fallback. The interface change is: `content?: ContentData` added to props, `image?.src` check becomes optional — render image if present, text if not, null if neither.
- **Benefits-grid responsive: baseline 1 column is safer than assuming 2-column stacking**: `Row`/`Column` from React Email renders as HTML tables that do NOT auto-stack on mobile. For `benefits-grid` with `settings.columns: 2`, the safest pattern is: baseline HTML (no media queries) treats each benefit as a full-width block (1 column), while an `@media only screen and (min-width: 481px)` query switches to 2-column Row/Column. This way Outlook desktop, Gmail web, and Gmail app (iOS) — none of which support media queries reliably — always see the 1-column layout, while Apple Mail and Gmail app (Android) get the 2-column desktop view. Document this constraint clearly in `04-design/mobile-spec.md` and `03-strategy/module-selection.md` — never promise "apilado natural en mobile" without explicitly requiring the agent 07 to implement it.
- **`[PENDIENTE]` in newsletter-data.json causes validation failures**: the `validate-newsletter` and `check-links` scripts treat `[PENDIENTE]` as an invalidity marker (it's checked explicitly). Never write `[PENDIENTE]` into JSON fields. If a mandatory field genuinely has no value and the type permits it, use an empty string `""`. If the field is optional in the TypeScript type, omit it entirely. This applies especially to `fromEmail`, `fromName`, and any optional CTA or image sub-fields.
- **`require()` inside a React component body**: dynamic `require()` breaks tree-shaking and React's fast refresh. Import everything statically at the top of the file.
- **`(item as any).cta` or `(settings as any).columns` in TSX**: when `ContentItemData` and `ModuleSettings` already type the field, casting to `any` hides type-checking. Access the typed property directly (`item.cta`, `settings?.columns`). If the interface lacks the field, extend the interface — don't cast.
- **Missing `<tbody>` in manual `<table>` elements**: React warns when `<tr>` is a direct child of `<table>` without `<tbody>`. When writing raw `<table>` markup in email HTML, always wrap rows in `<tbody>`.
- **Assuming 2-column layouts stack on mobile**: Row/Column from React Email renders as HTML tables. Tables do NOT automatically stack into rows on small screens. For real mobile stacking, either accept the compressed side-by-side layout or use media queries (functional in Apple Mail/iOS Mail, ignored in Outlook/Gmail web). Design baseline must work without stacking.
- **task-log.md overwritten during phase transitions**: when updating `task-log.md`, read the existing file first and APPEND the new entry — do not `write_file` the entire file unless you are certain no sibling agent or parallel task modified it concurrently. During the DemoSolar campaign, task-log.md was overwritten twice, losing 4 accumulated entries. The same risk applies to `handoff.md` and `next-steps.md` during rapid phase advancement. Safe pattern: `read_file → extract existing entries → append → write_file` with the full accumulated content.
- **campaign-status.md losing nested sections**: when rewriting `campaign-status.md` to advance a phase, preserve all sections (Campaign, Current Phase, Completed Phases, Open Issues, Production Gate Status, Next Step). The Open Issues section was dropped during the DemoSolar campaign's phase 04 transition because the rewrite only included Campaign + Current Phase + Completed Phases + Next Step. Always include all 6 sections; remove content only when an issue is resolved, never remove the section itself.

## Agent file pattern

Each agent file in `agents/` should follow this structure:

```
# NN — Agent Name

## Rol
## Objetivo principal
## Inputs aceptados
## Archivos que puedes leer
## Archivos que puedes escribir
## Reglas de trabajo
## Proceso paso a paso
## Criterios de salida
## Criterios de bloqueo
## [Formatos de cada archivo que genera]
## Handoff hacia [siguiente agente]
## Output final
```

Each agent is a markdown file at `agents/NN-name.md`. The orchestrator and agents read these files to understand their role. Files live in the system root, not per-campaign.

### Export-html technical pitfalls

The `export-html` script (`scripts/export-html.tsx`) has these gotchas discovered during the first real campaign export:

- **`render()` from `@react-email/render` returns a Promise** — the call must be `await render(component, { pretty: true })`. Omitting `await` produces `"Received an instance of Promise"` at the `writeFileSync` call that expects a string.
- **Loading `.tsx` component files** — when the script imports `NuevaCrea.tsx` from the campaign's `07-code/react-email/` directory, `require()` does NOT go through `tsx`'s transpilation hook because the extension is `.tsx`, not `.js`. Use `await import(path)` (dynamic `import()`) instead — `tsx` patches the ESM loader, so `import()` handles `.tsx` files correctly.
- **`juice` is an ESM-only module** — `require('juice')` returns a module object with a `.default` key rather than the function directly. The inline code must do `const juice = require('juice').default || require('juice')` to work around the dual ESM/CJS shape.

These only matter when building or debugging the export script. The standard `npm run export-html` command already handles them correctly — they're captured here so future maintainers don't reintroduce them on a rewrite.

## References (external docs)

The system includes supporting documentation that agents should consult alongside these skill files:

| Document | Path | Content |
|---|---|---|
| Workflow | `docs/workflow.md` | Complete phase-by-phase flow with inputs, outputs, and gates |
| Naming conventions | `docs/naming-conventions.md` | Campaign directory naming, file naming, module types, asset names, error IDs |
| Campaign lifecycle | `docs/campaign-lifecycle.md` | 13 campaign states, what files must exist per state, cycle diagram |
| QA process | `docs/qa-process.md` | 6 QA areas, severity definitions, approval/return/block criteria |
| Real campaign brief template | `docs/real-campaign-brief-template.md` | Structured briefing template with all fields, checklist, and production blockers — use before running create-campaign for any campaign that may go to production |
| Export HTML | `docs/export-html.md` | Render React Email to final HTML: usage, flags (--inline, --force), dependency requirements |
| Preview HTML | `docs/preview-html.md` | Generate visual PNG snapshot of the exported HTML: usage, viewport config, Playwright dependency |
| Check links — strict mode | `docs/check-links-strict.md` | `--strict` flag reference: rejects placeholder CRM links, empty fromEmail, incomplete data markers before production |
| Validate newsletter — production mode | `docs/validate-newsletter-production.md` | `--production` flag reference: validates flags, fromEmail, CRM links, metadata warnings before production |
| Validate claims | `docs/validate-claims.md` | 29 rules across 3 severity levels, normal and production mode |
| Production gate | `docs/production-gate.md` | Unified wrapper: runs validate-newsletter --production, check-links --strict, validate-claims --production |
| First real campaign checklist | `docs/first-real-campaign-checklist.md` | Operational guide for running the first real campaign: conditions per phase, claim rules, link rules, production gate, blockers |
| First real campaign kickoff template | `docs/first-real-campaign-kickoff-template.md` | Reusable prompt template with placeholders for client, CTA, URL, claims, assets, CRM data. Use as the initial instruction to Hermes when starting any real campaign. |
| Final audit (3 campaigns) | `docs/pipeline-audit-final-ocu-bmw-demosolar.md` | End-to-end audit after OCU, BMW, and DemoSolar campaigns; validates all 4 production gates |
| Pipeline audit (BMW vs OCU) | `docs/pipeline-audit-bmw-vs-ocu.md` | Comparative audit: fictitious vs real-data test runs, improvement recommendations |
| Pipeline audit verification | `docs/pipeline-audit-final-verification.md` | Cross-check of audit data against actual campaign files |
| Email limitations | `workspace/design-system/email-limitations.md` | Per-client compatibility tables (Outlook, Gmail, Apple Mail, mobile) |
| System validation (end-to-end) | `docs/system-validation.md` | Summary of full 00→09 pipeline validation with OCU test campaign |

## Production gate (3-script validation) — HISTÓRICO, NO USAR

⚠️ **Esta sección describe el gate del pipeline React Email archivado.** `npm run production-gate`
hoy es un alias de `production-gate-motor` (13 gates: integridad del motor, schema, paridad,
build, claims, assets, control files, balance de columnas, brand pack, contraste WCAG,
production-readiness, decisión de hero, diferenciación estructural) — no los 3 scripts de abajo.
Ver `references/script-usage.md` (al día) en vez de `references/production-gate.md` (histórico).

Before marking any campaign `productionReady: true` — and ideally also before agent 09 (Export) — run all three scripts in strict/production mode. Each must exit with code 0.

The **recommended** approach is the unified wrapper that runs all three in order:

```bash
npm run production-gate -- --campaign newsletters/2026/ocu/2026-jul-moneyman
```

This executes:
1. `npm run validate-newsletter -- --campaign ... --production` — structure, flags, fromEmail, CRM links
2. `npm run check-links -- --campaign ... --strict` — placeholder CRM links, empty fromEmail
3. `npm run validate-claims -- --campaign ... --production` — 29 rules: critical/high/medium severity claims

Alternatively, run each script independently:

```bash
npm run validate-newsletter  -- --campaign ... --production
npm run check-links         -- --campaign ... --strict
npm run validate-claims     -- --campaign ... --production
```

See `references/production-gate.md` for full reference and expected failure output.

## Campaign creation script

Use `scripts/create-campaign.ts` to bootstrap a new campaign from the template:

```bash
npm run create-campaign -- \
  --year 2026 --client ocu --campaign 2026-jul-moneyman \
  --date 2026-07-05 [--cta "Texto"] [--url "https://..."] [--client-name "OCU"] [--force]
```

The script copies `newsletters/_campaign-template/`, replaces placeholders ([CLIENTE], [CAMPAÑA], [FECHA], [CTA_PRINCIPAL], [URL_PRINCIPAL]) in all .md/.json/.ts files, sets campaign-status.md to `created`, and validates newsletter-data.json. It refuses to overwrite without `--force`.

**Client naming:** `--client` is the filesystem slug (ocu, ucademy, ford). `--client-name` is the human-readable name (OCU, UCademy, Ford). If `--client-name` is omitted, the script auto-derives it from the slug using known mappings (`ocu→OCU`, `ucademy→UCademy`, `ford→Ford`, `other-clients→Other Clients`) or by capitalising hyphenated segments (`test-client→Test Client`).

## HTML export script

Use `scripts/export-html.tsx` to render a campaign's React Email to final HTML:

```bash
# Basic export
npm run export-html -- --campaign newsletters/2026/ocu/2026-jul-moneyman

# With inline styles and overwrite
npm run export-html -- --campaign newsletters/2026/ocu/2026-jul-moneyman --inline --force
```

Generates `09-exports/final.html` (and `final-inline.html` with `--inline`). Requires `react`, `react-dom`, `@react-email/components`, `@react-email/render`, and `typescript` installed. Fails with a clear error message if dependencies are missing. See `docs/export-html.md` for full reference.

## Campaign directory convention

```
newsletters/{year}/{client}/{campaign-slug}/
```

- Year: 4 digits (2026)
- Client: lowercase, no spaces, hyphens allowed (ocu, ucademy, ford)
- Campaign slug: year-month-client-descriptor (2026-jul-moneyman)

## See also

- `references/agent-roles.md` — full breakdown of every agent's responsibilities, inputs, outputs, and handoffs
- `references/phase-gates.md` — exit criteria checklist for all 9 phases, with blocker tables
- `references/blocking-flow.md` — structured blocking/unblocking cycle with open-questions format
- `references/script-usage.md` — full CLI reference for all npm scripts (create-campaign, validate-newsletter, check-links, prepare-react-email, export-html, preview-html), plus React Email template structure
- `references/test-run-pattern.md` — complete end-to-end test run pattern (blank-inputs → blocked → test-data → unblock → 00→09), including expected gotchas and claim safety checks
- `references/public-source-campaign-pattern.md` — pattern for campaigns with real public data (client website, published specs) but no formal client approval; covers source-link precision, technical claims handling, financial disclaimers, and the BMW Serie 1 end-to-end example
- `references/production-gate.md` — 3-script validation gate (validate-newsletter --production + check-links --strict + validate-claims --production): when to run, what each script guards, expected failure output
- `references/dual-validation-audit.md` — dual-testing pattern (fictitious campaign → real-data campaign → compare → improve): 3-phase methodology for validating the pipeline before a real production run
- `references/validate-claims-rules.md` — condensed reference of all 29 claim rules with patterns, severity, and recommendations; useful for auditing or extending the claim validator without reading the source code
- `references/controlled-campaign-pattern.md` — full end-to-end reference of the BMW Serie 1 controlled campaign: 10 pipeline actions, 20 claim prohibitions, 12 production blockers, task-log preservation pattern, campaign-status 6-section pattern, production-gate results
- `docs/pipeline-audit-final-ocu-bmw-demosolar.md` — final 3-campaign audit (OCU + BMW + DemoSolar): validates pipeline end-to-end and confirms all 4 production gates work correctly

After building a campaign, verify:
1. All 10 agent files exist in `agents/`
2. A test campaign directory has the full directory tree (00-brief/ through 09-exports/)
3. A handoff from phase N produces valid instructions for phase N+1
4. campaign-status.md exists and shows the correct current phase
5. Run `validate-newsletter` on the campaign before advancing past 06-data. Before marking `productionReady: true`, run the full **production gate** — `production-gate` (wrapper) or the three scripts individually: `validate-newsletter --production`, `check-links --strict`, `validate-claims --production`. All three must exit 0.
