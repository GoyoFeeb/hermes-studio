# Next Steps — Rolex Datejust "Una fecha para recordar"

## Pendientes del cliente (imprescindibles para producción)

| # | Tarea | Responsable | Notas |
|---|-------|-------------|-------|
| U-001 | ~~Generar el hero~~ ✅ **Hecho 2026-07-25** — falta **subir el PNG al CDN** | Usuario | Hero generado localmente y verificado contra `photography.treatment` (9/10 criterios, ver `08-qa/brand-fidelity-qa.md` punto 2). Queda: subir a CDN, actualizar `bannerSrc` en `campaign-data.json` y reconstruir |
| U-002 | **Aportar logo real de Rolex (corona)** | Usuario | Actualmente placeholder `https://PENDING-ROLEX-LOGO/` — es SVG inline en el sitio real, no un asset CDN descargable directamente |
| U-003 | **Aprobar copy final** | Usuario | Revisar especialmente los 4 beneficios (materiales/certificación) y el ángulo de continuidad histórica |
| U-004 | **Configurar fromEmail real** | Usuario | Actualmente `test-rolex@internal-newsletter.es` — campaña de prueba |
| U-005 | **Aprobación comercial/legal de Rolex** | Usuario/cliente | No obtenida — mismo patrón que BMW X1, campaña de prueba interna únicamente |

## Pendientes técnicos

| # | Tarea | Responsable | Notas |
|---|-------|-------------|-------|
| N-001 | Actualizar `bannerSrc` con URL real del CDN | Usuario + reconstruir | `campaign-data.json → hero-imagen.data.bannerSrc` |
| N-002 | Actualizar `logoSrc` con URL real del logo | Usuario + reconstruir | `campaign-data.json → header-logo.data.logoSrc` |
| N-003 | Marcar `productionReady: true` | Orchestrator | Solo cuando U-001 a U-005 estén resueltos |
| N-004 | Re-ejecutar production gate tras cada cambio | Orchestrator | `npx tsx scripts/production-gate-motor.ts -- --campaign newsletters/2026/rolex/2026-jul-rolex-datejust-verde` |
| N-005 | Revisión visual en cliente real | Usuario | Abrir `09-exports/final-inline.html` en Gmail, Outlook, Apple Mail — verificar degradación de `@font-face` (Archivo) en clientes sin soporte |

## Lo que SÍ está listo

- ✅ HTML generado por el motor (`fotografia-primero`, 6 módulos, sin código a mano)
- ✅ Brand pack de Rolex real, verificado con Chrome sobre rolex.com (colores vía custom properties CSS, no aproximación visual)
- ✅ `@font-face` real (Archivo, pesos 300/700) ejercitado en una marca nueva
- ✅ 2 módulos con `layout.sectionStyle: "asimetrico"` ejercitados (intro-cta-asimetrico, banda-cierre-asimetrico)
- ✅ Variante `-sin-icono` ejercitada en columns-3-beneficios (4 ítems, extremo superior del rango 2-4)
- ✅ Vocabulario de CTA verificado honestamente: Rolex es 100% pastilla, `cta-bulletproof`/`cta-secondary-bulletproof` sin modificación — no se forzó `text-link`/`block` sin evidencia
- ✅ Contraste WCAG recalculado y corregido en el pack (2 combinaciones fallaban, ambas corregidas antes de avanzar)
- ✅ Copy sin claims problemáticos (29 reglas pasadas)
- ✅ Production gate (motor): 11/11 gates verdes (con placeholders documentados, esperados en campaña de prueba)
