# Delivery Notes — Audi A6 Sportback e-tron

## Campaña
- **Cliente**: Audi
- **Campaña**: 2026-jul-audi-premium
- **Modelo**: Audi A6 Sportback e-tron
- **Fecha**: 2026-07-27
- **Estado**: Test campaign (`isTestCampaign: true`)

## Archivos generados

| Archivo | Ruta | Tamaño |
|---|---|---|
| HTML fuente | `09-exports/final.html` | ~24 KB |
| HTML inline | `09-exports/final-inline.html` | ~24 KB |
| Build manifest | `09-exports/build-manifest.json` | — |
| Hero image (local) | `09-exports/assets/hero-banner.png` | 1024×576 PNG |
| Campaign data | `06-data/campaign-data.json` | Validado schema |
| Brand tokens | `brands/audi/tokens/brand-tokens.json` | v2.2.0 |

## Estructura de módulos

| # | Componente | Contenido |
|---|---|---|
| 1 | `header-logo` | Logo Audi + label "100 % eléctrico" |
| 2 | `hero-imagen` | Banner + "El progreso adopta una nueva silueta." + CTA Solicitar oferta |
| 3 | `intro-cta` | "Elegancia eléctrica, sin concesiones." |
| 4 | `columns-3-beneficios-sin-icono` | 773 km · 270 kW · 800 V |
| 5 | `intro-cta` | "Diseñado para avanzar." |
| 6 | `intro-cta` | "Un espacio que piensa contigo." |
| 7 | `banda-cierre` | "Tu próximo Audi empieza aquí." + CTA Configurar |
| 8 | `footer` | Legal, baja, preferencias |

## Paleta utilizada

| Token | Valor | Uso |
|---|---|---|
| `colors.primary` | `#000000` | Texto principal, CTA |
| `colors.deep` | `#101319` | Fondo cierre oscuro |
| `colors.white` | `#FFFFFF` | Blanco técnico, texto sobre oscuro |
| `surfaces.white` | `#FCFCFD` | Superficie clara (off-white Audi) |
| `surfaces.global` | `#F5F5F5` | Fondo secciones alternas |
| `colors.textSecondary` | `#67707F` | Texto secundario, legales |
| `colors.onBrandSecondary` | `#ABB1C3` | Subtítulo hero y cuerpo banda-cierre |

## Claims verificados

| Claim | Fuente | Estado |
|---|---|---|
| 773 km autonomía WLTP | Brief del cliente | ✅ Verificado |
| 270 kW carga rápida DC | Brief del cliente | ✅ Verificado |
| 800 V arquitectura | Brief del cliente | ✅ Verificado |
| 0 g/km CO₂ | Brief del cliente | ✅ Verificado |
| 100 % eléctrica | Brief del cliente | ✅ Verificado |

## Pendientes para producción

| # | Tarea | Responsable |
|---|---|---|
| 1 | Subir anillos Audi PNG al CDN (blanco y negro) | Producción |
| 2 | Subir hero-banner.png al CDN desde `09-exports/assets/` | Producción |
| 3 | Verificar URLs audi.es no devuelven 503 desde ESP | Producción |
| 4 | Sustituir `[UNSUBSCRIBE_LINK]` y `[PREFERENCES_LINK]` por tags reales del ESP | Producción |
| 5 | Revisar y actualizar disclosure legal con cifras WLTP exactas | Legal / Cliente |
| 6 | Cambiar `isTestCampaign` a `false` y `productionReady` a `true` | Producción |
| 7 | Ejecutar production-gate completo con URLs CDN reales | QA |
| 8 | Realizar capturas de preview (desktop + mobile 320/375/430) | QA |

## URLs de landing

| CTA | URL | Estado |
|---|---|---|
| Solicitar oferta / Descubrir | `https://www.audi.es/es/modelos/a6-e-tron/a6-sportback-e-tron/` | ✅ Del brief |
| Configurar mi Audi | `https://www.audi.es/es/modelos/a6-e-tron/a6-sportback-e-tron/configurador/` | ✅ Del brief |
