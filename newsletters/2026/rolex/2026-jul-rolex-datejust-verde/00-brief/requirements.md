# Requirements — Rolex Datejust "Una fecha para recordar"

## Requisitos legales

| ID | Requisito | Estado | Notas |
|----|-----------|--------|-------|
| L-001 | No incluir precios sin fuente verificada | ✅ Aplica | rolex.com no publica precio en la ficha de producto — la campaña tampoco lo hace |
| L-002 | No incluir referencias de catálogo/calibre/especificaciones técnicas sin dato oficial confirmado en la página fuente | ✅ Aplica | Solo se usa lo verbatim observado (ej. "Presentado en 1945", ventana de fecha a las 3h) |
| L-003 | No promocionar descuentos/financiación | ✅ Aplica | No aplica a la categoría — Rolex no hace descuentos |
| L-004 | Texto legal corporativo (datos del anunciante) | ❌ No aplica | isTestCampaign: true — no requiere datos reales |
| L-005 | Enlace de baja / preferencias | ❌ No aplica | isTestCampaign: true |
| L-006 | Dirección física del responsable | ❌ No aplica | isTestCampaign: true |

## Requisitos comerciales

| ID | Requisito | Estado | Notas |
|----|-----------|--------|-------|
| C-001 | CTA coherente con descubrimiento de marca (no venta directa) | ✅ Confirmado | "Descubrir el Datejust" — enlaza a la ficha oficial, no a un checkout |
| C-002 | Sin claims comparativos con competidores (Omega, Patek Philippe, Cartier) | ✅ Aplica | No se mencionan competidores |
| C-003 | Sin cifras técnicas no confirmadas (calibre, reserva de marcha, resistencia al agua) | ✅ Aplica | Campaña editorial/emocional, no una ficha técnica |
| C-004 | Tono sin urgencia ni lenguaje promocional agresivo | ✅ Aplica | Coherente con el registro real observado en rolex.com (afirmación calmada, sin exclamaciones) |

## Requisitos técnicos

| ID | Requisito | Estado | Notas |
|----|-----------|--------|-------|
| T-001 | Hero generado por engine — candidato a `hero-imagen` dado `photography.usesRealPhotography: true` en el pack | ✅ Motor | Decisión de 03 |
| T-002 | Build vía `node engine/build-newsletter.js` | ✅ Motor | Jamás HTML a mano |
| T-003 | Validación claims contra `claim-rules.ts` | ✅ Motor | Gate de 05 |
| T-004 | Production gate completo (`production-gate-motor.ts`) | ✅ Motor | Al final del pipeline |
| T-005 | Ejercitar el mecanismo `{{slot:fontface}}` con `typography.webFont` (Archivo) | ✅ Objetivo explícito de esta campaña | Ver `brands/rolex/tokens/brand-tokens.json` |
| T-006 | Ejercitar variantes `-sin-icono` en todos los módulos con campo de icono | ✅ Objetivo explícito de esta campaña | `iconography.style: "none"` en el pack |
| T-007 | Ejercitar `layout.sectionStyle: "asimetrico"` en al menos 2 módulos | ✅ Objetivo explícito de esta campaña | hero-asimetrico + banda-cierre-asimetrico como mínimo |
| T-008 | Verificar honestamente si el vocabulario de CTA no-píldora aplica — NO forzarlo si no hay evidencia | ✅ Ya resuelto en el pack | `components.ctaSecondary.style` sin declarar — CTA real de Rolex es pastilla, ver `_changelog` del pack |
