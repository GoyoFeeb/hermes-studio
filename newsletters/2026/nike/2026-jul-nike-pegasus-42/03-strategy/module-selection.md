# Module Selection — Nike Pegasus 42

## Patrón: institutional

**Justificación contra el brand pack de Nike (5 dimensiones):**

| Dimensión del brand pack | Evidencia | Implicación para el patrón |
|--------------------------|-----------|---------------------------|
| `photography.usesRealPhotography: true` | Nike usa fotografía real de alta calidad como elemento visual dominante | El patrón debe priorizar la imagen sobre el texto. `institutional` permite hero grande + secciones visuales. |
| `photography.treatment` | Fondo blanco infinito, perfil lateral, ghost shoe | La imagen del producto debe ser el hero principal — encaja con hero-imagen. |
| `iconography.style: "line-icon"` + `componentImplication` | Nike NO usa iconos de beneficio decorativos. iconGlyph (emoji) es inapropiado. | `columns-3-beneficios` usa iconGlyph por defecto. Para Nike, usar el `card-tarifa-3` como alternativa (módulo 4 del patrón) que acepta icon como httpsUrl — así se pueden omitir iconos decorativos o usar iconos reales como imagen. |
| `voice.rhythm` | Frases medias-explicativas, tono técnico-seguro | El patrón `institutional` con intro-cta da espacio para un párrafo explicativo corto + CTA. |
| `layout.contentRhythm` | Fotografía domina → texto mínimo → iconos funcionales | Secuencia: hero (imagen) → intro (texto mínimo) → beneficios (texto + iconos solo si son imágenes reales) → cierre (CTA). `saving` (con tarjetas de precio y pasos) no encaja en absoluto. |

**Conclusión:** `institutional` es el patrón correcto. `saving` no encaja porque Nike no es un comparador de precios.

## Elección de hero: hero-imagen

| Criterio | Evaluación |
|----------|-----------|
| ¿Landing real confirmada? | ✅ Sí — https://www.nike.com/t/pegasus-42-mens-road-running-shoes-S1bYkOza/IB1873-702 |
| ¿Marca usa fotografía real? | ✅ Sí — photography.usesRealPhotography: true, photography.treatment documentado en brand pack |
| ¿Cifra de marca para hero-asimetrico? | ❌ No — no hay cifra de ahorro/beneficio que justifique hero-asimetrico |
| ¿OPENAI_API_KEY disponible? | Se determinará en fase 06 |

**Decisión: hero-imagen.** El arte se genera sin texto (solo imagen del Pegasus 42 con tratamiento fotográfico Nike), el titular "Nike Pegasus 42" y el CTA van en HTML del motor.

## Secuencia de componentes

| # | Componente | Estado | Motivo |
|---|-----------|--------|--------|
| 1 | `header-logo` | ✅ **Incluido** | Logo Nike (swoosh) como cabecera |
| 2 | `hero-imagen` | ✅ **Incluido (hero-imagen)** | Landing real + fotografía real de producto Nike |
| 3 | `intro-cta` | ✅ **Incluido** | Párrafo introductorio corto + CTA — necesario para transición hero→beneficios |
| 4 | `card-tarifa-3` | ✅ **Incluido (card-tarifa-3)** | 3 características del producto. Se usa `card-tarifa-3` en lugar de `columns-3-beneficios` porque: (a) `columns-3-beneficios` requiere iconGlyph (emoji), que el brand pack de Nike prohíbe explícitamente (iconography.componentImplication); (b) `card-tarifa-3` usa icon como httpsUrl, permitiendo usar imágenes reales (o iconos funcionales si se obtienen); (c) aunque la sección se llame "3 beneficios", el layout de card-tarifa-3 (3 columnas con icono+título+body+enlace) se asemeja más a las tarjetas "Features That Perform" de nike.com. |
| 5 | `category-grid` | ❌ **Omitido** | Un solo producto (Pegasus 42). No hay categorías que gridificar. |
| 6 | `usp-cards` | ❌ **Omitido** | No hay 3 claims de confianza verificables para esta campaña de prueba. |
| 7 | `banda-cierre` | ✅ **Incluido (obligatorio)** | Cierre con CTA "Comprar el Pegasus 42" |
| 8 | `footer` | ✅ **Incluido (siempre)** | Placeholder isTestCampaign |
