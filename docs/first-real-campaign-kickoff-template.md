# First Real Campaign — Kickoff Template

## 1. Objetivo

Esta plantilla sirve para iniciar una campaña real controlada con Hermes Newsletter System, siguiendo el checklist operativo (`docs/first-real-campaign-checklist.md`) y garantizando que:

- La campaña comienza como **prueba interna** (`isTestCampaign: true`, `productionReady: false`)
- Los **pendientes quedan documentados** desde el briefing
- Los **claims están restringidos** desde la arquitectura (fase 03/04)
- El **task-log se preserva** sin sobrescrituras
- El **production-gate es obligatorio** antes de cualquier envío real
- **Ningún envío a producción ocurre sin aprobación externa**

---

## 2. Prompt base

Copia el bloque siguiente, sustituye los placeholders `[EDITABLE]` y pégalo en Hermes.

```text
Crea una campaña real controlada usando Hermes Newsletter System.

Sigue estrictamente el checklist operativo en docs/first-real-campaign-checklist.md.

Reglas obligatorias:
- Crear la campaña como prueba interna.
- No marcar producción.
- No inventar claims.
- No inventar legales.
- No inventar URLs.
- No inventar assets.
- Documentar todos los pendientes como Open Issues.
- Preservar task-log acumulativo (no sobrescribir).
- No ejecutar export-html en fases iniciales.
- No ejecutar preview-html en fases iniciales.
- No ejecutar build.
- No usar rm.

---

## Datos de campaña

| Campo | Valor |
|---|---|
| Cliente | [EDITABLE: nombre del cliente] |
| Marca | [EDITABLE: nombre de la marca] |
| Campaña | [EDITABLE: descripción breve] |
| Slug | [EDITABLE: año-mes-cliente-descriptor] |
| Año | [EDITABLE: 2026] |
| Mes | [EDITABLE: jul] |
| Producto / Servicio | [EDITABLE: producto o servicio a comunicar] |
| Objetivo | [EDITABLE: captación leads, promocional, informativo, etc.] |
| CTA principal | [EDITABLE: texto del CTA] |
| URL principal | [EDITABLE: URL real y funcional] |
| Asunto | [EDITABLE: asunto de la newsletter] |
| Preheader | [EDITABLE: preheader de la newsletter] |
| Audiencia | [EDITABLE: público objetivo] |
| Legales (si aplican) | [EDITABLE: texto legal o "no aplica"] |
| Condiciones comerciales (si aplican) | [EDITABLE: condiciones o "no aplica"] |
| Assets disponibles | [EDITABLE: logo, hero, iconos — o "pendiente"] |
| Claims sensibles conocidos | [EDITABLE: financieros, técnicos, energéticos, etc.] |

## Claims

Prohibidos (lista base a expandir por campaña):
- mejor oferta
- aprobación inmediata
- garantizado
- sin condiciones
- financiación asegurada
- entrega garantizada
- stock garantizado
- intereses cero
- sin intereses
- edición limitada
- última oportunidad
- exclusivo por tiempo limitado
- sin letra pequeña

Permitidos (lista base a expandir por campaña):
- [EDITABLE: claims seguros específicos del producto/servicio]

## Responsables

| Elemento | Responsable | Estado |
|---|---|---|
| Aprobación comercial | [EDITABLE: nombre o cargo] | [⏳ Pendiente / ✅ Confirmado] |
| Aprobación legal | [EDITABLE: nombre o cargo] | [⏳ Pendiente / ✅ Confirmado] |
| From email | [EDITABLE: email real o "pendiente CRM"] | [⏳ Pendiente / ✅ Confirmado] |
| Enlace de baja | [EDITABLE: URL real o "pendiente CRM"] | [⏳ Pendiente / ✅ Confirmado] |
| Enlace de preferencias | [EDITABLE: URL real o "pendiente CRM"] | [⏳ Pendiente / ✅ Confirmado] |
| Enlace de contacto | [EDITABLE: URL real o "pendiente CRM"] | [⏳ Pendiente / ✅ Confirmado] |
```

---

## 3. Reglas obligatorias incluidas en el prompt

| # | Regla | A quién aplica |
|---|---|---|
| 1 | Campaña comienza como prueba interna | Agente 00 (Orchestrator) |
| 2 | No marcar producción hasta que production-gate pase y haya aprobación externa | Agentes 06, 08, 09 |
| 3 | No inventar claims — usar claims prohibidos y permitidos del briefing | Agente 05 (Copywriter) |
| 4 | No inventar legales — si no aplican, documentar como "no aplica" | Agente 01 (Briefing) |
| 5 | No inventar URLs — documentar como pendientes si no están disponibles | Agente 01, 06 |
| 6 | No inventar assets — documentar como pendientes | Agente 02, 04 |
| 7 | Documentar pendientes como Open Issues en campaign-status.md | Todos los agentes |
| 8 | Preservar task-log acumulativo (read_file → append → write_file) | Todos los agentes |
| 9 | No ejecutar export-html ni preview-html en fases iniciales | Agente 09 |
| 10 | No ejecutar build | Todos los agentes |
| 11 | No usar rm | Todos los agentes |

---

## 4. Estado inicial requerido

Tras ejecutar `create-campaign`, la campaña debe quedar con:

| Campo | Valor |
|---|---|
| Estado actual | created |
| Fase | briefing |
| Agente activo | 01 — Briefing Strategist |
| isTestCampaign | true |
| productionReady | false |
| Next Step | Activar agente 01 — Briefing Strategist |

---

## 5. Gates y validaciones

### Fase inicial (tras create-campaign)

```bash
npm run validate-newsletter -- --campaign newsletters/[AÑO]/[CLIENTE]/[SLUG]/
```

### Fase 06 (Newsletter Data) — obligatorio ejecutar

```bash
npm run validate-claims -- --campaign newsletters/[AÑO]/[CLIENTE]/[SLUG]/
```

Cualquier claim crítico o alto detectado bloquea el avance.

### Fase 08/09 (QA / Export) — comprobación de bloqueo

```bash
npm run production-gate -- --campaign newsletters/[AÑO]/[CLIENTE]/[SLUG]/
```

Debe fallar mientras la campaña sea prueba interna. Solo debe pasar cuando todos los datos reales estén completos y haya aprobación externa.

### Antes de producción real (obligatorio)

```bash
npm run production-gate -- --campaign newsletters/[AÑO]/[CLIENTE]/[SLUG]/
```

Requiere 3/3 gates pasando:
1. validate-newsletter --production ✅
2. check-links --strict ✅
3. validate-claims --production ✅

Además de aprobación externa (comercial/legal del cliente).

---

## 6. Cómo usar esta plantilla

| Paso | Acción |
|---|---|
| 1 | Copiar el prompt base de la sección 2 |
| 2 | Sustituir todos los `[EDITABLE]` por los datos reales de la campaña |
| 3 | Revisar que los claims prohibidos cubren los riesgos del sector/industria |
| 4 | Pegar el prompt completo en Hermes como instrucción inicial |
| 5 | Hermes ejecutará `create-campaign`, `prepare-react-email` y `validate-newsletter` |
| 6 | Revisar que el estado inicial sea `created / briefing / 01 — Briefing Strategist` |
| 7 | No avanzar si faltan datos críticos sin documentarlos como Open Issues |
| 8 | Seguir el checklist operativo (`docs/first-real-campaign-checklist.md`) en cada fase |

### Recordatorios importantes

| Recordatorio | Detalle |
|---|---|
| La campaña comienza como prueba | `isTestCampaign: true`, `productionReady: false` |
| Los gates deben fallar | Mientras la campaña sea prueba, production-gate debe fallar |
| No forzar producción | No cambiar isTestCampaign ni productionReady sin aprobación |
| Documentar siempre | Open Issues visibles, task-log acumulativo, handoff completo |
| Adaptar claims | Las listas del prompt son base. Expandir según industria/cliente |
