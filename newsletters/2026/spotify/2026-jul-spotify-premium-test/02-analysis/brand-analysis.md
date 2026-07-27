# Brand Analysis: Spotify

## Identidad de marca

| Aspecto | Detalle |
|---|---|
| Marca | Spotify Technology S.A. |
| Sector | Streaming musical / audio digital |
| Identidad visual nativa | Dark-mode-first (#000000 fondo dominante, verde #1ED760 acento, tipografía propietaria CircularSp) |
| Identidad adaptada (email) | Fondo claro (#F5F5F5 global, #FFFFFF superficies) con degradado negro→verde en hero |
| Diferenciador visual | Fotografía de alto contraste con isotipo de barras de sonido como máscara gráfica. Sin iconografía decorativa — la fotografía y la tipografía llevan el peso visual. |
| Presencia digital | spotify.com — landing premium verificada en vivo, + campañas Wrapped (lenguaje de degradados vibrantes con paletas reducidas) |

## Voz de marca

Extraída de `voice.rhythm` del brand pack (ejemplos reales del DOM de spotify.com/us/premium/):

- **Longitud de frase:** muy corta (2-5 palabras titulares). Frases de beneficio de una sola línea, sin subordinadas.
- **Modo:** segunda persona directa ("tu música", "donde tú escuchas") + frases nominales sin verbo ("Música sin pausas.")
- **Formalidad:** tú directo, informal, cercano.
- **Puntuación:** frases cortas con punto. Sin exclamaciones forzadas. Juego de palabras ligero en titulares.
- **Ejemplos reales:** "The ultimate home for music.", "Música sin pausas.", "Todo lo que amas, aquí mismo.", "With music that never stops."

## Observaciones del ángulo "Prueba Premium gratis"

- El brand pack ya cubre este ángulo: voice.examples contiene frases reales extraídas del DOM de la landing Premium.
- La landing real (spotify.com/us/premium/) gira en torno a: prueba gratuita de 1 mes + 4 pilares de beneficio + CTA pill verde con texto negro.
- layout.contentRhythm documenta la estructura completa de la landing (10 secciones), confirmando que los bloques de feature en pares (beneficio corto + visual) son el patrón dominante de comunicación de la marca.
- **Conclusión:** el pack existente cubre el ángulo Premium sin necesidad de ampliación adicional. No se necesita nueva investigación.

## Recomendación de patrón

- **Patrón:** `institutional` con variantes asimétricas (Nivel 2)
- **Componentes asimétricos:** `intro-cta-asimetrico`, `columns-3-beneficios-sin-icono` (sin emoji, ver iconography del pack), `usp-cards-asimetrico`, `banda-cierre-asimetrico`
- **Hero:** `hero-centrado` o `hero-asimetrico` con gradient.heroBackground (degradado negro→verde bulletproof)
- **Justificación:** layout.sectionStyle:"asimetrico" documentado en el pack. La landing real usa composición asimétrica consistente. `institutional` es el único patrón que incluye `usp-cards` (necesario para probar el fix de sombra).
