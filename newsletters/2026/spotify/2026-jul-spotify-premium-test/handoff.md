# Handoff

## From

Agente anterior: 02 — Brand Visual Analyst

## To

Agente siguiente: 03 — Newsletter Architect

## Context

Análisis de marca completado. El brand pack de Spotify (brands/spotify/tokens/brand-tokens.json v2.2.0) es Nivel 3 completo (colores verificados en vivo, tipografía, fotografía, iconografía, ritmo de voz, ritmo estructural). Se ha verificado que cubre el ángulo "Prueba Spotify Premium gratis" sin necesidad de ampliación adicional.

**Diagnóstico de patrón (pre-analizado por 02, confirmación final de 03):**
- No es `saving` (no hay cifra de ahorro como eje)
- No es `fotografia-primero` (aunque fotografía es dominante, la petición explícita del usuario de incluir `usp-cards` y `columns-3-beneficios` solo es compatible con `institutional`)
- Por tanto: **`institutional` con variantes asimétricas (Nivel 2)**

**Datos clave de la marca:**
- sectionStyle: asimetrico (layout.sectionStyle)
- iconography desaconseja iconGlyph/emoji → usar columns-3-beneficios-sin-icono
- CTA: texto negro (#000000) sobre verde (#1ED760) — primero del sistema
- Gradiente hero: linear-gradient(135deg, #000000 0%, #146C43 100%) — bulletproof, sin IA
- Oferta: 1 mes gratis condicionado ("solo si no has probado Premium antes")

## Files to Read

- `00-brief/brief.md` — brief completo
- `00-brief/requirements.md` — restricciones (sin emoji, oferta condicionada)
- `02-analysis/brand-analysis.md` — identidad de marca y recomendación de patrón
- `02-analysis/visual-analysis.md` — tabla de colores, tipografía, contraste, composición
- `02-analysis/risks.md` — riesgos activos
- `brands/spotify/tokens/brand-tokens.json` — brand pack v2.2.0
- `patterns/institutional.md` — patrón de género (leer entero, especialmente §7 variantes asimétricas Nivel 2)
- `03-newsletter-architect.md` — contrato del agente

## Required Action

1. Elegir patrón de género (confirmar **institutional** o justificar alternativo)
2. Elegir variante de hero (hero-centrado, hero-asimetrico, hero-imagen)
3. Definir ángulo de campaña → campaign-angle.md
4. Definir jerarquía de mensajes (1-4) → message-hierarchy.md
5. Seleccionar módulos incluidos/omitidos con motivo → module-selection.md
6. Escribir secuencia exacta de componentes → structure.md

**Requerimientos específicos de 00:**
- Mantener `usp-cards` (necesario para probar fix de sombra)
- Mantener `columns-3-beneficios` (necesario para probar fix de sombra) — en variante `-sin-icono`
- Usar variantes asimétricas donde estén disponibles (layout.sectionStyle: "asimetrico")
- hero-centrado o hero-asimetrico (no hero-imagen a menos que OPENAI_API_KEY esté disponible y se justifique)

## Constraints

- Sin emoji en beneficios (iconography del pack lo desaconseja) → usar columns-3-beneficios-sin-icono
- Oferta condicionada debe aparecer en el copy (05) — documentar en las restricciones de 03
- CTA: "Prueba Premium gratis" → URL: spotify.com/us/premium/ con UTM
- Sin inventar cifras de catálogo (29 reglas claim-rules.ts)
- 3-7 módulos total (regla de institutional)
- CTA principal en el primer tercio de la secuencia

## Risks

- **usp-cards necesita 3 claims de confianza verificables.** Si no hay 3 puntos reales del brief, se omite el módulo entero (ver institutional.md §3). El usuario no ha confirmado puntos de confianza específicos de Spotify — 03 debe decidir si hay contenido suficiente o se omite.
- **columns-3-beneficios-sin-icono** no tiene icono visual. Los beneficios deben ser textualmente potentes para compensar (esto lo maneja 05, pero 03 lo tiene en cuenta al seleccionar el módulo).

## Expected Output

- `03-strategy/campaign-angle.md`
- `03-strategy/message-hierarchy.md` — mensajes ordenados por prioridad 1-4
- `03-strategy/module-selection.md` — cada módulo incluido/omitido, con motivo
- `03-strategy/structure.md` — secuencia EXACTA de componentes del motor
