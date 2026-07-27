# PROMPT 14 — Prueba de fuego: regenerar la piloto desde el motor

## CONTEXTO

Eres el Orchestrator de Hermes. El motor está completo (componentes + schema + patrón +
ensamblador). Esta ronda responde la única pregunta que importa: **¿el motor reproduce
la calidad premium validada?** Si la pieza regenerada desde datos es visualmente
equivalente al original de 15 rondas, el conocimiento premium está capturado y F1 queda
cerrada. Si no, los defectos encontrados se corrigen EN EL MOTOR (componentes/data/build),
nunca retocando el output a mano.

Referencia original: `newsletters/2026/paraycompara/2026-jul-ahorra-fibra-movil/v5-premium/final-premium-v2.html`
(y su inline). Entrada del build: `engine/schema/campaign-data.example.json`.

## TAREAS

1. **Build**: ejecutar `build-newsletter.js` con el example.json →
   `engine/_test-output/` (NO sobre la campaña real).

2. **Paridad estructural** (automatizable, hazla primero — es barata):
   - Conteos: tablas, `v:roundrect`, h1/h2/h3, `<img>`, enlaces UTM, placeholders
     legales — original vs regenerado, deben ser idénticos.
   - Grep de tokens de marca: mismos hex, mismas ocurrencias (±0).
   - Peso inline comparable (±10%).

3. **Paridad visual** (la decisiva):
   - `render-preview.js` sobre AMBAS piezas: original y regenerada, a 320/375/600/600-dark.
     (Si el entorno perdió el stub de libXdamage, recompílalo — receta en
     `v5-premium/qa-report.md` § G8.1.)
   - Comparar los pares de capturas una a una, de arriba abajo, sección por sección.
     Método: misma altura total (±2%), y revisión visual de cada sección anotando
     CUALQUIER diferencia — espaciado, tipografía, sombras, radios, alineación.
   - Si tienes forma de hacer diff de píxeles (p. ej. `pixelmatch` vía npm), añádelo
     como evidencia complementaria; si no, la inspección visual documentada basta.

4. **Informe**: `engine/_test-output/parity-report.md` con:
   - Tabla de paridad estructural (conteo a conteo).
   - Tabla de paridad visual por sección y viewport (✅ idéntico / ⚠️ diferencia menor /
     ❌ diferencia visible), con la captura de evidencia referenciada.
   - Veredicto global: APTO / NO APTO.

5. **Si hay diferencias**: corregir en el motor (componente, example.json o build),
   volver a construir, volver a capturar. Iterar hasta veredicto APTO o hasta
   documentar diferencias aceptadas explícitamente (con captura y justificación).
   Cada iteración se anota en el parity-report.

6. **Cierre de F1**: actualizar `engine/CHANGELOG.md` con el veredicto y, si es APTO,
   marcar en el README del pack (`prompts-fase1-motor/README.md`) la fase como
   completada. Registrar en `docs/` una nota breve
   (`f1-motor-cerrado.md`): fecha, veredicto, iteraciones necesarias, limitaciones
   conocidas.

## RESTRICCIONES

- PROHIBIDO editar el output regenerado a mano para que "cuadre" — invalidaría la
  prueba entera. Solo se corrige motor, data o build.
- PROHIBIDO tocar el original o cualquier archivo de la campaña piloto.
- Los iconos del CDN no cargan desde el sandbox (allowlist) — aparecen como placeholder
  en AMBAS piezas por igual; no cuenta como diferencia.
- Si tras 3 iteraciones sigue NO APTO, para y reporta las diferencias restantes con
  capturas — decisión del usuario, no tuya.

## CRITERIOS DE ACEPTACIÓN

- [ ] Paridad estructural: todos los conteos idénticos
- [ ] Paridad visual: todas las secciones ✅ (o ⚠️ aceptadas y documentadas) en los 4 viewports
- [ ] `parity-report.md` completo con evidencia e iteraciones
- [ ] Veredicto explícito APTO / NO APTO
- [ ] Sin ediciones manuales del output (el build regenera bit a bit el resultado final)
- [ ] CHANGELOG + nota de cierre de F1 en docs/
