# Handoff

## De
05 — Copywriter

## Para
06 — Data Specialist

## Contexto
Copy completo para todos los slots de Nike Air Force One '07. Brand pack v2.2.4 con logo swoosh capturado. Patrón fotografia-primero.

## Files to Read
- 04-design/desktop-spec.md (specs de layout)
- 04-design/assets-notes.md (notas de assets, prompts para hero/editorial)
- 05-copy/body-copy.md (todo el copy final)
- 05-copy/subject-lines.md (asunto recomendado)
- 05-copy/preheaders.md (preheader recomendado)
- 05-copy/cta-options.md (CTAs finales)
- brands/nike/tokens/brand-tokens.json v2.2.4
- patterns/fotografia-primero.md
- engine/schema/campaign-data.schema.json

## Required Action
1. Producir campaign-data.json validado contra el schema (ajv)
2. Ejecutar generate-hero-image para generar el banner hero del AF1
3. Generar imagen editorial (detalle AF1)
4. El JSON debe pasar validación del schema

## Data sources for JSON

| Módulo | Component | Data source |
|---|---|---|
| header-logo | header-logo | brand pack (logo PNG) |
| hero-imagen | hero-imagen | Copy (H1: "Air Force 1"), subtitle, CTA1 + generated hero image |
| intro-cta | intro-cta | Copy (body de 39 palabras), sin CTA propio |
| editorial-foto-texto | editorial-foto-texto | Copy (eyebrow, title, body, CTA2) + generated editorial image |
| columns-3-sin-icono | columns-3-beneficios-sin-icono | 3 items del copy |
| banda-cierre | banda-cierre | Copy (title, body, CTA3) |
| footer | footer | Placeholder legal |

## Expected Output
- 06-data/campaign-data.json (validado)
- brands/nike/design-input/hero-banner.png
- brands/nike/design-input/editorial-af1-detail.png
- Ruta de output para build de 07: newsletters/2026/nike/2026-jul-nike-air-force-one/09-exports/
