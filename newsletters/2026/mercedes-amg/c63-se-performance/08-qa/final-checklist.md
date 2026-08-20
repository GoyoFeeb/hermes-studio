# Final Checklist QA — Mercedes-AMG C 63 S E PERFORMANCE

> Fase 08 (Email QA Specialist). Fecha: 2026-08-20.

## Checklist de QA

| # | Check | Resultado |
|---|---|---|
| 1 | Schema (ajv) | ✅ BUILD OK |
| 2 | Claims gate (29 reglas) | ✅ 0 problemas |
| 3 | Parity fuente/inline | ✅ Sin desviaciones |
| 4 | Overflow desktop 1280 | ✅ scrollWidth=1280 |
| 5 | Overflow mobile 375 | ✅ scrollWidth=375 (post-fix motor) |
| 6 | Overflow mobile 320 | ✅ scrollWidth=320 (post-fix motor) |
| 7 | Contraste WCAG (check-contrast) | ✅ CTA 6.77:1, H1 21:1, body 8.19:1; eyebrow/label corregidos a #8F1418 (6.14:1) |
| 8 | Enlaces HTTP 200 | ✅ 6/6 (3 páginas + 3 imágenes) |
| 9 | Presupuesto de marca | ✅ «C 63» = 3; «Mercedes-AMG» = 3 (medido en el HTML final) |
| 10 | CTAs únicos | ✅ 4 strings distintos, 4 verbos distintos (descubrir/sentir/conocer/configurar) |
| 11 | Copy verbatim de 05 | ✅ Sin ediciones |
| 12 | ?fm=jpg en imágenes | ✅ 3/3 |
| 13 | Logo real (imagen, no CSS) | ⚠️ PENDIENTE embed (agente 09) — placeholder hasta entonces |
| 14 | Sin placeholders [corchetes] | ✅ Salvo tokens legales del schema ([UNSUBSCRIBE_LINK], [PREFERENCES_LINK], [DIRECCIÓN FÍSICA]) que son el formato estándar del motor para el cliente final |
| 15 | Outlook VML | ⚠️ Deuda H2 (arcsize 50% → pastillas en Outlook desktop), documentada |
| 16 | NORMA 600px | ⚠️ Deuda H1 aceptada por el usuario (fondo expandido del motor; migración PENDING) |

## Estado

- ✅ **Prueba interna**: PASA (funcional, sin bloqueos técnicos tras el fix del motor).
- ⛔ **Producción**: BLOQUEADA (esperado) hasta: logo subido a CDN o embed final, línea legal
  WLTP ES oficial (Q-005), resolución de deudas H1/H2 (NORMA 600px + VML Outlook) y aprobación
  del cliente de specs (Q-001..Q-004).

## Archivos de QA

- visual-qa.md, responsive-qa.md, outlook-qa.md, links-qa.md (este checklist)
- Renders: 08-qa/preview-*.png (render-preview) + 09-exports/final-{1280,375,320}.png
  (Playwright post-fix)
