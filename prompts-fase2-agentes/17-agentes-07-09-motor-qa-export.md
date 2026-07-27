# PROMPT 17 — Agentes 07-09: motor, QA, export

## CONTEXTO

Eres el Orchestrator de Hermes. Continúa F2 (prompts 15 y 16 ya escribieron `agents/00` a
`06`). Esta ronda escribe el tramo que produce el HTML real y lo certifica — la parte del
pipeline que más cambia respecto al diseño original, porque el motor (`engine/`, F1) sustituye
por completo a React Email.

## TAREAS

Misma estructura de 6 secciones de los prompts 15/16 para `agents/07-html-email-developer.md`,
`agents/08-qa-specialist.md`, `agents/09-export-manager.md`.

### 07 — HTML Email Developer (antes "React Email Developer")

Reescritura completa — el rol de fondo cambia, no solo se extiende. Base: fila `07` de
`agent-roles.md`, pero el "cómo" es enteramente distinto:
- **Lee**: `06-data/campaign-data.json`, `03-strategy/structure.md` (para verificar que el
  orden coincide).
- **Ejecuta** (no escribe a mano): `node engine/build-newsletter.js --data
  {campaña}/06-data/campaign-data.json --out {campaña}/09-exports/`. Ver `engine/README.md`
  para el contrato completo del pipeline (validación de schema → tokens → patrón → ensamblado
  → inline → auto-verificación → escritura).
- **Escribe**: nada directamente — el comando anterior escribe `09-exports/final.html`,
  `final-inline.html`, `build-manifest.json`. El agente SÍ escribe una nota corta
  (`07-code/build-log.md`, formato libre) con el comando ejecutado, el resultado (`✓ BUILD OK`
  o el error exacto) y, si hubo error, qué se corrigió y en qué capa (data / componente /
  build) antes de reintentar.
- **Regla clave, la más importante del pack**: si un módulo de `campaign-data.json` no tiene
  componente en `engine/components/`, el agente NO escribe HTML dentro de la campaña. Añade el
  componente nuevo al motor (`engine/components/{nombre}.html`, su adaptador en
  `MODULE_ADAPTERS` de `lib/assemble.js`, su `oneOf` en el schema, su línea en
  `patterns/{género}.md` — procedimiento completo en "Cómo añadir un componente nuevo" de
  `engine/README.md`) y lo documenta en `engine/CHANGELOG.md`. El conocimiento premium nuevo se
  queda en el motor, disponible para la siguiente campaña — nunca en un HTML de una sola
  campaña, que es exactamente el error de fondo que causó todo esto (§2.1 del plan).
- Bloquea si: `campaign-data.json` no valida, el build termina en `exit 1` por cualquier motivo
  (el mensaje de `build-newsletter.js` dice exactamente qué falló — no hay que adivinar), o el
  género no tiene patrón (eso ya debería haber bloqueado en 03, pero 07 es la última barrera
  antes de generar HTML).

### 08 — QA Specialist

Base: fila `08` de `agent-roles.md` + fase 08 de `phase-gates.md`. Añade sobre esa base (plan
§3.1: "bucle de render OBLIGATORIO... como criterio de cierre, no opcional"):
- **Render obligatorio**: `render-preview.js` (o el flujo equivalente documentado en
  `engine/CHANGELOG.md`, entrada del prompt 14, incluida la receta del stub `libXdamage.so.1`
  si el sandbox lo necesita) sobre `09-exports/final-inline.html`, a 320/375/600/600-dark.
  Inspección visual de las 4 capturas es parte del criterio de cierre — "no lo pude renderizar"
  bloquea el export, no se salta.
- **Paridad fuente/inline**: `build-manifest.json` ya trae los conteos verificados
  (`<img>`, `utm_source`, `v:roundrect`, balance de `<table>`, peso del inline) porque
  `lib/verify.js` corrió dentro del build — 08 los revisa, no los recalcula desde cero. **Nota:
  `check-parity.js` (verificación independiente del agente QA, fuera del propio build) es de
  F3 y todavía no existe** — hasta entonces, la garantía de paridad es la que da el propio
  motor por construcción (§ "Garantía de no dejar outputs parciales" de `engine/README.md`),
  y el agente 08 la audita, no la sustituye.
- Regla clave heredada: evaluar, no corregir. Clasificar por severidad (crítico/alto/medio/
  bajo, tabla completa en `phase-gates.md`). Solo exporta si aprobado.

### 09 — Export Manager

Base: fila `09` de `agent-roles.md` + fase 09 de `phase-gates.md`. Añade sobre esa base (plan
§3.1):
- **Verificación de assets antes de cerrar**: cada URL de imagen que aparezca en
  `final-inline.html` (grep de `src="https://...`) debe responder HTTP 200. Si el entorno no
  tiene acceso de red saliente al CDN real, el agente lo dice explícitamente en
  `delivery-notes.md` en vez de asumir que están bien — "no verificado por restricción de red
  del entorno" es una entrada válida, "verificado ✅" sin haberlo comprobado no lo es.
- El propio `build-manifest.json` ya es la prueba de qué se construyó (hashes de data/fuente/
  inline, versión de brand pack, patrón usado) — `delivery-notes.md` lo referencia en vez de
  repetir esa información a mano.
- Regla clave heredada: solo exporta si QA aprobó, cero cambios de contenido en esta fase,
  verificar todos los enlaces e imágenes, documentar todo en delivery-notes.

## RESTRICCIONES

- No tocar `engine/`, `patterns/saving.md`, brand packs ni campañas reales.
- No crear `agents/00-06` (ya existen, prompts 15 y 16).
- No fingir que `check-parity.js` ya existe — citar la garantía real del motor
  (`lib/verify.js` + `build-manifest.json`) en su lugar.
- El contrato de 07 no debe, en ningún caso, autorizar escribir HTML fuera de
  `engine/components/` — es la restricción más importante de todo el pack (repetirla
  literalmente en el archivo, no solo referenciarla).

## CRITERIOS DE ACEPTACIÓN

- [ ] 3 archivos creados en `agents/`, misma estructura de 6 secciones
- [ ] `07-html-email-developer.md` dice explícitamente que EJECUTA `build-newsletter.js`, no
      escribe HTML directamente, y que un componente faltante se añade AL MOTOR
- [ ] `08-qa-specialist.md` hace el render obligatorio (4 viewports) parte del criterio de
      cierre, no opcional, y no referencia `check-parity.js` como si ya existiera
- [ ] `09-export-manager.md` exige verificación HTTP 200 de assets (o su ausencia documentada
      explícitamente, no asumida)
- [ ] Ningún archivo referencia un script o ruta que no exista sin marcarlo como pendiente
