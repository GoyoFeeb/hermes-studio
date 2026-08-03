# Adidas — 2026-jul-adidas-premium-run

## Información general

| Campo | Valor |
|---|---|
| Cliente | Adidas |
| Campaña | 2026-jul-adidas-premium-run |
| Fecha de creación | 2026-07-28 |
| Estado actual | created |
| Formato | Motor HTML + juice (`engine/`) |
| Sistema | Hermes Newsletter System v2 |

## Estructura de la campaña

Esta carpeta contiene todos los archivos de la campaña, organizados por fases:

| Carpeta | Fase |
|---|---|
| `00-brief/` | Briefing y requisitos |
| `01-inputs/` | Materiales brutos, assets, referencias |
| `02-analysis/` | Análisis visual y de marca |
| `03-strategy/` | Arquitectura y estrategia |
| `04-design/` | Especificación visual y técnica |
| `05-copy/` | Contenido textual |
| `06-data/` | Datos estructurados (`campaign-data.json`) |
| `07-code/` | Build del motor / notas técnicas |
| `08-qa/` | Informes de calidad |
| `09-exports/` | Entregables finales |

## Flujo de trabajo

1. **Briefing** — 01-Briefing Strategist → `00-brief/*.md`
2. **Análisis visual** — 02-Brand Visual Analyst → `02-analysis/*.md`
3. **Arquitectura** — 03-Newsletter Architect → `03-strategy/*.md`
4. **Diseño técnico** — 04-Email Designer → `04-design/*.md`
5. **Copy** — 05-Copywriter → `05-copy/*.md`
6. **Datos estructurados** — 06-Newsletter Data Specialist → `06-data/campaign-data.json`
7. **Build del motor** — 07-HTML Email Developer → `engine/build-newsletter.js`
8. **QA** — 08-Email QA Specialist → `08-qa/*.md`
9. **Exportación** — 09-Export Manager → `09-exports/*`

## Archivos de control

| Archivo | Propósito |
|---|---|
| `campaign-status.md` | Estado actual de la campaña |
| `task-log.md` | Registro de decisiones importantes |
| `handoff.md` | Handoff entre fases (se sobrescribe) |
| `next-steps.md` | Próximos pasos después de cada fase |
| `blocked-reason.md` | Razón de bloqueo (solo si aplica) |
| `approval-needed.md` | Solicitud de aprobación (solo si aplica) |
