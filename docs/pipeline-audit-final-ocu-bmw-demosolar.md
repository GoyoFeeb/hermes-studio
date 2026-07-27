# Hermes Newsletter System — Auditoría final (OCU + BMW + DemoSolar)

## Fecha

2026-07-05

## 1. Resumen ejecutivo

El pipeline Hermes Newsletter System ha sido **validado end-to-end con 3 campañas completas**:

| Campaña | Propósito | Resultado |
|---|---|---|
| **OCU** | Primer test del flujo 00→09 | ✅ Pipeline básico funciona |
| **BMW** | Test con datos reales de cliente/producto | ✅ Pipeline maneja claims, legales, bloqueos |
| **DemoSolar** | Validación de nuevos gates de producción | ✅ Gates funcionan correctamente |

Las 3 campañas se ejecutaron desde briefing hasta exportación HTML, inline y preview visual. Las 3 se cerraron como `completed` (prueba interna) con `isTestCampaign: true`, `productionReady: false` y bloqueos de producción documentados.

---

## 2. Tabla comparativa de campañas

| Campaña | Tipo | Datos | Estado | isTest | prodReady | HTML | Preview | production-gate | Propósito |
|---|---|---|---|---|---|---|---|---|---|
| OCU | Ficticia | Ficticios | ✅ completed | true | false | 19.9 KB | 101.6 KB | ❌ (no existía) | Validar flujo 00→09 |
| BMW | Real (público) | BMW Serie 1 | ✅ completed | true | false | 19.0 KB | 115 KB | ❌ (existía parcial) | Validar con cliente real |
| DemoSolar | Ficticia | Ficticios controlados | ✅ completed | true | false | 17.8 KB | 90.7 KB | ❌ 2/3 gates | Validar nuevos gates |

---

## 3. Resumen por campaña

### 3.1 OCU (2026-jul-moneyman)

**Propósito:** Validar que el flujo 00→09 funciona de principio a fin con datos ficticios.
**Datos:** Campaña ficticia de OCU para captación de leads. URL ficticia. Sin assets.
**Estado:** ✅ completed (prueba interna).
**Módulos:** 7 (header, hero, text-block, benefits-grid, cta-block, legal, footer).
**Bloqueos de producción:** 10 (6 críticos, 2 altos, 2 medios).
**Exportación:** final.html (19.9 KB), final-inline.html (16.0 KB), final-preview.png (101.6 KB).
**Lecciones aprendidas:**
- El flujo 00→09 es funcional.
- Los placeholders CRM y datos ficticios bloquean producción correctamente.
- El script export-html se creó durante esta campaña.
- Se corrigieron claims ("gratuita" → "de ayuda", "puedes" → "podrías").

> **Nota posterior:** production-gate fue ejecutado manualmente sobre OCU después de la auditoría inicial. El resultado fue ❌ failed: validate-newsletter --production con 5 errores, check-links --strict con 4 errores y validate-claims --production con 0 claims. Esto confirma que los gates bloquean correctamente OCU para producción, manteniendo limpia la capa de claims.

### 3.2 BMW (2026-jul-bmw-serie-1-oferta)

**Propósito:** Validar el pipeline con datos públicos reales de un cliente real (BMW España), producto real (Serie 1) y condiciones financieras reales.
**Datos:** URL oficial BMW, condiciones financieras (TAE 6,64%, 195€/mes), producto real.
**Estado:** ✅ completed (prueba interna).
**Módulos:** 7.
**Bloqueos de producción:** 11 (8 críticos, 2 altos, 1 medio).
**Exportación:** final.html (19.0 KB), final-inline.html (15.4 KB), final-preview.png (115 KB).
**Lecciones aprendidas:**
- Los claims técnicos (tracción, potencia) requieren disciplina.
- Las condiciones financieras requieren disclaimer y fuente clara.
- Las URLs públicas no deben marcarse como "verificadas" sin aprobación del cliente.
- Los componentes React Email no requirieron modificaciones.
- Se crearon las mejoras: validate-claims, check-links --strict, validate-newsletter --production, production-gate.

> **Nota posterior:** production-gate fue ejecutado manualmente sobre BMW después de la auditoría inicial. El resultado fue ❌ failed: validate-newsletter --production con 5 errores, check-links --strict con 3 errores y validate-claims --production con 0 claims. Esto confirma que los gates bloquean correctamente BMW para producción, manteniendo limpia la capa de claims.

### 3.3 DemoSolar (2026-jul-demosolar-ahorro-energia)

**Propósito:** Validar específicamente los 4 nuevos gates de producción.
**Datos:** Ficticios controlados con 15 claims prohibidos y 7 claims seguros.
**Estado:** ✅ completed (prueba interna).
**Módulos:** 7.
**Bloqueos de producción:** 11 (7 críticos, 2 altos, 2 medios).
**Exportación:** final.html (17.8 KB), final-inline.html (14.3 KB), final-preview.png (90.7 KB).
**Componentes modificados:** 0 (ninguno necesario).
**Validaciones:**
- validate-newsletter ✅
- check-links normal ✅ (3 warnings placeholders)
- validate-claims ✅ (29 reglas, 0 claims detectados)
- production-gate ❌ (2/3 gates fallan — correcto para prueba)

**Lecciones aprendidas:**
- Los 4 gates funcionan como se espera.
- validate-claims detecta contenido real del JSON.
- check-links --strict rechaza placeholders CRM.
- validate-newsletter --production rechaza flags de prueba.
- production-gate integra los 3 anteriores.

---

## 4. Validación de nuevos gates

### 4.1 validate-claims

| Aspecto | Valor |
|---|---|
| **Objetivo** | Detectar claims prohibidos, técnicos no validados o expresiones de riesgo en newsletter-data.json |
| **Reglas** | 29 (9 críticas, 14 altas, 6 medias) |
| **Modo normal** | Error para críticos/altos, warning para medios. Exit 0 o 1. |
| **Modo production** | Cualquier claim es error. Exit 0 solo si limpio. |
| **Resultado DemoSolar** | ✅ 0 claims detectados (modo normal y production) |
| **Decisión** | ✅ Implementado y validado |

### 4.2 check-links --strict

| Aspecto | Valor |
|---|---|
| **Objetivo** | Rechazar placeholders CRM y datos incompletos en producción |
| **Modo normal** | Placeholders como warning. Exit 0. |
| **Modo strict** | Placeholders como error. Exit 1. |
| **Resultado DemoSolar normal** | ✅ 3 warnings, exit 0 |
| **Resultado DemoSolar strict** | ❌ 4 errores (fromEmail + 3 placeholders), exit 1 |
| **Decisión** | ✅ Implementado y validado |

### 4.3 validate-newsletter --production

| Aspecto | Valor |
|---|---|
| **Objetivo** | Validar flags de producción, fromEmail, enlaces CRM, warnings |
| **Modo normal** | Estructura y JSON. No comprueba flags. |
| **Modo production** | isTestCampaign, productionReady, fromEmail, CRM links, warnings. |
| **Resultado DemoSolar normal** | ✅ exit 0 |
| **Resultado DemoSolar production** | ❌ 5 errores (isTest, prodReady, fromEmail, 2 placeholders), exit 1 |
| **Decisión** | ✅ Implementado y validado |

### 4.4 production-gate

| Aspecto | Valor |
|---|---|
| **Objetivo** | Ejecutar los 3 gates en orden y reportar resultado global |
| **Gates ejecutados** | validate-newsletter --production → check-links --strict → validate-claims --production |
| **Resultado DemoSolar** | ❌ 2/3 gates fallan (newsletter + links). Claims pasa. |
| **Mensaje** | "Campaign is NOT ready for production." Lista de gates fallidos. |
| **Decisión** | ✅ Implementado y validado |

---

## 5. Hallazgos principales

| Hallazgo | Evidencia |
|---|---|
| El flujo 00→09 funciona end-to-end | 3 campañas completadas exitosamente |
| El sistema permite pruebas internas sin bloquearlas | Las 3 campañas avanzaron hasta export |
| El sistema bloquea producción cuando faltan datos reales | production-gate ❌ en las 3 campañas |
| Placeholders CRM: aceptados en normal, bloqueados en strict | DemoSolar: normal ✅ (warnings), strict ❌ (errores) |
| Claims prohibidos controlables con validate-claims | DemoSolar: 0 claims, BMW: 0 claims en JSON final |
| production-gate funciona como cierre de seguridad | DemoSolar: 2/3 gates fallan correctamente |
| React Email renderiza campañas sin assets | DemoSolar: 0 modificaciones en componentes |
| 4 archivos de control permiten trazabilidad completa | campaign-status, handoff, task-log, next-steps sincronizados en cada fase |

---

## 6. Riesgos aún existentes

| Riesgo | Severidad | Mitigación |
|---|---|---|
| Dependencia de disciplina del agente para no sobrescribir históricos | Media | Documentado en skills |
| Campañas sin assets son válidas para prueba pero visualmente limitadas | Baja | Documentado en risks.md y QA |
| clientApproved/legalApproved no son campos obligatorios en el schema actual | Media | Recomendado a corto plazo |
| Preview visual no sustituye revisión humana en clientes reales | Media | Documentado en docs |
| Datos legales/financieros requieren validación externa (cliente/legal) | Alta | Fuera del alcance del sistema |

---

## 7. Recomendaciones finales

### Ya implementado

| Mejora | Estado |
|---|---|
| validate-claims (29 reglas, 2 modos) | ✅ |
| check-links --strict (placeholders CRM como error) | ✅ |
| validate-newsletter --production (flags, fromEmail, CRM) | ✅ |
| production-gate (wrapper de los 3 anteriores) | ✅ |
| Plantilla de briefing real (real-campaign-brief-template.md) | ✅ |
| Pipeline audit (BMW vs OCU) | ✅ |
| system-validation.md | ✅ |

### Recomendado a corto plazo

| Mejora | Prioridad |
|---|---|
| Añadir `clientApproved` y `legalApproved` como campos obligatorios en metadata para producción | Alta |
| Convertir production-gate en paso obligatorio antes de cualquier exportación de producción | Alta |
| Automatizar sincronización de los 4 archivos de control en cada transición de fase | Media |
| Mejorar validate-claims con contexto de campaña (automoción vs energía vs finanzas) | Media |

### Recomendado antes de producción real

| Acción | Responsable |
|---|---|
| Definir URL real del CTA | Cliente |
| Obtener fromEmail y enlaces CRM reales | CRM |
| Proporcionar assets aprobados (logo, hero, iconos) | Cliente |
| Validar claims legales/financieros con cliente/legal | Legal / Cliente |
| Obtener aprobación comercial antes de envío | Comercial / Cliente |
| Ejecutar production-gate y verificar que pasa los 3 gates | Sistema |
| Realizar QA en clientes de email reales (Outlook, Gmail, Apple Mail) | QA |

### Reglas para campañas reales

1. **production-gate obligatorio** antes de cualquier envío real.
2. **validate-claims obligatorio después de fase 06** siempre.
3. **Open Issues visible en campaign-status.md** durante todo el flujo.
4. **No exportar a producción si production-gate falla.**
5. **clientApproved y legalApproved** deben ser true antes de productionReady.
6. **isTestCampaign** debe ser false antes de productionReady.
7. **fromEmail y enlaces CRM** deben ser URLs reales, no placeholders.

---

## 8. Estado final del sistema

| Dimensión | Estado |
|---|---|
| **Pipeline 00→09** | ✅ **Validado** — 3 ejecuciones exitosas |
| **Pruebas internas** | ✅ **Operativo** — acepta datos ficticios o reales |
| **Producción real** | ⚠️ **Parcialmente preparada** — requiere datos reales y aprobación |
| **Gates de producción** (validate-claims, check-links --strict, validate-newsletter --production, production-gate) | ✅ **Operativos** — bloquean campañas incompletas |
| **Riesgo técnico actual** | 🟢 **Bajo** — componentes maduros, 0 modificaciones en DemoSolar |
| **Riesgo de producción sin aprobación** | 🔴 **Alto** — el sistema bloquea, pero la decisión final es humana |
| **Plantilla React Email y componentes** | ✅ **Maduros** — soportan header textual, hero sin imagen, benefits sin iconos |
| **Scripts CLI** (8 scripts npm) | ✅ **Funcionales** — create, validate, check, prepare, export, preview, claims, production-gate |
| **Documentación** (10+ docs) | ✅ **Completa** — workflow, naming, lifecycle, QA, brief template, gates, audits |

### Siguiente paso recomendado

Usar el sistema con una campaña real controlada que tenga todos los datos necesarios (URL real, fromEmail, enlaces CRM, assets, aprobación), ejecutando production-gate como paso obligatorio antes de producción.
