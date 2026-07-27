# Task Log

| Fecha | Hito | Agente | Resultado |
|---|---|---|---|
| 2026-07-21 | Campaña creada fuera del motor: `campaign-data.json` en formato antiguo (`{type,content}`), `final.html` escrito a mano | (sesión externa, sin control files) | ⚠️ Sin gates, sin build-manifest |
| 2026-07-22 | Usuario reporta columnas/tarjetas desalineadas (captura) | Usuario | — |
| 2026-07-22 | Diagnóstico: campaña fuera del motor por completo (no `{component,data}`, sin `build-manifest.json`, sin control files). Causa raíz del bug: badge de promo dentro de 1 sola columna de 3 + textos de longitud muy desigual; grid de categorías sin garantía de ancho de columna entre filas | 00→02 | ✅ Diagnosticado |
| 2026-07-22 | Decisión con el usuario: "Motor completo" (construir componentes + patrón nuevo + migrar) en vez de parche del HTML a mano | Usuario | ✅ |
| 2026-07-22 | Brand pack nuevo `brands/uax/tokens/brand-tokens.json` v2.2.0 — colores/logo observados del original, contrastes WCAG recalculados | 02 | ✅ |
| 2026-07-22 | 5 componentes nuevos del motor (header-logo, intro-cta, columns-3-beneficios, category-grid, usp-cards) + patrón `institutional.md` + adaptadores + ramas de schema | 03/07 | ✅ Procedimiento de 5 pasos de `engine/README.md` |
| 2026-07-22 | Fix de motor: `{{#each}}` no soportaba anidamiento (regex no-greedy cerraba en el primer `{{/each}}` interior) — necesario para `category-grid` (filas de 3). Corregido en `lib/assemble.js` con parser de profundidad balanceada. Verificado sin regresión: rebuild de `2026-jul-comparar-tv`, `2026-jul-revision-verano` y `2026-jul-comparar-luz-gas` — `cmp` byte a byte IDÉNTICO en los 3 | 07 | ✅ |
| 2026-07-22 | Guardarraíl nuevo `scripts/check-column-balance.ts`, añadido como Gate 7 de `production-gate-motor.ts` | 07 | ✅ |
| 2026-07-22 | `campaign-data.json` reescrito al schema real; copy de beneficios reequilibrado (16/15/16 palabras, antes ~12/38/32) | 06 | ✅ ajv 0 errores |
| 2026-07-22 | Build: `node engine/build-newsletter.js` | 07 | ✅ BUILD OK |
| 2026-07-22 | `npm run check-engine -- --update` (25 archivos, incluye los 5 componentes nuevos + assemble.js) | 07 | ✅ |
| 2026-07-22 | `check-column-balance`: 16/15/16 palabras, ratio 1.07x | 08 | ✅ Dentro del margen (límite 1.6x) |
| 2026-07-22 | `production-gate-motor`: ver resultado exacto en `09-exports/delivery-notes.md` | 08→09 | Ver delivery-notes.md |
| 2026-07-22 | Usuario detecta que faltan carpetas de fase frente a `newsletters/_campaign-template` (`02-analysis`, `03-strategy`, `05-copy`, `07-code`, `08-qa`) — la reconstrucción del build no había hecho el backfill de esas carpetas, solo `06-data`/`09-exports`/control files. `01-brand-analysis` y `04-copy` eran restos mal numerados del intento original (2026-07-21, fuera de motor). Renombrados a `02-analysis`/`05-copy` (con addenda documentando qué cambió en la reconstrucción) y rellenadas `03-strategy` (structure/module-selection/campaign-angle/message-hierarchy) y `08-qa` (final-checklist/links-qa/responsive-qa/visual-qa/outlook-qa) con el trabajo real ya hecho — nada inventado, solo reorganizado. `07-code/build-log.md` documenta los 3 intentos de build reales (incluido el fix de `{{#each}}` anidado). Declarado explícitamente lo que NO se hizo: no hay `render-*.png` (sin Chromium/libXdamage montado en esta sesión) | Usuario→00 | ✅ Backfill completo, gap declarado donde sigue abierto |
