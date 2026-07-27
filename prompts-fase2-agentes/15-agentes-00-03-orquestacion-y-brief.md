# PROMPT 15 — Agentes 00-03: orquestación, briefing, marca, arquitectura

## CONTEXTO

Eres el Orchestrator de Hermes. F1 (el motor) está cerrada con veredicto APTO
(`docs/f1-motor-cerrado.md`). Esta ronda arranca F2: escribir los primeros 4 archivos de
`agents/` — la mitad "upstream" del pipeline (coordinación + todo lo previo a que exista una
sola decisión visual). Base: `pipeline-skill/references/agent-roles.md` (contratos 00-03,
diseñados para el pipeline viejo) y `pipeline-skill/references/phase-gates.md` (criterios de
cierre por fase). El objetivo del plan (§3.1) marca qué cambia respecto a esa base.

## TAREAS

Crea `agents/00-orchestrator.md`, `agents/01-briefing-strategist.md`,
`agents/02-brand-visual-analyst.md`, `agents/03-newsletter-architect.md`. Cada uno con esta
estructura mínima (adáptala, no la recortes):

- **Rol** (1 párrafo: qué decide este agente, qué NO decide)
- **Lee** (rutas exactas de archivos/carpetas)
- **Escribe** (rutas exactas de archivos que produce)
- **Entrega a** (siguiente agente)
- **Bloquea si** (condiciones binarias, de `phase-gates.md`, verificables sin criterio subjetivo)
- **Regla clave** (la más importante del rol — de `agent-roles.md`)

### 00 — Orchestrator

Base: fila `00` de `agent-roles.md`. Añade sobre esa base (plan §3.1):
- Checklist de cierre de ronda VERIFICABLE antes de dar cualquier fase por cerrada: qué
  archivos deben existir, qué scripts correr. **`check-control-files.js` y `check-parity.js`
  todavía no existen (son de F3)** — hasta que existan, el checklist dice explícitamente qué
  verificar a mano en su lugar (los 4 archivos de control por transición: `campaign-status.md`,
  `task-log.md`, `handoff.md`, `next-steps.md`; y para paridad, los hashes de
  `build-manifest.json` + la auto-verificación de `engine/lib/verify.js`).
  Nunca se debe leer/pensar que ese archivo ya existe.
- Regla explícita: "ningún pendiente sobrevive sin entrada en `next-steps.md` con
  responsable" — de lo contrario la ronda no se cierra.
- Referencia al motor: cuando el pipeline llegue a la fase 07, el Orchestrator verifica que
  el output de `07-html-email-developer` sea el resultado de `node engine/build-newsletter.js`
  (por `build-manifest.json`), nunca HTML escrito a mano.

### 01 — Briefing Strategist

Base: fila `01` de `agent-roles.md` + fase 01 de `phase-gates.md`. Sin cambios de fondo — el
contrato actual ya es válido según el plan. Formalízalo como archivo ejecutable igual que los
demás (no es un "porque sí": documenta explícitamente por qué no cambia, citando el plan §3.1).

### 02 — Brand Visual Analyst

Base: fila `02` de `agent-roles.md` + fase 02 de `phase-gates.md`. Añade sobre esa base:
- El **brand pack** (`brands/{cliente}/tokens/brand-tokens.json`) pasa a ser un entregable de
  primera clase de este agente, no solo análisis en prosa — si el cliente ya tiene brand pack
  (ver `newsletters/2026/newsletter-system/brands/`, ubicación física actual — el plan §3
  apunta a moverlo a `brands/` en la raíz de `sistema-final/`, movimiento aún pendiente,
  anótalo como hallazgo, no lo hagas aquí), lo actualiza; si no existe, lo crea siguiendo la
  estructura de `brands/paraycompara/tokens/brand-tokens.json` (colors, typography, spacing,
  radius, shadows, surfaces, components, darkMode, personalization, utm, assets, voice,
  `_changelog`).
- Regla clave heredada: distinguir identidad documentada / observada / inferida. Nunca
  inventar colores, fuentes o estilos — si algo no está confirmado, el campo se omite o se
  marca `[Q-NNN]`, nunca se aproxima.

### 03 — Newsletter Architect

Base: fila `03` de `agent-roles.md` + fase 03 de `phase-gates.md`. Añade sobre esa base:
- Este agente ya no elige "módulos abstractos": elige el **patrón de género** de `patterns/`
  (hoy solo `saving.md` existe — regla anti-aspiracional, no crear un patrón nuevo sin una
  campaña real que lo necesite) y lo adapta. Su entregable (`03-strategy/structure.md`) es la
  secuencia EXACTA de componentes del motor (`hero-asimetrico`, `trust-bar`, `card-tarifa`,
  `pasos`, `lista-premium`, `banda-cierre`, `footer`, en el caso de `saving`), no una lista de
  tipos de módulo genéricos.
  - Si el género de la campaña no tiene patrón todavía: el agente bloquea y lo dice
    explícitamente ("no existe `patterns/{género}.md`; crear uno es un prompt aparte, no
    parte de esta campaña") — no debe inventar una secuencia sobre la marcha.
- Regla clave heredada: estructura compacta (3-7 módulos), CTA en el primer tercio, cada
  módulo con función, sin decisiones visuales ni copy.

## RESTRICCIONES

- No tocar `engine/`, `patterns/saving.md` ni ninguna campaña real.
- No crear `agents/04-*.md` a `agents/09-*.md` todavía — son los prompts 16 y 17.
- No inventar contratos sin base: cada regla nueva debe citar de dónde sale (plan §3.1,
  `agent-roles.md`, `phase-gates.md`, o un archivo real del motor).
- No fingir que `check-parity.js`/`check-control-files.js` existen.

## CRITERIOS DE ACEPTACIÓN

- [ ] 4 archivos creados en `agents/`, cada uno con las 6 secciones mínimas
- [ ] Cada condición de bloqueo es verificable (binaria), no una apreciación subjetiva
- [ ] `00-orchestrator.md` documenta explícitamente qué verificar a mano mientras F3 no exista
- [ ] `02-brand-visual-analyst.md` deja el brand pack como entregable explícito, con ruta real
- [ ] `03-newsletter-architect.md` referencia `patterns/` y bloquea si el género no tiene patrón
- [ ] Ningún archivo referencia un script o ruta que no exista sin marcarlo como pendiente
