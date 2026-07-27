# Production Blockers — Para y Compara

> Campaña: 2026-jul-ahorra-fibra-movil
> Fecha: 2026-07-09
> Estado: ⛔ BLOQUEADO para producción — válido solo como prueba interna

## Bloqueos críticos

| # | Ítem | Archivo/Lugar | Acción necesaria |
|---|---|---|---|
| 1 | **fromEmail placeholder** | `06-data/newsletter-data.json` → `metadata.fromEmail` | Solicitar email real (ej: newsletter@paraycompara.com) |
| 2 | **fromName placeholder** | `06-data/newsletter-data.json` → `metadata.fromName` | Solicitar nombre real (ej: "Para y Compara") |
| 3 | **isTestCampaign: true** | `06-data/newsletter-data.json` → `metadata.isTestCampaign` | Cambiar a `false` |
| 4 | **productionReady: false** | `06-data/newsletter-data.json` → `metadata.productionReady` | Cambiar a `true` |
| 5 | **Enlace de baja** | `final.html` + `newsletter-data.json` → `modules.footer.links[0]` | Reemplazar `[UNSUBSCRIBE_LINK]` por URL real |
| 6 | **Enlace de preferencias** | `final.html` + `newsletter-data.json` → `modules.footer.links[1]` | Reemplazar `[PREFERENCES_LINK]` por URL real |
| 7 | **Dirección física** | `final.html` + `newsletter-data.json` → `modules.legal.content.body` | Reemplazar `[DIRECCIÓN FÍSICA — pendiente del cliente]` |
| 8 | **Assets en CDN** | `09-exports/assets/` (12 PNGs) | Subir a CDN y actualizar rutas `assets/...` a URLs HTTPS |

## Bloqueos opcionales

| # | Ítem | Acción necesaria |
|---|---|---|
| 9 | **Confirmar precios/promociones** | El cliente debe validar si incluir cifras concretas |
| 10 | **Confirmar sorteo iPhone 16** | Verificar si la campaña debe mencionarlo |
| 11 | **UTM parameters** | Definir utm_source y utm_campaign |

## Notas técnicas

- **lang corregido**: `lang="en"` → `lang="es"` ✅ (esta pasada)
- **Preheader styling**: añadido font-size/font-family explícitos ✅ (esta pasada)
- **Assets locales**: 12 PNGs funcionales para preview, pendientes de CDN
- **HTML válido**: ambos `final.html` y `final-inline.html` pasan validación estructural
- **Preview visual**: ver `final-preview.png`