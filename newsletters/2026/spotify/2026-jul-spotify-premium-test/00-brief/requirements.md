# Requirements: Spotify — 2026-jul-spotify-premium-test

## Requisitos legales

[PENDIENTE] — campaña de test interno (isTestCampaign:true). Sin bloqueo. Los textos legales de footer se rellenarán con placeholders genéricos hasta que el cliente los proporcione.

### Cláusulas copiadas textualmente

> [PENDIENTE — pendiente de que el cliente Spotify aporte textos legales de email marketing]

## Requisitos comerciales

| Concepto | Detalle | Fuente |
|---|---|---|
| Precio | $12.99/mes tras el periodo de prueba | Observado en spotify.com/us/premium/ (2026-07-24) |
| Promoción | 1 mes gratis ($0) | Observado en spotify.com/us/premium/ (2026-07-24) |
| Condiciones | Solo para usuarios que NO hayan probado Premium antes | Observado en spotify.com/us/premium/ (2026-07-24) |
| Producto | Spotify Premium Individual | Observado en spotify.com/us/premium/ |
| Moneda | USD — verificado en la URL .com/us/ | Observación directa del usuario |

**⚠️ Importante:** precio en USD ($12.99/mes). No usar este precio en copy sin indicar moneda o sin verificar la variante regional correspondiente.

## Requisitos técnicos

- Motor actual: `engine/` (HTML+juice, no React Email)
- Componentes: patrón `institutional` con variantes asimétricas (Nivel 2)
- Tokens resueltos desde `brands/spotify/tokens/brand-tokens.json` v2.2.0
- Schema: `engine/schema/campaign-data.schema.json`
- Build: `node engine/build-newsletter.js`

## Restricciones

1. **No inventar cifras de catálogo** — ni número de canciones, artistas, dispositivos compatibles, calidad de audio en kbps/bits exactos. 29 reglas en `scripts/lib/claim-rules.ts`.
2. **Oferta condicionada obligatoria** — el copy debe incluir explícitamente la condición "solo si no has probado Premium antes". No simplificar a "gratis sin más" (regla 🔴 crítica de claim-rules.ts).
3. **CTA negro sobre verde** — #000000 sobre #1ED760. NO cambiar ctaText a blanco "porque así es en otras marcas" — este es el valor real observado y ya pasa check-contrast (10.94:1).
4. **Sin emoji decorativo en beneficios** — Spotify iconography desaconseja iconGlyph/emoji. Usar `columns-3-beneficios-sin-icono.html`.
5. **Fondo claro adaptado** — el pack ya está adaptado a claro deliberadamente. No replicar el fondo negro real de Spotify en el email.
