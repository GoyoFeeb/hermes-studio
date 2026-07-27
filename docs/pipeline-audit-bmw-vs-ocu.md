# Pipeline Audit: Hermes Newsletter System — BMW vs OCU

## Fecha de auditoría

2026-07-05

## Resumen ejecutivo

El pipeline Hermes ha sido ejecutado dos veces con éxito como prueba interna:
- **OCU** (2026-jul-moneyman): Campaña ficticia, primer test del sistema. Validó que el flujo 00→09 funciona de principio a fin.
- **BMW** (2026-jul-bmw-serie-1-oferta): Campaña con datos públicos reales de un cliente real (BMW España), producto real (Serie 1) y condiciones financieras reales. Validó que el pipeline maneja correctamente restricciones legales, claims prohibidos y bloqueos de producción.

Ambas campañas cerraron como `completed` (prueba interna), con `isTestCampaign: true` y `productionReady: false`, y con bloqueos de producción documentados.

---

## 1. Estado final de BMW

| Aspecto | Valor |
|---|---|
| Estado | ✅ Completed (prueba interna) |
| Producción | ❌ Bloqueada |
| Bloqueos | 11 (8 críticos, 2 altos, 1 medio) |
| Módulos | 7 |
| HTML final | ✅ 19.0 KB |
| HTML inline | ✅ 15.4 KB |
| Preview | ✅ 115 KB / 600x2200px |
| QA decisión | Aprobado para prueba interna |

## 2. Estado final de OCU

| Aspecto | Valor |
|---|---|
| Estado | ✅ Completed (prueba interna) |
| Producción | ❌ Bloqueada |
| Bloqueos | 10 (6 críticos, 2 altos, 2 medios) |
| Módulos | 7 |
| HTML final | ✅ 19.9 KB |
| HTML inline | ✅ 16.0 KB |
| Preview | ✅ 101.6 KB / 600x2000px |
| QA decisión | Aprobado para prueba interna |

---

## 3. Comparativa por fases

| Fase | OCU (ficticia) | BMW (real) | Diferencia |
|---|---|---|---|
| 00 Orchestrator | ✅ Creación y estructura | ✅ Creación y estructura | Idéntico. Reutilizable. |
| 01 Briefing | ⏳ Bloqueado por falta inputs. Desbloqueado con datos ficticios. | ✅ Completo con datos reales. | BMW más fluido porque los inputs existían desde el principio. |
| 02 Visual Analysis | ⚠️ Parcial. Sin referencias visuales reales. Valores inferidos. | ⚠️ Parcial. Sin guía de marca. Valores inferidos de web pública. | Ambos parciales. BMW tenía más referencias públicas (bmw.es) pero sin guía oficial. |
| 03 Architecture | ✅ 7 módulos genéricos | ✅ 7 módulos para automoción premium | La arquitectura se adaptó al producto: hero como presentación del Serie 1, benefits alineados con atributos del coche. |
| 04 Design | ✅ Paleta inferida. CTA azul. | ✅ Paleta inferida. CTA negro (premium). | El diseño se adaptó al tono de marca. BMW requirió paleta más sobria. |
| 05 Copy | ✅ Copy genérico. Corrección de claims "gratuita"/"puedes". | ✅ Copy premium. 15 claims prohibidos respetados. | BMW requirió más disciplina de claims por ser automoción con condiciones financieras reales. |
| 06 Data | ✅ JSON con 7 módulos. | ✅ JSON con 7 módulos + condiciones financieras + disclaimer. | BMW añadió complejidad legal/financiera en el JSON. |
| 07 React Email | ✅ 1 componente modificado (HeaderBlock). | ✅ 0 modificaciones. | BMW demostró que los componentes base son maduros. |
| 08 QA | ✅ 8 bloqueos producción. | ✅ 11 bloqueos producción. | BMW identificó 3 bloqueos adicionales: condiciones financieras, aprobación cliente, guía de marca. |
| 09 Export | ✅ HTML + inline + preview. | ✅ HTML + inline + preview. | Idéntico. Scripts reutilizables. |

---

## 4. Qué ha funcionado bien en BMW

- **Briefing completo desde el inicio:** Al tener datos reales (objetivo, CTA, URL, asunto, preheader, condiciones financieras), el agente 01 no bloqueó la campaña.
- **Disciplina de claims:** Los 15 claims prohibidos se respetaron en todo el flujo. Ninguno apareció en el JSON ni en el HTML final.
- **Condiciones financieras gestionadas correctamente:** Se incluyeron como referencia pública con disclaimer claro, sin convertirlas en claim central agresivo.
- **Componentes React Email sin modificaciones:** Los 7 módulos del JSON BMW se renderizaron con el template existente. HeaderBlock (sin logo), HeroBlock (sin imagen), BenefitsGridBlock (sin iconos) — todos funcionaron.
- **Paleta adaptada al tono de marca:** CTA negro en lugar de azul, reflejando una estética más premium/sobria.
- **11 bloqueos de producción documentados:** Cada bloqueo tiene responsable y acción requerida.

---

## 5. Qué ha funcionado mejor que en OCU

| Aspecto | OCU | BMW |
|---|---|---|
| Briefing inicial | Bloqueado, requirió datos ficticios | Fluido, datos reales disponibles |
| Corrección de claims | Necesaria (gratuita, puedes) | No necesaria (15 prohibidos respetados) |
| Componentes React Email | 1 modificación (HeaderBlock) | 0 modificaciones |
| Condiciones financieras | No aplicaban | Gestionadas con precisión legal |
| Bloqueos producción | 8 | 11 (más completos) |
| QA | Aprobó con placeholders | Aprobó con placeholders + condiciones financieras pendientes |

---

## 6. Qué ha sido más débil en BMW

- **Sin logo, hero ni guía de marca:** Aunque el pipeline funciona sin assets, una campaña de automoción premium sin imagen del producto pierde gran parte de su impacto.
- **Condiciones financieras sin validar:** Hay riesgo legal si se interpretan como aprobadas. El pipeline las marca como pendientes, pero la decisión final queda fuera del sistema.
- **Sin aprobación comercial/legal:** El pipeline no puede obtener aprobación externa. Depende del usuario/cliente.
- **Sin enlaces CRM reales:** El pipeline genera placeholders, pero no puede obtener fromEmail, baja y preferencias reales.

---

## 7. Partes del sistema reutilizables

| Componente | Reutilizable para | Estado |
|---|---|---|
| 10 agentes (00→09) | Cualquier campaña de newsletter | ✅ |
| Plantilla React Email | Cualquier campaña | ✅ |
| HeaderBlock (texto + imagen) | Cualquier campaña con o sin logo | ✅ |
| ModuleRenderer (13 tipos) | Cualquier campaña | ✅ |
| Script create-campaign | Nueva campaña desde plantilla | ✅ |
| Script validate-newsletter | Validación estructural | ✅ |
| Script check-links | Validación de enlaces | ✅ |
| Script prepare-react-email | Preparar React Email | ✅ |
| Script export-html | Exportación a HTML | ✅ |
| Script preview-html | Preview visual | ✅ |
| Plantilla de briefing real | Recogida de datos iniciales | ✅ |
| 8-qa/ plantillas | QA de cualquier campaña | ✅ |
| 09-exports/ plantillas | Documentación de exportación | ✅ |
| Skills newsletter-pipeline | Conocimiento del flujo | ✅ |
| Phase gates checklist | Criterios de salida | ✅ |

---

## 8. Riesgos gestionados bien

| Riesgo | Cómo se gestionó |
|---|---|
| Claims no validados | 15 claims prohibidos documentados y verificados en copy y JSON |
| Condiciones financieras incorrectas | Incluidas como referencia pública con disclaimer claro |
| Placeholders CRM | Documentados en delivery-notes, production-blockers, QA |
| Assets no disponibles | Versión base sin assets funcional. Versión mejorada documentada |
| Campaña ficticia vs real | isTestCampaign y productionReady controlan el estado |
| Sin apilado mobile | Documentado en responsive-QA, mobile-spec, structure |
| sin guía de marca | Valores inferidos claramente marcados como no oficiales |

---

## 9. Riesgos que deberían automatizarse mejor

| Riesgo | Automatización propuesta |
|---|---|
| Claims prohibidos en JSON | Script de validación de claims que busque palabras prohibidas en newsletter-data.json |
| Placeholders CRM detectados | check-links podría tener modo `--strict` que marque `#placeholder-*` como error |
| fromEmail vacío | validate-newsletter podría comprobar fromEmail no vacío en modo producción |
| productionReady flag inconsistente | Script que verifique que production blockers = 0 antes de permitir productionReady |
| Assets no disponibles | validate-newsletter podría tener campo opcional para listar assets requeridos y verificar que existen |

---

## 10. Mejoras recomendadas para el sistema

| # | Mejora | Prioridad | Impacto |
|---|---|---|---|
| 1 | **Script de validación de claims:** Buscar claims prohibidos en newsletter-data.json y marcar error si aparecen en contenido activo | Alta | ✅ Implementado — validate-claims (29 reglas, 2 modos) |
| 2 | **check-links modo strict:** Marcar `#placeholder-*` y `[PENDIENTE]` como error en modo producción | Alta | ✅ Implementado — `--strict` flag |
| 3 | **validate-newsletter modo production:** Añadir flag `--production` que verifique fromEmail, enlaces footer, isTestCampaign, productionReady | Alta | ✅ Implementado — `--production` flag |
| 4 | **Production gate unificado:** Script que ejecute los 3 gates de producción en un solo comando | Media | ✅ Implementado — production-gate (wrapper validate-newsletter + check-links + validate-claims) |
| 5 | **Control de campañas sin aprobación:** Añadir campo `clientApproved: boolean` en metadata y bloquear producción si es false | Media | Evita envíos sin autorización |
| 6 | **Template de production-blockers.md mejorado:** Incluir check específico para condiciones financieras, aprobación cliente, guía de marca | Media | Cubre más casos reales |
| 7 | **Validación de enlaces CRM:** check-links podría verificar que los enlaces de baja/preferencias no sean placeholders en modo --production | Alta | CRM gates |

---

## 11. Reglas nuevas recomendadas para futuras campañas reales

1. **Campaña con cliente real = QA aprobado solo para prueba interna hasta que cliente apruebe.**
2. **Condiciones financieras → siempre con disclaimer y referencia explícita a la fuente.**
3. **Claims de producto (tracción, potencia, consumo) → requieren validación técnica documentada.**
4. **Sin assets aprobados → campaña siempre isTestCampaign.**
5. **fromEmail, baja y preferencias → deben ser enlaces reales antes de productionReady.**
6. **Aprobación comercial/legal → debe documentarse en metadata antes de productionReady.**
7. **Auditoría final → obligatoria comparando bloqueos de campañas anteriores.**

---

## 12. Checklist para convertir prueba interna en producción real

| # | Elemento | Responsable | Estado |
|---|---|---|---|
| 1 | isTestCampaign → false | Proyecto | requerido |
| 2 | productionReady → true | Proyecto | requerido |
| 3 | fromEmail definido | CRM | requerido |
| 4 | Enlace baja real | CRM | requerido |
| 5 | Enlace preferencias real | CRM | requerido |
| 6 | Logo aprobado | Cliente | requerido |
| 7 | Hero image aprobada | Cliente | alto |
| 8 | Guía de marca | Cliente | alto |
| 9 | Condiciones financieras validadas | Cliente/Legal | requerido |
| 10 | Aprobación comercial/legal | Cliente | requerido |
| 11 | Claims verificados contra brief | QA | requerido |
| 12 | Assets iconos (si aplican) | Cliente | medio |
| 13 | Preview visual revisado | QA | alto |
| 14 | HTML validado en Outlook/Gmail | QA | requerido |
| 15 | validate-newsletter ✅ | Script | requerido |
| 16 | check-links ✅ (modo production) | Script | requerido |

---

## 13. Conclusión

| Dimensión | Estado |
|---|---|
| **Pipeline validado para pruebas internas** | ✅ **Sí** |
| Pipeline listo para campañas con datos reales | ✅ Sí (como prueba interna) |
| Pipeline listo para producción real con clientes externos | ⚠️ **Parcialmente** |
| Scripts de validación (validate-newsletter, check-links) | ✅ Sólidos |
| Scripts de exportación (export-html, preview-html) | ✅ Funcionales |
| Plantilla React Email y componentes | ✅ Maduros, sin modificaciones en BMW |
| Capacidad de gestionar condiciones financieras | ✅ Gestionadas con disclaimer |
| Capacidad de gestionar claims de producto | ✅ 15 prohibidos respetados |
| Capacidad de gestionar placeholders CRM | ⚠️ Documentados pero no bloqueados automáticamente |

### Decisión final

**El pipeline Hermes Newsletter System está validado para ejecutar campañas de prueba internas con datos reales de clientes, desde briefing hasta exportación HTML, inline y preview visual.**

Para producción real con clientes externos, el sistema necesita:

1. **Validación automática de claims prohibidos** en newsletter-data.json (mejora #1)
2. **check-links modo strict** para placeholders CRM (mejora #2)
3. **validate-newsletter modo production** con gates automáticos (mejora #3)
4. **Proceso externo** de aprobación comercial/legal del cliente (fuera del alcance del sistema)

Con estas mejoras, el pipeline estaría listo para producir campañas enviables a usuarios reales sin supervisión manual de los bloqueos de producción.
