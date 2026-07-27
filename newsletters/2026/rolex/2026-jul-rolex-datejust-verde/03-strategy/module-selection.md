# Module Selection — Rolex Datejust "Una fecha para recordar"

## Patrón elegido: `fotografia-primero`

Verificación explícita de los 5 criterios de `patterns/fotografia-primero.md` §6 contra el brand pack real de Rolex (no una impresión subjetiva de "se ve premium"):

| # | Criterio | Cumple | Evidencia |
|---|---|---|---|
| 1 | `photography.usesRealPhotography: true` y `treatment` describe la fotografía como protagonista | ✅ Sí | `photography.treatment` del pack: "el producto es el único protagonista, fotografiado como una joya" |
| 2 | `iconography.componentImplication` desaconseja iconos/emoji explícitamente | ✅ Sí (más fuerte que el mínimo) | `iconography.style: "none"` — no es solo "desaconsejado", es ausencia total confirmada: el sitio real no tiene NINGÚN icono de contenido |
| 3 | `layout.contentRhythm` documenta bloques grandes de fotografía + texto breve, no una página de comparación de precios ni catálogo extenso | ✅ Sí | 6 secciones reales documentadas, 2 explícitamente marcadas no traducibles (vídeo cinemático, configurador) — las 4 traducibles son fotografía + titular + 1-2 párrafos cortos |
| 4 | Ninguna cifra de ahorro/comparación que justifique `saving` | ✅ Sí | Rolex no publica precio ni cifras comparativas en la página fuente |
| 5 | Ningún catálogo real de 2-8 categorías que justifique `category-grid` de `institutional` | ✅ Sí | El carrusel de 12 variantes del modelo existe en la página real, pero no hay assets fotográficos reales por variante disponibles para esta ronda (ver Q-004/Q-005 de `open-questions.md`) — fabricar un grid con placeholders genéricos habría sido peor que omitirlo. Se documenta como sección no traducida en `layout.contentRhythm.sections` |

Los 5 criterios se cumplen — de hecho con más margen que la campaña BMW que originó este patrón (BMW documentaba iconos "desaconsejados"; Rolex documenta iconos "inexistentes"). `institutional` habría forzado un grid de beneficios con icono o tarjetas de credibilidad que el propio pack contradice explícitamente.

## Elegir hero — las 2 preguntas obligatorias (antes de cualquier otra variante)

1. **¿El brief da una URL de landing real a la que apunta el CTA principal?** ✅ Sí — `https://www.rolex.com/es/watches/datejust`, la misma página fuente de toda la investigación de 02.
2. **¿`photography.usesRealPhotography` es `true` con `treatment` describiendo fotografía protagonista?** ✅ Sí.

**Las 2 son "Sí" → `hero-imagen` es la variante por defecto, y es la elegida.** No hay motivo para descartarla (no hay cifra de marca que necesite `hero-asimetrico`, sí hay landing y fotografía real). Es además la única variante que admite este patrón (`fotografia-primero` no tiene fallback a `hero-centrado`, ver §3 del patrón).

## Secuencia de componentes

| # | Componente | Estado | Motivo |
|---|-----------|--------|--------|
| 1 | `header-logo` | ✅ **Incluido (obligatorio)** | Corona Rolex como cabecera |
| 2 | `hero-imagen` | ✅ **Incluido (obligatorio, sin alternativa)** | Ver §"Elegir hero" arriba |
| 3 | `intro-cta-asimetrico` | ✅ **Incluido (opcional, 1 de máx. 3)** | `layout.sectionStyle: "asimetrico"` en el pack, con evidencia real: la sección editorial de rolex.com ("Una fecha para recordar") es titular izquierda + cuerpo derecha, no centrada — usar la variante centrada (`intro-cta`) habría ignorado esa evidencia sin motivo |
| 4 | `columns-3-beneficios-sin-icono` | ✅ **Incluido (opcional, 1 de máx. 2, sin alternativa con icono)** | 4 razones materiales/técnicas reales disponibles (Oystersteel+Everose, hermeticidad Oyster, cronómetro certificado, ventana de fecha) — dentro del rango 2-4 ítems del componente. `iconography.style: "none"` prohíbe cualquier variante con icono |
| 5 | `banda-cierre-asimetrico` | ✅ **Incluido (obligatorio)** | Mismo motivo de `layout.sectionStyle` que el módulo 3 — cierre con título+cuerpo a todo el ancho arriba y CTA suelto alineado a la izquierda, no la composición centrada por defecto |
| 6 | `footer` | ✅ **Incluido (siempre)** | Placeholder estándar, `isTestCampaign: true` |

Total: 6 módulos — dentro del rango 3-7 y dentro del límite de 6 slots del patrón `fotografia-primero`.

## Orden del cuerpo — justificación contra `layout.contentRhythm`

El orden elegido (hero fotográfico → editorial asimétrico → razones sin icono → cierre asimétrico) replica exactamente el orden real observado en `layout.contentRhythm.sections` del pack: 1) hero fotográfico, 2) editorial-foto-texto asimétrico ("Una fecha para recordar"), 3-4) secciones no traducibles omitidas (vídeo, configurador), 5) grid de variantes — sustituido aquí por el bloque de razones materiales, ya que no hay fotografía real por variante para un grid (ver criterio 5 arriba). No es "el orden del patrón por defecto" — coincide porque la página real de la marca sigue ese mismo ritmo, verificado sección por sección.

## Repetición de bloques

Ningún bloque se repite en esta campaña — 4 tipos de fondo/densidad distintos consecutivos (blanco alto→blanco bajo→sectionLila media→deep media→global baja), sin dos iguales seguidos.

## Vocabulario de CTA — decisión explícita (no un olvido)

No se declara `components.cta.style` en el pack ni se fuerza en esta campaña. Verificado con Chrome real (ver `02-analysis/visual-analysis.md`): el único vocabulario de forma de CTA observado en rolex.com es pastilla (sólida y translúcida/outline) — cero evidencia de CTA de texto plano o de bloque de esquina recta. El CTA de esta campaña usa `cta-bulletproof.html` (pastilla sólida verde) sin modificación.
