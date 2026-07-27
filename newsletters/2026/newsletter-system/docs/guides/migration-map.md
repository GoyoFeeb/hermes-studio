# Migration Map — Sistema Multimarca

> Fecha: 2026-07-13
> De: `paraycompara-email-system/`
> A: `newsletter-system/`

---

> **[SUPERSEDED — F4, 2026-07-21]** Este documento describe una migración aspiracional: listaba
> ~13 componentes "✅ Movido" a `core/components/` de los que en la práctica solo existían 6
> (verificado en la auditoría del plan de transformación, §1.2 —
> `docs/auditoria-total-y-plan-transformacion-2026-07-17.md`). Esos 6 se archivaron en F4
> (`_archive/f4-core-components-pre-g1/README.md`) por reflejar el estado pre-G1 de la pieza,
> muy anterior a las 15+ rondas de refinamiento que sí están capturadas en el motor. La
> arquitectura vigente **no tiene** `core/components/` — toda la biblioteca de componentes
> premium vive en `engine/components/` (ver `engine/README.md` y `docs/f1-motor-cerrado.md`).
> Este archivo se conserva como registro histórico de la intención de migración del 13-jul, no
> como documentación operativa — no seguir sus rutas de destino.

---

## Origen → Destino

| Archivo original | Nueva ubicación | Tipo | Estado |
|---|---|---|---|
| `tokens/color-system.md` | `brands/paraycompara/tokens/color-tokens.md` | Brand-specific | ✅ Movido |
| `tokens/typography-system.md` | `core/tokens/typography-tokens.md` + `brands/paraycompara/tokens/typography-override.md` | Core + Brand | ✅ Dividido |
| `tokens/spacing-system.md` | `core/tokens/spacing-tokens.md` | Core universal | ✅ Movido |
| `tokens/design-tokens.json` | `brands/paraycompara/tokens/brand-tokens.json` | Brand-specific | ✅ Movido |
| `components/component-system.html` | `core/components/component-gallery.html` | Core universal | ✅ Movido |
| `components/header/` | `core/components/header.html` + `brands/paraycompara/components/header-theme.html` | Core + Brand | ✅ Dividido |
| `components/hero/` | `core/components/hero.html` + `brands/paraycompara/components/hero-theme.html` | Core + Brand | ✅ Dividido |
| `components/cta/` | `core/components/cta.html` + `brands/paraycompara/components/cta-theme.html` | Core + Brand | ✅ Dividido |
| `components/cards/` | `core/components/cards.html` + `brands/paraycompara/components/cards-theme.html` | Core + Brand | ✅ Dividido |
| `components/trust-bar/` | `core/components/trust-bar.html` | Core universal | ✅ Movido |
| `components/steps/` | `core/components/steps.html` | Core universal | ✅ Movido |
| `components/footer/` | `core/components/footer.html` | Core universal | ✅ Movido |
| `components/placeholders/` | `core/components/placeholders.html` | Core universal | ✅ Movido |
| `campaigns/saving/` | `brands/paraycompara/examples/campaign-saving.html` | Brand example | ✅ Movido |
| `campaigns/educational/` | `brands/paraycompara/examples/campaign-educational.html` | Brand example | ✅ Movido |
| `campaigns/comparison/` | `brands/paraycompara/examples/campaign-comparison.html` | Brand example | ✅ Movido |
| `campaigns/retargeting/` | `brands/paraycompara/examples/campaign-retargeting.html` | Brand example | ✅ Movido |
| `guidelines/voice-and-copy-guide.md` | `brands/paraycompara/voice-and-copy-guide.md` | Brand-specific | ✅ Movido |
| `guidelines/asset-spec-system.md` | `brands/paraycompara/asset-spec.md` | Brand-specific | ✅ Movido |
| `guidelines/icon-spec.md` | `brands/paraycompara/icon-spec.md` | Brand-specific | ✅ Movido |
| `guidelines/animation-guidelines.md` | `core/animation/animation-guidelines.md` | Core universal | ✅ Movido |
| `guidelines/responsive-guidelines.md` | `core/responsive/responsive-guidelines.md` | Core universal | ✅ Movido |
| `guidelines/compatibility-guidelines.md` | `core/compatibility/compatibility-guidelines.md` | Core universal | ✅ Movido |
| `guidelines/qa-checklist-template.md` | `core/qa/qa-checklist-template.md` | Core universal | ✅ Movido |
| `system-audit-final.md` | `docs/audits/system-audit-v1.md` | Documentation | ✅ Movido |
| `inconsistencies-found.md` | `docs/audits/inconsistencies-v1.md` | Documentation | ✅ Movido |
| `system-usage-guide.md` | `docs/guides/system-usage-guide.md` | Documentation | ✅ Movido |
| `release-notes-v1.md` | `docs/releases/release-notes-v1.md` | Documentation | ✅ Movido |
| `README.md` | `README.md` (nuevo root) | Documentation | ✅ Reescribiendo |

## Archivos eliminados (contenido migrado)

| Archivo | Motivo |
|---|---|
| `paraycompara-email-system/` (directorio completo) | Reemplazado por `newsletter-system/` |

## Archivos nuevos (core)

| Archivo | Contenido |
|---|---|
| `core/tokens/core-tokens.json` | Tokens técnicos universales |
| `core/tokens/spacing-tokens.md` | Escala de espaciado universal |
| `core/tokens/typography-tokens.md` | Escala tipográfica base |
| `core/components/header.html` | Header estructural sin marca |
| `core/components/hero.html` | Hero con placeholder universal |
| `core/components/cta.html` | CTA bulletproof sin color |
| `core/components/cards.html` | Cards estructurales |
| `core/components/trust-bar.html` | Trust bar genérica |
| `core/components/steps.html` | Steps genéricos |
| `core/components/footer.html` | Footer legal universal |
| `core/components/placeholders.html` | Placeholders técnicos |
| `core/components/component-gallery.html` | Galería de todos los componentes core |
| `core/responsive/responsive-guidelines.md` | Guía responsive universal |
| `core/compatibility/compatibility-guidelines.md` | Guía de compatibilidad |
| `core/accessibility/accessibility-guidelines.md` | Guía de accesibilidad |
| `core/animation/animation-guidelines.md` | Guía de animación |
| `core/qa/qa-checklist-template.md` | Checklist QA universal |

## Archivos nuevos (brands/_template)

| Archivo | Contenido |
|---|---|
| `brands/_template/README.md` | Instrucciones para crear marca |
| `brands/_template/tokens/brand-tokens.json` | Tokens vacíos |
| `brands/_template/placeholders/logo.png` | Placeholder logo |
| `brands/_template/examples/saving.html` | Ejemplo base |

## Archivos nuevos (brands/demo)

| Archivo | Contenido |
|---|---|
| `brands/demo/tokens/brand-tokens.json` | Tokens azules |
| `brands/demo/components/cta-theme.html` | CTA azul |
| `brands/demo/examples/saving.html` | Campaña demo |