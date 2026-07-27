# QA Report — Ronda Assets y Tipografía

> 2026-07-15

---

## 1. Sora 800 — REAL verificada ✅

| Check | Resultado |
|---|---|
| URL woff2 obtenida de Google Fonts CSS API | ✅ `https://fonts.gstatic.com/s/sora/v17/xMQOuFFYT72X5wkB_18qmnndmSfSmU-NKQI.woff2` |
| HTTP 200 verificado | ✅ (14.9 KB, font/woff2) |
| URL distinta a la del 700 | ✅ (Sora 700: `xMQ9uFFYT72X5wkB_...V6-x.woff2`, 24.7 KB) |
| @font-face añadido al HTML | ✅ |
| Font carga real en Chromium | ✅ HTTP 200, `font-family: Sora, "Segoe UI", Arial`, `font-weight: 800` |
| `document.fonts.check('800 1em Sora')` | ✅ **true** — no es fallback sintetizado |
| Captura post-cambio | ✅ Generada en `rondas/assets/after-600.png` |

## 2. Iconos — propuesta generada

Inputs del cliente (`01-inputs/images/`): **vacío** (solo `.gitkeep`). CDN actual: 4 PNGs de tarifa con pesos dispares (1.8—3.9 KB, diferencia 2x, documentada desde G3).

**Propuesta generada** en `rondas/assets/iconos-propuesta/`:

| Archivo | Tamaño | Descripción |
|---|---|---|
| `icon-movil@2x.png` | 550 B | Auricular teléfono, trazo 2px, 96×96 |
| `icon-fibra@2x.png` | 582 B | Señal WiFi 3 arcos, trazo 2px |
| `icon-convergente@2x.png` | 649 B | Móvil + WiFi combinado |
| `icon-tv@2x.png` | 418 B | Pantalla TV con soporte |
| `icon-check-20@2x.png` | 430 B | Check para trust bar (círculo 20px) |
| `icon-check-24@2x.png` | 430 B | Check para lista premium (círculo 24px) |
| `contact-sheet.png` | 2.0 KB | Lámina con los 6 en fila sobre fondo blanco |

**Todos bajo 1 KB** (spec pedía <6 KB). Sin integrar — pendiente de aprobación explícita. Al aprobarse, los checks tipográficos `✓` se sustituyen por `<img>` según `icon-system-spec.md`.

## 3. Auditoría de peso de assets

| Asset | HTTP | Peso | Tipo | Riesgo |
|---|---|---|---|---|
| Sora 700 woff2 | 200 | 24.7 KB | font/woff2 | ✅ |
| Sora 800 woff2 | 200 | 14.5 KB | font/woff2 | ✅ |
| Logo PyC | 200 | 10.1 KB | image/png | ✅ |
| Icono fibra+móvil | 200 | 3.8 KB | image/png | ✅ |
| Icono fibra | 200 | 2.8 KB | image/png | ✅ |
| Icono TV | 200 | 2.5 KB | image/png | ✅ |
| Icono móvil | 200 | 1.8 KB | image/png | ✅ |
| brand-pattern-tile | **404** | 1.2 KB | text/html | ⚠️ Asset no subido al CDN |

**Ningún asset supera 100 KB.** El patrón decorativo `brand-pattern-tile.png` da 404 en el CDN — necesita subirse. Outlook y Gmail ignoran el `background` HTML y usan el `bgcolor` de fallback, así que no hay rotura visual, pero el tile no aparece en los clientes que sí lo soportan.

## 4. Verificaciones

| Check | Resultado |
|---|---|
| Inline regenerado (42.0 KB) | ✅ |
| Tags balanceados | ✅ |
| Pieza no modificada en composición/copy | ✅ (solo @font-face añadido) |
| Dark mode = claro | ✅ Mismo SHA256 |

## Archivos de ronda

- `rondas/assets/after-{320,375,600,600-dark}.png`
- `rondas/assets/iconos-propuesta/` — 6 PNGs + contact-sheet (propuesta, **RECHAZADA** en ronda 07 — el set oficial integrado está documentado en `rondas/ronda07/qa-report.md`)