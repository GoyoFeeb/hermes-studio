# QA Report — Adeslas Seguro Médico

**Campaña:** 2026-jul-adeslas-seguro-medico
**Fecha:** 2026-07-22
**Estado:** pre-build verification

## Pre-build checks

### Brand tokens ✅
- brands/adeslas/tokens/brand-tokens.json v2.2.0 ✓
- All required color fields present ✓
- Typography tokens complete ✓
- Layout.sectionStyle: centrado ✓
- Assets.logo: placeholder {{ADESLAS_LOGO_URL}} (test campaign — acceptable) ✓

### Campaign data ✅
- Format: {component, data} per module ✓
- All 7 modules follow the institutional pattern sequence ✓
- Required modules present: header-logo, hero-centrado, columns-3-beneficios, banda-cierre, footer ✓
- Optional modules: intro-cta, usp-cards ✓
- No pasos or trust-bar (not in institutional pattern — correct) ✓
- metadata.isTestCampaign: true ✓
- metadata.productionReady: false ✓
- Placeholders use {{PLACEHOLDER}} format ✓
- No invented prices, promotions, or claims ✓
- Legal qualifiers included ✓

### Copy review ✅
- Subject line matches concept ✓
- Preheader present ✓
- All CTA labels consistent: "Calcula tu precio" ✓
- Hero text within length limits ✓
- Benefits balanced across 3 columns ✓
- USP copy factual, no invented claims ✓
- Footer legal line includes brand and disclaimer ✓

### Data contracts ✅
- header-logo: {logoSrc, logoAlt, logoWidth, logoHeight, label} — matches schema ✓
- hero-centrado: {brandName, h1, subtitle, cta: {href, label}} — matches schema ✓
- intro-cta: {title, body, cta: {href, label}} — matches schema ✓
- columns-3-beneficios: {title, highlight, highlightNote, items: [{icon, title, body}]} — matches schema ✓
- usp-cards: {eyebrow, title, body, badge, items: [{icon, title, body}]} — matches schema ✓
- banda-cierre: {title, body, cta: {href, label}} — matches schema ✓
- footer: {brandName, tagline, disclosure, unsubscribeUrl, preferencesUrl, legalLine} — matches schema ✓

## Pre-build issues

| # | Severity | Issue | Status |
|---|----------|-------|--------|
| 1 | Low | Logo URL is placeholder {{ADESLAS_LOGO_URL}} — no logo PNG confirmed | Acceptable (test campaign) |
| 2 | Low | CTA URL is placeholder {{CTA_URL}} — no target URL confirmed | Acceptable (test campaign) |
| 3 | Low | Hero background image is placeholder {{HERO_IMAGE_URL}} — not used in hero-centrado | N/A (hero-centrado doesn't use background image) |
| 4 | Low | Legal address is placeholder {{LEGAL_ADDRESS}} — pending client | Acceptable (test campaign) |
| 5 | Info | No brand photography analysis done (Nivel 3 pending) | Documented in brand-tokens.json |

## Post-build verification (to be completed after build)

- [ ] Schema validation passes
- [ ] Pattern validation passes
- [ ] Build completes without errors
- [ ] final.html created in 09-exports/
- [ ] final-inline.html created in 09-exports/
- [ ] build-manifest.json created in 09-exports/
- [ ] No unresolved {{placeholders}} in output
- [ ] Table tags balanced
- [ ] Inline file size < 90 KB
- [ ] Inline file size < 80 KB (warning threshold)
- [ ] All CTA links present and consistent
- [ ] Visual review: color scheme matches brand
