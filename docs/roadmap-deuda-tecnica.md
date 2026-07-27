# Roadmap de Producto — Deuda Técnica del Motor (Hermes Newsletter System)

**Versión:** 1.0
**Fecha:** 2026-07-27
**Basado en:** Hallazgos dispersos verificados contra el estado real del repositorio — `memory.md`, `engine/README.md`, `patterns/saving.md` §5, `docs/f5-prueba-real-cerrada.md`, `engine/CHANGELOG.md` — no hay un informe funcional previo (`case-to-report`); este roadmap parte directamente del backlog técnico conocido.
**Equipo estimado:** 1 (Claude Code, ejecución autónoma vía `roadmap-to-plan`)
**Horizonte temporal:** ~2-3 semanas de trabajo efectivo (orientativo)

---

## Estado 2026-07-27

F1.1 y F1.2 quedan cerradas en el repositorio: `create-campaign.ts` incluye fallback manual ante
`EACCES`, `newsletters/_campaign-template/06-data/` ya arranca con `campaign-data.json`, y
`npm test` usa `node --test` con cobertura de tokens, patrones, adaptadores y smoke end-to-end.
No se añadió Vitest. F2.5 queda parcialmente cerrada con la limpieza de outputs de prueba y
artefactos del paquete entregable; `engine/_test/` se conserva porque contiene tests reales.

Nota de aplicación de skills: `report-to-roadmap` detectó este roadmap como roadmap activo, por
lo que no se creó un roadmap paralelo. `roadmap-to-plan` sincronizó `tasks.json` y `TASKS.md`
con este estado.

Actualización de ejecución: F2.1, F2.2, F2.3 y F2.4 quedan cerradas el 2026-07-27. El enlace
secundario de `card-tarifa*` usa `colors.primary` y queda cubierto por `check-contrast.ts`; el
bug "Antes de decidir" queda reclasificado como histórico/no accionable en motor; y
`check-column-balance.ts` bloquea títulos de cierre >45 caracteres. La variante `card-tarifa-2`
permanece bloqueada hasta que una campaña real la necesite.

## Resumen ejecutivo

El pipeline de 10 agentes y el motor propio (`engine/`) están cerrados y validados desde F5 (2026-07-21), y en producción de prueba activa contra 12 marcas reales. Este roadmap no añade funcionalidad de negocio: organiza la deuda técnica y los hallazgos de auditoría documentados. La primera prioridad era la **fiabilidad operativa del pipeline** (fallback de `create-campaign` y tests automatizados), ya cerrada el 2026-07-27; queda después el **refinamiento de componentes y contenido** (una variante de layout, un fallo de contraste, un bug puntual y una mejora de validación) que no bloquea el uso actual del sistema pero sí su solidez a medio plazo.

Nota importante de verificación: el hallazgo original sobre `card-tarifa` mezclaba la variante de **2** con la de **3**. Al revisar `engine/components/` y `patterns/saving.md` se confirmó que la variante de **3** ya se construyó el 2026-07-21 (`card-tarifa-3.html`); solo falta la de **2**. La documentación operativa ya queda corregida.

---

## Vista general de fases

| Fase | Nombre | Objetivo | Estimación | Estado |
|------|--------|----------|------------|--------|
| 1 | Fiabilidad del pipeline | Eliminar el único fallo operativo conocido y cerrar el hueco de tests automatizados | Cerrada 2026-07-27 | Cerrada |
| 2 | Refinamiento de componentes y contenido | Resolver hallazgos de diseño/contenido documentados y sin cerrar | ~3-5 días | Parcial: 4/5 cerradas |

**Total estimado:** ~2-3 semanas para una sola persona/agente

---

## Fase 1 — Fiabilidad del pipeline

**Objetivo:** Que el pipeline no falle por causas ya conocidas y que cualquier regresión futura en el motor o los scripts críticos se detecte automáticamente, sin depender de que alguien ejecute una campaña real para descubrirlo.
**Criterio de entrada:** Ninguno — son fixes independientes, se puede empezar ya.
**Criterio de salida:** `create-campaign.ts` funciona en el entorno donde antes fallaba (o falla con un mensaje claro y una alternativa), y existe una suite de tests que corre en CI sin depender de campañas reales ni de red.
**Estado:** Cerrada el 2026-07-27.

### Features

#### F1.1 Tolerancia de `create-campaign.ts` a fallos EACCES
- **Descripción**: `scripts/create-campaign.ts` usa `fs.cpSync` para copiar `newsletters/_campaign-template/`. En carpetas montadas en sesiones tipo Cowork, `cpSync` puede fallar con `EACCES`; desde 2026-07-27 el script cae a una copia recursiva archivo por archivo.
- **HUs relacionadas**: — (hallazgo técnico de `docs/f5-prueba-real-cerrada.md`)
- **Criterios de aceptación clave**:
  - [ ] `create-campaign` crea la campaña correctamente en un filesystem con las mismas restricciones que causaban el `EACCES` (verificar en un entorno montado real, no solo en local)
  - [ ] Si la copia recursiva falla, el script cae a un método alternativo (copia archivo por archivo, o invocar `cp -r`) en vez de abortar
  - [ ] `pipeline-skill/references/script-usage.md` documenta el comportamiento y, si queda alguna limitación, la alternativa manual
- **Estimación**: S
- **Dependencias**: Ninguna
- **Riesgo**: Bajo — el fallback ya se conoce y funciona, es implementarlo/documentarlo, no investigarlo

#### F1.2 Suite de tests automatizados para el motor
- **Descripción**: `package.json` define `npm test` con `node --test`. La suite cubre resolución de patrones (`lib/pattern.js`), adaptadores de módulo (`lib/assemble.js` — `MODULE_ADAPTERS`), resolución de tokens (`lib/tokens.js`), y un test de humo end-to-end usando `engine/schema/campaign-data.example.json`.
- **HUs relacionadas**: —
- **Criterios de aceptación clave**:
  - [x] `npm run test` ejecuta una suite real y el proceso falla (exit ≠ 0) si algo se rompe
  - [x] Tests unitarios de `lib/assemble.js`, `lib/pattern.js`, `lib/tokens.js`
  - [x] Un test de humo construye el ejemplo (`campaign-data.example.json`) y verifica que `build-manifest.json` se genera sin warnings
  - [x] La suite corre sin red y sin brand packs de clientes reales (solo con el ejemplo y fixtures del propio repo)
- **Estimación**: L
- **Dependencias**: Ninguna (se puede aprovechar para cubrir F1.1 con un test de integración)
- **Riesgo**: Cerrado — se eligió el runner nativo de Node para evitar dependencias nuevas.

---

## Fase 2 — Refinamiento de componentes y contenido

**Objetivo:** Cerrar hallazgos de diseño y contenido que quedaron documentados como pendientes en las auditorías pero sin resolver — ninguno bloquea el uso actual del sistema, pero todos están anotados como deuda en `memory.md`/`patterns/saving.md`.
**Criterio de entrada:** Ninguno (independiente de Fase 1, se puede paralelizar).
**Criterio de salida:** `memory.md`, `engine/README.md` y `patterns/saving.md` §5 reflejan el estado real (sin pendientes obsoletos ni contradicciones entre secciones del mismo documento).

### Features

#### F2.1 Variante `card-tarifa-2.html` (grid de 2 tarjetas) y corrección de la documentación
- **Descripción**: El patrón `saving` soporta 4 tarjetas (`card-tarifa.html`) y 3 (`card-tarifa-3.html`, añadida 2026-07-21), pero no 2. Regla anti-aspiracional del proyecto: no construir la variante de 2 hasta que una campaña real la necesite. La documentación ya queda corregida el 2026-07-27.
- **HUs relacionadas**: —
- **Criterios de aceptación clave**:
  - [x] `engine/README.md` y `patterns/saving.md` §5 actualizados: el pendiente real es solo "variante de 2", no "2 o 3"
  - [ ] Si aparece una campaña real que lo necesita: `engine/components/card-tarifa-2.html` + adaptador en `MODULE_ADAPTERS` + `oneOf` en el schema + línea en `PATTERN_SEQUENCE` + entrada en `engine/CHANGELOG.md` (mismo procedimiento que la de 3)
- **Estimación**: S (documentación) / M si se construye el componente
- **Dependencias**: Ninguna
- **Riesgo**: Bajo

#### F2.2 Resolver el contraste de `typography.cardLinkSecondary`
- **Descripción**: Cerrado el 2026-07-27. El enlace secundario de `card-tarifa*` usa `colors.primary`, que pasa AA normal sobre blanco en todos los brand packs activos, y `check-contrast.ts` cubre la combinación automáticamente.
- **HUs relacionadas**: —
- **Criterios de aceptación clave**:
  - [x] La combinación final pasa `check-contrast.ts` para las marcas activas
  - [x] Decisión de diseño documentada en `engine/CHANGELOG.md` y `memory.md`
  - [x] `patterns/saving.md` §5.2 actualizado a "resuelto" con fecha y fix aplicado
- **Estimación**: S
- **Dependencias**: Ninguna
- **Riesgo**: Medio — si el fix es de color, depende de aprobación externa y puede bloquearse

#### F2.3 Corregir el bug de "Antes de decidir" (2 títulos ausentes)
- **Descripción**: Cerrado como no accionable en motor el 2026-07-27. El defecto estaba en el HTML histórico de la campaña piloto; `lista-premium.html` y `engine/schema/campaign-data.example.json` ya contienen la estructura/títulos correctos. Si la pieza antigua se reenvía, debe regenerarse con el motor.
- **HUs relacionadas**: —
- **Criterios de aceptación clave**:
  - [x] Causa raíz identificada y documentada
  - [x] La plantilla actual (`lista-premium.html`) renderiza `{{data:title}}` por item
  - [x] Si se reenvía la campaña histórica, la corrección operativa es regenerarla con el motor, no editar `final.html` a mano
- **Estimación**: S
- **Dependencias**: Ninguna
- **Riesgo**: Bajo

#### F2.4 Límite duro de 45 caracteres para el título de cierre
- **Descripción**: Cerrado el 2026-07-27. `check-column-balance.ts` falla cuando `banda-cierre*.data.title` supera 45 caracteres.
- **HUs relacionadas**: —
- **Criterios de aceptación clave**:
  - [x] Un `campaign-data.json` con título de `banda-cierre` > 45 caracteres genera warning o error en la validación
  - [x] Documentado en `engine/README.md`, `patterns/saving.md` y `memory.md`
- **Estimación**: S
- **Dependencias**: Ninguna
- **Riesgo**: Bajo

#### F2.5 Limpieza de residuos de pruebas (`engine/_test`, `engine/_test-output`)
- **Descripción**: `engine/README.md` menciona directorios/archivos residuales de rondas de prueba anteriores que no se pudieron borrar por una restricción de la carpeta montada en esas sesiones, pero que se pueden eliminar manualmente sin riesgo.
- **HUs relacionadas**: —
- **Criterios de aceptación clave**:
  - [x] `engine/_test/` y `engine/_test-output/` revisados; residuos obsoletos eliminados o, si algo se conserva, documentado el motivo
- **Estimación**: S
- **Dependencias**: Ninguna
- **Riesgo**: Bajo — housekeeping, cero impacto funcional

---

## Backlog no planificado

| ID | Feature | Motivo de exclusión | Fase candidata |
|----|---------|----------------------|-----------------|
| BP-01 | Patrones de género adicionales (educational, retargeting, etc.) | Regla anti-aspiracional explícita del proyecto: no crear hasta que una campaña real lo necesite | Fase 3+ (cuando aplique) |
| BP-02 | Vocabulario de formas de CTA (text-link/block) para marcas que no lo necesitan aún | Ya construido en el motor (2026-07-25) pero sin marca real que lo use; no requiere trabajo adicional, solo queda disponible | — |

---

## Riesgos del roadmap

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|-------------|---------|------------|
| Reejecutar `npm test` en el paquete entregable limpio requiere restaurar dependencias | Media | Bajo | Ejecutar `npm install` antes de la suite si `node_modules` fue eliminado del entregable |
| Nuevos brand packs podrían romper la combinación de `colors.primary` sobre blanco | Baja | Bajo | `check-contrast.ts` ya cubre el enlace secundario y debe correrse en el gate antes de entregar |
| La documentación (`engine/README.md`, `patterns/saving.md`) vuelve a desincronizarse tras estos fixes, como ya pasó con `card-tarifa-3` | Media | Bajo | Incluir la actualización de la documentación como criterio de aceptación explícito en cada feature (ya reflejado arriba), no como paso opcional |

---

## Notas y asunciones

- ⚠️ Asunción: no hay fecha límite de negocio para este backlog — es deuda técnica y de calidad, no una entrega comprometida con cliente. El horizonte de "2-3 semanas" es orientativo para una sola persona/agente trabajando en paralelo a las campañas de prueba en curso.
- ⚠️ Asunción: se prioriza fiabilidad (Fase 1) antes que refinamiento visual (Fase 2) porque un fallo de `create-campaign` o una regresión no detectada por falta de tests tiene más impacto que un componente de layout que falta.
- ⚠️ Asunción: F2.1 (card-tarifa-2) se trata como condicional — solo se construye el componente si aparece una campaña real que lo necesite; mientras tanto, el criterio de aceptación es solo corregir la documentación desactualizada.
- No se hizo la mini-entrevista de priorización de la Fase 2 del proceso estándar porque hay contexto suficiente en las auditorías del propio proyecto para ordenar las fases sin necesidad de preguntar plazos o restricciones de negocio (este backlog no tiene esa naturaleza).

---

*Generado con la skill `report-to-roadmap`.*
