# Assets Notes — BMW X1 "Descubre"

## Assets necesarios

| Asset | Estado | Especificaciones | Responsable |
|-------|--------|-----------------|-------------|
| Logo BMW (PNG) | 🔴 **Pendiente** | Ancho 120px, altura proporcional ~36px. Blanco/fondo transparente. Capturar de bmw.es o solicitar al cliente. | 07 (capturar durante build) o usuario |
| Hero banner (generado) | 🔴 **Pendiente de generación** | 1200×700 → 600×350px. PNG sin texto (arte + tratamiento fotográfico BMW). Lo genera 06 vía `npm run generate-hero-image`. | 06 |
| Subida al CDN del hero | 🔴 **Pendiente de confirmación del usuario** | URL final tipo `https://feebbodigital.com/creativities-library/bmw/hero-banner.png` | Usuario |

## Especificaciones técnicas

- **Formato:** PNG para el hero (pérdida de calidad aceptable en email), PNG/WebP para el logo
- **Dimensiones hero:** 600×350px en email (1200×700 nativo para retina)
- **Modo de color:** RGB
- **Fondo:** Transparente para el logo; el arte del hero puede tener fondo integrado
- **Alt text:** Siempre descriptivo (nunca dejar vacío)

## Assets NO necesarios

- Iconos para beneficios: se usan emojis (`iconGlyph`) — cero dependencia de CDN
- Pattern tile: BMW no usa patrones de fondo decorativos
