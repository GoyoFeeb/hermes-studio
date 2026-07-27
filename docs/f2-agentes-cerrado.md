# F2 — Los agentes: cerrada

**Fecha de cierre:** 2026-07-20

**Veredicto:** APTO — 10 archivos ejecutables, cadena de lectura/escritura verificada sin
desajustes, 0 referencias falsas a herramientas de F3.

## Qué se construyó

`agents/` — los 10 archivos que traducen `docs/auditoria-total-y-plan-transformacion-2026-07-17.md`
§3.1 en contratos operables, escritos en 3 prompts (`prompts-fase2-agentes/15-17`) y auditados
en este cuarto y último prompt (18):

| Archivo | Cambio respecto a `pipeline-skill/references/agent-roles.md` |
|---|---|
| `00-orchestrator.md` | + checklist de cierre de ronda verificable, con verificación manual explícita mientras F3 no exista |
| `01-briefing-strategist.md` | Sin cambios de fondo — formalizado tal cual |
| `02-brand-visual-analyst.md` | + brand pack como entregable de primera clase, con ruta real |
| `03-newsletter-architect.md` | + elige patrón de `patterns/`, entrega secuencia real de componentes del motor |
| `04-email-designer.md` | + hereda el criterio premium codificado (WCAG, ritmo, sombras, tracking) de `patterns/saving.md` y `brand-tokens.json` |
| `05-copywriter.md` | Sin cambios de fondo — formalizado, con autoevaluación explícita contra `validate-claims.ts` |
| `06-data-specialist.md` | Reescrito — `campaign-data.json` contra el schema del motor, no el JSON de React Email |
| `07-html-email-developer.md` | Reescritura completa — ejecuta `build-newsletter.js`, componente faltante se añade al motor |
| `08-qa-specialist.md` | + render obligatorio en 4 viewports como criterio de cierre |
| `09-export-manager.md` | + verificación HTTP 200 de assets antes de cerrar |

## Corrección de conteo respecto al plan

El plan (§4, fila F2) dice "9 archivos"; su propia tabla (§3.1) lista 10 filas (00 incluido).
Se trató como imprecisión del documento — este pack entrega los 10, incluido el Orchestrator.

## Auditoría de cierre (prompt 18) — hallazgos y correcciones

1. **Completitud**: los 10 archivos tienen las 6 secciones mínimas (Rol / Lee / Escribe /
   Entrega a / Bloquea si / Regla clave), más secciones adicionales donde el rol lo pedía
   (`00` con checklist de cierre, `04` con criterio premium heredado, `05` con autoevaluación
   de claims, `07` con el bloque "Ejecuta", `08` con render obligatorio y paridad, `09` con
   verificación de assets). Todas las condiciones de "Bloquea si" son binarias y comprobables.

2. **Consistencia de cadena 00→09**: verificada Escribe(N) vs Lee(N+1) para las 9 transiciones.
   2 desajustes menores encontrados y corregidos en este mismo prompt:
   - `04-email-designer.md` solo leía `structure.md` y `module-selection.md` de 03, sin
     `campaign-angle.md` ni `message-hierarchy.md` — corregido para leer los 4 archivos de la
     fase 03 (el ángulo y la jerarquía de mensajes también informan énfasis visual).
   - `07-html-email-developer.md` decía "Escribe: Nada directamente en `09-exports/`" de forma
     que podía leerse como si no produjera nada — corregido para dejar explícito que el
     comando SÍ produce `final.html`/`final-inline.html`/`build-manifest.json` como su salida
     real (solo que generada por el motor, no escrita a mano), que es lo que 08 espera
     encontrar y lee.
   - El resto de la cadena (01→02, 02→03, 03→05, 05→06, 06→07, 08→09) se verificó sin
     desajustes: cada archivo que un agente dice "Escribir" aparece literalmente en la sección
     "Lee" del agente que lo consume.

3. **Anti-aspiracional**: grep de `check-parity.js`/`check-control-files.js` en los 10
   archivos → 2 menciones (`00-orchestrator.md`, `08-qa-specialist.md`), ambas acompañadas de
   la aclaración explícita de que son entregables de F3 todavía no escritos, y qué verificar
   mientras tanto (control files a mano en 00; `build-manifest.json` + `lib/verify.js` en 08).
   0 menciones sin esa aclaración.

4. **Prueba de lectura cruzada** sobre `07-html-email-developer.md` (el que más cambia):
   confirmado que es operable solo con ese archivo + sus referencias directas
   (`engine/README.md` para el contrato del pipeline y el procedimiento de componente nuevo,
   `patterns/{género}.md` para la secuencia) — no depende de conocimiento no escrito en ningún
   sitio.

## Limitaciones conocidas

- Los 10 archivos asumen un cliente/campaña con brand pack y patrón ya existentes
  (`paraycompara` / `saving`, los únicos reales hoy). El primer uso con un cliente o género
  nuevo ejercitará por primera vez las rutas de bloqueo de `02` (crear brand pack) y `03`
  (bloquear por falta de patrón) — no probadas end-to-end todavía, solo por inspección.
- `00-orchestrator.md` y `08-qa-specialist.md` dependen de verificación manual de paridad y de
  archivos de control hasta que F3 escriba `check-parity.js`/`check-control-files.js`. Esto es
  una limitación conocida y aceptada, no un defecto — documentada en ambos archivos.
- La reubicación de `brands/paraycompara/` a la ruta objetivo del plan
  (`brands/{cliente}/...` en la raíz de `sistema-final/`, hoy sigue bajo
  `newsletters/2026/newsletter-system/brands/`) sigue pendiente — anotada en
  `02-brand-visual-analyst.md`, no es tarea de F2 resolverla.
- Ningún archivo de agente se ha ejercitado todavía con una ejecución real de campaña de
  principio a fin usando exclusivamente los archivos de `agents/` (sin la memoria de esta
  sesión) — esa prueba es, en espíritu, la de F5 ("un prompt, cero intervención manual").

## Siguiente fase

Con F2 cerrada, siguen F3 (Verificación: `check-parity.js`, `check-control-files.js`,
`production-gate` ampliado) y F4 (Limpieza: archivar React Email y restos), según el orden del
plan (§4). F5 (prueba real end-to-end) depende de que F2-F4 estén cerradas.
