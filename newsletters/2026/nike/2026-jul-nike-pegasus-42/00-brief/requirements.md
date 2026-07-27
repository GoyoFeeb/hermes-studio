# Requirements — Nike Pegasus 42

## Requisitos legales

| ID | Requisito | Estado | Notas |
|----|-----------|--------|-------|
| L-001 | No incluir precios sin fuente verificada | ✅ Aplica | Confirmar en nike.com |
| L-002 | No incluir claims de rendimiento sin verificar | ✅ Aplica | Cifras de drop, peso, amortiguación NO sin confirmar |
| L-003 | No promocionar promociones/descuentos | ✅ Aplica | isTestCampaign |
| L-004 | Texto legal corporativo | ❌ No aplica | isTestCampaign |
| L-005 | Enlace de baja / preferencias | ❌ No aplica | isTestCampaign |

## Requisitos comerciales

| ID | Requisito | Estado | Notas |
|----|-----------|--------|-------|
| C-001 | CTA de compra aceptable para producto | ✅ Confirmado | "Comprar el Pegasus 42" |
| C-002 | Sin claims comparativos con otros modelos | ✅ Aplica | No comparar con Vomero, Structure, etc. |
| C-003 | Sin cifras técnicas no verificadas | ✅ Aplica | Drop, peso, tecnología sinfuera del brief |

## Requisitos técnicos

| ID | Requisito | Estado | Notas |
|----|-----------|--------|-------|
| T-001 | Hero generado por engine (hero-imagen o hero-centrado) | ✅ Motor | Decisión de 03 |
| T-002 | Build vía node engine/build-newsletter.js | ✅ Motor | Jamás HTML a mano |
| T-003 | Validación claims contra claim-rules.ts (29 reglas) | ✅ Motor | Ojo con claims de rendimiento |
| T-004 | Production gate completo (9 gates, incluido brand-pack-completeness) | ✅ Motor | Gate 8 es nuevo |
