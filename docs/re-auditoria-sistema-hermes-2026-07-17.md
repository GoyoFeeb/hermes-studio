# Re-auditoría del sistema de newsletters — estado post-ronda 08

Fecha: 2026-07-17 (tarde) · Referencia: `auditoria-sistema-hermes-2026-07-17.md` (5 hallazgos originales)

## Estado de los 5 hallazgos originales

| # | Hallazgo | Estado | Detalle |
|---|---|---|---|
| H1 | Tres HTML finales no coincidentes | 🟡 **Resuelto a medias** | Fuente única declarada y archivado correcto (ronda 08, verificado bit a bit). PERO ver Defecto Nuevo N1: el inline certificado está desincronizado de su fuente. |
| H2 | Agentes no existen como archivos | ❌ Sin cambios | `agents/` no existe, `agentes/` sigue vacío. Planificado (orden 3), no iniciado. |
| H3 | Tres sistemas de diseño paralelos | ❌ Sin cambios | Pendiente de la decisión de motor único (orden 5). Motor ya acordado: HTML+juice. |
| H4 | Tokens premium fuera del core | ❌ Sin cambios | `brand-tokens.json` sigue en v2.1.0, `design-tokens-premium.json` sin marca `_superseded`. **El prompt 09 está escrito pero Hermes no lo ha ejecutado todavía.** |
| H5 | Control files sin verificación automática | ❌ Sin cambios — y acaba de morder de nuevo | No existe script de verificación. El Defecto N1 es exactamente el tipo de fallo que ese script habría atrapado. |

## Defectos nuevos encontrados (por orden de gravedad)

### N1 — CRÍTICO: el archivo oficial de envío tiene los iconos viejos

Cadena verificada por timestamps y contenido:

1. Ronda 07 (10:07): Hermes integró los 8 iconos oficiales en `v5-premium/final-premium-v2.html` (8 referencias `icon-tarifa-*`/`icon-aspecto-*`). ✅
2. Pero **no regeneró el inline** — `final-premium-v2-inline.html` es de las 09:29, anterior a la integración, con **0 referencias** a los iconos nuevos. (Era uno de los pendientes declarados por Hermes "awaiting console consent" y nunca se cerró.)
3. Ronda 08 (12:36) copió ese inline desactualizado a `09-exports/final-inline.html` y lo certificó como fuente única.

Resultado: `09-exports/final.html` (fuente) tiene los iconos oficiales; `09-exports/final-inline.html` (el que se enviaría por ESP) tiene los viejos. La "fuente única" de la ronda 08 son en realidad dos piezas distintas otra vez — el mismo patrón del Hallazgo 1 original, reproducido a menor escala 2 horas después de "resolverlo". Sin un check automático de paridad fuente/inline (H5), esto va a seguir pasando.

### N2 — El prompt 06 (correcciones post-auditoría) sigue sin ejecutarse

Los 3 defectos administrativos que documentaba siguen abiertos:

- `redesign-summary.md` sigue diciendo "Fecha: 2026-07-15" (las rondas fueron el 17).
- El CTA sigue a 16px y el fallo AA de contraste (3.10:1) no está documentado como riesgo aceptado en `qa-report.md` — ni opción A ni opción B.
- `task-log.md` solo registra la ronda 08 de las rondas Hermes — las rondas 02, 03, 04, 05 y 07 siguen sin entrada (la 07 tampoco se registró).

### N3 — Cabos sueltos de la ronda 07 (iconos oficiales)

- `qa-report-assets.md` referencia `rondas/ronda07/qa-report.md` — **ese archivo no existe**. Referencia rota.
- `icon-system-spec.md` no se actualizó con el set oficial (0 menciones a "oficial" o al rechazo de la propuesta), aunque el prompt 07 lo exigía.
- Los 8 PNGs nuevos siguen **solo en local** (`09-exports/assets/`), pendientes de subida manual al CDN según `ASSETS_PRODUCCION.md`. Mientras no se suban, el HTML fuente apunta a URLs que devuelven 404 — la pieza se enviaría con iconos rotos. (No he podido verificar el CDN desde este entorno; si ya los subiste, este punto queda cerrado con un HTTP 200 por archivo.)
- `brand-pattern-tile.png` da 404 en el CDN según el propio QA de Hermes — degrada con fallback de color, no rompe, pero sigue pendiente.

## Lectura general

La ronda 08 hizo bien su tarea declarada (archivar + declarar fuente) pero certificó sin verificar la paridad fuente/inline — y las rondas siguen dejando pendientes abiertos ("awaiting consent", "pendiente de subir") que nadie recoge después. El sistema no tiene memoria de sus propios cabos sueltos: cada prompt cierra su objetivo y los flecos quedan en prosa que nadie relee. Esto refuerza que los órdenes 3 (agentes como archivos, con criterios de cierre fijos) y 4 (script de verificación) no son mejoras opcionales sino el mecanismo que falta para que las rondas cierren de verdad.

## Recomendación de secuencia inmediata

1. **Prompt 10 (correcciones)**: regenerar inline desde la fuente (v5 y 09-exports), cerrar los 3 defectos del prompt 06, crear el qa-report de ronda 07 que falta, actualizar icon-system-spec.md, registrar rondas 02-07 en task-log. Una sola ronda administrativa que deje TODO cerrado.
2. **Subir los 8 PNGs al CDN** (acción tuya, manual — Hermes no tiene acceso de subida) y verificar HTTP 200.
3. **Ejecutar el prompt 09** (fusión de tokens), que ya está escrito.
4. Continuar con el plan: agentes (orden 3) → script de verificación (orden 4) → motor único (orden 5). El script del orden 4 debería incluir, además del hash del gate, el **check de paridad fuente/inline** — es la lección directa del Defecto N1.
