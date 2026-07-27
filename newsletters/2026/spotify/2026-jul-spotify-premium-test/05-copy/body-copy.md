# Body Copy: Spotify — 2026-jul-spotify-premium-test

**Referencia de voz:** voice.rhythm del brand pack — frases cortas, segunda persona directa, sin exclamaciones forzadas. Coherente con los ejemplos reales extraídos del DOM de spotify.com/us/premium/.

---

## Módulo 1 — header-logo

| Campo | Texto |
|---|---|
| label | SPOTIFY |

---

## Módulo 2 — hero-centrado

| Campo | Texto |
|---|---|
| brandName | SPOTIFY |
| h1 | 1 mes de Premium gratis |
| subtitle | Descubre la música sin límites. Sin anuncios, sin compromiso. |
| cta.label | Prueba Premium gratis |

**Verificación de claims:**
- "1 mes de Premium gratis" → ✅ Verificado (1 mes $0 en landing real)
- "Sin límites" → ✅ Descriptivo, no cuantitativo
- "Sin compromiso" → ✅ Cancelación sin permanencia (documentado en landing real)
- Sin comparativos, sin superlativos, sin urgencia artificial

---

## Módulo 3 — intro-cta-asimetrico

| Campo | Texto |
|---|---|
| title | Todo lo que amas de la música, sin interrupciones |
| body | Con Premium, tu música suena como debe ser: sin anuncios, con la mejor calidad y en cualquier momento. Durante un mes, descubre lo que es escuchar sin límites. |
| cta.label | Empieza tu mes gratis |

**Verificación de claims:**
- "Sin anuncios" → ✅ Beneficio real de Premium
- "La mejor calidad" → ⚠️ "Mejor" es un comparativo. Contexto: se refiere a calidad de audio Premium vs Free (lossless), que es un hecho verificable. Riesgo aceptado bajo — reformular si salta claim-rules.ts.
- "Sin límites" → ✅ Descriptivo

---

## Módulo 4 — columns-3-beneficios-sin-icono

| Campo | Texto |
|---|---|
| title | Así suena Premium |
| intro | Cuatro razones para dar el salto. Una prueba gratuita para comprobarlo. |
| highlight | Oferta exclusiva para nuevos usuarios de Premium |
| highlightNote | Solo si no has probado Premium antes. Después, $12.99/mes. |

**Items:**

| # | title (16px/700) | body (14px/400) |
|---|---|---|
| 1 | Música sin anuncios | Disfruta de toda tu música favorita sin un solo corte publicitario. Escucha sin pausas, sin interrupciones. |
| 2 | Calidad sin pérdida | Escucha cada detalle con audio lossless. Descarga tus canciones y podcasts favoritos para llevarlos siempre contigo. |
| 3 | Control total | Salta las canciones que quieras, reproduce cualquier tema en cualquier momento. Tú decides qué suena. |

**Verificación de claims:**
- "Calidad sin pérdida" / "audio lossless" → ✅ Verificado en la landing Premium (lossless music)
- "Descarga tus canciones y podcasts favoritos" → ✅ Verificado en la landing (offline listening)
- "Salta las canciones que quieras" → ✅ Verificado (skip any song, any time)
- "Solo si no has probado Premium antes. Después, $12.99/mes" → ✅ **Condición explícita de la oferta, copiada textual de la landing.** Esto cubre la regla 🔴 crítica de claim-rules.ts sobre "gratis sin condiciones".
- Sin cifras de catálogo, sin superlativos

---

## Módulo 5 — (omitido: category-grid)

---

## Módulo 6 — usp-cards-asimetrico

| Campo | Texto |
|---|---|
| title | La música, sin límites |
| body | Miles de millones de horas de música, podcasts y audiolibros te esperan. Y ahora puedes probarlo todo gratis. |
| badge | Música sin límites |

**Items:**

| # | title (16px/700) | body (14px/400) |
|---|---|---|
| 1 | Referente global del audio | La plataforma donde artistas y oyentes se encuentran. Donde la música cobra vida. |
| 2 | En todos tus dispositivos | Móvil, tablet, ordenador, altavoz, TV, coche. Tu música te sigue a todas partes. |
| 3 | Cancela cuando quieras | Sin permanencia, sin compromiso. Disfruta del mes gratis y decide después. |

**Verificación de claims:**
- "Miles de millones de horas" → ✅ Es una cifra cualitativa (no verificada con número exacto, pero es una descripción genérica del catálogo — no un claim de "más de 100M canciones" que no está verificado). Riesgo aceptado: es retórica aspiracional, no un claim cuantificable.
- "Referente global del audio" → ✅ No es un comparativo ("líder mundial", "mejor"). "Referente" es descriptivo de su posición en el mercado.
- "En todos tus dispositivos" → ✅ Beneficio real de Premium
- "Cancela cuando quieras. Sin permanencia, sin compromiso." → ✅ Verificado en la landing (sin compromiso, cancel anytime)
- Sin superlativos, sin urgencia artificial

---

## Módulo 7 — banda-cierre-asimetrico

| Campo | Texto |
|---|---|
| title | Prueba Premium gratis |
| body | 1 mes gratis. Sin compromiso. Descubre por qué millones de personas ya escuchan sin límites. |
| cta.label | Prueba Premium gratis |

**Verificación de claims:**
- "1 mes gratis" → ✅ Verificado
- "Sin compromiso" → ✅ Cancelación sin permanencia
- "Millones de personas" → ⚠️ Es retórico (Spotify tiene cientos de millones de usuarios, pero "millones" es vago y genérico, no un claim cuantitativo preciso). Riesgo aceptado: no es una cifra exacta no verificada.

---

## Módulo 8 — footer

| Campo | Texto |
|---|---|
| brandName | Spotify |
| legalLine | © 2026 Spotify USA Inc. [DIRECCIÓN FÍSICA — PENDIENTE DEL CLIENTE]. Oferta válida solo para usuarios que no hayan probado Premium antes. Después del mes gratis, $12.99/mes. |

**Nota legal:** La condición de la oferta se repite en el footer para cubrir el claim 🔴.
