# Next Steps — BMW X1 "Descubre"

## Pendientes del cliente (imprescindibles para producción)

| # | Tarea | Responsable | Notas |
|---|-------|-------------|-------|
| U-001 | **Subir hero PNG al CDN** y aportar URL | Usuario | El arte está generado en `brands/bmw/design-input/hero-banner.png`. Subir a `feebbodigital.com/creativities-library/bmw/hero-banner.png` (o ruta equivalente). Luego actualizar `bannerSrc` en `campaign-data.json` y reconstruir. |
| U-002 | **Aportar logo BMW en PNG** | Usuario | Actualmente placeholder `https://PENDING-BMW-LOGO/`. Se necesita URL real del logo de BMW (120x36px, fondo transparente). |
| U-003 | **Aprobar copy final** | Usuario | Revisar y confirmar textos, especialmente CTAs y claims. |
| U-004 | **Configurar fromEmail real** | Usuario | Actualmente `test@example.com` — campaña de prueba. |

## Pendientes técnicos

| # | Tarea | Responsable | Notas |
|---|-------|-------------|-------|
| N-001 | Actualizar `bannerSrc` con URL real del CDN | Usuario + reconstruir | `campaign-data.json → hero-imagen.data.bannerSrc` |
| N-002 | Actualizar `logoSrc` con URL real del logo | Usuario + reconstruir | `campaign-data.json → header-logo.data.logoSrc` |
| N-003 | Marcar `productionReady: true` en campaign-data.json | Orchestrator | Solo cuando U-001 a U-004 estén resueltos |
| N-004 | Re-ejecutar production gate | Orchestrator | Tras cada cambio en campaign-data.json |
| N-005 | Revisión visual en cliente real | Usuario | Abrir `09-exports/final-inline.html` en Gmail, Outlook, Apple Mail |

## Lo que SÍ está listo

- ✅ HTML generado por el motor (no escrito a mano como el incidente)
- ✅ Hero image generado (lista para subir al CDN)
- ✅ Brand pack de BMW real, verificado con Chrome sobre bmw.es (no inventado)
- ✅ Production gate 8/8 verde (con placeholders documentados)
- ✅ Copy sin claims problemáticos (29 reglas pasadas)
- ✅ Columnas equilibradas (1.24x ratio)
- ✅ Control files sincronizados
