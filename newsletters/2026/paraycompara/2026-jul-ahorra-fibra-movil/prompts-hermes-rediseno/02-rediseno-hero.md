# PROMPT 02 — Rediseño del hero (el módulo de mayor impacto)

## CONTEXTO

Eres el Orchestrator de Hermes. Pieza: `v5-premium/final-premium-v2.html` (G8.1).
Prerequisito: la ronda 01 dejó el bucle de verificación visual operativo
(`scripts/render-preview.js`, baseline en `v5-premium/baseline/`). Léete antes:
`v5-premium/baseline/baseline-notes.md`, `v5-premium/component-patterns.md` §2 (hero
actual), `00-brief/brief.md` (qué datos están aprobados) y `docs/email-compatibility-rules.md`.

El hero actual (editorial tipográfico: eyebrow → H1 → subtítulo → pill "+30" → CTA →
microcopy, todo centrado sobre morado con patrón) es correcto pero no memorable. Es el
módulo que decide la percepción premium de toda la pieza en los primeros 2 segundos.

## OBJETIVO

Un hero que un director de arte de una marca premium firmaría, manteniendo el enfoque
tipográfico (no hay fotografía aprobada todavía) y la compatibilidad email total.

## DIRECCIÓN (explora dentro de esto, decide tú la ejecución)

- **Una sola idea dominante**: el ahorro/la comparación, no cinco mensajes. Revisa si
  eyebrow + H1 + subtítulo + stat + microcopy compiten entre sí; elimina o fusiona lo
  que no aporte (menos elementos, mejor jerarquizados).
- **Composición**: prueba una alternativa a "todo centrado y apilado" — p. ej. jerarquía
  asimétrica con el "+30" como elemento gráfico grande integrado en la composición
  (no como chip aparte), o un layout de dos niveles con la cifra como textura tipográfica.
  Máximo 2 variantes; elige la mejor tras verlas capturadas y justifica.
- **Profundidad sin imágenes**: capas de color de marca (primary/deep/light ya tokenizados),
  patrón existente, tamaños tipográficos con más contraste entre sí. Sin degradados CSS,
  sin imágenes nuevas.
- **Escala móvil primero**: el hero debe ser impactante a 320px, no solo a 600px.

## RESTRICCIONES

- Solo se toca el bloque de marca (header+hero). El resto de secciones NO se modifica.
- Copy: solo mensajes de `00-brief/brief.md` (los "+30 compañías" y mensajes clave
  aprobados). Nada de precios ni claims pendientes.
- Mantener: anatomía VML del CTA, UTM (`hero-cta`), h1 semántico, metas light,
  placeholders legales, `role="presentation"`.
- Regenerar inline con juice tras cada iteración.

## FLUJO OBLIGATORIO

1. Captura ANTES (o reutiliza baseline).
2. Implementa variante(s) del hero.
3. Captura DESPUÉS a 320/375/600 + 600-dark. **Visualiza las capturas.**
4. Si a 320px algo se rompe o pierde jerarquía, corrige y recaptura antes de cerrar.
5. Compara antes/después lado a lado y escribe tu autocrítica en el changelog de ronda.

## CRITERIOS DE ACEPTACIÓN

- [ ] Hero nuevo visible en capturas 320/375/600, revisadas por ti
- [ ] Captura 600-dark idéntica a la clara
- [ ] Máximo 1 CTA en el hero; jerarquía legible en <2 segundos (autoevalúa sobre la captura)
- [ ] Tags balanceados, 4 VML totales en la pieza, inline regenerado
- [ ] Copy 100% respaldado por el brief
- [ ] Ronda documentada: qa-report.md, comparison-before-after.md, component-patterns.md
      (actualiza §2 heroEditorialNoPhoto), tokens si cambian valores, 4 control files
- [ ] Capturas de la ronda guardadas en `v5-premium/rondas/hero/`
