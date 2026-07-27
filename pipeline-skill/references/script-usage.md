# Script Usage Reference — Hermes Newsletter System

## npm scripts (defined in package.json)

| Script | Command | Purpose |
|---|---|---|
| `create-campaign` | `npm run create-campaign -- ...` | Bootstrap a new campaign from template |
| `preview-html` | `npm run preview-html -- ...` | Generate PNG screenshot of rendered HTML via Playwright |
| `build-newsletter` | `npm run build-newsletter -- --data ... --out ...` | F1. The engine — the vigente path for generating premium HTML (`engine/build-newsletter.js`) |
| `check-parity` | `npm run check-parity -- ...` | F3. Independent post-hoc audit of source/inline parity for engine-built campaigns |
| `check-control-files` | `npm run check-control-files -- ...` | F3. Verifies the 4 control files are internally consistent |
| `production-gate` | `npm run production-gate -- ...` | Alias explícito de `production-gate-motor`; cierre real del sistema vigente |
| `production-gate-motor` | `npm run production-gate-motor -- ...` | Gate completo del motor: Gate 0 + Gates 1-11 |
| `test` | `npm test` | Suite de regresión con `node --test` |
| `legacy:validate-newsletter` | `npm run legacy:validate-newsletter -- ...` | Legacy React Email JSON (`newsletter-data.json`) |
| `legacy:check-links` | `npm run legacy:check-links -- ...` | Legacy React Email links |
| `legacy:validate-claims` | `npm run legacy:validate-claims -- ...` | Legacy React Email claims |
| `legacy:production-gate-react-email` | `npm run legacy:production-gate-react-email -- ...` | Gate histórico React Email |

**`prepare-react-email` and `export-html` were removed in F4 (2026-07-21)** — the React Email
pipeline they drove is archived at `_archive/f4-react-email-pipeline/`
(`export-html.tsx`, `prepare-react-email.ts`, `react-email-template/`, and every campaign's old
`07-code/react-email/`). The vigente path for generating HTML is `build-newsletter` above.

---

## check-parity (engine campaigns — F3)

Independent parity audit for campaigns built via `engine/build-newsletter.js`. The engine
already guarantees source/inline parity **by construction** (`engine/lib/verify.js` runs
inside the same process that writes the files — see `engine/README.md`). This script answers
a different question: **are those files still consistent with each other and with
`build-manifest.json` right now**, after the fact — i.e. did anyone touch `final.html` /
`final-inline.html` / `campaign-data.json` by hand after the build was certified. This is the
direct fix for historical Defect N1 (`docs/re-auditoria-sistema-hermes-2026-07-17.md`): an
inline certified as final that was actually out of sync with its own source, undetected by any
script.

```bash
npx tsx scripts/check-parity.ts --campaign newsletters/2026/paraycompara/2026-jul-revision-verano
npx tsx scripts/check-parity.ts --campaign-set newsletters/2026/paraycompara
```

| Flag | Required | Description |
|---|---|---|
| `--campaign` | one of the two | Path to a single campaign root |
| `--campaign-set` | one of the two | Path to a client directory — audits every campaign subfolder found |

### Checks performed (all recomputed from the real files on disk, never trusted from the manifest alone)

- Recomputes sha256 of `final.html` / `final-inline.html` and compares against
  `sourceSha256` / `inlineSha256` in `build-manifest.json` — mismatch means the file was
  edited after the build.
- Recomputes sha256 of `06-data/campaign-data.json` and compares against
  `campaignDataSha256` — mismatch means the data changed since the last build, so the exported
  HTML is stale.
- Independently recounts `<img>`, `utm_source`, `v:roundrect` and `<table>` balance in both
  `final.html` and `final-inline.html` (separate implementation from `engine/lib/verify.js` —
  the point of "independent" is that a bug in one doesn't automatically hide behind the other's
  verdict).
- Inline weight: error at ≥90 KB, warning at ≥80 KB (same thresholds as `engine/lib/verify.js`).

### Behaviour

- If a campaign has no `09-exports/build-manifest.json`, it's outside this script's scope
  (not an engine-built campaign yet, or still on the React Email pipeline) — reported as
  `⏭️  skipped`, not as a failure.
- Exit code: `0` = no errors (skipped campaigns don't count as failures), `1` = at least one
  parity error found.

### Verified against a fabricated failure (prompt 19, `prompts-fase3-verificacion/`)

Tested by copying a real engine-built campaign to a temp directory, hand-editing one word in
`final-inline.html`, and confirming the script catches it (`exit 1`, exact hash mismatch
reported) — the temp copy was deleted afterward, no real campaign was touched.

---

## check-control-files (F3)

Verifies the 4 control files of a campaign (`campaign-status.md`, `task-log.md`,
`handoff.md`, `next-steps.md`) are internally consistent — closes historical Defect H5
(`docs/re-auditoria-sistema-hermes-2026-07-17.md`: "no script existed to verify these files
were synchronized; Defect N1 is exactly the kind of failure that script would have caught").

```bash
npx tsx scripts/check-control-files.ts --campaign newsletters/2026/paraycompara/2026-jul-ahorra-fibra-movil
```

| Flag | Required | Description |
|---|---|---|
| `--campaign` | yes | Path to a single campaign root |

### Format this script assumes (observed in `newsletters/_campaign-template/` and real
campaigns, not invented from scratch)

- `campaign-status.md` — a markdown table row `| Estado actual | {value} |`, with `{value}`
  from a fixed vocabulary (`created`, `briefing`, `analysis`, `strategy`, `design`, `copy`,
  `data`, `development`, `qa`, `corrections`, `export`, `completed`, `blocked` — from the
  `State` column of each agent in `pipeline-skill/references/agent-roles.md`, plus `created`/
  `completed`/`blocked` observed in real campaigns). An optional `## Completed Phases`
  checklist (`- [x]`/`- [ ]`) is cross-checked ONLY when present with that exact heading —
  mature real campaigns drift toward a longer narrative log instead of the template's 9-item
  checklist, and that drift is not itself penalized.
- `task-log.md` — a markdown table; must have at least 1 data row if state ≠ `created`.
- `handoff.md` — must be non-trivially non-empty if state ≠ `created`.
- `next-steps.md` — must exist; open pending items are not a failure (a `completed` campaign
  can legitimately have documented client-side blockers), only its absence is.

### Checks performed

- The 4 files exist.
- `campaign-status.md` has a recognizable `Estado actual` value from the known vocabulary.
- `task-log.md` has data rows once the campaign has moved past `created`.
- `handoff.md` isn't empty once the campaign has moved past `created`.
- If a `## Completed Phases` checklist is present: `completed` state with unchecked items is
  an error; `created` state with checked items is a warning (stale status).
- **Strongest check, format-independent**: if state is `completed`, `09-exports/final.html`
  must actually exist on disk — a declared-complete campaign with no real export is caught
  regardless of how the prose is written.
- If state is `blocked`, `blocked-reason.md` must exist.

### Verified against 2 fabricated H5 scenarios (prompt 20, `prompts-fase3-verificacion/`)

Both tested on a temp copy of a real campaign (deleted afterward):
1. `completed` state with `09-exports/final.html` removed → caught (`exit 1`).
2. `completed` state with `task-log.md` emptied of data rows → caught (`exit 1`).

Also verified clean (`exit 0`) against 3 real campaigns: the template (`created`), `demo/2026-jul-test` (`created`), and `2026-jul-ahorra-fibra-movil` (`completed`, the most mature real campaign in the system, with a long narrative-log-style control file history rather than the template's short checklist).

---

## production-gate-motor (F3)

Production gate for campaigns built via `engine/build-newsletter.js`. `npm run production-gate`
is an alias of this script and is the required closing gate for the current motor.

```bash
npm run production-gate -- --campaign newsletters/2026/paraycompara/2026-jul-revision-verano
```

| Flag | Required | Description |
|---|---|---|
| `--campaign` | yes | Path to a campaign root (must have `06-data/campaign-data.json`) |

### Gate 0 + 11 gates, run in order

0. **engine-integrity** — `check-engine-integrity.ts` verifies the engine lock before certifying anything.
1. **schema** — `campaign-data.json` validated against `engine/schema/campaign-data.schema.json` with `ajv`.
2. **parity (pre-build)** — invokes `check-parity.ts` on the CURRENT `09-exports/`, before rebuilding.
3. **build** — regenerates `09-exports/` via `engine/build-newsletter.js`.
4. **claims** — applies the shared 29 claim rules to `campaign-data.json`.
5. **assets** — audits `https://` assets in `final-inline.html`.
6. **control-files** — invokes `check-control-files.ts`.
7. **column-balance** — invokes `check-column-balance.ts`.
8. **brand-pack-completeness** — invokes `check-brand-pack-completeness.ts`.
9. **contrast** — invokes `check-contrast.ts`.
10. **production-readiness** — invokes `check-production-readiness.ts`.
11. **hero-decision** — invokes `check-hero-decision.ts`.

If Gate 1 (schema) fails, Gates 2-3 are skipped (marked failed with an explicit "omitted" reason) since there's nothing meaningful to audit or build from invalid data — the remaining gates that can still inspect the campaign keep running so the report is as complete as possible in one pass.

### Gate-ordering bug found and fixed during the F3 fire test (prompt 22)

The first version ran build BEFORE parity. Since the build always regenerates `09-exports/`
from scratch, any hand-tampering on the exported files got silently overwritten (and thus
"fixed") before the parity gate ever looked at it — the check could never fail in practice,
the exact same underlying pattern as historical Defect N1 (a certification that doesn't
actually verify what it claims to). Fixed by swapping the order: parity now audits whatever is
on disk BEFORE the build touches it. Verified with a fabricated tampering test both before and
after the fix — full account in `docs/f3-verificacion-cerrada.md`.

### Behaviour

Same reporting style as the historical gate: per-gate ✅/❌ summary, exit `0` only if every
motor gate passes, final message "candidate for production, pending final human/client approval"
— never "production ready" outright.

### Run against a real motor campaign (prompt 21, `prompts-fase3-verificacion/`)

`2026-jul-revision-verano`: Gates 1-4 passed clean. Gate 5 (assets) passed with 15/15 URLs
reported as warnings — the sandbox has no outbound DNS resolution to the real CDN
(`getaddrinfo EAI_AGAIN`), correctly distinguished from a broken asset. **Gate 6
(control-files) failed** — this campaign was created directly with only `06-data/` and
`09-exports/`, skipping the full agent pipeline, so it genuinely has no
`campaign-status.md`/`task-log.md`/`handoff.md`/`next-steps.md`. This is the gate working
correctly, not a bug — the campaign was not "fixed" to make the gate pass (see restriction in
`prompts-fase3-verificacion/21-production-gate-motor.md`).

## create-campaign

Creates a new campaign directory from `newsletters/_campaign-template/`.

```bash
npm run create-campaign -- \
  --year 2026 \
  --client ocu \
  --client-name "OCU" \
  --campaign 2026-jul-moneyman \
  --date 2026-07-05 \
  --cta "Ver oferta" \
  --url "https://ocu.org/oferta"
```

| Flag | Required | Default | Description |
|---|---|---|---|
| `--year` | yes | — | 4-digit year |
| `--client` | yes | — | Slug for directory name (ocu, ford, ucademy) |
| `--client-name` | no | derived from slug | Visible name shown in files |
| `--campaign` | yes | — | Campaign slug |
| `--date` | no | today's date | YYYY-MM-DD |
| `--cta` | no | `Definir CTA` | CTA text |
| `--url` | no | `https://placeholder.invalid/{client}/{campaign}` | Primary URL placeholder |
| `--force` | no | off | Overwrite existing campaign |

### Copia de plantilla en filesystems restringidos (EACCES)

En carpetas montadas de algunas sesiones (p. ej. sandboxes tipo Cowork), `fs.cpSync` puede fallar
con `EACCES` al copiar `newsletters/_campaign-template/` aunque el equivalente de shell `cp -r`
funcione sin problema. `copyTemplate()` ahora detecta ese error específico y cae automáticamente
a una copia recursiva manual (archivo por archivo, vía `fs.readdirSync` + `fs.copyFileSync`) sin
abortar el comando. La salida del comando indica qué método se usó:

```
     (método: copia rápida — fs.cpSync)
```
o, si hubo fallback:
```
     ⚠️  fs.cpSync falló con EACCES (carpeta montada) — usando fallback manual
     (método: copia fallback — archivo por archivo)
```

No requiere ninguna acción manual del usuario — es transparente en ambos entornos.

### Client name mapping

Known slugs produce specific visible names:

| `--client` | Auto `--client-name` |
|---|---|
| `ocu` | OCU |
| `ucademy` | UCademy |
| `ford` | Ford |
| `other-clients` | Other Clients |
| `audika` | Audika |
| `testclient` | Test Client |
| *(any other)* | Slug converted: hyphens → spaces, capitalised |

### Behaviour

1. Validates required flags (`--year`, `--client`, `--campaign`).
2. Checks destination does not exist (refuses without `--force`).
3. Copies `newsletters/_campaign-template/` → `newsletters/{year}/{client}/{campaign}/`.
4. Replaces placeholders (`[CLIENTE]`, `[CLIENT_SLUG]`, `[CAMPAÑA]`, `[FECHA]`, `[CTA_PRINCIPAL]`, `[URL_PRINCIPAL]`) in all `.md` and `.json` files.
5. Sets `campaign-status.md` state to `created`.
6. Validates `06-data/campaign-data.json` against `engine/schema/campaign-data.schema.json`.
7. Prints summary with path, file count, client slug+name, campaign, date, JSON validity.

---

## legacy:validate-newsletter

Legacy React Email validator. Do not use it as the production close for motor campaigns.

```bash
npm run legacy:validate-newsletter -- --campaign newsletters/2026/ocu/2026-jul-moneyman
```

| Flag | Required | Description |
|---|---|---|
| `--campaign` | yes | Relative or absolute path |

### Validations performed

1. Campaign directory exists.
2. All 10 phase directories exist (`00-brief/` through `09-exports/`).
3. Required files exist:
   - `README.md`, `campaign-status.md`, `task-log.md`, `handoff.md`, `next-steps.md`
   - `00-brief/brief.md`, `00-brief/requirements.md`, `00-brief/source-links.md`
   - `06-data/newsletter-data.json`, `06-data/newsletter-data.ts`
4. `newsletter-data.json` is syntactically valid JSON.
5. JSON contains `metadata`, `settings`, and `modules` (array).
6. If `modules` has entries, each has `id`, `type`, `order`.
7. If a module has `cta`, it has `text` and non-empty `href`.
8. If a module has `image`, it has `src` and `alt`.

Exit code: `0` = all clear, `1` = errors found.

---

## legacy:check-links

Legacy React Email link checker. Do not use it as the production close for motor campaigns.

```bash
npm run legacy:check-links -- --campaign newsletters/2026/ocu/2026-jul-moneyman
npm run legacy:check-links -- --campaign newsletters/2026/ocu/2026-jul-moneyman --online
```

| Flag | Required | Description |
|---|---|---|
| `--campaign` | yes | Relative or absolute path |
| `--online` | no | Attempt HTTP HEAD for each URL (graceful failure on network error) |

### Offline checks (default)

- Empty/invalid hrefs (`""`, `"#"`, `"null"`)
- Placeholder hrefs (`[PENDIENTE]`, `[URL_PRINCIPAL]`)
- Non-absolute URLs when they should be absolute
- Image missing `src` or `alt`
- CTA missing `text`

### Strict checks (`--strict`)

Add `--strict` to also check for production-readiness:

- `#placeholder-*` hrefs — **error** (CRM placeholders that block production)
- `[TODO]`, `[FIXME]`, `[ESCRIBIR AQUÍ]` — **error** (incomplete data)
- `metadata.fromEmail` empty or placeholder — **error** (must be defined before production)
- All normal checks still apply

| Flag | Required | Description |
|---|---|---|
| `--campaign` | yes | Relative or absolute path |
| `--online` | no | Attempt HTTP HEAD for each URL (graceful failure on network error) |
| `--strict` | no | Reject placeholder CRM links and empty fromEmail as errors (exit 1) |

### Online checks (`--online`)

- HTTP HEAD request to each URL (8s timeout)
- Reports status code or connection failure as **warnings only** (non-blocking)

Exit code: `0` = no errors (warnings allowed), `1` = errors found.

---

## prepare-react-email

> **[ARCHIVADO — F4, 2026-07-21]** Ver `_archive/f4-react-email-pipeline/README.md`. Sección
> conservada como referencia histórica; el script ya no existe en `scripts/`.

Copies the validated React Email template from `workspace/react-email-template/` into a campaign's `07-code/react-email/` directory.

```bash
npm run prepare-react-email -- --campaign newsletters/2026/ocu/2026-jul-moneyman
```

| Flag | Required | Description |
|---|---|---|
| `--campaign` | yes | Relative or absolute path to campaign root |
| `--force` | no | Overwrite existing `07-code/react-email/` |

Copies `template-hermes.tsx` (as `NuevaCrea.tsx` with import rewritten), `newsletter-schema.json`, and `components/`. Creates `newsletter-data.example.json` from the campaign's real JSON. Refuses to overwrite without `--force`.

---

## React Email Template

> **[ARCHIVADO — F4, 2026-07-21]** Ver `_archive/f4-react-email-pipeline/README.md`. Sección
> conservada como referencia histórica; `react-email-template/` ya no existe en la raíz.

Located at `workspace/react-email-template/`. Contains:

| File | Purpose |
|---|---|
| `template.tsx` | Base template consuming `newsletter-data.json` |
| `template-hermes.tsx` | Hermes-ready version accepting `data` prop |
| `newsletter-data.json` | Example JSON with 6 placeholder modules |
| `newsletter-schema.json` | JSON Schema for validation |
| `components/ModuleRenderer.tsx` | Type→component dispatcher |
| `components/types.ts` | All TypeScript interfaces |
| `components/styles.ts` | 11 style helper functions |
| `components/HeaderBlock.tsx` | type: `header` |
| `components/HeroBlock.tsx` | type: `hero` |
| `components/TextBlock.tsx` | type: `text-block`, `social-proof` |
| `components/CTA.tsx` | type: `cta-block` |
| `components/TwoColumnsBlock.tsx` | type: `two-columns` |
| `components/ImageTextBlock.tsx` | type: `image-text` |
| `components/CardsGridBlock.tsx` | type: `cards-grid` |
| `components/BenefitsGridBlock.tsx` | type: `benefits-grid` |
| `components/FooterBlock.tsx` | type: `footer` |
| `components/LegalBlock.tsx` | type: `legal` |

### 13 supported module types

`header`, `hero`, `text-block`, `cta-block`, `image-block`, `divider`, `social-proof`, `two-columns`, `image-text`, `cards-grid`, `benefits-grid`, `legal`, `footer`

### Key patterns

- All layout uses `Section`, `Row`, `Column` from `@react-email/components` (renders as HTML tables).
- No flexbox, no CSS grid, no JavaScript.
- CTAs use the shared `CTA` component (renders as `<a>` with inline styles, never `<button>`).
- Images always have explicit `width`, `height`, and `alt`.
- Font stacks always include web-safe fallbacks (`Arial, Helvetica, sans-serif`).
- Colours are solid hex values (`#RRGGBB`), never gradients.
- Unknown module types are silently ignored (return null).
- `visible: false` modules are skipped.
- `import type * as React from 'react'` for CSSProperties typing.

---

## export-html

> **[ARCHIVADO — F4, 2026-07-21]** Ver `_archive/f4-react-email-pipeline/README.md`. Sección
> conservada como referencia histórica; el script ya no existe en `scripts/`. El camino vigente
> para generar HTML es `build-newsletter` (`engine/build-newsletter.js`, ver arriba).

Renders a campaign's React Email component to final HTML.

```bash
npm run export-html -- --campaign newsletters/2026/ocu/2026-jul-moneyman
npm run export-html -- --campaign newsletters/2026/ocu/2026-jul-moneyman --inline --force
```

| Flag | Required | Description |
|---|---|---|
| `--campaign` | yes | Relative or absolute path to campaign root |
| `--inline` | no | Also generate `final-inline.html` with juice inline styles |
| `--force` | no | Overwrite existing `final.html` |

### Required dependencies

Installed at the project root:

```
npm install react react-dom @react-email/components @react-email/render typescript
npm install juice    # optional, needed for --inline
```

### Behaviour

1. Verifies campaign directory and `06-data/newsletter-data.json` exist.
2. Checks all required npm dependencies are available (fails with install instructions if missing).
3. Resolves `07-code/react-email/NuevaCrea.tsx`, imports the `HermesNewsletter` component, and renders it with `@react-email/render` using the campaign's JSON data.
4. Writes `09-exports/final.html`.
5. If `--inline` and `juice` is available, also writes `09-exports/final-inline.html`.
6. Refuses to overwrite without `--force`.
7. Does NOT send emails, install dependencies, or modify campaign data.

### Known export-html issues

| Issue | Symptom | Fix |
|---|---|---|
| `render()` is async but missing `await` | `"Received an instance of Promise"` at `writeFileSync` | Add `await` before `render(component, { pretty: true })` |
| `.tsx` component not loadable via `require()` | `ERR_UNKNOWN_FILE_EXTENSION` or silent module-not-found | Use `await import(modulePath)` — tsx patches ESM loader for `.tsx` |
| `juice` not callable after `require('juice')` | `"juice is not a function"` | `const juice = require('juice').default \\|\\| require('juice')` (ESM dual-shape workaround) |

---

## preview-html

Generates a PNG screenshot of the rendered HTML using Playwright + Chromium.

```bash
npm run preview-html -- --campaign newsletters/2026/ocu/2026-jul-moneyman
npm run preview-html -- --campaign newsletters/2026/ocu/2026-jul-moneyman --force --width 600 --height 2200
```

| Flag | Required | Description |
|---|---|---|
| `--campaign` | yes | Relative or absolute path to campaign root |
| `--force` | no | Overwrite existing `final-preview.png` |
| `--width` | no | Viewport width (default 600) |
| `--height` | no | Viewport height (default 2000) |

### Required dependencies

```bash
npm install playwright
npx playwright install chromium
```

### Behaviour

1. Checks that `09-exports/final.html` exists (run `export-html` first).
2. Opens the HTML in headless Chromium via Playwright.
3. Takes a full-page screenshot.
4. Writes `09-exports/final-preview.png`.

Does NOT send emails, install dependencies, or modify campaign data.

### Limitations

- Screenshot is in Chromium headless only. Does NOT represent real rendering in Outlook, Gmail, or Apple Mail.
- Does not replace manual QA in real email clients.

---

## validate-claims

Scans `newsletter-data.json` content fields for prohibited claims, unvalidated technical specs, and risky marketing language.

```bash
npm run validate-claims -- --campaign newsletters/2026/ocu/2026-jul-moneyman
npm run validate-claims -- --campaign newsletters/2026/ocu/2026-jul-moneyman --production
```

| Flag | Required | Description |
|---|---|---|
| `--campaign` | yes | Relative or absolute path to campaign root |
| `--production` | no | Treat all severity levels (critical, high, medium) as errors |

### 29 claim rules across 3 severity levels

| Severity | Count | Examples |
|---|---|---|
| 🔴 Critical | 9 | intereses cero, garantizado, aprobación inmediata, sin condiciones, entrega garantizada |
| 🟠 High | 14 | tracción trasera, potencia, consumo técnico, velocidad máxima, líder del segmento, mejor comparativo |
| 🟡 Medium | 6 | mejor oferta, edición limitada, última oportunidad, exclusivo tiempo limitado |

### Behaviour

- Normal mode: critical + high = errors (exit 1), medium = warnings (exit 0 if no critical/high).
- Production mode: all severity levels = errors (exit 1). Exit 0 only if no claims detected.
- Scans: subjectLine, preheader, content.title/subtitle/body/bullets/items, cta.text, link labels.
- Does NOT scan metadata.warning, internal notes, or production-blockers.

---

## production-gate

Alias of `production-gate-motor`. This is the required closing command for current engine-built
campaigns.

```bash
npm run production-gate -- --campaign newsletters/2026/ocu/2026-jul-moneyman
```

| Flag | Required | Description |
|---|---|---|
| `--campaign` | yes | Relative or absolute path to campaign root |

### Gates executed

Same Gate 0 + Gates 1-11 listed in `production-gate-motor`.

### Behaviour

- If all motor gates pass: exit 0, message "Campaign is candidate for production, pending final human/client approval."
- If any gate fails: exit 1, message "Campaign is NOT ready for production." Lists failed gates.
- Does NOT send emails, install dependencies, or modify campaign data.
- "Candidate for production" is NOT the same as "production ready" — human/client approval is still required.

---

## check-engine (integrity — added after the 2026-07-21 incident)

`npm run check-engine` verifies every engine file (components, libs, entry point, schema)
against `engine/components.lock.json` (sha256 per file). Exit 1 on any missing/altered/
unregistered file. After a LEGITIMATE engine change (documented in `engine/CHANGELOG.md`):
`npm run check-engine -- --update` regenerates the lock. Runs automatically as Gate 0 of
`production-gate-motor` — nothing gets certified if built with an altered engine. Origin: an
external Hermes session re-derived the component library from scratch and overwrote the
engine (full account in `engine/CHANGELOG.md`, "INCIDENTE 2026-07-21").

---

## Brand hero design flow (Claude design — added 2026-07-21)

Per-brand hero designed by Claude (multimodal: it looks at the brand's website) at brand-design
time; the engine stays deterministic. `npm run capture-brand-site -- --brand X --url URL` →
`npm run generate-hero -- --brand X` (needs ANTHROPIC_API_KEY; model via HERO_MODEL, default
claude-sonnet-5; writes a CANDIDATE to `engine/components/_candidates/`) → `npm run
validate-hero -- --brand X --accept` (full contract validation + smoke render; on accept:
moves into the engine, CHANGELOG entry, lock regenerated). Contract:
`scripts/hero-design/HERO-DESIGN-CONTRACT.md`. Generated heroes are named `hero-marca-{slug}`
and share hero-centrado's data contract (generic adapter/schema/pattern support — no per-brand
engine edits needed).

---

## generate-hero-image (hybrid hero art via OpenAI gpt-image-1/gpt-image-2 — updated 2026-07-22)

`npm run generate-hero-image -- --brand X --theme "..."` — generates the hero BANNER ART with
OpenAI's image API (`gpt-image-1` by default; `gpt-image-2` if `HERO_IMG_MODEL=gpt-image-2` is
set — released 2026-04-21, confirmed via live web search before wiring it in rather than
assumed from training data) from the brand pack palette/voice (prompt saved alongside for
traceability). Requires `OPENAI_API_KEY` in root `.env` with active billing AND organization
verification (`platform.openai.com/settings/organization/general`, required for any gpt-image-*
model — see `.env.example`). If the account is billing-blocked, unverified, or the requested
size is invalid for the active model, the script surfaces that explicitly instead of a raw
error. Size rules differ by model: `gpt-image-1` only accepts a fixed enum
(1024x1024/1536x1024/1024x1536/auto); `gpt-image-2` accepts any size where both edges are
multiples of 16px, max edge ≤3840px, aspect ratio ≤3:1, and total pixels between 655,360 and
8,294,400 — validated locally before calling the API. Optional `HERO_IMG_TARGET_WIDTH` resizes
the API result down to an exact width (e.g. 600px, which the API can't be asked for directly
since it's not a multiple of 16) using `sharp`, saved as `hero-banner.png` alongside the
unscaled `hero-banner-original.png`. By default the generated PNG(s) open automatically in
Preview (macOS, via the `open` command) right after saving, for instant local viewing — set
`HERO_IMG_AUTO_OPEN=false` to disable (no-ops gracefully on non-macOS).

**Real-page anchoring (2026-07-22):** with an interactive terminal, the script asks before
generating whether to ground the art in that campaign's specific landing page (pass
`--campaign {path}` to suggest its `cta.href` as the default), the brand's general website (asked
once, then optionally cached as `website` in the brand pack), or skip. If a page is chosen, it's
captured with Playwright and OpenAI itself (chat completions with vision, `HERO_IMG_VISION_MODEL`
— default `gpt-5.6-sol`, GPT-5.6's flagship, GA 2026-07-09 — same `OPENAI_API_KEY`, no other
provider involved) describes ONLY the real
photographic/visual style it sees — never transcribing text or logos — and that description
replaces the generic "Theme" line in the image-generation prompt. Falls back silently to the
generic prompt if there's no TTY or the capture fails; `HERO_IMG_SOURCE_PAGE=false` disables the
question entirely. (An earlier version of this used Claude/Anthropic for the description step;
switched to OpenAI-only at the user's request so the whole pipeline needs a single API key.)
History: originally built
against OpenAI, switched to Pollinations.ai (free, no key) 2026-07-21 when the user hit their
OpenAI billing limit; switched back to OpenAI 2026-07-22 at the user's request, with billing
since resolved (see `engine/CHANGELOG.md`, all entries). Hybrid rule unchanged: the art contains
NO text — headline/subtitle/CTA stay live HTML (`hero-imagen` engine component) so the email
survives Outlook/Gmail image blocking. Output image goes to `brands/{X}/design-input/`; upload to
the feebbodigital CDN manually (this step stays fully manual — the script only opens a local
preview, it never uploads) and reference the https URL in `campaign-data.json` →
`data.bannerSrc` (Gate 5 checks HTTP 200).
