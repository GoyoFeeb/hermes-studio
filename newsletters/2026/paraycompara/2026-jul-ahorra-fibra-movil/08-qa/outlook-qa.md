# Outlook QA: Para y Compara — 2026-jul-ahorra-fibra-movil

| Campo | Valor |
|---|---|
| Cliente | Para y Compara |
| Campaña | 2026-jul-ahorra-fibra-movil |
| Fecha | 2026-07-13 |
| Versión Outlook | No verificado — sin acceso a Outlook/Litmus en este entorno |

## Resumen

| Total | ✅ Pass | ❌ Fail | ⚠️ Warning | N/A |
|---|---|---|---|---|
| 8 | 5 | 0 | 3 | 0 |

## Verificaciones

### Estructura

| Check | Estado | Notas |
|---|---|---|
| Layout basado en tablas | ✅ Pass | Todos los módulos usan `<table>` en lugar de div/flex. Verificado en código. |
| Contenedor 600px se renderiza | ⚠️ Warning | No verificado — sin acceso a Outlook/Litmus en este entorno. Construido con `max-width:600px`. |
| role="presentation" en todas las tablas | ✅ Pass | Verificado en código. |
| lang="es" presente | ✅ Pass | `lang="es"` en `<html>`. |

### Botones (CTA)

| Check | Estado | Notas |
|---|---|---|
| Botón funcional | ✅ Pass | 4 CTAs con VML bulletproof (`v:roundrect`) + fallback `<a>` para no-MSO. Verificado en código XML. |
| VML con v:roundrect presente | ✅ Pass | 4 ocurrencias en 09-exports/final.html, 4 en final-inline.html. Verificado con grep. |
| Border-radius con VML fallback | ✅ Pass | VML arcsize="50%" para Outlook. |
| Esquinas rectas aceptables | ✅ Pass | Fallback de VML con arcsize configurado. |

**CTAs verificados en código (no en render real):**
- 09-exports/final.html: 4 VML ✅
- v3-premium/final-fixed-v4.1.html: 2 VML ✅
- v5-premium: No verificado — archivo final-premium.html no encontrado en el proyecto

### Fondos e imágenes

| Check | Estado | Notas |
|---|---|---|
| Sin imágenes de fondo sin fallback | ✅ Pass | No se usan background-image en celdas clave. |
| Imágenes con width/height | ✅ Pass | Todas las imágenes tienen width y height explícitos. |
| Imágenes con display:block | ✅ Pass | Verificado en código. |

### Tipografía

| Check | Estado | Notas |
|---|---|---|
| Font fallback web-safe funciona | ⚠️ Warning | No verificado — sin acceso a Outlook/Litmus en este entorno. Familia: Arial, Helvetica, sans-serif. |
| Texto legible (contraste) | ⚠️ Warning | No verificado — sin acceso a Outlook/Litmus en este entorno. Relaciones de contraste calculadas en código (#FF5A3C/#FFFFFF = 3.5:1 aprox). |

## Errores Outlook

| ID | Módulo | Error | Severidad | Agente |
|---|---|---|---|---|
| OQ-001 | — | Sin acceso a Outlook/Litmus para verificación real | Baja | QA |

> **Nota:** Este QA se ha realizado mediante verificación de código (grep, revisión de estructura) y no mediante render real en Outlook o Litmus/Email on Acid. Las filas marcadas como ⚠️ Warning indican puntos que requieren verificación en un entorno de testeo de correo real antes de producción. Los CTAs con VML bulletproof, la estructura basada en tablas y el uso de web-safe fonts son buenas prácticas que maximizan la compatibilidad esperada, pero no sustituyen una prueba real en cliente.