# Module Selection — BMW X1 "Descubre"

## Patrón: institutional

Justificación: El patrón `saving` (comparación de precios/ahorro) no aplica — esta campaña es editorial/premium, sin precios ni tarifas. El patrón `institutional` (presentación de marca/producto con beneficios y CTA) es el que corresponde: estructura hero → intro → beneficios → cierre.

## Secuencia de componentes

| # | Componente | Estado | Motivo |
|---|-----------|--------|--------|
| 1 | `header-logo` | ✅ **Incluido** | Logo BMW como cabecera de la newsletter |
| 2 | `hero-imagen` | ✅ **Incluido (hero-imagen)** | Landing real confirmada (bmw.es) + BMW usa fotografía real de alta calidad. hero-centrado sería subóptimo (no hay cifra que justifique hero-asimetrico, pero sí hay landing que alimentar a hero-imagen). |
| 3 | `intro-cta` | ✅ **Incluido** | Párrafo editorial de transición entre hero y beneficios. El brief permite un copy real sin inventar. |
| 4 | `columns-3-beneficios` | ✅ **Incluido (obligatorio)** | 3 beneficios clave del X1 identificables desde el brand pack: diseño, tecnología, versatilidad. |
| 5 | `category-grid` | ❌ **Omitido** | La campaña se centra en un solo modelo (X1). No hay categorías/líneas de producto que gridificar. |
| 6 | `usp-cards` | ❌ **Omitido** | Campaña de prueba (isTestCampaign: true) — no hay 3 claims de confianza verificables para rellenar este módulo. |
| 7 | `banda-cierre` | ✅ **Incluido (obligatorio)** | Cierre con CTA "Descubre el X1" y enlace a la landing oficial. |
| 8 | `footer` | ✅ **Incluido (siempre)** | Placeholder estándar para campaña de prueba. |

## Elección de hero: hero-imagen

| Criterio | Evaluación |
|----------|-----------|
| ¿Landing real confirmada? | ✅ Sí — https://www.bmw.es/es/coches-bmw/x/x1/bmw-x1.html |
| ¿Marca usa fotografía real? | ✅ Sí — photography.usesRealPhotography: true, photography.treatment documentado en brand pack |
| ¿Cifra de marca para hero-asimetrico? | ❌ No — campaña de interés sin datos de precio/ahorro |
| ¿OPENAI_API_KEY disponible? | Se determinará en fase 06 — si falla, 06 lo reporta como bloqueo, no se cambia la estructura |

**Decisión: hero-imagen.** El arte se genera sin texto (solo imagen del X1 con tratamiento fotográfico BMW), el titular "El nuevo BMW X1. Diseñado para emocionar." y el CTA van en HTML del motor. 06 ejecuta `npm run generate-hero-image` como parte de su fase.
