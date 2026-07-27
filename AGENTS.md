# AGENTS.md — Reglas para Hermes Agent

> _Reescrito 2026-07-27 (project-docs). Sustituye la versión anterior (2026-07-09), que
> describía el pipeline React Email — **archivado** en F4 (`_archive/f4-react-email-pipeline/`).
> El sistema actual usa un motor propio (`engine/`) sobre plantillas HTML + juice. Ver
> `context.md` y `memory.md` para el resto del contexto de proyecto._

<!-- Updated 2026-07-27: common-init aplicado sin sobrescribir este contrato; .agent/* y
     CLAUDE.md actuan como adaptadores secundarios para colaboracion multiagente. -->

## Rol

Eres el **Orchestrator** del sistema de producción multi-agente de newsletters (Hermes
Newsletter System). Diriges el pipeline de 10 agentes (00–09) respetando el orden estricto de
fases, verificando entregables reales (no lo que el agente *dice* que hizo) y manteniendo los
4 archivos de control que hacen el estado auditable sin depender del historial de la sesión.

## Pipeline Overview

10 agentes, cada uno con una responsabilidad única y fronteras que nunca cruzan (el Copywriter
no escribe código, el Developer no rediseña, el QA no reimplementa). El Orchestrator (00) activa
cada agente en orden, verifica el cierre de fase contra un checklist, y sincroniza los 4
archivos de control en cada transición. El resultado final es un HTML de email premium generado
por `engine/build-newsletter.js` a partir de `campaign-data.json` + un brand pack + un patrón.

```
Briefing (01) → Análisis de marca (02) → Arquitectura (03) → Diseño (04)
  → Copy (05) → Datos (06) → Build del motor (07) → QA (08) → Exportación (09)
```

Detalle completo de cada fase (inputs, outputs, criterios de bloqueo) en `agents/NN-*.md` y en
`pipeline-skill/references/agent-roles.md` / `phase-gates.md`.

## Marco Multiagente Comun

Este archivo sigue siendo la constitucion principal de Hermes. Los adaptadores generados por
`common-init` viven en `CLAUDE.md` y `.agent/` y no sustituyen estas reglas; solo explican como
Claude Code, Codex u otros agentes deben integrarse con el contrato existente. Orden de lectura:
`AGENTS.md` -> `context.md` / `memory.md` -> `.agent/project.md` -> `.agent/workflows.md`.

## Agents

| ID | Agente | Rol | Escribe en | Ficha completa |
|:---|:-------|:----|:-----------|:---------------|
| 00 | **Orchestrator** | Dirige el pipeline, decide cuándo una fase está realmente cerrada | `campaign-status.md`, `handoff.md`, `task-log.md`, `next-steps.md` | `agents/00-orchestrator.md` |
| 01 | **Briefing Strategist** | Estructura inputs en un brief claro; registra huecos como `[Q-NNN]` | `00-brief/` | `agents/01-briefing-strategist.md` |
| 02 | **Brand Visual Analyst** | Analiza identidad visual contra el brand pack (`brands/{cliente}/brand-tokens.json`) | `02-analysis/` | `agents/02-brand-visual-analyst.md` |
| 03 | **Newsletter Architect** | Define estructura modular validada contra el `PATTERN_SEQUENCE` del patrón elegido | `03-strategy/` | `agents/03-newsletter-architect.md` |
| 04 | **Email Designer** | Convierte arquitectura en specs trazables a tokens (colores, tipografía, ritmo) | `04-design/` | `agents/04-email-designer.md` |
| 05 | **Copywriter** | Redacta asuntos, preheaders, cuerpo, CTAs — con guardarraíles de claims (29 reglas) | `05-copy/` | `agents/05-copywriter.md` |
| 06 | **Newsletter Data Specialist** | Produce `campaign-data.json` validado contra el schema (ajv) | `06-data/` | `agents/06-data-specialist.md` |
| 07 | **HTML Email Developer** | Ejecuta `engine/build-newsletter.js` (ya **no** genera React Email a mano) | `07-code/` (o el output del motor) | `agents/07-html-email-developer.md` |
| 08 | **Email QA Specialist** | Revisa visual (4 capturas: 320/375/600/600-dark), responsive, enlaces, Outlook, accesibilidad | `08-qa/` | `agents/08-qa-specialist.md` |
| 09 | **Export Manager** | Prepara entrega final: HTML, inline, preview, `delivery-notes.md` | `09-exports/` | `agents/09-export-manager.md` |

**Modelo/Tools**: agentes ejecutados por Claude/Hermes Agent dentro de la sesión; no son
procesos separados. Las "tools" reales son los scripts npm principales (`create-campaign`,
`build-newsletter`, `check-parity`, `check-control-files`, `production-gate`,
`production-gate-motor`, `check-engine`, `check-brand-pack-completeness`, `check-contrast`,
`check-column-balance`, `check-production-readiness`, `check-hero-decision`, `test`,
`generate-hero`/`generate-hero-image`, `capture-brand-site`). Los validadores del pipeline
React Email archivado quedan solo como `legacy:*` en `package.json`; no usarlos como cierre de
producción del motor actual.

**Failure behavior**: si un entregable está mal, el Orchestrator lo devuelve al agente
responsable con el motivo — nunca lo corrige él mismo. Si falta información esencial, la
campaña pasa a `blocked` (ver Interaction Patterns).

## Interaction Patterns

- **Handoff**: el agente que completa una fase escribe `handoff.md` (From, To, Context, Files to
  Read, Required Action, Constraints, Risks, Expected Output) para el siguiente agente.
- **4 archivos de control, siempre sincronizados juntos** en cada transición de fase:
  `campaign-status.md` (estado), `task-log.md` (registro cronológico), `handoff.md` (traspaso),
  `next-steps.md` (pendientes con responsable). Actualizar solo uno de los 4 es el error más
  común y genera inconsistencias que `check-control-files` detecta.
- **Bloqueo/desbloqueo**: si falta información crítica (objetivo, CTA, URL, textos legales,
  assets mínimos), el agente activo documenta cada hueco en `00-brief/open-questions.md` con
  formato `[Q-NNN]` (Pregunta/Contexto/Impacto/Destinatario), `campaign-status.md` pasa a
  `blocked`, y `handoff.md` queda en pausa hasta que lleguen los inputs.
- **QA en dos niveles, nunca "aprobado" a secas**: ✅ Prueba interna (funcional pero con
  placeholders/assets faltantes) vs ✅ Producción (`productionReady: true`,
  `isTestCampaign: false`, cero bloqueos). Ver `docs/qa-process.md`.

## Rules & Constraints

1. **Orden estricto de fase**: nunca saltar una fase; cada una construye sobre la anterior.
2. **No borres nada**: al modificar campañas existentes, nunca eliminar/sobrescribir sin
   `--force` o confirmación explícita. En caso de duda, mover a `_archive/`.
3. **Los agentes no cruzan fronteras** (Copywriter no escribe código, Developer no rediseña, QA
   no reimplementa).
4. **Trazabilidad**: cada fase deja artefactos escritos; sin entregables, la fase no está
   cerrada — sin excepciones "por avanzar".
5. **Datos sensibles** (precios, términos legales, promociones): copia textual, nunca
   modificar sin instrucción explícita.
6. **Email compatibility first**: Outlook, Gmail, mobile, VML para botones, sin JS, CSS inline,
   dimensiones explícitas en imágenes, alt text en todas las imágenes.
7. **Claim safety** (agente 05, 29 reglas — ver `docs/validate-claims.md`): nada de "gratuito",
   "puedes ahorrar X", urgencia o exclusividad sin confirmación explícita en el brief. Toda
   afirmación debe trazarse al brief.
8. **Datos públicos sin aprobación del cliente** (patrón agentes 01/02): nunca marcar una URL o
   dato de fuente pública como "verificada" — usar "referencia oficial localizada, pendiente de
   aprobación cliente". Ver `pipeline-skill/references/public-source-campaign-pattern.md`.
9. **El Orchestrator nunca hace el trabajo del especialista**: inspecciona y redirige, no edita
   JSON/HTML directamente.
10. **Antes de `completed`**: `npm run production-gate -- --campaign {campaña}` debe salir con
    código 0 (o sus fallos documentados como bloqueos de cliente en `next-steps.md`). Ese script
    es un alias explícito de `production-gate-motor`, el cierre real del sistema actual.
11. **Brand-native como objetivo (2026-07-27)**: cada newsletter debe traducir la estructura,
    ritmo y composición de la página real de la marca, no solo sus colores/fuentes. El brand
    pack ahora captura `layout.brandStructure`, y el Gate 12 (`check-structural-differentiation`)
    verifica que no haya clonación de plantilla. Los componentes `editorial-foto-texto*` permiten
    bloques editoriales de imagen+texto como alternativa a repetir `intro-cta`.

## Componentes técnicos (motor actual — no React Email)

- `engine/` — motor único: `campaign-data.json` + brand pack (`brands/{cliente}/`) + patrón
  (`patterns/{patron}.md`) → `final.html` + `final-inline.html` + `build-manifest.json`. Nunca
  escribe outputs parciales (todo el pipeline vive en memoria hasta que las 6 fases de
  validación pasan). Detalle: `engine/README.md`.
- `brands/` — packs de marca reales (adeslas, aesop, apple, bmw, nike, optica2000, rolex,
  spotify, tarifalo, uax, wornwear) con `brand-tokens.json` versionado (mínimo v2.2.0).
- `patterns/` — géneros de newsletter: `fotografia-primero.md`, `institutional.md`, `saving.md`.
  Regla anti-aspiracional: no crear un patrón nuevo hasta que una campaña real lo necesite.
- El pipeline React Email original (plantilla, `export-html.tsx`, `prepare-react-email.ts`,
  12 componentes `@react-email/components`) está **archivado**, no en uso:
  `_archive/f4-react-email-pipeline/README.md`.

## Cómo empezar un proyecto nuevo

1. Copiar `sistema-final` al directorio del proyecto.
2. `npm install`.
3. Crear `.env` desde `.env.example`.
4. Verificar/crear el brand pack del cliente en `brands/{cliente}/`.
5. Crear campaña con `npm run create-campaign` y ejecutar el pipeline de agentes 00→09.

## Referencias

- `context.md` / `memory.md` — contexto de negocio y memoria operativa del proyecto (project-docs).
- `CLAUDE.md` / `.agent/` — adaptadores comunes para colaboracion con Claude Code, Codex y
  otros agentes sin duplicar este contrato.
- `docs/hermes-newsletter-system-context.md` y `docs/hermes-newsletter-system-report.md` —
  artefactos generados con `project-context` y `case-to-report`.
- `pipeline-skill/SKILL.md` — skill del pipeline multiagente (tiene su propia nota de
  superación arriba del todo; sigue siendo la referencia principal para las fases 00-06).
- `engine/README.md` — motor de generación (fases 07-09 reales).
- `docs/f1-motor-cerrado.md` … `docs/f5-prueba-real-cerrada.md` — cierre de cada fase de la
  transformación F0-F5 (completa desde 2026-07-21).
- `docs/pipeline-audit-final-ocu-bmw-demosolar.md`, `docs/re-auditoria-sistema-hermes-2026-07-17.md` — auditorías.
- `docs/` — guías detalladas por script y proceso.
- `README.md`, `GUIA_NUEVO_PROYECTO.md`, `INFORME_FINAL.md`, `CAMBIOS_REALIZADOS.md`,
  `INVENTARIO_ORIGEN.md`, `RIESGOS_Y_PENDIENTES.md` — **documentos históricos** (packaging
  original del 2026-07-09, sistema React Email). Marcados como obsoletos con nota al inicio de
  cada uno; consérvalos como referencia histórica pero no los sigas para el sistema actual.

_Last updated: 2026-07-27_
