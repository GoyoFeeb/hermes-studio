# Risks: Spotify — 2026-jul-spotify-premium-test

## Riesgos activos

### 🔴 Crítico — Oferta condicionada mal comunicada

**Riesgo:** El mes gratis de Spotify Premium es condicionado ("solo si no has probado Premium antes"). Si el copy lo presenta como incondicional, salta `claim-rules.ts` regla 9 (🔴 crítico: "gratis sin condiciones" → claim no verificado). El agente 05 debe incluir explícitamente la condición en el copy.

**Mitigación:** Documentado en `requirements.md` como restricción explícita. El brief incluye el texto exacto de la condición.

### 🟠 Alto — Precio en USD para audiencia potencialmente no estadounidense

**Riesgo:** El precio verificado es $12.99/mes en la URL .com/us/. Si la audiencia del email es internacional, el precio en USD puede no corresponder. El copy debe limitarse a mencionar la oferta de prueba gratuita y la URL, sin repetir el precio en el cuerpo salvo que se haya verificado para la región destino.

**Mitigación:** CTA apunta a la URL exacta verificada (.com/us/). El copy principal se centra en los beneficios más que en el precio. El precio aparece solo contextualmente.

### 🟠 Alto — Logo de Spotify no capturado

**Riesgo:** `assets.logo` está vacío. El header-logo no tendrá imagen de logo real.

**Mitigación:** Usar `label: "SPOTIFY"` como texto en header-logo. Con `isTestCampaign:true` es un aviso de Gate 10, no un error.

### 🟡 Medio — Degradado hero como fondo de email

**Riesgo:** `gradients.heroBackground` es un degradado CSS (`linear-gradient`). No todos los clientes de email lo soportan (Outlook desktop, Gmail web antiguo). El fallback es `colors.primary` (#000000) que el motor ya maneja como `background-color` en el componente.

**Mitigación:** El motor ya implementa el patrón "gradiente como mejora progresiva" (ver engine/CHANGELOG.md, "gradientes bulletproof"). El degradado es decorativo, no funcional.

### 🟡 Medio — Sin iconGlyph decorativo en beneficios

**Riesgo:** `columns-3-beneficios-sin-icono` no tiene iconos. Las 3 columnas de beneficio se verán como bloques de texto sin ancla visual. El peso visual recae enteramente en la fotografía del hero y en el degradado.

**Mitigación:** Consistente con la identidad de marca observada (Spotify no usa iconos decorativos). El usp-cards-asimetrico (con sombra) y el degradado hero dan suficiente variedad visual.

### 🟡 Medio — Hero-imagen no utilizable sin OPENAI_API_KEY

**Riesgo:** Si 03 elige `hero-imagen`, se necesita OPENAI_API_KEY en .env para la generación del arte. Si no está configurada, el build se bloquea o genera un placeholder.

**Mitigación:** El patrón elegido (`institutional`) admite `hero-centrado` y `hero-asimetrico` como alternativas, que usan el degradado bulletproof sin necesidad de generar imágenes. No depende de OPENAI_API_KEY.

### 🟢 Bajo — Sin personalización real

**Riesgo:** La campaña Wrapped real de Spotify se basa en datos de escucha individuales. Este test no puede generar datos personalizados reales.

**Mitigación:** `personalization.status: "not-implemented"` documentado en el pack. `isTestCampaign:true`. Cualquier cifra de escucha personalizada en el copy debe marcarse como ejemplo.

### 🟢 Bajo — Textos legales de footer pendientes

**Riesgo:** No hay dirección física ni textos legales específicos de Spotify para email marketing.

**Mitigación:** `isTestCampaign:true` — se usan placeholders genéricos. Gate 10 no bloquea con metadata.isTestCampaign:true.
