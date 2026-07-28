# Test Run Pattern — End-to-End Pipeline Validation

> **[SUPERSEDED — F1/F4, 2026-07-21; banner añadido 2026-07-28]** Describe fase 07 como
> desarrollo React Email (`ModuleRenderer`, `HeaderBlock`, `Row`/`Column`, `.tsx`,
> `@react-email/render`, `juice` manual). El agente 07 vigente ejecuta
> `engine/build-newsletter.js` — no escribe componentes React. `juice` ya vive dentro del motor,
> no se invoca a mano. El patrón de test end-to-end (00→09 con datos ficticios → bloqueado →
> datos reales → desbloquear) sigue siendo válido como metodología; los detalles técnicos de
> implementación de esta página no.

## Purpose

Run a complete 00→09 pipeline with fictitious/test data to validate that all agents, scripts, and control files work together before using real campaign data.

## When to use

- After building the full system for the first time
- After adding a new agent, script, or phase
- Before committing to a real production campaign with a client

## The blank-inputs → blocked → test-data → unblock flow

This is the expected pattern during a first test run:

### Phase 00 — Orchestrator

```
State: created → briefing
Output: campaign-status, handoff, task-log, next-steps all pointing at 01
```

### Phase 01 — Briefing Strategist (the blocking phase)

This is the most likely phase to trigger a block. The agent detects missing inputs and must NOT advance.

```
State: briefing → blocked
```

**Expected behaviour:**
1. Agent reads handoff from orchestrator
2. Agent checks `00-brief/brief.md` — fields are all `[PENDIENTE]`
3. Agent registers 8 open questions (Q-001 through Q-008) in `00-brief/open-questions.md`
4. Agent sets campaign-status.md to `blocked`
5. Handoff is paused: `To: (Pausado — pendiente de inputs del usuario)`
6. `next-steps.md` lists exactly what critical data is missing

**What unblocks:** User provides: objective, CTA, URL, message/offer, legal texts (or "no aplica"), visual references (or "no disponible").

### Phase 01 — unblocked

```
State: blocked → analysis
```

Inputs arrive, agent structures brief.md, requirements.md, source-links.md, resolves all 8 questions in open-questions.md. Handoff prepared for 02.

### Phase 02 — Brand Visual Analyst (with no references)

When the user provides "No disponible" for visual references:

```
State: analysis → strategy
```

**Pattern:**
1. Document every visual element as "❌ No disponible — fuente: inferida"
2. Choose conservative defaults: neutral palette, web-safe fonts
3. Flag all inferred values as needing validation before production
4. Include a critical-severity risk: "Campaña ficticia — no apta para producción"
5. Allow advancement — the analysis is partial but non-blocking

### Phase 03 — Newsletter Architect

```
State: strategy → design
```

Using brief + inferred visuals, define 7 modules (header, hero, text-block, benefits-grid, cta-block, legal, footer). Structure diagram, message hierarchy, CTA placement.

### Phase 04 — Email Designer

```
State: design → copy
```

Convert architecture into visual specs. Critical: specify mobile behaviour explicitly — never claim "apilado automático" because Row/Column does NOT stack on mobile without media queries.

### Phase 05 — Copywriter (+ claim safety corrections)

```
State: copy → data
```

**Copy claim safety check:**
- "gratuita" → error unless brief explicitly confirms. Use "herramienta de ayuda"
- "puedes ahorrar" → error. Use "podrías ahorrar" (conditional)
- "gran ahorro" → vague. Use "detectar oportunidades de mejora"
- Any urgency, exclusivity, or comparative → requires brief confirmation

**Expected correction cycle:**
1. User reviews copy → flags over-claims
2. Agent corrects: `patch` over-claims in subject-lines.md, preheaders.md, body-copy.md, handoff.md
3. Agent logs correction in task-log.md
4. These corrections feed back into the copy claim safety rules

### Phase 06 — Newsletter Data Specialist

```
State: data → development
```

Transform copy into newsletter-data.json. Validate with validate-newsletter and check-links.

**Gotchas:**
- `[PENDIENTE]` in JSON → both validators fail. Use `""` or omit the field
- `fromEmail` → use `""` rather than `[PENDIENTE]`
- Footer links → `#placeholder-*` passes check-links but clearly mark as placeholder

### Phase 07 — React Email Developer

```
State: development → qa
```

**Common fixes needed:**
- HeaderBlock needs `content` prop to render text-only headers (when no `image` field exists)
- Verify all 7 module types have matching components in ModuleRenderer
- Run static checks: no `require()`, no `display:flex`, no `(item as any)`, no `<button>`

### Phase 08 — Email QA Specialist

```
State: qa → export
```

**Two-level approval — always distinguish:**
| Level | Tag | When |
|---|---|---|
| Internal test | ✅ Prueba interna | Structure valid, but placeholders/test flags exist |
| Production | ✅ Producción | All blockers resolved, real assets, real URLs |

**Production blockers to check:**
| Severity | Examples |
|---|---|
| 🔴 Critical | URL ficticia, footer placeholder, sin logo, fromEmail vacío, isTestCampaign=true |
| 🟠 High | Iconos ausentes, paleta inferida |
| 🟡 Medium | Benefits-grid stacking, sin hero image |

When approving for test: generate `production-blockers.md`, keep `isTestCampaign=true`, keep `productionReady=false`.

### Phase 09 — Export Manager

```
State: export → completed (prueba interna)
```

**Three outputs to generate (in order):**
1. `09-exports/final.html` — via `npm run export-html`
2. `09-exports/final-inline.html` — via `export-html --inline` (requires juice)
3. `09-exports/final-preview.png` — via `npm run preview-html` (requires playwright + chromium)

**Gotchas during first export-html run:**
- `render()` from @react-email/render is async — needs `await`
- Loading .tsx files: use `await import()`, not `require()`
- juice is ESM-only: `require('juice').default || require('juice')`

## Post-run artifacts

After a complete test run, the campaign should have:

| Artifact | Required |
|---|---|
| All 10 phase directories (00-brief/ through 09-exports/) | ✅ |
| 10 control files in 09-exports/ (final.html, inline, png, delivery-notes, export-summary, production-blockers) | ✅ (png requires Playwright) |
| `campaign-status.md`: `Estado actual: completed`, `Tipo de cierre: prueba interna`, `Producción: bloqueada` | ✅ |
| `production-blockers.md` listing every production blocker | ✅ |

## Next improvements after test run

1. Script de render/export (if missing)
2. Script de preview visual / PNG (if missing)
3. Ejecutar flujo completo con datos reales
