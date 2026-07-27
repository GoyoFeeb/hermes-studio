# Open Questions — BMW Experiencia Premium

## [Q-001] URL principal de la campaña

| Campo | Valor |
|-------|-------|
| **Pregunta** | ¿Qué URL debe usar la campaña como CTA principal? "Experiencia Premium" es un concepto de marca general, no vinculado a un modelo concreto como el X1 o el M4. |
| **Contexto** | Las URLs existentes en campañas BMW del sistema son: `https://www.bmw.es/es/coches-bmw/x/x1/bmw-x1.html` (X1 campaign) y `https://www.bmw.es/es/configurador.html` (M4 campaign). Ninguna es una URL general de "experiencia BMW". |
| **Impacto** | Bloquea el CTA principal de todas las secciones (hero, intro, banda-cierre). Sin URL confirmada, no se puede completar el campaign-data.json. |
| **Destinatario** | Usuario (cliente) |
| **Estado** | ✅ Resuelta — Usar `https://www.bmw.es/es/home.html` |

**Decisión:** Página principal de BMW España (`https://www.bmw.es/es/home.html`). Confirmada por el usuario como URL principal de la campaña. Se usará como CTA principal en hero, intro y banda-cierre.

## [Q-002] Imagen de cabecera (hero banner)

| Campo | Valor |
|-------|-------|
| **Pregunta** | ¿Se debe generar una imagen de cabecera con el flujo `hero-imagen` (OpenAI) para esta campaña? El brand pack BMW usa fotografía real como elemento principal. |
| **Contexto** | El flujo requiere `OPENAI_API_KEY` en `.env` y genera un banner con DALL-E / GPT-Image-1/2. La imagen debe subirse al CDN después de generada. |
| **Impacto** | Bajo — podemos generar la imagen sin confirmación adicional. El Gate de assets fallará hasta que se suba al CDN (esperado en campaña de test). |
| **Destinatario** | Orchestrator (decisión interna) |
| **Estado** | ✅ Resuelto — Se usará `hero-imagen` con generación de arte vía script `generate-hero-image`. |
