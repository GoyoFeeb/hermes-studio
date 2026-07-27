# Requirements — BMW X1 "Descubre"

## Requisitos legales

| ID | Requisito | Estado | Notas |
|----|-----------|--------|-------|
| L-001 | No incluir precios sin fuente verificada | ✅ Aplica | Campaña de interés — no se usan precios |
| L-002 | No incluir consumos ni emisiones sin datos oficiales | ✅ Aplica | Campaña de interés — no se usan datos técnicos |
| L-003 | No promocionar promociones/financiación sin verificar | ✅ Aplica | Campaña de interés — no se usan |
| L-004 | Texto legal corporativo (datos del anunciante) | ❌ No aplica | isTestCampaign: true — no requiere datos reales |
| L-005 | Enlace de baja / preferencias | ❌ No aplica | isTestCampaign: true |
| L-006 | Dirección física del responsable | ❌ No aplica | isTestCampaign: true |

## Requisitos comerciales

| ID | Requisito | Estado | Notas |
|----|-----------|--------|-------|
| C-001 | CTA coherente con lead gen (no venta directa) | ✅ Confirmado | "Descubre el X1" / "Solicita información" |
| C-002 | Sin claims comparativos con competidores | ✅ Aplica | No comparar con Audi/Volvo/Mercedes |
| C-003 | Sin cifras de potencia, velocidad, autonomía | ✅ Aplica | Campaña emocional/aspiracional, no técnica |

## Requisitos técnicos

| ID | Requisito | Estado | Notas |
|----|-----------|--------|-------|
| T-001 | Hero generado por engine (hero-centrado o hero-imagen) | ✅ Motor | Decisión de 03 |
| T-002 | Build vía `node engine/build-newsletter.js` | ✅ Motor | Jamás HTML a mano |
| T-003 | Validación claims contra `claim-rules.ts` | ✅ Motor | Gate de 05 |
| T-004 | Production gate completo | ✅ Motor | Al final del pipeline |
