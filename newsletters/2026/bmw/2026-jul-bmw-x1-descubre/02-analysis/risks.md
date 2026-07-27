# Risks — BMW X1 (adaptación a email)

## Riesgos de marca

| ID | Riesgo | Impacto | Mitigación |
|----|--------|---------|------------|
| R-001 | Fuente `bmwTypeNextWeb` no disponible en email | Alto — la identidad tipográfica no se reproduce exactamente | Usar Arial/Helvetica como fallback primario, consistente con la cadena de fuentes del sitio |
| R-002 | El azul BMW (#1C69D4) puede verse diferente en pantallas no calibradas | Medio | Es un azul estándar RGB, se comporta bien en email |
| R-003 | Las imágenes del X1 en email necesitan compresión y dimensiones fijas | Medio | Usar imágenes de Scene7 de BMW (CDN oficial) con parámetros de tamaño |
| R-004 | Hero con fotografía real necesita contraste suficiente para texto superpuesto | Alto | Usar overlay oscuro semitransparente o colocar texto fuera de la imagen |

## Riesgos técnicos

| ID | Riesgo | Impacto | Mitigación |
|----|--------|---------|------------|
| R-005 | Hero generado por IA (hero-imagen) puede no capturar el lenguaje visual exacto de BMW | Medio | Usar photography.treatment del brand pack como prompt base; incluir referencia a fotografía real de bmw.es |
| R-006 | Outlook no soporta border-radius → botones aparecen cuadrados | Bajo | BMW ya usa botones casi rectos (3px radius) — la caída a cuadrado es aceptable |
| R-007 | VML para botones en Outlook necesita color exacto #1C69D4 | Bajo | Documentado en el CTA del brand pack |

## Riesgos de contenido

| ID | Riesgo | Impacto | Mitigación |
|----|--------|---------|------------|
| R-008 | No tenemos datos de producto confirmados (precios, consumos, motorizaciones) | Alto — NO incluirlos | Campaña de interés: CTA "Descubre" / "Solicita información" sin datos técnicos |
| R-009 | No tenemos logos vectoriales de BMW | Medio | Capturar de bmw.es o usar SVG inline si está disponible |
| R-010 | La campaña es isTestCampaign — no hay dirección ni enlaces de baja reales | Bajo | Usar placeholders estándar (no bloquea) |
