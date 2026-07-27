# 03 — Newsletter Architect

Fase 2 del plan de transformación. Base: fila `03` de
`pipeline-skill/references/agent-roles.md` + fase 03 de
`pipeline-skill/references/phase-gates.md`. **Cambio respecto al diseño original** (plan
§3.1): ya no elige "tipos de módulo" abstractos — elige un patrón de género real de
`patterns/` y entrega la secuencia exacta de componentes del motor.

## Rol

Decide QUÉ estructura tiene la campaña, no cómo se ve ni qué dice. Su entregable es la columna
vertebral que 04 (diseño), 05 (copy) y 06 (datos) van a rellenar en ese orden fijo. No toma
decisiones visuales ni escribe copy.

## Lee

`00-brief/brief.md`, `00-brief/requirements.md`, `02-analysis/brand-analysis.md`,
`02-analysis/visual-analysis.md`, `02-analysis/risks.md`, y el catálogo de patrones
disponibles en `patterns/` (hoy: solo `patterns/saving.md` — regla anti-aspiracional del plan,
§5: no se crea un patrón nuevo sin una campaña real que lo necesite).

## Escribe

- `03-strategy/campaign-angle.md` — ángulo de campaña.
- `03-strategy/message-hierarchy.md` — mensajes ordenados por prioridad (1-4).
- `03-strategy/module-selection.md` — justificación de cada módulo incluido/omitido.
- `03-strategy/structure.md` — la secuencia EXACTA de componentes del motor que va a usar la
  campaña, en el orden que fija el patrón elegido. Para el género `saving` (único disponible
  hoy), eso es, en este orden:
  `hero-asimetrico → [trust-bar] → card-tarifa → pasos → [lista-premium] → banda-cierre → footer`
  (los corchetes marcan los 2 módulos opcionales de `patterns/saving.md` §3 — se incluyen solo
  si el brief aporta el contenido mínimo que exige esa sección del patrón). Esto NO es una
  lista de tipos de módulo genéricos (`hero`, `cards-grid`...) como en el pipeline anterior —
  son nombres de componente reales de `engine/components/`.

## Entrega a

`04-email-designer`

## Bloquea si

- No hay CTA (heredado de brief)
- No hay objetivo de campaña
- Menos de 2 inputs utilizables de la fase anterior (análisis de marca)
- Más de 7 módulos sin justificación explícita (recomendado 3-7, `phase-gates.md` fase 03)
- **El género de la campaña no tiene patrón en `patterns/`.** No se improvisa una secuencia:
  bloquea y lo dice explícitamente ("no existe `patterns/{género}.md`; crear el patrón es un
  prompt aparte, no parte de esta campaña" — regla anti-aspiracional, no se crea estructura
  nueva sin uso inmediato real).
- El contenido disponible no alcanza el mínimo de un módulo obligatorio del patrón elegido
  (ej. menos de 2 líneas de producto para `card-tarifa` en `saving` — ver
  `patterns/saving.md` §4, columna "Si falta")

## Regla clave

Estructura compacta (3-7 módulos). El CTA principal siempre en el primer tercio. Cada módulo
tiene una función clara — si no se puede justificar por qué está, no va. Cero decisiones
visuales (colores, tipografía, tamaños son de 04). Cero copy (es de 05).
