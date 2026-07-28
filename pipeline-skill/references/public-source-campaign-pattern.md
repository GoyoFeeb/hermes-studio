# Public-Source Campaign Pattern — Real Data Without Client Approval

> **[PARCIALMENTE SUPERSEDED — banner añadido 2026-07-28]** El patrón/criterio de negocio de
> este documento (nunca marcar datos de fuente pública como "verificados" sin aprobación del
> cliente) sigue vigente y es correcto — ver `AGENTS.md` regla 8. Los comandos/scripts citados
> (`prepare-react-email`, `export-html`, `preview-html`, `validate-newsletter`, `check-links`,
> `validate-claims` sin prefijo `legacy:`) son del pipeline React Email archivado — hoy serían
> `legacy:*` en `package.json`, o no existen. Para el flujo vigente: `agents/01-briefing-strategist.md`,
> `agents/02-brand-visual-analyst.md`.

## Purpose

Document the flow for campaigns where the client data (product specs, prices, URLs, legal references) comes from public/official sources — the client's own website, published brochures, press releases — but lacks **explicit internal client approval** for use in the newsletter.

This pattern sits between "fully fictitious test data" (see `test-run-pattern.md`) and "fully approved production data."

## When to use

- Client data is publicly available but not formally approved for the campaign.
- URLs point to the client's official website but have not been validated for campaign use.
- Product specs exist in public channels but the client's marketing/legal team has not signed off.
- Financial figures (TAE, TIN, cuotas, precios) are published on the client's web but not confirmed for email communication.

## The distinction: fictitious vs public-source vs approved

| Dimension | Fictitious (OCU test) | Public-source (BMW test) | Approved (production) |
|---|---|---|---|
| Data origin | Invented by user | Client's public website / official channels | Client-approved documents |
| Client approval | N/A | Not obtained | Obtained |
| Production blockers | All critical | Recorded as blockers | None |
| Campaign state | `completed — prueba interna` | `completed — prueba interna` | `completed — producción` |
| isTestCampaign | `true` | `true` | `false` |
| productionReady | `false` | `false` | `true` |

## Agent-by-agent adjustments

### Agent 01 — Briefing (the key difference)

Unlike the fully fictitious pattern where agent 01 blocks the campaign, a campaign with real public data **can advance immediately** if the critical fields are complete:

**Minimum data to advance (even for test):**
- Objective ✅
- CTA text ✅
- URL (official site) ✅
- Message/offer ✅
- Legal texts OR "no aplica" ✅

**What gets recorded as blockers (not blocking advancement):**
- From email → `open-questions.md` Q-001
- Baja/preferencias links → `open-questions.md` Q-002, Q-003
- Logo → `open-questions.md` Q-004
- Hero image → `open-questions.md` Q-005
- Financial conditions validation → `open-questions.md` Q-006
- Brand guide → `open-questions.md` Q-007
- Commercial/legal approval → `open-questions.md` Q-008

**Source-link phrasing (critical):**
Do NOT label public URLs as "verificada" or "confirmed." Use precise conditional language:

| Phrase to avoid | Phrase to use |
|---|---|
| `✅ Verificada (web oficial)` | `✅ Referencia oficial localizada. Pendiente de aprobación cliente.` |
| `(verificada, web oficial)` | `— referencia oficial localizada, pendiente de aprobación cliente para producción.` |

The handoff and campaign-status must clearly state that production is blocked even though the campaign can advance for test.

### Agent 02 — Visual Analysis (with real brand but no guide)

When the client is a well-known brand (BMW, Audi, Nike) but no guide or assets are provided:

1. Document the brand's **known personality** (premium, sober, minimalist) and state the source as "Percepción pública, no validada con cliente."
2. **Do not invent** specific hex values, font names, or logo variants.
3. Provide conservative defaults (white, near-black, web-safe fonts, clean layout).
4. Mark ALL values as "Inferido desde percepción pública. Pendiente de validación por cliente."
5. In `risks.md`, add risks for: missing logo, missing brand guide, missing palette validation.

### Agent 03 — Architecture (with real product data)

When the product has public technical specs (automotive, electronics, financial products):

1. **Do NOT copy technical claims** into the newsletter copy, even from official public sources. The client may have a different marketing angle or the specs may apply to a different variant.
2. Describe benefits at the **experiential level** not the technical level:

| Unsafe (technical) | Safe (experiential) |
|---|---|
| "Motorizaciones eficientes con tracción trasera o integral" | "Conducción dinámica — pendiente de validación técnica final por cliente" |
| "156 CV, consumo 5.2L/100km" | "Rendimiento eficiente — pendiente de confirmación de especificaciones" |
| TAE 6,64%, TIN 5,99% | Include as legal text with disclaimer, not as promotional claim |

3. In the `module-selection.md` and `structure.md`, clearly mark which benefits are safe and which are pending validation.

### Agent 05 — Copy (with real financial/legal text)

When financial figures exist publicly (TAE, TIN, cuotas, precios):

1. **Copy the figures verbatim** from the public source — do not alter, round, or interpret.
2. **Add a clear disclaimer** before and after: "Condiciones financieras de referencia consultadas en [fuente]. Pendientes de validación final por cliente antes de producción."
3. **Do NOT make the financial figures the central promotional claim.** Keep them in the legal/financial module, not the hero or primary CTA module.
4. Label every module's status as:
   - `Estado: Aprobado para prueba interna / pendiente validación cliente`
   - NOT `Estado: Final`
5. The `Estado: Final` label implies client approval for production use, which is false as long as blockers remain.

### Agent 06 — Data (capturing warnings in metadata)

In `newsletter-data.json`, the `metadata.warning` field should capture all pending items in a single string:

```
"Campaña de prueba interna. No usar en producción. [specific blockers]. From email, enlaces de baja y preferencias pendientes CRM. Assets (logo, hero, iconos) pendientes cliente. [Financial conditions] pendientes de validación."
```

Keep `isTestCampaign: true` and `productionReady: false` throughout.

### Agent 08 — QA (two-level approval)

QA must produce two distinct lists:
1. **Pass for test** — what works structurally (all modules render, CTAs functional, JSON valid)
2. **Block for production** — every pending item that prevents production release

The `final-checklist.md` needs two sections: "Aprobado para prueba interna" and "Bloqueos de producción." The `production-blockers.md` file lists every blocker with severity, owner, and action required.

### Agent 09 — Export (documenting blockers)

The export produces the standard triad of documentation:
- `delivery-notes.md` — what was exported, with warnings
- `export-summary.md` — phase-by-phase summary
- `production-blockers.md` — every blocker organized by severity (🔴 critical, 🟠 high, 🟡 medium)

## BMW Serie 1 campaign (reference example)

The BMW España campaign followed this pattern end-to-end:
- **Data source:** bmw.es (official website, public)
- **Advanced without blocking:** objective, CTA, URL, message, asunto, preheader, audience, tone all provided
- **Production blockers (11):** isTestCampaign, productionReady, fromEmail, baja, preferencias, logo, hero, financial validation, brand guide, icons, commercial approval
- **Technical claims handled:** Replaced "tracción trasera o integral" with "Experiencia de conducción con comportamiento ágil y enfoque deportivo"
- **Financial text:** Included TAE 6,64%, TIN 5,99%, 47x195€ with disclaimer
- **Result:** `completed — prueba interna` with `isTestCampaign: true`, `productionReady: false`, 11 blockers documented

## Verification checklist for public-source campaigns

Before advancing any phase, verify:
- [ ] Source URLs are labeled with precision ("Referencia oficial localizada" not "Verificada")
- [ ] Technical specs are described experientially, not technically
- [ ] Financial/legal text has clear disclaimer
- [ ] Copy states say "Aprobado para prueba interna / pendiente validación cliente"
- [ ] `isTestCampaign: true` and `productionReady: false` unchanged
- [ ] Production blockers recorded in separate files
- [ ] No `[PENDIENTE]` in JSON (use `""` or omit)
