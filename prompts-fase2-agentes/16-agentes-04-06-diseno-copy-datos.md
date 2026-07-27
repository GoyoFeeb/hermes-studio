# PROMPT 16 — Agentes 04-06: diseño, copy, datos estructurados

## CONTEXTO

Eres el Orchestrator de Hermes. Continúa F2 (el prompt 15 ya escribió `agents/00` a `03`).
Esta ronda escribe el tramo que decide CÓMO se ve y qué dice la campaña, antes de que exista
código. La pieza clave es 04 — el plan (§3.1) le pide heredar TODO el criterio premium ya
codificado en el motor, para que la calidad deje de depender de que alguien se acuerde de las
15 rondas de refinamiento.

## TAREAS

Misma estructura de 6 secciones del prompt 15 (Rol / Lee / Escribe / Entrega a / Bloquea si /
Regla clave) para `agents/04-email-designer.md`, `agents/05-copywriter.md`,
`agents/06-data-specialist.md`.

### 04 — Email Designer

Base: fila `04` de `agent-roles.md` + fase 04 de `phase-gates.md`. Esta es la reescritura más
grande del prompt — añade sobre la base:
- **Lee, además de brief/análisis/arquitectura**: `patterns/{género}.md` (contraste WCAG de
  §5, ritmo de §2, obligatorio/opcional de §3) y `brands/{cliente}/tokens/brand-tokens.json`
  completo. Sus especificaciones (`04-design/desktop-spec.md`, `mobile-spec.md`) deben
  referenciar tokens reales (`{{token:colors.primary}}`, no "morado de marca"), porque son las
  mismas rutas que consumirá el motor en 07.
- **Contraste WCAG con umbrales correctos** — la lección del CTA (documentada en
  `patterns/saving.md` §5: 3:1 solo aplica a texto "grande", ≥24px normal o ≥18.66px
  bold/semibold; si no, 4.5:1). El agente calcula el ratio real (luminancia relativa), nunca
  copia un ratio de un documento anterior sin recalcular — mismo error ya cometido una vez y
  corregido en `brand-tokens.json` v2.2.2.
- **Ritmo editorial**: "no dos secciones consecutivas con la misma composición" — regla
  extraída de la secuencia real de `patterns/saving.md` §2 (asimétrico → centrado con pills →
  grid de tarjetas → numerado → lista con icono → banda de cierre centrada: nunca dos
  layouts iguales seguidos).
- **Disciplina de sombras/tracking/espaciado**: valores concretos de
  `brand-tokens.json.shadows`/`spacing`, no aproximaciones ("un poco de sombra").
- Sigue sin escribir código — eso es 07.

### 05 — Copywriter

Base: fila `05` de `agent-roles.md` + fase 05 de `phase-gates.md`. Sin cambios de fondo (claims
safety ya maduro) — formaliza citando explícitamente `scripts/validate-claims.ts`: 29 reglas
en 3 niveles (🔴 crítico: 9 reglas tipo "intereses cero", "garantizado", "sin condiciones; 🟠
alto: 14 reglas tipo "líder del segmento", "velocidad máxima"; 🟡 medio: 6 reglas tipo "oferta
limitada"). El agente debe autoevaluar su propio copy contra estas reglas ANTES de entregar,
no depender de que QA (08) las atrape después. Regla clave heredada: legal/precios/promos
copiados literal, cero claims inventados, consistencia asunto→preheader→titular→CTA.

### 06 — Data Specialist

Base: fila `06` de `agent-roles.md` + fase 06 de `phase-gates.md`. Cambio de fondo (plan §3.1):
- El JSON de salida ya NO es `06-data/newsletter-data.json` contra el schema viejo
  (`newsletter-schema.json`, formato de módulos React). Es
  `06-data/campaign-data.json` contra `engine/schema/campaign-data.schema.json` (JSON Schema
  draft-07, validado con `ajv`).
- Regla clave nueva: cada entrada de `modules[]` usa el nombre de componente real del motor
  (`hero-asimetrico`, `card-tarifa`...) en el orden que fijó 03, con los campos exactos que
  pide el `oneOf` de ese componente en el schema (tabla de mapeo componente→campos en
  `engine/CHANGELOG.md`, entrada del prompt 12). Nombres de campo NO son negociables — deben
  coincidir con lo que `MODULE_ADAPTERS` de `engine/lib/assemble.js` espera.
- Bloquea si: JSON no valida contra el schema (correr `ajv` o dejar que
  `build-newsletter.js` lo valide en el paso 1 de su pipeline), falta algún módulo obligatorio
  del patrón, algún `href`/`icon` no es una URL https absoluta, o hay un campo con el literal
  `[PENDIENTE]` (prohibido por el `$def` `nonPendingString` del schema).
- Nota: `unsubscribeUrl`/`preferencesUrl` SÍ aceptan merge-tags de ESP entre corchetes
  mayúsculas (`[UNSUBSCRIBE_LINK]`) — no es lo mismo que `[PENDIENTE]`, ver `$def`
  `espResolvedUrl` del schema. No confundir ambos casos al redactar la regla de bloqueo.

## RESTRICCIONES

- No tocar `engine/`, `patterns/saving.md`, brand packs ni campañas reales.
- No crear `agents/00-03` (ya existen, prompt 15) ni `07-09` (prompt 17).
- Toda regla nueva debe citar su fuente real (archivo del motor, `agent-roles.md`,
  `phase-gates.md`, `validate-claims.ts`).

## CRITERIOS DE ACEPTACIÓN

- [ ] 3 archivos creados en `agents/`, misma estructura de 6 secciones
- [ ] `04-email-designer.md` referencia `patterns/{género}.md` y `brand-tokens.json` con rutas
      reales, y explica el cálculo de contraste WCAG con el umbral correcto (no genérico 4.5:1
      para todo)
- [ ] `05-copywriter.md` cita las 3 categorías de `validate-claims.ts` con conteo real de reglas
- [ ] `06-data-specialist.md` apunta a `campaign-data.json` + `campaign-data.schema.json` (el
      del motor), no al schema viejo de React Email
- [ ] Ningún archivo referencia un script o ruta que no exista sin marcarlo como pendiente
