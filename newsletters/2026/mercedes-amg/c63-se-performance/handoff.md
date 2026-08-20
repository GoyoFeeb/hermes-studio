# Handoff

## From

Agente anterior: 09 — Export Manager (fase export)

## To

Orchestrator (00) + usuario — cierre de campaña

## Context

Exportación completada: production-gate-motor ✅ 13/13, logo embebido (base64 del PNG NEGRO
derivado del SVG oficial — el blanco era invisible en el header blanco del motor, detectado por
muestreo de píxeles en QA y corregido), renders finales con logo visible (verificado por
visión), delivery-notes.md escrito. Pack actualizado a v2.5.0 (nuevo asset logoPngRaster negro,
changelog documentado).

## Files to Read

- 09-exports/delivery-notes.md (estado completo + bloqueos)
- 09-exports/final.html, final-inline.html, preview-final-*.png
- 08-qa/final-checklist.md

## Required Action

- Revisión del usuario del preview final (logo visible).
- Decisión de cierre: campaña como PRUEBA completada (isTestCampaign true) vs esperar los
  pendientes Q-001..Q-005 para producción.

## Constraints

- NO marcar completed hasta la decisión del usuario.
- En Gmail web los data URIs se bloquean: el logo base64 funciona en navegador/Apple Mail/
  Outlook desktop, pero para Gmail web el PNG debe subirse al CDN (pendiente del cliente).

## Risks

- Q-001..Q-005 (precio, disponibilidad, Vmax, superlativo, legal WLTP ES) bloquean producción.
- Deudas del motor: NORMA 600px (H1, aceptada) y VML Outlook arcsize (H2) — migración futura.

## Expected Output

- Estado de campaña: export → completed (prueba) tras aprobación del usuario.
