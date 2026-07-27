# Pipeline Audit — Verification Report

## Fecha

2026-07-05

## Resumen

Verificación de `docs/pipeline-audit-final-ocu-bmw-demosolar.md` frente a datos reales de las 3 campañas.

**Resultado:** ✅ Auditoría correcta — sin diferencias objetivas.

---

## Datos reales encontrados (por campaña)

### OCU (newsletters/2026/ocu/2026-jul-moneyman)

| Campo | Valor real | Fuente |
|---|---|---|
| Estado | ✅ completed | campaign-status.md |
| isTestCampaign | ✅ true | newsletter-data.json |
| productionReady | ✅ false | newsletter-data.json |
| final.html | ✅ 19.9 KB (20370 bytes) | 09-exports/final.html |
| final-inline.html | ✅ 16.0 KB (16408 bytes) | 09-exports/final-inline.html |
| final-preview.png | ✅ 101.6 KB (104064 bytes) | 09-exports/final-preview.png |
| Bloqueos de producción | ✅ 10 | production-blockers.md |
| Tipo de cierre | ✅ Prueba interna | delivery-notes.md |
| production-gate | ❌ No existía en ese momento | No implementado aún |

### Ejecución posterior de production-gate

Después de completar la auditoría, se ejecutó `production-gate` sobre la campaña OCU:

| Gate | Resultado |
|---|---|
| validate-newsletter --production | ❌ 5 errores (isTestCampaign, productionReady, fromEmail, 2 placeholders) |
| check-links --strict | ❌ 4 errores (fromEmail + 3 placeholders CRM) |
| validate-claims --production | ✅ 0 claims (29 reglas) |
| **Global** | **❌ Production gate failed — 2/3 gates** |

**Decisión:** Correcto y esperado. OCU sigue bloqueada para producción. Los gates funcionan correctamente.

### BMW (newsletters/2026/bmw/2026-jul-bmw-serie-1-oferta)

| Campo | Valor real | Fuente |
|---|---|---|
| Estado | ✅ completed | campaign-status.md |
| isTestCampaign | ✅ true | newsletter-data.json |
| productionReady | ✅ false | newsletter-data.json |
| final.html | ✅ 19.0 KB (19410 bytes) | 09-exports/final.html |
| final-inline.html | ✅ 15.4 KB (15782 bytes) | 09-exports/final-inline.html |
| final-preview.png | ✅ 114.8 KB (117565 bytes) | 09-exports/final-preview.png |
| Bloqueos de producción | ✅ 11 | production-blockers.md |
| Tipo de cierre | ✅ Prueba interna | delivery-notes.md |
| production-gate | ⚠️ Existía parcialmente (scripts individuales) | implementado tras campaña |

### Ejecución posterior de production-gate

Después de completar la auditoría, se ejecutó `production-gate` sobre la campaña BMW:

| Gate | Resultado |
|---|---|
| validate-newsletter --production | ❌ 5 errores (isTestCampaign, productionReady, fromEmail, 2 placeholders) |
| check-links --strict | ❌ 3 errores (fromEmail, preferencias, baja) |
| validate-claims --production | ✅ 0 claims (29 reglas) |
| **Global** | **❌ Production gate failed — 2/3 gates** |

**Decisión:** Correcto y esperado. BMW sigue bloqueada para producción. Los gates funcionan correctamente.

### DemoSolar (newsletters/2026/demosolar/2026-jul-demosolar-ahorro-energia)

| Campo | Valor real | Fuente |
|---|---|---|
| Estado | ✅ completed | campaign-status.md |
| isTestCampaign | ✅ true | campaign-status.md + JSON |
| productionReady | ✅ false | campaign-status.md + JSON |
| final.html | ✅ 17.8 KB (18203 bytes) | 09-exports/final.html |
| final-inline.html | ✅ 14.3 KB (14605 bytes) | 09-exports/final-inline.html |
| final-preview.png | ✅ 90.7 KB (92886 bytes) | 09-exports/final-preview.png |
| Bloqueos de producción | ✅ 11 | production-blockers.md |
| Tipo de cierre | ✅ Prueba interna | delivery-notes.md |
| production-gate | ✅ ❌ 2/3 gates fallan (esperado) | ejecutado durante fase 06 |

---

## Datos declarados en la auditoría (según docs/pipeline-audit-final-ocu-bmw-demosolar.md)

### Tabla comparativa (sección 2)

| Campaña | Tipo | Estado | isTest | prodReady | HTML | Preview | production-gate | Bloqueos |
|---|---|---|---|---|---|---|---|---|
| OCU | Ficticia | ✅ completed | true | false | 19.9 KB | 101.6 KB | ❌ (no existía) | 10 |
| BMW | Real (público) | ✅ completed | true | false | 19.0 KB | 115 KB | ❌ (existía parcial) | 11 |
| DemoSolar | Ficticia | ✅ completed | true | false | 17.8 KB | 90.7 KB | ❌ 2/3 gates | 11 |

### Resúmenes por campaña (sección 3)

| Campaña | Bloqueos declarados | Bloqueos reales | Diferencia |
|---|---|---|---|
| OCU | 10 (6 críticos, 2 altos, 2 medios) | 10 | ✅ Coincide |
| BMW | 11 (8 críticos, 2 altos, 1 medio) | 11 | ✅ Coincide |
| DemoSolar | 11 (7 críticos, 2 altos, 2 medios) | 11 | ✅ Coincide |

---

## Diferencias encontradas

**Ninguna diferencia objetiva.** Todos los datos declarados en la auditoría coinciden con los archivos reales de las campañas.

Las únicas variaciones menores son de redondeo en los tamaños de preview (101.6 KB vs 102K, 114.8 KB vs 115K) que son equivalentes y no constituyen error.

## Correcciones necesarias

❌ Ninguna. La auditoría es correcta y no requiere cambios.

---

## Decisión final

✅ **Auditoría correcta.** Todos los datos verificados coinciden. El documento puede mantenerse sin modificaciones.

| Campaña | Decisión |
|---|---|
| OCU | ✅ Datos verificados |
| BMW | ✅ Datos verificados |
| DemoSolar | ✅ Datos verificados |
| Auditoría (pipeline-audit-final-ocu-bmw-demosolar.md) | ✅ Sin correcciones necesarias |
