# Production Gate — 3-script validation suite

> **[SUPERSEDED — F3, 2026-07-21; banner añadido 2026-07-28]** Este documento describe el gate
> de 3 scripts del pipeline React Email archivado. El `npm run production-gate` vigente hoy es
> un alias de `production-gate-motor` (13 gates sobre `campaign-data.json` + `engine/`) — un
> comando con el mismo nombre que ejecuta algo completamente distinto. Ver
> `pipeline-skill/references/script-usage.md` § production-gate-motor para el gate real.

Before any campaign can be marked `productionReady: true` and `isTestCampaign: false`, it must pass all three scripts below in strict/production mode.  This is the automated gate that prevents campaigns with placeholders, unapproved claims, or incomplete CRM data from reaching a real audience.

## The three commands

Run them in order.  Each must exit with code `0`.

```bash
# 1. Structure, metadata flags, and CRM links
npm run validate-newsletter -- \
  --campaign newsletters/<year>/<client>/<campaign> \
  --production

# 2. Syntax and placeholder-whitelist for every href in the JSON
npm run check-links -- \
  --campaign newsletters/<year>/<client>/<campaign> \
  --strict

# 3. Prohibited claims, unapproved technical specs, risky marketing language
npm run validate-claims -- \
  --campaign newsletters/<year>/<client>/<campaign> \
  --production
```

## What each script guards

| Script | Normal mode | Production / Strict mode | Exits 1 when … |
|---|---|---|---|
| `validate-newsletter` | Structure + JSON validity | Checks `isTestCampaign`, `productionReady`, `fromEmail`, footer CRM links, metadata warnings | Campaign is still flagged as test, fromEmail missing, baja/preferencias are placeholders |
| `check-links` | Syntax + absolute URLs | Rejects `#placeholder-*`, `[PENDIENTE]`, `[TODO]`, `[FIXME]` | CRM placeholders still present |
| `validate-claims` | Scans content for 29 rules (critical/high → error, medium → warning) | Every severity level → error | Any prohibited or unapproved claim appears in content fields |

## Typical failure output (BMW test campaign)

```
$ npm run validate-newsletter -- --campaign ... --production
❌ [PRODUCTION] metadata.isTestCampaign debe ser false (actual: true)
❌ [PRODUCTION] metadata.productionReady debe ser true (actual: false)
❌ [PRODUCTION] metadata.fromEmail está vacío
❌ [PRODUCTION] modules[6].links[1] ("Preferencias"): placeholder — #placeholder-preferencias
❌ [PRODUCTION] modules[6].links[2] ("Darse de baja"): placeholder — #placeholder-baja

$ npm run check-links -- --campaign ... --strict
❌ [STRICT] metadata.fromEmail está vacío
❌ [STRICT] Enlace → Preferencias: placeholder — #placeholder-preferencias
❌ [STRICT] Enlace → Darse de baja: placeholder — #placeholder-baja

$ npm run validate-claims -- --campaign ... --production
✅ Todos los claims revisados. No se detectaron problemas.
```

## When to run

| Point in pipeline | Mode | Action |
|---|---|---|
| Before agent 06 (Newsletter Data) | normal | Run `validate-claims` to catch copy issues before JSON is built |
| Before agent 09 (Export) | normal | Run all three in normal mode |
| Before setting `productionReady: true` | **production/strict** | Run all three in production/strict mode — **all must pass** |
| As part of a pre-send QA audit | production/strict | Re-run all three on the final `newsletter-data.json` |

## Relationship to QA

The production gate is a **technical complement** to QA, not a replacement:

- QA (agent 08) verifies visual rendering, responsive layout, Outlook quirks, and subjective copy quality.
- The production gate (the three scripts) verifies hard mechanical constraints: no test flags uncleared, no CRM placeholders, no banned claims, no empty fromEmail.

A campaign should pass both the gate AND human QA before being production-ready.
