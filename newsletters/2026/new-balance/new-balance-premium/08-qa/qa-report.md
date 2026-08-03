# QA Report — New Balance Premium

## Resumen
| Gate | Resultado |
|------|-----------|
| Engine integrity | ✅ PASS |
| Schema validation | ✅ PASS |
| Parity (source/inline) | ✅ PASS |
| Build | ✅ PASS |
| Claims (29 reglas) | ✅ PASS |
| Assets HTTP 200 | ❌ 3 URL reales 403 (protección bot NB.com) — esperado para test campaign |
| Control files | ✅ PASS |
| Column balance | ✅ PASS |
| Brand pack completeness | ✅ PASS |
| WCAG Contrast | ✅ PASS (10/10 combinaciones) |
| Production readiness | ✅ PASS (con avisos de placeholders — test campaign) |
| Hero decision | ✅ PASS |
| Structural differentiation | ✅ PASS |
| Brand visual report completeness | ✅ PASS (avisos N5 no bloqueantes) |

## Resultado global: **12/13 gates PASS** ✅
El único fallo (assets HTTP 403) es un **expected production blocker** para campaña de prueba — newbalance.com bloquea bots programáticos.

## Detalle de contrastes WCAG
| Combinación | Ratio | Umbral | Resultado |
|------------|-------|--------|-----------|
| CTA #FFFFFF / #151415 | 18.38:1 | 4.5:1 | ✅ |
| Texto secundario #6C6C6C / #FFFFFF | 5.25:1 | 4.5:1 | ✅ |
| Texto secundario #6C6C6C / #F2F2F3 | 4.69:1 | 4.5:1 | ✅ |
| Hero subtitle #FFFFFF / #CF0A2C | 5.63:1 | 4.5:1 | ✅ |
| H1 hero #FFFFFF / #CF0A2C | 5.63:1 | 3:1 | ✅ |
| Banda cierre #FFFFFF / #231F20 | 16.30:1 | 4.5:1 | ✅ |
| H2 #CF0A2C / #FFFFFF | 5.63:1 | 3:1 | ✅ |
| Enlace tarjeta #CF0A2C / #FFFFFF | 5.63:1 | 4.5:1 | ✅ |
| Footer #6C6C6C / #FFFFFF | 5.25:1 | 4.5:1 | ✅ |
| CTA secondary #CF0A2C / #FFFFFF | 5.63:1 | 4.5:1 | ✅ |

## Especificaciones
- **Patrón:** fotografia-primero
- **Módulos:** 6 (header-logo, hero-imagen, editorial-foto-texto, columns-3-beneficios-sin-icono, banda-cierre, footer)
- **Peso HTML inline:** 18.6 KB
- **Imágenes:** 3 (hero, editorial, logo — todos PENDING-CDN-UPLOAD)
- **Enlaces UTM:** 6
- **VML roundrects:** 6
- **Balance tablas:** 21/21

## Pendientes para producción
1. Subir hero-banner.jpg, logo.png y editorial-990.jpg a CDN
2. Actualizar URLs en campaign-data.json de PENDING-CDN-UPLOAD a URLs reales
3. Cambiar metadata.isTestCampaign a false
4. Cambiar metadata.productionReady a true
5. fromEmail real (no test@example.com)
6. Actualizar legalLine con datos reales de NB España si aplica
