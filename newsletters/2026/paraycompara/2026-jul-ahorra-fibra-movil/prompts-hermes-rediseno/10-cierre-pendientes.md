# PROMPT 10 — Cierre de todos los pendientes abiertos (rondas 06, 07 y 08)

## CONTEXTO

Eres el Orchestrator de Hermes. Una re-auditoría externa
(`docs/re-auditoria-sistema-hermes-2026-07-17.md`) encontró que varias rondas cerraron
su objetivo principal pero dejaron pendientes abiertos que nadie recogió después. El más
grave: **el archivo oficial de envío tiene los iconos viejos**. Esta ronda cierra TODO
lo abierto de golpe. No introduce ningún cambio de diseño nuevo.

## DEFECTO CRÍTICO N1 — Inline desincronizado (prioridad máxima)

Cadena verificada:

1. La ronda 07 integró los 8 iconos oficiales en `v5-premium/final-premium-v2.html`
   (10:07) pero NO regeneró el inline (`final-premium-v2-inline.html` es de las 09:29,
   con 0 referencias a `icon-tarifa-*`/`icon-aspecto-*`).
2. La ronda 08 (12:36) copió ese inline desactualizado a `09-exports/final-inline.html`
   y lo certificó como fuente única.

Resultado: `09-exports/final.html` (fuente) y `09-exports/final-inline.html` (envío)
son piezas distintas. Corrige:

1. Regenera `v5-premium/final-premium-v2-inline.html` desde
   `v5-premium/final-premium-v2.html` con juice (`preserveMediaQueries: true` —
   recuerda `require('juice').default`).
2. Copia el inline regenerado a `09-exports/final-inline.html`.
3. Verifica paridad: mismo número de referencias a iconos nuevos en fuente e inline
   (deben ser 8 y 8), y que el inline no contiene ningún `icon-*` con nombre viejo.
4. Captura de verificación 320/600 del inline regenerado (los iconos del CDN saldrán
   como placeholder desde el sandbox — no es error; lo que se verifica es estructura).

## DEFECTOS DEL PROMPT 06 (nunca ejecutado — ejecutar ahora)

1. **task-log.md incompleto**: registrar una entrada por cada ronda Hermes no registrada:
   02 (hero), 03 (ritmo), 04 (assets/tipografía), 05 (QA final), 07 (iconos oficiales).
   APPEND, nunca reescribir el archivo entero (lección DemoSolar).
2. **Fecha errónea**: `v5-premium/redesign-summary.md` dice "Fecha: 2026-07-15" —
   las rondas se ejecutaron el 2026-07-17. Corregir.
3. **Contraste del CTA mal documentado**: `#FFFFFF sobre #FF5A3C = 3.10:1` se dio por
   bueno como "large text" con 16px bold — incorrecto (el umbral WCAG de texto grande
   bold es ≥18.66px). Elige e implementa UNA salida:
   - **Opción A (recomendada)**: subir el CTA a 19px bold en HTML y VML de ambos
     botones; verificar con captura que no rompe a 320px. Con 19px bold sí aplica el
     umbral 3:1 y el 3.10:1 pasa legítimamente.
   - **Opción B**: mantener 16px y documentar el FAIL de AA en `qa-report.md` como
     riesgo aceptado de marca — como riesgo, nunca como PASS.
   Si eliges A, regenera el inline OTRA VEZ después (el orden correcto de esta ronda es:
   primero decidir A/B, luego una única regeneración de inline que lo incluya todo).

## CABOS SUELTOS DE LA RONDA 07

1. **Referencia rota**: `rondas/assets/qa-report-assets.md` apunta a
   `rondas/ronda07/qa-report.md`, que no existe. Crea `rondas/ronda07/qa-report.md`
   documentando la ronda 07 real: SVGs descargados, PNGs generados (tamaños/pesos),
   integración en la pieza, decisión sobre trust bar y pasos 01-03, capturas
   `after-icons-{320,375,600}.png` ya existentes.
2. **`icon-system-spec.md` sin actualizar**: el prompt 07 exigía que el set oficial
   sustituyera a la spec de encargo. Añade la sección: set oficial integrado (8 iconos,
   origen paraycompara.com, fecha), propuesta de la ronda 04 rechazada por el usuario,
   variantes white archivadas como base del futuro dark mode.
3. **Recordatorio de subida al CDN**: los 8 PNGs siguen solo en local. NO puedes subirlos
   tú — es acción manual del usuario. Asegúrate de que `next-steps.md` lo lista como
   primer paso bloqueante, con referencia a `09-exports/assets/ASSETS_PRODUCCION.md`.

## CIERRE

Sincroniza los 4 archivos de control con todo lo anterior. En `campaign-status.md` deja
constancia de que la fuente única (ronda 08) queda ahora sí con paridad fuente/inline
verificada.

## RESTRICCIONES

- Cero cambios de diseño, composición o copy (excepto el tamaño del CTA si eliges opción A).
- No tocar: VML (salvo font-size del CTA en opción A), UTM, placeholders legales,
  headings, metas light.
- No actuar sobre la fusión de tokens (prompt 09) — es la siguiente ronda, no esta.
- Una sola regeneración final de inline que incluya todos los cambios de esta ronda.

## CRITERIOS DE ACEPTACIÓN

- [ ] Fuente e inline con 8/8 referencias a iconos oficiales; 0 nombres viejos en ambos
- [ ] `09-exports/final.html` y `final-inline.html` idénticos a sus originales de v5-premium
- [ ] task-log.md con las rondas 02, 03, 04, 05 y 07 registradas (append, sin pérdidas)
- [ ] Fecha de redesign-summary.md corregida a 2026-07-17
- [ ] CTA: opción A con captura 320/600, o opción B documentada como riesgo (no PASS)
- [ ] `rondas/ronda07/qa-report.md` existe y la referencia rota queda válida
- [ ] `icon-system-spec.md` actualizado con el set oficial y el rechazo de la propuesta
- [ ] next-steps.md lista la subida al CDN como primer bloqueante
- [ ] 4 archivos de control sincronizados
