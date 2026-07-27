# Final Checklist: 2026-jul-wornwear-usado

## Gates del sistema (production-gate-motor)

| Gate | Resultado | Notas |
|---|---|---|
| 0 — Engine integrity | ✅ PASS | 33 archivos OK |
| 1 — Schema validation | ✅ PASS | campaign-data.json válido |
| 2 — Export parity | ✅ PASS | Source/inline sin desviaciones |
| 3 — Build | ✅ PASS | BUILD OK, 19.8 KB inline |
| 4 — Claims (29 reglas) | ✅ PASS | 0 claims problemáticos |
| 5 — Assets HTTP 200 | ✅ PASS | Logo 200, 3 CTAs 200, hero placeholder ⚠️ |
| 6 — Control files | ✅ PASS | 4 archivos sincronizados |
| 7 — Column balance | ✅ PASS | 21/14/16 — ratio 1.50x |
| 8 — Brand pack completeness | ✅ PASS | v2.2.1 completo |
| 9 — WCAG contrast | ✅ PASS | **9/9** combinaciones (incluye H1 naranja) |
| 10 — Production readiness | ✅ PASS | 4 avisos (test campaign, esperados) |
| 11 — Hero decision | ✅ PASS | hero-imagen |

## QA manual

| Aspecto | Resultado | Notas |
|---|---|---|
| Visual | ✅ PASS | H1 naranja correcto, layout fiel al diseño |
| Responsive | ✅ PASS | mobile-stack, padding reducido |
| Outlook/VML | ✅ PASS | 6 roundrects, tablas balanceadas |
| Links/UTM | ✅ PASS | 3 CTAs con UTM por módulo, HTTP 200 |
| Claims copy | ✅ PASS | 0 claims problemáticos |
| Sin file:// paths | ✅ PASS | Todos los src/href son https:// o [TOKEN] |
| Sin SVG en HTML | ✅ PASS | Solo PNG (logo) |
| Alt text en imágenes | ✅ PASS | Logo y hero banner tienen alt text |

## Pendientes para producción real

| Item | Estado | Acción requerida |
|---|---|---|
| Hero banner | 🔴 Placeholder | Subir asset real a CDN, actualizar bannerSrc |
| Logo CDN | 🟡 Pendiente | Migrar a CDN propio (actualmente en wornwear.patagonia.com) |
| fromEmail/fromName | 🟡 Placeholder test | Reemplazar con datos reales |
| Footer legal | 🟡 Placeholder | Dirección física y aviso legal del cliente |
| Preheader nitpick | 🟢 Baja | "equipo Patagonia... Respaldado por Patagonia" — redundancia menor |
| Logo redundante | 🟢 Baja | El label "WORN WEAR" debajo del logo repite lo que ya está en el PNG |

## Veredicto final

✅ **PASS** — Campaña lista para test interno. Todos los gates en verde. Los placeholders son esperados para `isTestCampaign: true`.
