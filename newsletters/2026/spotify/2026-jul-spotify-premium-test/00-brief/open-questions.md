# Open Questions: Spotify — 2026-jul-spotify-premium-test

## Preguntas abiertas

### [Q-001] — Textos legales de footer para email marketing de Spotify

**Pregunta:** ¿Qué textos legales específicos debe incluir el footer del email? (dirección física registrada, datos de contacto para bajas, aviso de privacidad, etc.)

**Contexto:** Spotify tiene presencia global con oficinas en múltiples países. Para un email de test interno no es bloqueante, pero para producción se necesita la versión específica de texto legal que Spotify usa en sus comunicaciones por email.

**Impacto:** Bajo — `isTestCampaign:true`, no bloquea la campaña de test. Los placeholders legales son aceptables.

**Posible respuesta / Suposición temporal:** Usar placeholder genérico: "© 2026 Spotify USA Inc. [DIRECCIÓN FÍSICA — PENDIENTE DEL CLIENTE]. [UNSUBSCRIBE_LINK]"

**Destinatario:** Cliente (Spotify)

---

### [Q-002] — Logo de Spotify (wordmark + isotipo)

**Pregunta:** ¿Se necesita el logo oficial (wordmark + isotipo de barras de sonido) antes de la exportación? El brand pack tiene `assets.logo` vacío.

**Contexto:** El logo se capturará durante el build o se usará el nombre de marca como texto. Con `isTestCampaign:true` es un aviso de Gate 10, no un error bloqueante.

**Impacto:** Bajo — no bloquea el test. La cabecera puede mostrar "SPOTIFY" como texto (estilo del patrón institutional) hasta tener el logo real.

**Posible respuesta / Suposición temporal:** Usar `header-logo.html` con `label: "SPOTIFY"` y `logoSrc: "https://placeholder.brand.es/spotify-logo.png"` (placeholder HTTPS).

**Destinatario:** Usuario / Cliente

---

### [Q-003] — Hero banner: generar con IA o dejar placeholder

**Pregunta:** ¿Generamos el arte del hero con `npm run generate-hero-image` (requiere OPENAI_API_KEY) o lo dejamos como placeholder para esta campaña de test?

**Contexto:** El brand pack documenta `photography.treatment` (alto contraste, iluminación dramática de estudio, isotipo como máscara). El patrón recomendado es `institutional` con `hero-centrado` (degradado negro→verde) o variante asimétrica. La decisión de 03 determinará si se necesita hero-imagen.

**Impacto:** Medio — afecta a la fase 03 (architect) y 06 (data generation). Si se elige `hero-imagen`, 06 necesita OPENAI_API_KEY configurada.

**Posible respuesta / Suposición temporal:** Por ahora, el patrón `institutional` puede usar `hero-centrado` o `hero-asimetrico` con el degradado bulletproof (gradients.heroBackground). No depende de generación de imágenes.

**Destinatario:** Usuario (decidir en fase 03)
