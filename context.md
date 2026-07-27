# Project Context

## Purpose

<!-- Updated 2026-07-27: project-context/common-init aplicados; se anaden artefactos de
     onboarding para IA sin cambiar la arquitectura del motor. -->

Hermes Newsletter System automatiza la producción de newsletters HTML premium para múltiples
marcas cliente, desde un brief en lenguaje natural hasta un HTML final listo para enviar. Un
pipeline de 10 agentes de IA (orquestador + 9 especialistas) ejecuta las fases de briefing,
análisis de marca, arquitectura, diseño, copy y datos; un motor de generación propio
(`engine/`) convierte esos datos en HTML de email compatible con Outlook/Gmail/mobile, validado
automáticamente antes de exportar. El objetivo original del proyecto (medido y cumplido en F5,
2026-07-21): "un prompt → una newsletter premium con estructura perfecta, cero intervención
manual de diseño, con agentes que cumplan su función de verdad".

## Target Users

Equipo interno (operando el sistema a través de Hermes/Claude Agent) que produce newsletters
para marcas cliente — no es un producto self-service para los clientes finales. El "usuario" del
sistema es quien da el brief (objetivo, CTA, marca, contenido) y revisa las validaciones; el
sistema hace el resto del trabajo de diseño/maquetación.

## Key Features

- Pipeline de 10 agentes con fronteras estrictas (cada uno escribe solo en su carpeta de fase) y
  protocolo de handoff explícito entre fases.
- Motor de generación propio (`engine/build-newsletter.js`) que nunca deja outputs parciales:
  valida schema → carga brand tokens → resuelve patrón → ensambla → inlinea CSS → auto-verifica,
  y solo entonces escribe a disco.
- Sistema de brand packs (`brands/{cliente}/brand-tokens.json`, versionado) para reutilizar
  identidad visual entre campañas de la misma marca.
- Patrones de género de newsletter (`patterns/`: fotografía-primero, institucional, ahorro) que
  definen secuencia de módulos obligatoria/opcional por tipo de campaña.
- Validación automatizada multi-capa: estructura, enlaces, 29 reglas de claims comerciales,
  paridad fuente/inline, integridad del motor, completitud de brand pack, contraste WCAG — con
  `production-gate` como alias explícito de `production-gate-motor`, el cierre real que las
  ejecuta todas antes de aprobar envío.
- Guardarraíles de layout añadidos el 2026-07-27: contraste automático del enlace secundario de
  `card-tarifa*` y límite duro de 45 caracteres para títulos de `banda-cierre*`.
- Archivos de control por campaña (`campaign-status.md`, `handoff.md`, `task-log.md`,
  `next-steps.md`) que hacen el estado de cada campaña auditable sin depender del historial de
  la sesión de IA.
- Marco común multiagente (`CLAUDE.md` + `.agent/*`) para que Claude Code, Codex y otros
  asistentes compartan el mismo contrato sin duplicar instrucciones.

## Tech Stack

- Node.js 18+ / TypeScript (ejecutado vía `tsx`, sin paso de compilación).
- Motor de plantillas HTML propio (placeholders `{{token:}}`, `{{data:}}`, `{{#each}}`,
  `{{include:}}`, `{{slot:}}`) — no usa un motor de terceros (Handlebars, EJS, etc.).
- `ajv` — validación de `campaign-data.json` contra JSON Schema.
- `juice` — inline de CSS para compatibilidad con clientes de email (Outlook especialmente).
- `playwright` (opcional) — capturas PNG de previsualización.
- `sharp` — procesado de imágenes (hero images).
- `node --test` — suite de regresión sin dependencias nuevas para tokens, patrones, adaptadores
  de módulos y un smoke test end-to-end del motor.
- `.agent/` — documentación operativa agent-neutral generada por `common-init`.
- Sin framework de frontend: el pipeline React Email original fue **archivado** en favor del
  motor propio (ver Key Constraints).

## Architecture Overview

El sistema tiene dos capas: (1) el **pipeline de agentes**, definido en `agents/00-09-*.md` y
documentado en `pipeline-skill/SKILL.md`, que produce `campaign-data.json` a partir de un brief;
y (2) el **motor de render**, en `engine/`, que es determinista y no-IA: toma ese JSON más un
brand pack y un patrón, y produce el HTML final de forma reproducible y verificable. Cada
campaña vive en `newsletters/{año}/{cliente}/{campaña}/` con su propia carpeta por fase
(00-brief a 09-exports), sus 4 archivos de control y `06-data/campaign-data.json`, presente
también en `newsletters/_campaign-template/`. Ver `AGENTS.md` para el detalle de cada agente y
las reglas de interacción entre ellos.

## Key Constraints & Decisions

- **El pipeline React Email fue reemplazado por un motor propio (F1-F5, jul 2026)**: la razón
  documentada es garantizar paridad fuente/inline "por construcción" y eliminar la superficie de
  fallo de una librería externa (`@react-email/components`) cuya API podía cambiar. El pipeline
  antiguo quedó archivado en `_archive/f4-react-email-pipeline/`, no en uso.
- **"No crear un patrón nuevo hasta que haya una campaña real que lo necesite"** (regla
  anti-aspiracional del plan de transformación) — evita construir géneros de newsletter
  especulativos sin caso de uso real.
- **El motor nunca escribe outputs parciales**: decisión de diseño explícita — todo el trabajo
  intermedio vive en memoria y `writeFileSync` solo se llama tras pasar las 6 fases de
  verificación, precisamente para que sea imposible dejar un `final.html` inválido en disco.
- **Claims comerciales restringidos por regulación del sector** (finanzas, salud, energía,
  automoción): 29 reglas de validación automática porque el copy debe trazarse siempre al brief
  — nunca inventar ahorro garantizado, gratuidad, urgencia o exclusividad sin confirmación
  explícita del cliente.
- **Datos de fuente pública sin aprobación del cliente se tratan como no verificados**: aunque
  un dato salga de la web oficial de una marca, no se marca "verificado" hasta que el cliente lo
  apruebe explícitamente para la campaña — evita exposición legal por specs desactualizadas o
  variantes de producto incorrectas.
- **Deuda F2 cerrada parcialmente el 2026-07-27**: documentación `card-tarifa` sincronizada,
  contraste `card-tarifa*` resuelto con `colors.primary`, bug "Antes de decidir" reclasificado
  como histórico/no accionable en motor, y validación de 45 caracteres implementada en
  `check-column-balance.ts`. Sigue bloqueada solo la variante `card-tarifa-2`.
- **Evolución brand-native (2026-07-27)**: nuevos componentes `editorial-foto-texto*` para
  bloques de imagen+texto; nuevo campo `layout.brandStructure` en brand packs; nuevo gate de
  diferenciación estructural (Gate 12, `check-structural-differentiation.ts`) que verifica que
  cada newsletter traduce la estructura real de su marca y no es una copia de plantilla. El brand
  pack ya no captura solo tokens visuales; captura también la estructura traducible de la página
  real de la marca. Ver `engine/CHANGELOG.md`.
- **Varios documentos en la raíz del proyecto (`README.md`, `GUIA_NUEVO_PROYECTO.md`,
  `INFORME_FINAL.md`, `CAMBIOS_REALIZADOS.md`, `INVENTARIO_ORIGEN.md`,
  `RIESGOS_Y_PENDIENTES.md`) describen el sistema React Email original (empaquetado 2026-07-09)
  y están desactualizados respecto al motor actual.** Se han marcado como históricos con una nota
  al inicio; no son la fuente de verdad — esta lo es, junto con `AGENTS.md` y `memory.md`.

## Deep Search Targets

### Tecnología
- Compatibilidad de email HTML: reglas VML para Outlook, límites de `Row`/`Column` de tablas en
  clientes de email, soporte real de media queries por cliente (Apple Mail sí, Outlook/Gmail no).
- `juice` (inline CSS) y `ajv` (JSON Schema) — versiones y breaking changes relevantes.

### Mercado y competencia
- Herramientas de email marketing con motores de plantillas propios (Mailchimp, Braze, Iterable)
  como referencia de patrones de compatibilidad y QA.

### Regulación y estándares
- Normativa publicitaria sobre claims de ahorro/gratuidad por sector (finanzas, energía, salud,
  automoción) en España/UE — relevante para las 29 reglas de `validate-claims`.
- GDPR / normativa de email marketing (enlaces de baja y preferencias obligatorios).

### Tendencias y contexto externo
- Evolución de soporte de CSS moderno en Outlook/Gmail (dark mode, media queries) — afecta
  directamente a `patterns/*.md` y `engine/lib/verify.js`.

### Referencias técnicas
- `docs/pipeline-audit-final-ocu-bmw-demosolar.md` — auditoría de referencia del pipeline
  completo.
- `pipeline-skill/references/` — 10 documentos de referencia detallada por patrón operativo.
- `docs/hermes-newsletter-system-context.md` y `docs/hermes-newsletter-system-report.md` —
  onboarding y análisis técnico generados desde el estado actual del repo.

_Last updated: 2026-07-27_
