# PROMPT 06 — Correcciones post-auditoría (cierre administrativo)

## CONTEXTO

Eres el Orchestrator de Hermes. Las rondas 01-05 del rediseño pasaron auditoría externa
con buen resultado: entregables completos, checks técnicos en verde con paridad exacta
fuente/inline, gate de aprobación de iconos respetado, resultado visual verificado a
320 y 600px. Quedan 3 defectos administrativos y 1 decisión técnica pendiente. Esta
ronda NO cambia el diseño.

## DEFECTOS A CORREGIR

### 1. Archivos de control desincronizados (regla de oro #3 de AGENTS.md)

Los 4 archivos de control se actualizaron por última vez a las 09:03-09:04 (durante la
ronda 01) — las rondas 02, 03, 04 y 05 no están registradas. `task-log.md` termina en
G8.1. Corrige: añade una entrada por ronda ejecutada (02-hero, 03-ritmo, 04-assets,
05-QA final) en `task-log.md`, actualiza `campaign-status.md` (fases 19-22 o equivalente),
`next-steps.md` y `handoff.md` con el estado real post-rediseño.

### 2. Fecha errónea en redesign-summary.md

Dice "Fecha: 2026-07-15". Las rondas se ejecutaron el 2026-07-17. Corrige la fecha.

### 3. Justificación de contraste del CTA técnicamente incorrecta

En el QA final se dio por bueno `#FFFFFF sobre #FF5A3C = 3.10:1` con la justificación
"16px bold → umbral 3:1 (large text)". **Eso es incorrecto**: el umbral WCAG de texto
grande es ≥24px normal o ≥18.66px bold — 16px bold NO califica. El ratio real exigible
es 4.5:1 y el CTA no lo cumple. Es un riesgo PREEXISTENTE (el botón siempre fue así,
no lo introdujo el rediseño), pero la documentación no puede afirmar que pasa AA.
Elige e implementa UNA de estas dos salidas, documentándola:

- **Opción A (recomendada)**: subir la tipografía del CTA a 19px bold en ambos botones
  (HTML y VML) — con eso sí aplica el umbral de texto grande (3:1) y el 3.10:1 pasa
  legítimamente. Verificar con captura que el botón no se rompe a 320px.
- **Opción B**: mantener 16px y documentar honestamente en qa-report.md el FAIL de AA
  como riesgo aceptado de marca (práctica común con colores de CTA corporativos, pero
  debe constar como riesgo, no como PASS).

## DECISIÓN QUE NO ES TUYA (no actuar)

La propuesta de iconos (`rondas/assets/iconos-propuesta/contact-sheet.png`) está
pendiente de aprobación del usuario. NO los integres. Si el usuario los aprueba, será
en un prompt aparte.

## CRITERIOS DE ACEPTACIÓN

- [ ] task-log.md con las 5 rondas registradas; los otros 3 control files coherentes
- [ ] Fecha de redesign-summary.md corregida
- [ ] CTA: opción A implementada con captura de verificación a 320/600, o opción B
      documentada como riesgo (nunca como PASS)
- [ ] Ningún otro cambio en la pieza; checksum del HTML solo cambia si elegiste opción A
- [ ] Inline regenerado solo si cambió la fuente
