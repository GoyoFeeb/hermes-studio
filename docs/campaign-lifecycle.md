# Campaign Lifecycle: Hermes Newsletter System

## Estados permitidos

Una campaña puede estar en uno de estos 13 estados:

| Estado | Descripción |
|---|---|
| `created` | Campaña creada con estructura de carpetas. Sin trabajo iniciado. |
| `briefing` | Agente 01 activo. Convirtiendo inputs en brief estructurado. |
| `analysis` | Agente 02 activo. Analizando identidad visual y marca. |
| `strategy` | Agente 03 activo. Definiendo arquitectura y estructura modular. |
| `design` | Agente 04 activo. Especificando diseño visual y técnico. |
| `copy` | Agente 05 activo. Produciendo contenido textual. |
| `data` | Agente 06 activo. Estructurando datos en newsletter-data.json. |
| `development` | Agente 07 activo. Implementando React Email. |
| `qa` | Agente 08 activo. Revisando calidad. |
| `corrections` | QA ha detectado errores. Agente responsable corrigiendo. |
| `export` | Agente 09 activo. Preparando entregables finales. |
| `completed` | Todos los entregables listos. Campaña cerrada. |
| `blocked` | Falta información crítica. Flujo detenido hasta que el usuario resuelva. |

## Ciclo de vida

```
            ┌─────────┐
            │ created │
            └────┬────┘
                 │
            ┌────▼─────┐
            │ briefing │
            └────┬─────┘
                 │
            ┌────▼──────┐
            │ analysis  │
            └────┬──────┘
                 │
            ┌────▼───────┐
            │ strategy   │
            └────┬───────┘
                 │
            ┌────▼────┐
            │ design  │
            └────┬────┘
                 │
            ┌────▼───┐
            │ copy   │
            └────┬───┘
                 │
            ┌────▼────┐
            │ data    │
            └────┬────┘
                 │
            ┌────▼───────────┐
            │ development    │
            └────┬───────────┘
                 │
            ┌────▼────┐
            │ qa      │◄──────────────┐
            └────┬────┘               │
                 │                    │
         ┌───────┴───────┐           │
         ▼               ▼           │
    ┌──────────┐   ┌────────────┐    │
    │ export   │   │corrections │────┘
    └────┬─────┘   └────────────┘
         │
    ┌────▼─────────┐
    │ completed    │
    └──────────────┘

    En cualquier punto:
    ┌─────────┐
    │ blocked │ ← Se puede bloquear desde cualquier estado
    └─────────┘
```

## Archivos que deben existir por estado

### created
- `campaign-status.md` (estado: created)
- Estructura de carpetas de campaña creada

### briefing
- `campaign-status.md` (estado: briefing)
- Inputs del usuario disponibles

Condición de salida:
- `00-brief/brief.md` existe
- `00-brief/requirements.md` existe
- `00-brief/source-links.md` existe
- Información esencial presente (cliente, objetivo, CTA, enlace, restricciones legales)

### analysis
- `campaign-status.md` (estado: analysis)
- Archivos de briefing completos

Condición de salida:
- `02-analysis/brand-analysis.md` existe
- `02-analysis/visual-identity-report.md` existe
- `02-analysis/risks.md` existe
- Cada afirmación visual tiene fuente asignada

### strategy
- `campaign-status.md` (estado: strategy)
- Archivos de análisis visual completos

Condición de salida:
- `03-strategy/campaign-angle.md` existe
- `03-strategy/message-hierarchy.md` existe
- `03-strategy/module-selection.md` existe
- `03-strategy/structure.md` existe
- Estructura compacta (3-7 módulos) o justificada
- CTA principal en el primer tercio

### design
- `campaign-status.md` (estado: design)
- Archivos de estrategia completos

Condición de salida:
- `04-design/layout.md` existe
- `04-design/desktop-spec.md` existe
- `04-design/mobile-spec.md` existe
- `04-design/assets-notes.md` existe
- Especificaciones accionables (hex, px)
- Outlook y mobile evaluados por módulo

### copy
- `campaign-status.md` (estado: copy)
- Archivos de diseño completos

Condición de salida:
- `05-copy/subject-lines.md` existe (mínimo 3 opciones)
- `05-copy/preheaders.md` existe
- `05-copy/body-copy.md` existe (todos los módulos)
- `05-copy/cta-options.md` existe
- Copy obligatorio copiado textualmente
- Consistencia asunto→preheader→titular→CTA

### data
- `campaign-status.md` (estado: data)
- Archivos de copy completos

Condición de salida:
- `06-data/newsletter-data.json` existe y es sintácticamente válido
- `06-data/newsletter-data.ts` existe (tipos)
- Todos los módulos de la arquitectura están en modules[]
- CTAs con href no vacío
- Imágenes con src y alt
- Textos legales copiados textualmente

### development

> **[SUPERSEDED — F4, 2026-07-21]** Condición de salida descrita para el pipeline React Email
> archivado. Condición vigente (motor, `agents/07-html-email-developer.md`): `campaign-data.json`
> completo y válido contra `engine/schema/campaign-data.schema.json`; `node
> engine/build-newsletter.js` termina en `✓ BUILD OK`; `09-exports/final.html`,
> `final-inline.html` y `build-manifest.json` existen.

- `campaign-status.md` (estado: development)
- newsletter-data.json completo

Condición de salida (histórica, pipeline archivado):
- `07-code/react-email/newsletter.tsx` existe
- `07-code/react-email/components/` contiene componentes para cada type
- `tsc --noEmit` pasa sin errores
- Sin datos hardcodeados
- Sin imports rotos

### qa
- `campaign-status.md` (estado: qa)
- Código React Email completo y compilado

Condición de salida:
- `08-qa/visual-qa.md` existe
- `08-qa/responsive-qa.md` existe
- `08-qa/outlook-qa.md` existe
- `08-qa/links-qa.md` existe
- `08-qa/final-checklist.md` existe
- Decisión: aprobado, devuelto o bloqueado

### corrections
- `campaign-status.md` (estado: corrections)
- `08-qa/return.md` existe con instrucciones

Condición de salida:
- Errores corregidos por el agente responsable
- QA re-verifica y actualiza el estado

### export
- `campaign-status.md` (estado: export)
- QA aprobado (handoff con ✅)

Condición de salida:
- `09-exports/final.html` existe y es válido
- `09-exports/final-inline.html` existe (si se requiere)
- `09-exports/final-preview.png` existe
- `09-exports/delivery-notes.md` existe
- Enlaces e imágenes verificados

### completed
- `campaign-status.md` (estado: completed)
- Todos los entregables en 09-exports/
- No hay errores critical sin resolver
- Todas las fases marcadas como completadas

### blocked
- `campaign-status.md` (estado: blocked)
- `blocked-reason.md` existe con explicación
- El flujo está detenido hasta que el usuario resuelva la causa

## Condiciones para avanzar

1. Todos los archivos de salida de la fase actual existen y están validados.
2. El agente actual ha generado su handoff hacia la siguiente fase.
3. El Orchestrator ha revisado y aprobado el resultado de la fase.
4. No hay errores critical sin resolver.
5. No faltan inputs esenciales para la siguiente fase.

## Condiciones para bloquear

Campaña blocked desde cualquier estado si:

- Falta CTA principal (fase briefing/data/qa)
- Falta enlace principal
- Faltan textos legales obligatorios
- Falta objetivo de campaña
- No hay assets mínimos
- Contradicción entre brief y requisitos
- Promoción sin condiciones claras
- URL que no funciona
- Falta aprobación de estructura cuando se requiere
- QA no aprobado antes de exportación

## Condiciones para cerrar como completed

La campaña se cierra como completed cuando:

1. La exportación está completa (09-exports/ con todos los archivos).
2. QA está aprobado y el checklist final no tiene errores critical.
3. Todas las fases del pipeline están ejecutadas y validadas.
4. delivery-notes.md documenta instrucciones de entrega.
5. campaign-status.md refleja estado completed y fases completadas.
6. No quedan errores critical sin resolver.
