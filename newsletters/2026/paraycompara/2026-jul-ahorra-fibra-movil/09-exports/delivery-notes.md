# Delivery Notes: Para y Compara — 2026-jul-ahorra-fibra-movil

| Campo | Valor |
|---|---|
| Cliente | Para y Compara |
| Campaña | 2026-jul-ahorra-fibra-movil |
| Fecha de exportación | 2026-07-09 |
| Última pasada visual | 2026-07-09 |
| Versión | 3.0.0 |
| Estado | ✅ Completado (prueba interna) |
| QA aprobado | ✅ 2026-07-09 |

## Archivos entregados

| Archivo | Descripción | Tamaño |
|---|---|---|
| `09-exports/final.html` | HTML completo de la newsletter | 39.6 KB |
| `09-exports/final-inline.html` | HTML con estilos inline (producción) | 29.8 KB |
| `09-exports/final-preview.png` | Captura de preview | 152.5 KB |
| `09-exports/assets/` | 12 assets PNG (~41 KB) | |
| `09-exports/delivery-notes.md` | Este documento | |
| `09-exports/ASSETS_PRODUCCION.md` | Notas de assets para producción | |

## Instrucciones de subida

| Plataforma | Archivo | Notas |
|---|---|---|
| Doctorsender / Mailchimp / HubSpot | `final-inline.html` | Usar este HTML con estilos inline |
| Preview / revisión interna | `final.html` | HTML pretty con assets relativos |
| Assets | `09-exports/assets/` | Subir a CDN y actualizar rutas en HTML |

## Resumen de la newsletter

| Aspecto | Detalle |
|---|---|
| Asunto | ¿Sigues pagando de más por tu fibra y móvil? |
| Preheader | Compara tarifas de más de 30 compañías y encuentra la que mejor encaje contigo. |
| Módulos | 8 (header, hero, servicios, pasos, educativo, cta-final, footer, legal) |
| CTA principal | COMPARAR TARIFAS → https://paraycompara.com/ |

## Enlaces incluidos

| CTA | Texto | URL |
|---|---|---|
| Principal | COMPARAR TARIFAS | https://paraycompara.com/ |
| Footer CTA | COMPARAR TARIFAS | https://paraycompara.com/ |
| Baja | Darse de baja | [PENDIENTE — solicitar al cliente] |
| Preferencias | Preferencias | [PENDIENTE — solicitar al cliente] |

## Parámetros UTM

| Parámetro | Valor |
|---|---|
| utm_source | [PENDIENTE] |
| utm_medium | email |
| utm_campaign | [PENDIENTE] |

## Limitaciones conocidas (prueba interna)

- `lang="es"` corregido en esta pasada
- Preheader hidden div con font-size/font-family explícitos corregido en esta pasada
- Imágenes usan rutas relativas `assets/...` — funcional para preview local, requieren CDN para producción
- Assets SVG originales del cliente convertidos a PNG mediante Playwright

## Bloqueos para producción

Ver `09-exports/production-blockers.md` para la lista completa de ítems pendientes antes de enviar a producción.

## Recomendaciones post-entrega

1. Solicitar al cliente: fromEmail, fromName, logo oficial, enlaces de baja y preferencias, dirección física
2. Subir assets a CDN y reemplazar rutas relativas por URLs absolutas HTTPS
3. Cambiar `isTestCampaign: false` y `productionReady: true` en newsletter-data.json
4. Ejecutar `npm run production-gate` para validación final
5. Generar preview final con assets en CDN antes de envío real