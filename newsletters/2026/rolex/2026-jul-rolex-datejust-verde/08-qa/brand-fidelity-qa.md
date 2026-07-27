# Brand Fidelity QA — Rolex Datejust "Una fecha para recordar"

Checklist de los 5 puntos de `agents/08-qa-specialist.md` §"Fidelidad de marca", verificado
contra `brands/rolex/tokens/brand-tokens.json` y el HTML compilado — no una impresión.

## 1. Iconografía coherente

`iconography.style: "none"` — el pack documenta ausencia total de iconos de contenido.
Verificación: `grep` sobre `07-build/final.html` contra el rango Unicode de emoji
(`\u{1F300}-\u{1FAFF}`) → **0 coincidencias**. `columns-3-beneficios-sin-icono` es la variante
correcta (sin campo `icon` en absoluto, no un icono vacío). ✅ **Coherente.**

## 2. Fotografía coherente

`photography.usesRealPhotography: true`, `treatment` describe fotografía macro de estudio como
protagonista. El módulo 2 es `hero-imagen` (arte generado, no un hero de color plano) — decisión
correcta según `03-strategy/module-selection.md`.

**Verificado con el asset real (2026-07-25).** El usuario ejecutó `generate-hero-image`
localmente y compartió el resultado. Contraste punto por punto contra `photography.treatment`:

| Criterio documentado en el pack | Resultado | Veredicto |
|---|---|---|
| Fotografía real, NO ilustración/gráfico plano | Render fotográfico con reflejos metálicos reales y degradado tonal continuo | ✅ |
| Una única fuente de luz direccional dura | Franja de luz diagonal marcada cruzando el fondo desde arriba-izquierda | ✅ |
| Sombra diagonal larga sobre superficie neutra | Sombra proyectada bajo el brazalete, en diagonal | ✅ |
| Fondo neutro gris-azulado, NUNCA blanco plano de estudio | Gris-azulado con degradado, exactamente lo documentado | ✅ |
| Sin personas, sin contexto lifestyle | Producto aislado, único protagonista | ✅ |
| Esfera verde oliva | Correcta, con el acabado radial "sunburst" real | ✅ |
| Oystersteel + oro Everose (bicolor) | Bisel y eslabones centrales en oro rosa sobre acero, brazalete Jubilee | ✅ |
| Bisel estriado (fluted) | Presente y bien resuelto | ✅ |
| Lupa Cyclops sobre la ventana de fecha a las 3h | Lupa presente y en la posición correcta | ✅ (con matiz, ver abajo) |
| Profundidad de campo muy reducida (solo bisel/esfera en foco) | El reloj está nítido casi por completo; el desenfoque solo aparece en el extremo del brazalete | 🟡 **Desviación menor** |

### Hallazgos (severidad baja/media, no bloqueantes)

1. **Profundidad de campo menos marcada de lo documentado** (🟡 bajo). El `treatment` pide que
   "solo el bisel/esfera/ventanilla estén en foco nítido, el resto se desvanece en desenfoque
   suave". La imagen tiene desenfoque real, pero más contenido: el brazalete permanece nítido
   casi hasta el borde. No contradice la marca (Rolex también publica fotografías de producto
   con más profundidad de campo), pero es menos específico de lo que el pack describe.
2. **La esfera no lleva el texto de marca** (🟡 medio, pero *deseable* aquí). Un Datejust real
   siempre muestra "ROLEX / OYSTER PERPETUAL / DATEJUST" y la corona a las 12h; esta esfera está
   limpia. Es **coherente con la regla del flujo `generate-hero-image`** (el arte se genera sin
   texto, porque el copy vive en HTML del motor) y además evita reproducir un logotipo registrado
   en un asset generado, lo cual es preferible en una campaña de prueba sin aprobación de marca.
   Se documenta como observación, no como defecto a corregir.
3. **La ventana de fecha aparece vacía** (🟡 bajo). Bajo la lupa Cyclops no se lee ningún número.
   Mismo origen que el punto 2 (generación sin texto). Si el asset se usara en producción real,
   este detalle sí habría que resolverlo con fotografía oficial de la marca — no con arte
   generado.

### Veredicto del punto 2

✅ **Coherente.** La imagen respeta 9 de los 10 criterios del `treatment` documentado, incluido
lo más difícil y lo que motivó el fix del prompt en la ronda anterior: es fotografía real, no una
ilustración plana genérica. Las 3 observaciones son de severidad baja/media y ninguna contradice
una prohibición explícita del brand pack.

## 3. Estructura coherente con la evidencia

`layout.contentRhythm` documenta fotografía dominante + pocas secciones de texto breve. El
render final (verificado por HTML, ver `visual-qa.md`) tiene exactamente eso: 1 hero fotográfico
+ 2 bloques de texto breve (editorial asimétrico + 4 razones cortas) + 1 cierre — ningún grid de
categorías ni bloque de credibilidad con icono que contradiga la decisión de patrón. ✅
**Coherente.**

## 4. Voz coherente

`voice.rhythm`: afirmación declarativa, formal (usted), sin exclamaciones. Verificado sobre el
copy final (`05-copy/body-copy.md`):
- Asunto ("Una fecha para recordar.") y H1 (mismo texto): afirmación, sin exclamación. ✅
- CTAs ("Descubrir el Datejust", "Ver la colección Datejust"): infinitivo/sustantivo, no
  imperativo de segunda persona ("descubre", "ve") — coherente con el registro formal
  observado (Rolex no tutea). ✅
- Ningún body copy usa pregunta retórica ni exclamación. ✅
**Coherente.**

## 5. CTA proporcionado a la marca

- `typography.cta.size/weight/letterSpacing` y `components.cta.padding` tienen procedencia
  "observado en https://www.rolex.com/es/watches/datejust el 2026-07-25" en el `_changelog` del
  pack — no heredado de plantilla sin citar.
- Padding real (`16px 32px`) y tamaño (15px/700) NO coinciden exactamente con ningún otro brand
  pack del sistema (verificado contra nike: 16px/500/"0px"; bmw: 15px/500/"0.5px"; wornwear:
  distinto tamaño) — sin la señal de "coincidencia sospechosa" que motivó el sub-checklist de
  CTA en la ronda del 2026-07-24.
- En el HTML compilado, el CTA no lleva `width:100%` fijo (fix de la ronda 2026-07-25) — se
  ajusta al texto en desktop, evitando el problema exacto que motivó esta campaña de prueba.
✅ **Coherente.**

## Veredicto de fidelidad de marca

**5 de 5 puntos verificados como coherentes** (actualizado 2026-07-25 tras la generación real del
hero por parte del usuario). El punto 2 estaba pendiente de verificación visual y ha quedado
cerrado en positivo: la imagen generada es fotografía real de producto con la luz direccional, la
sombra diagonal y el fondo neutro gris-azulado que el `photography.treatment` documenta — no una
ilustración plana ni un render genérico sobre blanco.

3 observaciones de severidad baja/media registradas en el punto 2 (profundidad de campo menos
marcada, esfera sin texto de marca, ventana de fecha vacía). Ninguna bloquea la prueba interna;
las dos últimas son consecuencia deseada de la regla "arte sin texto" del flujo
`generate-hero-image` y quedan anotadas para el caso de un uso real en producción, que exigiría
fotografía oficial de la marca en vez de arte generado.
