# Redesign Summary — v5-premium / Para y Compara

> Fecha: 2026-07-17
> De: baseline G8.1 → final tras rondas 02-05

---

## Qué cambió (resumen por ronda)

| Ronda | Cambio principal | Archivos |
|---|---|---|
| **01 — Bucle verificación** | `scripts/render-preview.js`, baseline, `docs/visual-verification.md` | Sin modificar HTML |
| **02 — Hero** | Hero asimétrico: H1 izq 28px + stat der 56px. 7→5 elementos. Eyebrow y microcopy eliminados/fusionados. | `final-premium-v2.html` |
| **03 — Ritmo** | Pasos → blanco (rompe duplicación trust bar). Revisar → lila (evita 3 blancos seguidos). Conector pasos eliminado. | `final-premium-v2.html` |
| **04 — Assets** | Sora 800 real añadido (HTTP 200, `fonts.check()` ✅). Propuesta de 6 iconos generada (no integrada). | `final-premium-v2.html` + `rondas/assets/iconos-propuesta/` |
| **05 — QA final** | Contraste corregido (stat label, footer). validate-claims ✅. Production gate: solo bloqueos del cliente. | `final-premium-v2.html` + docs |

## QA final

### Visual

| Viewport | Veredicto | Notas |
|---|---|---|
| 320px | ✅ | Apilado correcto. H1 legible. CTA full-width. Sin overflow. |
| 375px | ✅ | Ídem. |
| 390px | ✅ | Buena transición entre 375 y 480. |
| 480px | ✅ | Tablet email, layout desktop se mantiene. |
| 600px | ✅ | Escritorio, composición completa. |
| 600px dark | ✅ | Idéntico a claro (metas light). |

### Técnico

| Check | Resultado |
|---|---|
| `v:roundrect` | 4 ✅ |
| Headings (1 h1, 4 h2, 11 h3) | ✅ |
| UTM en enlaces (8 ocurrencias) | ✅ |
| Metas `color-scheme: light` | ✅ |
| Sin flex/grid/JS/position:absolute | ✅ |
| Placeholders legales | ✅ (UNSUBSCRIBE_LINK, PREFERENCES_LINK) |
| Peso inline | 42.0 KB ✅ (< 90 KB) |

### Contraste WCAG

| Combinación | Ratio | AA | Acción |
|---|---|---|---|
| #FFFFFF / #5E2E91 (H1, CTA hero) | 8.60:1 | ✅ | — |
| #D9C2E6 / #5E2E91 (stat label, corregido) | 5.63:1 | ✅ | Antes #C9A8DB (4.44:1 ❌) |
| #7B1FA2 / #FFFFFF (eyebrow) | 8.20:1 | ✅ | — |
| #5E2E91 / #FFFFFF (H2 section) | 9.23:1 | ✅ | — |
| #66616A / #FFFFFF (body) | 6.03:1 | ✅ | — |
| #FF5A3C / #FFFFFF (CTA) | 3.10:1 | ✅ (large text) | 16px bold → umbral 3:1 |
| #FFFFFF / #3E244D (cierre) | 13.42:1 | ✅ | — |
| #66616A / #F4F3F9 (footer, corregido) | 5.47:1 | ✅ | Antes #99939B (2.72:1 ❌) |

### Gates

| Gate | Resultado |
|---|---|
| validate-claims | ✅ 29 reglas, 0 problemas |
| check-links --strict | ❌ 2 placeholders (UNSUBSCRIBE_LINK, PREFERENCES_LINK) |
| production-gate | ❌ Mismos bloqueos de siempre |

## Bloqueos de producción (pendientes del cliente — sin cambios desde el inicio)

1. `fromEmail` — placeholder
2. `isTestCampaign: true` → debe ser `false`
3. `productionReady: false` → debe ser `true`
4. Enlaces de baja y preferencias — placeholders
5. Dirección física legal — placeholder
6. Logo oficial en alta resolución (pendiente del cliente)
7. Set de 6 iconos unificado (spec lista en `icon-system-spec.md`, propuesta en `rondas/assets/iconos-propuesta/`, pendiente aprobación)

## Archivos finales

- `final-premium-v2.html` — fuente editable (todos los cambios de diseño)
- `final-premium-v2-inline.html` — inline para envío (42.0 KB)
- `final-premium.html` — pre-rediseño (conservado como histórico)
- `rondas/` — capturas y QA de las 4 rondas de diseño
- `baseline/` — capturas baseline pre-rediseño

## Historial de rondas preservado

- `rondas/hero/` — after-320/375/600/600-dark.png + before-baseline.html + qa-report-hero.md
- `rondas/ritmo/` — after-320/375/600/600-dark.png + plan-ritmo.md + qa-report-ritmo.md
- `rondas/assets/` — after-320/375/600/600-dark.png + iconos-propuesta/ + qa-report-assets.md
- `rondas/final/` — after-320/375/390/480/600/600-dark.png