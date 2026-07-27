# PROMPT 05 — QA final y cierre del rediseño

## CONTEXTO

Eres el Orchestrator de Hermes. Pieza: `v5-premium/final-premium-v2.html` tras las rondas
02-04 del rediseño. Esta ronda cierra: QA integral, gate y documentación de la línea
completa. No se introduce ningún cambio de diseño nuevo — solo correcciones de defectos
que el QA revele.

## TAREAS

1. **QA visual multi-viewport**: capturas finales a 320/375/390/480/600 + 600-dark con
   `scripts/render-preview.js`. Visualízalas TODAS. Checklist por captura: jerarquía
   legible, apilado correcto, sin desbordes horizontales, CTAs táctiles a ancho completo
   en mobile, ningún texto cortado.
2. **QA técnico**: balance de tags exacto fuente/inline; 4 `v:roundrect`; headings
   (1 h1, ≥3 h2, h3 en tarjetas); metas `color-scheme: light`; placeholders legales
   intactos; 0 enlaces comerciales sin UTM; sin JS/flexbox/grid/position:absolute;
   peso inline < 90 KB.
3. **QA de contraste**: recalcula WCAG para toda combinación texto/fondo introducida en
   las rondas 02-04. Tabla completa en el informe, nada por debajo de AA (4.5:1 texto
   normal, 3:1 texto grande).
4. **Claims y links**: `npm run validate-claims -- --campaign ... --production` y
   `npm run check-links -- --campaign ... --strict` (los placeholders de baja/preferencias
   son la única excepción esperada). Cualquier otra cosa, se corrige.
5. **Production gate**: `npm run production-gate`. Documenta el resultado y los bloqueos
   que siguen dependiendo del cliente (fromEmail, enlaces legales, dirección física,
   flags) — deben ser LOS MISMOS de siempre, ninguno nuevo.
6. **Documentación de cierre**:
   - `v5-premium/redesign-summary.md`: antes/después de la línea completa de rediseño
     (captura baseline de la ronda 01 vs. final), decisiones clave por ronda, y la lista
     honesta de lo que sigue pendiente del cliente.
   - qa-report, comparison, tokens, patterns y los 4 control files, como siempre.
7. **Verificación de no-regresión documental**: comprueba que todos los archivos
   históricos de `v5-premium/` siguen presentes (nada borrado ni sobrescrito sin registro).

## CRITERIOS DE ACEPTACIÓN

- [ ] 6 capturas finales revisadas una a una, con veredicto por viewport en el informe
- [ ] QA técnico completo en verde (tabla con evidencia por check)
- [ ] Tabla de contraste sin ningún FAIL
- [ ] validate-claims y check-links ejecutados con salida pegada en el informe
- [ ] production-gate ejecutado; bloqueos restantes = solo los del cliente
- [ ] `redesign-summary.md` con comparación visual baseline→final
- [ ] Todo documentado; la campaña queda lista para la fase de assets/aprobación del cliente
