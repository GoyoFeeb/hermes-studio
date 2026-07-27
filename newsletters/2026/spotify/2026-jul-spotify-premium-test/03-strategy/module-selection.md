# Module Selection: Spotify — 2026-jul-spotify-premium-test

## Patrón elegido

**`institutional`** — con variantes asimétricas (Nivel 2)

**Motivo:**
1. No es `saving` — no hay cifra de ahorro/beneficio como eje de campaña.
2. No es `fotografia-primero` — a pesar de que `photography.usesRealPhotography: true` y la fotografía es dominante, la petición explícita del usuario de mantener `usp-cards` y `columns-3-beneficios` solo es compatible con `institutional` (son exclusivos de ese patrón).
3. `layout.sectionStyle: "asimetrico"` documentado en el brand pack — se usan variantes asimétricas donde estén disponibles.

## Hero elegido

**`hero-centrado`** — **⚠️ CORRECCIÓN RETROACTIVA (2026-07-24, ver `engine/CHANGELOG.md` "Romper
composiciones repetidas" y `agents/03-newsletter-architect.md` §"Elegir hero")**

**Las 2 preguntas obligatorias de `hero-imagen` (añadidas a 03 después de este hallazgo):**

1. ¿El brief da una URL de landing real a la que apunta el CTA principal? **Sí** —
   `https://www.spotify.com/us/premium/`, la misma página investigada por 02.
2. ¿`brand-tokens.json` → `photography.usesRealPhotography` es `true`? **Sí** — documentado con
   Chrome real, `photography.treatment` describe fotografía de alto contraste como elemento
   dominante.

**Las dos son "Sí" — el criterio dice que la variante por defecto debería haber sido
`hero-imagen`.** El motivo original de este documento (citado abajo, tachado) nunca respondía
estas preguntas — argumentaba contra `hero-asimetrico`, que nadie había propuesto, y no
mencionaba `hero-imagen` ni una vez. No es que se evaluara y se descartara con un motivo real:
no se evaluó. `scripts/check-hero-decision.ts` (Gate 11 del motor) ahora falla esta campaña por
exactamente este motivo.

~~**Motivo original (incompleto — no responde las 2 preguntas de arriba):** Spotify Premium no
tiene una cifra de ahorro/beneficio confirmada que justifique el stat de `hero-asimetrico` (no
hay "ahorra 30€" ni "+30 compañías" como en otros clientes). El mensaje principal es "1 mes
gratis" — eso va en el H1 y subtítulo, no como una cifra destacada en el otro lado de la
pantalla. El gradiente negro→verde (`gradients.heroBackground`) se renderiza igual con
`hero-centrado` y da el impacto visual aspiracional que la marca necesita.~~

**Resuelto (2026-07-24):** el usuario confirmó reconstruir con `hero-imagen`. `campaign-data.json`
migrado — `bannerSrc` queda en `https://PENDING-CDN-UPLOAD/hero-banner.png` porque el arte real
NO pudo generarse desde este entorno: `scripts/generate-hero-image.ts` necesita salida real a
`api.openai.com`, y este sandbox no tiene acceso a internet saliente (mismo motivo por el que
todas las URLs externas fallan con "sin respuesta" en el Gate 5 de todas las campañas de esta
sesión — verificado directamente, no asumido: la llamada real devolvió "No se pudo conectar con
api.openai.com: fetch failed"). Pendiente de ejecutar en un entorno con internet real (máquina
del usuario o la propia sesión de Hermes):

```
npm run generate-hero-image -- --brand spotify --source landing \
  --url https://www.spotify.com/us/premium/ \
  --campaign newsletters/2026/spotify/2026-jul-spotify-premium-test \
  --theme "Fotografía real de alto contraste: manos sobre un instrumento o vinilo iluminado dramáticamente en estudio, fondo negro profundo, un solo foco de luz cálida sobre el sujeto, mood íntimo y aspiracional de música premium, sin texto ni logos en la imagen"
```

Tras generarla: subir `brands/spotify/design-input/hero-banner.png` al CDN y pegar la URL https
real en `campaign-data.json` → `modules[1].data.bannerSrc` (mismo flujo de 2 pasos que ya usan
Nike/BMW — el script nunca sube directamente, ver su cabecera de comentarios).

## Selección de módulos

### Módulo 1 — header-logo ✅ REQUIRED

**Decisión:** Incluido.
- Logo: placeholder (assets.logo vacío). Usar `label: "SPOTIFY"` como texto.
- `logoSrc` → URL placeholder HTTPS.

### Módulo 2 — hero-imagen ✅ REQUIRED

**Decisión:** Incluido — **corregido 2026-07-24** de `hero-centrado` (ver "Hero elegido" arriba).
- `bannerSrc`: pendiente de generación real (ver arriba) + subida a CDN.
- CTA: "Prueba Premium gratis" → URL con UTM.
- El degradado negro→verde (`gradients.heroBackground`) que usaba `hero-centrado` YA NO aplica
  aquí — `hero-imagen.html` no tiene fondo de color de marca, la fotografía ocupa ese espacio.
  El degradado sigue vivo en `banda-cierre-asimetrico` (el otro componente que lo usa).

### Módulo 3 — intro-cta-asimetrico ⬜ OPCIONAL — INCLUIDO

**Decisión:** Incluido.
**Motivo:** El brief tiene una frase de transición real entre el hero y los beneficios: "1 mes gratis para descubrir todo lo que Premium puede hacer por ti" (no es paráfrasis del hero — contextualiza los beneficios que vienen a continuación).
- Variante asimétrica (coherente con sectionStyle: asimetrico).

### Módulo 4 — columns-3-beneficios-sin-icono ✅ REQUIRED

**Decisión:** Incluido. Variante SIN icono.
**Motivo:** `iconography.componentImplication` del brand pack desaconseja explícitamente iconGlyph/emoji para marcas con identidad fotográfica fuerte como Spotify. Las 3 columnas de beneficio se basan en:
1. Música sin anuncios (sin interrupciones)
2. Audio lossless + escucha offline
3. Control total de reproducción (salta canciones sin límite, reproduce lo que quieras)
- Column balance: longitudes comparables (verificar en build con check-column-balance).

### Módulo 5 — category-grid ⬜ OPCIONAL — OMITIDO

**Decisión:** Omitido.
**Motivo:** Spotify no tiene un catálogo de categorías/líneas de producto comparable (no vende planes de TV, seguros o productos físicos). Los planes de precio (Individual, Student, Duo, Family) existen pero no encajan en la estructura de category-grid (que espera icono + título + breve descripción). Se mencionan en el CTA secundario "Ver todos los planes" pero no se despliegan como grid.

### Módulo 6 — usp-cards-sin-icono-asimetrico ⬜ OPCIONAL — INCLUIDO

**Decisión:** Incluido — **corregido el 2026-07-24** de `usp-cards-asimetrico` a
`usp-cards-sin-icono-asimetrico` (variante nueva, ver `engine/CHANGELOG.md` "Marca real Spotify +
usp-cards-sin-icono").
**Motivo:** (a) Se necesita para probar el fix de sombra (`shadows.card`) — petición explícita del usuario. (b) Spotify tiene 3 claims de confianza verificables no inventados (basados en la propia landing y documentación pública general de la marca sin números concretos):
1. **La plataforma de audio más grande del mundo** — verificado cualitativamente (no se usa el claim "más grande" para evitar comparativos; se reformula como "referente global del audio").
2. **En todos tus dispositivos** — compatible con teléfonos, tablets, ordenadores, altavoces, TV, coche.
3. **Cancela cuando quieras** — sin permanencia, sin compromiso.

- Variante asimétrica (coherente con sectionStyle). Insignia: "Música sin límites".

**Nota de corrección:** este documento afirmaba originalmente que "usp-cards-asimetrico no tiene
variante con icono — las tarjetas USP no llevan icono en el schema". Era falso: el schema exigía
`icon` como campo obligatorio, y 06 rellenó emoji genérico (🌍📱✅) para poder validar — justo lo
que `iconography.componentImplication` del brand pack desaconseja para Spotify. Se creó
`usp-cards-sin-icono-asimetrico` (motor) para cerrar el hueco de verdad, y se migró
`campaign-data.json` a esa variante sin emoji. De paso se corrigieron las tildes que había
perdido todo el copy del cuerpo del email (bug de contenido de 05/06, no del motor).

### Módulo 7 — banda-cierre-asimetrico ✅ REQUIRED

**Decisión:** Incluido. Mismo CTA del hero.
- Variante asimétrica (coherente con sectionStyle).
- Gradiente negro→verde como fondo (coherente con el hero).

### Módulo 8 — footer ✅ REQUIRED

**Decisión:** Incluido. Con placeholders legales (isTestCampaign:true).

## Resumen de la secuencia

| # | Componente | Fondo | Decisión |
|---|---|---|---|
| 1 | header-logo | Blanco | Sí |
| 2 | hero-imagen | fotografía (bannerSrc, pendiente de generar/subir) | Sí |
| 3 | intro-cta-asimetrico | Blanco | Sí (opcional) |
| 4 | columns-3-beneficios-sin-icono | surfaces.sectionLila | Sí |
| 5 | (category-grid) | — | OMITIDO |
| 6 | usp-cards-sin-icono-asimetrico | surfaces.sectionLila | Sí (opcional) |
| 7 | banda-cierre-asimetrico | gradients.heroBackground + colors.deep | Sí |
| 8 | footer | surfaces.global | Sí |

**Total: 7 módulos** (5 obligatorios + 2 opcionales incluidos, 1 opcional omitido) — dentro del límite de 3-7 (institutional.md).
