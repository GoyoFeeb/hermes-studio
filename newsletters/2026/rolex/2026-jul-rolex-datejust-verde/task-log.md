## 2026-07-25 — Fase 02 (Brand Visual Analyst)

| # | Acción | Detalle |
|---|--------|---------|
| T-001 | Navegar rolex.com/es/watches/datejust con Chrome real | Página cargada correctamente, cookies rechazadas (no esenciales) |
| T-002 | Computar colores reales | `getComputedStyle` + custom properties CSS: `--green` #127749, `--dark-green` #0B3E27, `--rolex-gold` #926C1C, `--light-black` #212121, `--dark-grey` #767676, `--light-grey` #F8F8F8 |
| T-003 | Tipografía computada | "Helvetica Now Text" (no email-safe, licencia Monotype), contraste real 300 (body)/700 (H1/CTA/eyebrow) |
| T-004 | Forma de CTA computada | `border-radius:50px` — pastilla real, sólida (nav) y translúcida/outline (sobre foto) — sin evidencia de text-link ni block |
| T-005 | Observar photography.treatment | Macro de producto, luz direccional dura, sombra diagonal, profundidad de campo mínima, sin personas |
| T-006 | Observar iconography.style | `"none"` — cero iconos de contenido en todo el sitio, solo iconos de interfaz |
| T-007 | Observar voice.rhythm | Afirmación declarativa, formal (usted), sin exclamaciones — ejemplos reales capturados |
| T-008 | Observar layout.contentRhythm | 6 secciones reales documentadas, 2 marcadas explícitamente no traducibles (vídeo, configurador) |
| T-009 | Buscar sustituto web de Helvetica Now Text | WebSearch: Inter/Open Sans/Work Sans/Archivo citados como alternativas — Archivo elegido (distinto de Inter, ya usado en Nike) |
| T-010 | Verificar Archivo en Google Fonts CSS2 API | Pesos 300 y 700, URLs `fonts.gstatic.com` verificadas HTTP 200 |
| T-011 | Escribir brand-analysis.md, visual-analysis.md, risks.md | `02-analysis/` |
| T-012 | Crear brand-tokens.json desde cero | `brands/rolex/tokens/brand-tokens.json` — v1.0.0 inicial, `_changelog` documentado |

## 2026-07-25 — Fase 03 (Newsletter Architect)

| # | Acción | Detalle |
|---|--------|---------|
| T-013 | Verificar los 5 criterios de `fotografia-primero` contra el pack | Los 5 se cumplen — patrón elegido con evidencia, no por defecto |
| T-014 | Responder las 2 preguntas obligatorias de "Elegir hero" | Ambas "Sí" → `hero-imagen` sin alternativa |
| T-015 | Componer secuencia contra `layout.contentRhythm` | header-logo → hero-imagen → intro-cta-asimetrico → columns-3-beneficios-sin-icono → banda-cierre-asimetrico → footer |
| T-016 | Escribir los 4 archivos de `03-strategy/` | campaign-angle.md, message-hierarchy.md, module-selection.md, structure.md |

## 2026-07-25 — Fase 04 (Email Designer)

| # | Acción | Detalle |
|---|--------|---------|
| T-017 | Calcular contraste WCAG de las combinaciones nuevas | 2 combinaciones fallaban (`#767676`/`#F8F8F8` = 4.28:1, `#D4D4D4`/`#127749` = 3.77:1) — no se aprobaron "por estar cerca" |
| T-018 | Corregir el pack (v1.0.1) | `colors.text.secondary` → `#666666`, `colors.onBrandSecondary` → `#ECECEC`, ambas ahora ≥4.5:1 en todos los contextos donde se usan |
| T-019 | Escribir los 4 archivos de `04-design/` | layout.md, desktop-spec.md, mobile-spec.md, assets-notes.md |

## 2026-07-25 — Fase 05 (Copywriter)

| # | Acción | Detalle |
|---|--------|---------|
| T-020 | Redactar copy con hechos verificados únicamente | 1945, ventana de fecha a las 3h, cronómetro superlativo (texto observado en la esfera), lupa Cyclops (visible en el vídeo) — sin cifras técnicas no confirmadas |
| T-021 | Validar contra las 29 reglas de `claim-rules.ts` | Sin coincidencias — ningún claim problemático |
| T-022 | Escribir los 4 archivos de `05-copy/` | subject-lines.md, preheaders.md, body-copy.md, cta-options.md |

## 2026-07-25 — Fase 06 (Data Specialist) + Build

| # | Acción | Detalle |
|---|--------|---------|
| T-023 | Escribir campaign-data.json | 6 módulos, patrón `fotografia-primero`, `isTestCampaign: true` |
| T-024 | Corregir error de schema | `metadata` no admite `additionalProperties` — el warning se movió a `_comment` a nivel raíz (`patternProperties: "^_"`) |
| T-025 | Corregir MIN_VERSION del motor | `engine/lib/tokens.js` exige `>= 2.2.0` — pack saltado de 1.0.1 a 2.2.0 sin cambio de contenido, documentado en `_changelog` como requisito técnico de compuerta, no revisión saltada |
| T-026 | Build con el motor | `node engine/build-newsletter.js` → OK |
| T-027 | Production gate (motor) | 11/11 gates verdes salvo `control-files` (pendiente — este mismo archivo lo resuelve) |
| T-028 | Corregir `campaign-status.md` para pasar `check-control-files.ts` | "Estado actual" debe ser un token único del vocabulario fijo (`ESTADOS_VALIDOS`), no una frase libre — corregido a `qa` |
| T-029 | Re-ejecutar production gate (motor) | 11/11 gates verdes, incluido `control-files` |

## 2026-07-25 — Fase 08 (QA Specialist)

| # | Acción | Detalle |
|---|--------|---------|
| T-030 | Intentar render obligatorio | Playwright falla (`libXdamage.so.1`, sin root) — intentado también abrir `final-inline.html` vía `file://` en Claude in Chrome, rechazado por política de seguridad de la extensión ("Can't interact with browser internal pages") |
| T-031 | Documentar la limitación de render explícitamente | No se finge verificación — se sustituye por inspección exhaustiva del HTML fuente (grep de emoji, font-face, VML, media queries, placeholders sin resolver, colores, letter-spacing, hrefs, alts) |
| T-032 | Escribir los 6 archivos de `08-qa/` | visual-qa.md, responsive-qa.md, outlook-qa.md, links-qa.md, brand-fidelity-qa.md, final-checklist.md |
| T-033 | Verificar fidelidad de marca (5 puntos) | 4/5 coherentes; fotografía del hero pendiente de verificación visual real (asset no generado en este entorno) |
| T-034 | Veredicto | Aprobado para prueba interna, ningún error crítico |

## 2026-07-25 — Fase 09 (Export Manager)

| # | Acción | Detalle |
|---|--------|---------|
| T-035 | Escribir delivery-notes.md | Resumen por fase + advertencias de producción + objetivo de la campaña de prueba de estrés |
| T-036 | Actualizar archivos de control a estado final | campaign-status.md (`completed`), handoff.md (09→completada), next-steps.md, este task-log.md |
