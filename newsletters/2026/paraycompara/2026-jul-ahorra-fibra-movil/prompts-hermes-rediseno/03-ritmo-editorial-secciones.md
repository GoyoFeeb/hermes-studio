# PROMPT 03 — Ritmo editorial: que ninguna sección parezca de plantilla

## CONTEXTO

Eres el Orchestrator de Hermes. Pieza: `v5-premium/final-premium-v2.html` (con el hero
ya rediseñado en la ronda 02). Léete: `baseline-notes.md`, las capturas de la ronda 02,
y `component-patterns.md` completo.

Diagnóstico heredado (G8-D5): las secciones de contenido repiten un mismo esqueleto
(kicker → eyebrow → título → contenido, casi todo centrado). En G8 solo "Antes de decidir"
pasó a composición asimétrica. La repetición sin variación es lo que hace que una pieza
huela a plantilla en vez de a diseño editorial dirigido.

## OBJETIVO

Que el recorrido de la pieza tenga ritmo: cada sección con una composición propia
justificada por su contenido, dentro de un mismo sistema (tokens, tipografía y CTA
compartidos). Editorial, no catálogo.

## DIRECCIÓN

- **Mapa de ritmo primero, código después**: antes de tocar nada, escribe en
  `v5-premium/rondas/ritmo/plan-ritmo.md` la secuencia completa (hero → trust →
  tarifas → pasos → revisar → cierre → footer) indicando para cada sección:
  alineación, densidad, color de fondo y qué la diferencia de la anterior.
  El objetivo es alternancia consciente: centrado/izquierda, denso/aireado, claro/lila.
- **Tarifas**: evalúa si el grid 2×2 con franjas moradas + 4 "Ver tarifas →" iguales
  transmite curaduría o inventario. Considera jerarquizar (p. ej. una tarjeta destacada
  o layout 1+3) solo si mejora la lectura — justifica con captura, no por variar.
- **Pasos**: la línea conectora y los círculos numerados están bien resueltos; valora si
  la sección necesita menos peso (es información de apoyo, no protagonista).
- **Transiciones entre secciones**: G7 eliminó los degradados (correcto), pero revisa
  en las capturas si algún corte resulta brusco; si lo es, resuélvelo con espaciado y
  jerarquía de fondos, no reintroduciendo degradados.
- **Consistencia**: lo que cambies debe seguir usando los tokens existentes
  (`design-tokens-premium.json`) — cero colores nuevos sin justificar contraste WCAG.

## RESTRICCIONES

- No tocar: hero (cerrado en ronda 02), footer legal, VML, UTM, headings, metas light.
- Copy: sin cambios salvo que una composición nueva exija acortar un texto — solo
  acortar, nunca añadir claims.
- Máximo una pasada de cambios + una de corrección tras ver capturas. Sin deriva.

## FLUJO OBLIGATORIO

Igual que la ronda 02: plan → cambio → inline → capturas 320/375/600 + 600-dark →
visualizar → corregir si hace falta → documentar. Capturas en `v5-premium/rondas/ritmo/`.

## CRITERIOS DE ACEPTACIÓN

- [ ] `plan-ritmo.md` escrito ANTES del primer cambio de código
- [ ] Ninguna pareja de secciones consecutivas con composición idéntica (verifícalo
      describiendo la secuencia final sobre la captura)
- [ ] Mobile 320px: apilado correcto en todas las secciones tocadas, revisado en captura
- [ ] Tags balanceados, inline regenerado, 4 VML, contrastes de cualquier combinación
      nueva calculados y anotados
- [ ] Ronda documentada con la disciplina de siempre + capturas guardadas
