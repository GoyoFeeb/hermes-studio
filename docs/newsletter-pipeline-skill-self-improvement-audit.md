# Newsletter Pipeline Skill — Self-Improvement Audit

## 1. Contexto

| Campo | Valor |
|---|---|
| Fecha | 2026-07-05 |
| Skill afectada | newsletter-pipeline |
| Archivo | `~/.hermes/skills/creative/newsletter-pipeline/SKILL.md` |
| Tipo de cambio | Self-improvement review automático (1 reemplazo) |
| Resultado de auditoría | ✅ Conservar |

## 2. Cambios identificados

### 2.1 Pre-embedding claim restrictions at architecture phase

**Nueva subsección** dentro de *Copy claim safety (agent 05)*.

**Contenido:**
- Documenta el patrón de definir claims prohibidos y seguros en la fase de Arquitectura (03) o Diseño (04), antes de que el Copywriter (05) redacte.
- Incluye ejemplo del formato usado en DemoSolar (15 prohibidos, 7 seguros).
- Enumera 4 beneficios: el copywriter tiene guardrails, validate-claims no detecta falsos positivos, el arquitecto puede rechazar módulos incompatibles, los handoffs llevan las restricciones.
- Indica cuándo usar: toda campaña, especialmente con restricciones regulatorias (finanzas, salud, energía, automoción).

**Origen:** Aprendizaje directo de DemoSolar, donde los claims se definieron desde el brief antes de que el copywriter empezara.

### 2.2 Nuevos anti-patterns (task-log.md y campaign-status.md)

**Dos nuevas entradas** en la lista de pitfalls:

| Anti-pattern | Problema | Solución documentada |
|---|---|---|
| task-log.md overwritten during phase transitions | Durante DemoSolar, task-log.md fue sobrescrito 2 veces, perdiendo 4 entradas acumuladas. | read_file → extraer entradas existentes → append → write_file con contenido completo acumulado |
| campaign-status.md losing nested sections | Durante DemoSolar, la sección Open Issues se perdió en la transición de fase 04. | Siempre incluir las 6 secciones. Eliminar contenido solo cuando un issue se resuelve, nunca eliminar la sección. |

**Origen:** Errores reales ocurridos durante la ejecución de DemoSolar.

### 2.3 Referencias actualizadas

| Documento | Cambio |
|---|---|
| `docs/export-html.md` | Añadido a la tabla de referencias |
| `docs/preview-html.md` | Añadido a la tabla de referencias |
| `docs/production-gate.md` | Añadido a la tabla de referencias |
| `docs/first-real-campaign-checklist.md` | Añadido a la tabla de referencias |
| `docs/pipeline-audit-final-ocu-bmw-demosolar.md` | Añadido a la tabla de referencias |
| `docs/pipeline-audit-final-verification.md` | Añadido a la tabla de referencias |
| `docs/system-validation.md` | Añadido a la tabla de referencias |
| `references/validate-claims-rules.md` | Añadido a "See also" |
| Production gate section | Ahora recomienda el wrapper `production-gate` como enfoque principal en lugar de solo los scripts individuales |

## 3. Impacto

| Dimensión | Impacto |
|---|---|
| Flujo 00→09 | ❌ Sin cambios ejecutivos en el flujo |
| Scripts (validate-claims, check-links, production-gate, etc.) | ❌ No modificados |
| Campañas (OCU, BMW, DemoSolar) | ❌ No modificadas |
| React Email / Componentes | ❌ No modificados |
| production-gate | ❌ No alterado. Solo mejor documentado (wrapper recomendado) |
| validate-claims | ❌ No alterado. Solo referenciado desde nueva sección de claims |
| check-links --strict | ❌ No alterado |
| validate-newsletter --production | ❌ No alterado |

**Impacto positivo en futuras campañas:**
- Pre-embedding de claims reduce el riesgo de copy inválido.
- Anti-patterns de task-log y campaign-status reducen la pérdida de trazabilidad.
- Referencias actualizadas conectan la skill con la documentación existente.

## 4. Riesgo

| Factor | Evaluación |
|---|---|
| ¿Introduce cambios en scripts? | ❌ No |
| ¿Introduce cambios en campañas? | ❌ No |
| ¿Introduce cambios en componentes? | ❌ No |
| ¿Introduce cambios en datos? | ❌ No |
| ¿Basado en errores reales? | ✅ Sí (DemoSolar) |
| ¿Reduce riesgo de claims inválidos? | ✅ Sí |
| ¿Reduce riesgo de pérdida de trazabilidad? | ✅ Sí |
| ¿Refuerza documentación de gates? | ✅ Sí |

**Clasificación:** ✅ **Seguro y recomendable conservar.**

## 5. Decisión final

| Decisión | Valor |
|---|---|
| ¿Revertir? | ❌ No |
| ¿Conservar? | ✅ Sí |
| ¿Usar como referencia? | ✅ Sí — para primera campaña real controlada |
| Justificación | Los cambios están basados en aprendizajes reales de DemoSolar, mejoran la disciplina operativa y no introducen riesgos técnicos. |
