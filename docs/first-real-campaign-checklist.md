# First Real Campaign Checklist — Hermes Newsletter System

## 1. Objetivo

Este checklist debe usarse **antes, durante y después** de crear una campaña real con Hermes Newsletter System. Está basado en las lecciones aprendidas de 3 campañas de prueba (OCU, BMW, DemoSolar).

| Estado | Significado |
|---|---|
| ✅ | Listo para continuar |
| ⚠️ | Riesgo documentado — puede avanzar con precaución |
| ❌ | Bloqueante — no avanzar sin resolver |

---

## 2. Condiciones mínimas antes de iniciar una campaña real

| # | Condición | Obligatorio | Responsable |
|---|---|---|---|
| 1 | Cliente real confirmado | ✅ Sí | Proyecto |
| 2 | Briefing validado con datos reales | ✅ Sí | Proyecto / Cliente |
| 3 | URL principal real y funcional | ✅ Sí | Cliente |
| 4 | Asunto y preheader aprobados o marcados como "pendiente cliente" | ✅ Sí | Proyecto / Cliente |
| 5 | FromEmail real o documentado como pendiente | ✅ Sí | CRM / Cliente |
| 6 | Enlaces CRM (baja, preferencias, contacto) reales o pendientes documentados | ✅ Sí | CRM / Cliente |
| 7 | Legales aportados por cliente/legal si aplica | ✅ Sí | Legal / Cliente |
| 8 | Assets reales (logo, hero, iconos) o decisión aprobada de no usarlos | ✅ Sí | Cliente |
| 9 | Claims sensibles identificados desde el briefing | ✅ Sí | Proyecto |
| 10 | Responsable de aprobación comercial/legal definido | ✅ Sí | Proyecto / Cliente |

**Si alguna de estas condiciones falta y no está documentada como pendiente, la campaña debe iniciarse como `isTestCampaign: true`.**

---

## 3. Reglas durante el flujo 00→09

### Fase 00/01 — Briefing

| Check | Descripción |
|---|---|
| Objetivo | Estructurar datos reales del briefing en 00-brief/ |
| Obligatorio | CTA, URL, asunto, preheader, audiencia, tono, legales (si aplican), condiciones comerciales (si aplican), fuente/aprobación de cualquier claim sensible |
| Error común | Marcar URLs como "verificadas" sin aprobación → usar "referencia oficial localizada" |
| Bloqueante | Falta de CTA o URL principal. Falta de legales/condiciones solo si aplican. Falta de fuente o aprobación para claims sensibles |
| Documentar | Todas las preguntas abiertas relevantes. Como mínimo, si faltan: fromEmail, baja, preferencias, URL principal, legales/condiciones, logo, hero/assets y responsable de aprobación |
| **Avance** | ✅ Si el briefing tiene datos suficientes para prueba interna |

### Fase 02 — Brand Visual Analysis

| Check | Descripción |
|---|---|
| Objetivo | Analizar identidad visual disponible |
| Sin guía | Marcar todo como inferido. No inventar colores ni tipografías oficiales |
| Obligatorio | Documentar riesgos visuales y de producción adaptados a la campaña real. Riesgos críticos habituales: identidad visual no validada, URL principal no aprobada o no funcional, isTestCampaign activo, productionReady false, assets obligatorios ausentes o sin aprobación |
| Error común | Inventar identidad de marca |
| Bloqueante para prueba interna | Normalmente no. Bloqueante para producción: sí, si faltan identidad visual, assets obligatorios o aprobación de marca requeridos por el cliente |
| **Avance** | ✅ Siempre que los riesgos estén documentados |

### Fase 03 — Newsletter Architecture

| Check | Descripción |
|---|---|
| Objetivo | Definir módulos sin depender de assets |
| Módulos base | header, hero, text-block, benefits-grid, cta-block, legal, footer |
| Sin assets | Hero textual, header textual, benefits sin iconos |
| Claims | Documentar 15 prohibidos y 7+ seguros desde el inicio |
| Error común | Incluir módulos que requieren imágenes o iconos no disponibles |
| **Avance** | ✅ Siempre que la estructura funcione sin assets |

### Fase 04 — Email Design

| Check | Descripción |
|---|---|
| Objetivo | Layout 600px, paleta, CTA, desktop/mobile |
| Paleta inferida | Marcar claramente como inferida si no hay guía de marca |
| CTA | Esquinas rectas (Outlook), enlace `<a>`, no `<button>` |
| Mobile | Benefits-grid baseline 1 columna |
| Error común | Asumir apilado automático de Row/Column en mobile |
| **Avance** | ✅ Siempre que las limitaciones estén documentadas |

### Fase 05 — Copy

| Check | Descripción |
|---|---|
| Objetivo | Asunto, preheader, body, CTA sin claims |
| Estado | **No marcar como "Final"** sin aprobación externa |
| Estado correcto | "Aprobado para prueba interna / pendiente validación cliente" |
| Claims | 15 prohibidos documentados. Cero claims en copy activo |
| Error OCU | "gratuita" sin confirmación → corregido a "de ayuda" |
| Error OCU | "puedes ahorrar" → corregido a "podrías ahorrar" |
| Error BMW | "experiencia de conducción única" → corregido a "dinámica" |
| Error BMW | "tecnología de última generación" → corregido a "tecnología BMW" |
| **Avance** | ✅ Solo si el copy no contiene claims prohibidos |

### Fase 06 — Data

| Check | Descripción |
|---|---|
| Objetivo | Crear newsletter-data.json con 7 módulos |
| Obligatorio | 🟢 **Ejecutar validate-claims después de crear el JSON** |
| isTestCampaign | true (a menos que ya esté aprobada para producción) |
| productionReady | false |
| Placeholders CRM | #placeholder-contacto, #placeholder-preferencias, #placeholder-baja |
| **Avance** | ✅ Solo si validate-claims pasa sin errores críticos/altos |

### Fase 07 — React Email

| Check | Descripción |
|---|---|
| Objetivo | Verificar que los 7 módulos son compatibles con componentes existentes |
| Modificaciones | 0 si la arquitectura se diseñó sin assets |
| Error común | Modificar componentes globales sin necesidad |
| **Avance** | ✅ Siempre que ModuleRenderer soporte los tipos usados |

### Fase 08 — QA

| Check | Descripción |
|---|---|
| Objetivo | QA visual, responsive, Outlook, links, claims |
| Obligatorio | 🟢 **Ejecutar production-gate** (debe fallar para prueba interna) |
| Decisión | Dos niveles: "aprobado para prueba interna" / "aprobado para producción" |
| Error común | Decir solo "aprobado" sin distinguir nivel |
| Bloqueo producción | 11+ bloqueos documentados |
| **Avance a export** | ✅ Solo si QA aprueba para prueba interna |

### Fase 09 — Export

| Check | Descripción |
|---|---|
| Objetivo | Generar final.html, final-inline.html, final-preview.png |
| production-gate | ❌ Debe fallar para prueba interna |
| HTML generado | ✅ Verificar contenido (asunto, preheader, CTA, legal) |
| Preview generado | ✅ Verificar que no está vacío |
| **Estado final** | ✅ completed (prueba interna). ❌ No producción |

---

## 4. Reglas obligatorias de claims

| Regla | Aplicación |
|---|---|
| 🟢 validate-claims después de fase 06 | **Obligatorio.** Siempre. |
| Claim crítico o alto detectado | ❌ Bloquea avance. Corregir antes de continuar. |
| Claims financieros (intereses, TAE, comisiones) | Requieren fuente y aprobación cliente/legal |
| Claims técnicos (potencia, consumo, tracción) | No usar sin validación. Usar lenguaje experiencial. |
| Claims energéticos (ahorro, subvención, amortización) | Solo condicionales y sin cifras sin aprobación |
| No marcar copy como "Final" | Sin aprobación externa → "pendiente validación cliente" |
| validate-claims modo production | Obligatorio antes de cualquier envío real |

---

## 5. Reglas obligatorias de links

| Regla | Prueba interna | Producción |
|---|---|---|
| check-links normal | ✅ Debe pasar | ⏳ |
| check-links --strict | ❌ Debe fallar | ✅ Debe pasar |
| Placeholders CRM (#placeholder-*) | ⚠️ Permitido | ❌ Bloqueante |
| URLs example.com | ⚠️ Permitido | ❌ Bloqueante |
| fromEmail vacío | ⚠️ Permitido | ❌ Bloqueante |
| Baja/preferencias ausentes | ⚠️ Permitido | ❌ Bloqueante |

---

## 6. Production gate obligatorio

**Antes de cualquier envío real**, ejecutar:

```bash
npm run production-gate -- --campaign <campaign>
```

### Gates

| Gate | Comando | Debe pasar para producción |
|---|---|---|
| 1 | validate-newsletter --production | ✅ Sí |
| 2 | check-links --strict | ✅ Sí |
| 3 | validate-claims --production | ✅ Sí |

### Interpretación de resultados

| Resultado | Significado | Acción |
|---|---|---|
| ✅ 3/3 gates pasan | Campaña candidata a producción | Pendiente de aprobación humana |
| ❌ 1-2 gates fallan | Campaña no lista | Revisar bloqueos y corregir |
| ❌ 3/3 gates fallan | Campaña no lista | Problemas graves de estructura/datos |

---

## 7. Criterios para pasar de prueba interna a producción

| # | Criterio | Estado requerido |
|---|---|---|
| 1 | isTestCampaign | false |
| 2 | productionReady | true |
| 3 | fromEmail | Email real (no vacío, sin placeholder) |
| 4 | URL principal | URL real y funcional (no example.com) |
| 5 | Baja (unsubscribe) | URL real |
| 6 | Preferencias | URL real |
| 7 | Contacto | URL real (si aplica) |
| 8 | clientApproved | true (si existe en schema) |
| 9 | legalApproved | true (si existe en schema) |
| 10 | commercialApproved | true (si existe en schema) |
| 11 | production-gate | ✅ 3/3 gates pasan |
| 12 | Revisión humana final | Realizada |

---

## 8. Bloqueos automáticos de producción

| # | Situación | Bloquea producción |
|---|---|---|
| 1 | production-gate falla | ❌ Sí |
| 2 | fromEmail vacío | ❌ Sí |
| 3 | URL ficticia (example.com) | ❌ Sí |
| 4 | Placeholders CRM (#placeholder-*) | ❌ Sí |
| 5 | Claims críticos/altos detectados | ❌ Sí |
| 6 | Legales pendientes o sin confirmación | ❌ Sí |
| 7 | Assets obligatorios sin aprobar | ❌ Sí |
| 8 | Copy marcado como "Final" sin aprobación externa | ❌ Sí |
| 9 | campaign-status sin Open Issues visibles | ❌ Sí |
| 10 | task-log sobrescrito o incompleto | ❌ Sí |
| 11 | isTestCampaign: true | ❌ Sí |
| 12 | productionReady: false | ❌ Sí |

---

## 9. Checklist final de exportación

### Test export (prueba interna)

| # | Elemento | Estado esperado |
|---|---|---|
| 1 | validate-newsletter | ✅ |
| 2 | check-links normal | ✅ (warnings permitidos) |
| 3 | validate-claims | ✅ |
| 4 | production-gate | ❌ Debe fallar |
| 5 | final.html generado | ✅ |
| 6 | final-inline.html generado | ✅ (si es posible) |
| 7 | final-preview.png generado | ✅ (si es posible) |
| 8 | delivery-notes.md | ✅ Cierre como prueba interna |
| 9 | export-summary.md | ✅ Cierre como prueba interna |
| 10 | production-blockers.md | ✅ 11+ bloqueos documentados |

### Production export (envío real)

| # | Elemento | Estado requerido |
|---|---|---|
| 1 | production-gate | ✅ 3/3 gates pasan |
| 2 | HTML revisado visualmente | ✅ |
| 3 | Preview revisado | ✅ |
| 4 | Links reales (no placeholders) | ✅ |
| 5 | Legal aprobado por cliente/legal | ✅ |
| 6 | Asunto/preheader aprobados | ✅ |
| 7 | QA sin fails | ✅ |
| 8 | Entrega documentada | ✅ |

---

## 10. Recomendación final

| Dimensión | Estado |
|---|---|
| Hermes Newsletter System para pruebas internas | ✅ Validado y operativo |
| Hermes Newsletter System para primera campaña real controlada | ✅ Listo — siguiendo este checklist |
| Producción real sin aprobación externa | ❌ Bloqueado por diseño |
| Production-gate como paso obligatorio | ✅ Implementado y validado |

**Decisión final:** El sistema está listo para una primera campaña real controlada. Sin embargo, la producción real (envío a usuarios) debe permanecer bloqueada hasta que:

1. **production-gate pase** (3/3 gates)
2. **Haya aprobación externa** (comercial/legal del cliente)
3. **Los datos reales estén completos** (URL, fromEmail, CRM, assets, legales)

Cualquier campaña que no cumpla estas condiciones debe ejecutarse como `isTestCampaign: true` con `productionReady: false`.

> **Nota sobre adaptación de reglas:** Las reglas aprendidas de campañas ficticias (DemoSolar, OCU) deben adaptarse a campañas reales. En campañas reales, no usar "marca ficticia" ni "URL ficticia" como riesgo estándar; usar "identidad visual no validada" o "URL no aprobada/no funcional" cuando corresponda. Los riesgos documentados en campañas ficticias son una referencia metodológica, no una plantilla literal.
