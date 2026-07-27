# Brief: Spotify — 2026-jul-spotify-premium-test

## Información general

| Campo | Valor |
|---|---|
| Cliente | Spotify |
| Campaña | 2026-jul-spotify-premium-test |
| Fecha de briefing | 2026-07-24 |
| Estado | briefing |
| Fuente del brief | Investigación real en spotify.com/us/premium/ (Chrome, getComputedStyle + DOM, 2026-07-24) + confirmación directa del usuario |

## Objetivo

Promocionar Spotify Premium con el ángulo de prueba gratuita de 1 mes. Presentar los 4 pilares de beneficio (sin anuncios, audio sin pérdida, escucha offline, control total de reproducción) usando el lenguaje visual asimétrico y directo de Spotify.

## CTA principal

**CTA primario:** "Prueba Premium gratis" (voice.ctaDefault del brand pack, verificado en vivo en spotify.com/us/premium/)
**CTA secundario:** "Ver todos los planes" (voice.ctaSecondary del brand pack)

## Enlace principal

`https://www.spotify.com/us/premium/?utm_source=newsletter&utm_medium=email&utm_campaign=2026-jul-spotify-premium-test`

Estado: ✅ Referencia oficial localizada. Pendiente de aprobación cliente.
Nota: URL exacta verificada en vivo por el usuario. Precio observado: $12.99/mes tras prueba gratuita. No usar /es/premium/ ni otra variante regional — precio/condiciones no verificados.

## Audiencia objetivo

Usuarios de Spotify Free que no han probado Premium antes (la oferta es condicionada: "solo si no has probado Premium antes").

## Tono y estilo

Directo, cercano, con humor ligero. Segunda persona del singular ("tú"). Frases cortas. Sin exclamaciones forzadas. Referencia directa: `brands/spotify/tokens/brand-tokens.json → voice.rhythm` (ejemplos reales extraídos del DOM de spotify.com/us/premium/).

## Mensajes clave

1. **Prueba gratuita de 1 mes** — sin compromiso, sin anuncios
2. **Música sin interrupciones** — ad-free listening, tu música sin pausas
3. **Audio en calidad sin pérdida** — pérdida, lossless music para los que escuchan cada detalle
4. **Escucha offline** — descarga tus canciones, playlists y podcasts favoritos
5. **Control total** — salta canciones sin límite, reproduce lo que quieras, cuando quieras

## Promociones / Ofertas

| Concepto | Detalle |
|---|---|
| Producto/servicio | Spotify Premium Individual |
| Descuento/promoción | 1 mes gratis ($0) |
| Condiciones | Solo para usuarios que NO hayan probado Premium antes. Después del mes gratis: $12.99/mes. |
| Fecha de validez | No especificada en la página observada — oferta vigente a fecha de verificación (2026-07-24) |
| Fuente | Observado en spotify.com/us/premium/ el 2026-07-24 |

## Referencias visuales

Brand pack completo en `brands/spotify/tokens/brand-tokens.json` v2.2.0:
- Degradado hero: linear-gradient(135deg, #000000 0%, #146C43 100%)
- CTA: texto #000000 sobre fondo #1ED760 (verde vivo real de Spotify)
- Fondo global claro: #F5F5F5 (adaptación a claro, ver _changelog)
- SectionStyle: asimetrico (documentado en layout.sectionStyle)

## Riesgos detectados

- **Oferta condicionada**: el copy NO debe presentar el mes gratis como incondicional. Si se simplifica a "gratis sin más", salta `claim-rules.ts` regla 9 (🔴 crítico).
- **Precio en USD**: $12.99/mes verificado en la URL .com/us/ — no usar en contexto que implique otra moneda o región sin verificar.
- **Logo pendiente**: assets.logo está vacío (pendiente de captura real). Con `isTestCampaign:true` es un aviso de Gate 10, no un error.
- **Hero banner**: heroBannerPlaceholder es `PENDING-CDN-UPLOAD`. Si se usa `hero-imagen`, requiere OPENAI_API_KEY para generación o quedar como placeholder.

## Notas adicionales

- Campaña de TEST interno — `metadata.isTestCampaign: true`
- Brand pack completo con Nivel 3 (color, tipografía, fotografía, iconografía, ritmo de voz, ritmo estructural)
- CTA con texto NEGRO sobre fondo verde (#000000 sobre #1ED760) — primera marca del sistema con esta combinación
- WCAG check-contrast.ts: 7/7 PASS (verificado antes de esta campaña)
- Brand pack check: limpio (verificado antes de esta campaña)
